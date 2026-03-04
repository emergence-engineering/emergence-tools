import { PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  ActionType,
  ProcessingUnit,
  RunnerOptions,
  RunnerState,
  RunnerStatus,
  UnitProcessor,
  UnitStatus,
} from "./types";
import { dispatchAction, sleep } from "./utils";

// Select next unit to process based on priority and status
function selectNextUnit<ResponseType, ContextState, UnitMetadata>(
  state: RunnerState<ResponseType, ContextState, UnitMetadata>,
  options: RunnerOptions<ResponseType, ContextState, UnitMetadata>
): ProcessingUnit<UnitMetadata> | undefined {
  if (state.status !== RunnerStatus.ACTIVE) return undefined;

  const now = Date.now();
  const units = state.unitsInProgress ?? [];

  const isReady = (u: ProcessingUnit<UnitMetadata>) =>
    [UnitStatus.QUEUED, UnitStatus.BACKOFF, UnitStatus.DIRTY].includes(
      u.status
    ) && u.waitUntil <= now;

  const isBlocking = (u: ProcessingUnit<UnitMetadata>) =>
    [UnitStatus.QUEUED, UnitStatus.BACKOFF, UnitStatus.DIRTY].includes(
      u.status
    ) && u.waitUntil > now;

  // Priority order:
  // 1. Ready units matching priority filter
  const priorityReady = units.find(
    (u) => isReady(u) && options.priorityFilter(u, state.contextState)
  );
  if (priorityReady) return priorityReady;

  // 2. Any ready unit
  const anyReady = units.find(isReady);
  if (anyReady) return anyReady;

  // 3. Blocking unit (will sleep until ready)
  const blocking = units.find(isBlocking);
  if (blocking) return blocking;

  return undefined;
}

// Process a single unit
async function processNext<ResponseType, ContextState, UnitMetadata>(
  pluginKey: PluginKey<RunnerState<ResponseType, ContextState, UnitMetadata>>,
  view: EditorView,
  unitProcessor: UnitProcessor<ResponseType, UnitMetadata>,
  options: RunnerOptions<ResponseType, ContextState, UnitMetadata>
): Promise<boolean> {
  // Do-while: keep selecting and sleeping until a unit is ready (waitUntil elapsed).
  // Edits during sleep push waitUntil forward via remapPositions; the loop re-reads
  // fresh state each iteration so the worker keeps sleeping until debounce settles.
  let unit: ProcessingUnit<UnitMetadata> | undefined;
  let didSleep: boolean;
  do {
    const state = pluginKey.getState(view.state);
    if (!state || state.status !== RunnerStatus.ACTIVE) return false;

    unit = selectNextUnit(state, options);
    if (!unit) return false;

    const now = Date.now();
    if (unit.waitUntil > now) {
      await sleep(unit.waitUntil - now);
      didSleep = true;
    } else {
      didSleep = false;
    }
  } while (didSleep);

  // Debounce/backoff settled — claim the unit
  dispatchAction(view, pluginKey, {
    type: ActionType.UNIT_STARTED,
    unitId: unit.id,
  });

  try {
    // Execute the processor
    const result = await unitProcessor(view, unit);

    if (result.error) {
      dispatchAction(view, pluginKey, {
        type: ActionType.UNIT_ERROR,
        unitId: unit.id,
        error: result.error,
      });
    } else if (result.data !== undefined) {
      dispatchAction(view, pluginKey, {
        type: ActionType.UNIT_SUCCESS,
        unitId: unit.id,
        response: result.data,
      });
    }
  } catch (error) {
    dispatchAction(view, pluginKey, {
      type: ActionType.UNIT_ERROR,
      unitId: unit.id,
      error: error instanceof Error ? error : new Error(String(error)),
    });
  }

  return true;
}

// Single worker loop - processes units until none remain
async function executeLoop<ResponseType, ContextState, UnitMetadata>(
  pluginKey: PluginKey<RunnerState<ResponseType, ContextState, UnitMetadata>>,
  view: EditorView,
  unitProcessor: UnitProcessor<ResponseType, UnitMetadata>,
  options: RunnerOptions<ResponseType, ContextState, UnitMetadata>
): Promise<boolean> {
  const didProcess = await processNext(pluginKey, view, unitProcessor, options);

  if (didProcess) {
    // Recursively process next unit
    return executeLoop(pluginKey, view, unitProcessor, options);
  }

  return false;
}

// Execute parallel workers
export async function executeParallel<ResponseType, ContextState, UnitMetadata>(
  pluginKey: PluginKey<RunnerState<ResponseType, ContextState, UnitMetadata>>,
  view: EditorView,
  unitProcessor: UnitProcessor<ResponseType, UnitMetadata>,
  options: RunnerOptions<ResponseType, ContextState, UnitMetadata>
): Promise<void> {
  // Spawn batchSize concurrent workers
  const workers = Array.from({ length: options.batchSize }, () =>
    executeLoop(pluginKey, view, unitProcessor, options)
  );

  await Promise.all(workers);
}

// Check if there are still units to process
export function hasUnitsToProcess<ResponseType, ContextState, UnitMetadata>(
  state: RunnerState<ResponseType, ContextState, UnitMetadata>
): boolean {
  if (state.status !== RunnerStatus.ACTIVE) return false;

  return state.unitsInProgress.some(
    (u) =>
      u.status === UnitStatus.QUEUED ||
      u.status === UnitStatus.WAITING ||
      u.status === UnitStatus.BACKOFF ||
      u.status === UnitStatus.DIRTY ||
      u.status === UnitStatus.PROCESSING
  );
}

// Export for testing purposes
export { selectNextUnit as _selectNextUnitForTesting };
