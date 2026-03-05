import { Node } from "prosemirror-model";
import { EditorState, Selection } from "prosemirror-state";
import {
  Action,
  ActionType,
  DecorationFactory,
  InitAction,
  MapUnitMetadataAction,
  ProcessingUnit,
  RunnerOptions,
  RunnerState,
  RunnerStateActive,
  RunnerStatus,
  UnitErrorAction,
  UnitRange,
  UnitStatus,
  UnitSuccessAction,
} from "./types";
import { calculateBackoff, createUnitsFromDocument, updateUnit } from "./utils";

// Trigger a non-blocking framework re-render after plugin state changes
function nonBlockingForceRerender<ResponseType, ContextState, UnitMetadata>(
  state: RunnerState<ResponseType, ContextState, UnitMetadata>
) {
  setTimeout(state.options.forceRerender, 0);
}

// Initialize units from document
function initializeUnits<ResponseType, ContextState, UnitMetadata>(
  state: RunnerState<ResponseType, ContextState, UnitMetadata>,
  action: InitAction<UnitMetadata>,
  doc: Node,
  selection: Selection
): RunnerStateActive<ResponseType, ContextState, UnitMetadata> {
  const from = action.onlySelection ? selection.from : 0;
  const to = action.onlySelection ? selection.to : doc.content.size;

  // Determine metadata factory
  const metadataFactory = (
    _unit: UnitRange,
    index: number
  ): UnitMetadata => {
    if (action.metadata.single !== undefined) {
      return action.metadata.single;
    }
    if (action.metadata.array !== undefined) {
      return action.metadata.array[index] ?? action.metadata.array[0];
    }
    if (action.metadata.factory !== undefined) {
      // Create a temporary unit to pass to factory
      const tempUnit: ProcessingUnit<UnitMetadata> = {
        id: {},
        status: UnitStatus.QUEUED,
        from: _unit.from,
        to: _unit.to,
        node: _unit.node,
        text: _unit.text,
        mapping: _unit.mapping,
        metadata: {} as UnitMetadata,
        retryCount: 0,
        waitUntil: 0,
      };
      return action.metadata.factory(tempUnit);
    }
    return {} as UnitMetadata;
  };

  const units = createUnitsFromDocument(doc, from, to, metadataFactory, state.options.nodeTypes, state.options.textExtractionOptions);

  // Apply priority filter to set initial status
  const unitsWithStatus = units.map((unit) => ({
    ...unit,
    status: state.options.priorityFilter(unit, state.contextState)
      ? UnitStatus.QUEUED
      : UnitStatus.WAITING,
  }));

  return {
    ...state,
    status: RunnerStatus.ACTIVE,
    unitsInProgress: unitsWithStatus,
  } as RunnerStateActive<ResponseType, ContextState, UnitMetadata>;
}

// Handle unit success
function handleUnitSuccess<ResponseType, ContextState, UnitMetadata>(
  state: RunnerStateActive<ResponseType, ContextState, UnitMetadata>,
  action: UnitSuccessAction<ResponseType>,
  decorationFactory: DecorationFactory<ResponseType, UnitMetadata, ContextState>
): RunnerStateActive<ResponseType, ContextState, UnitMetadata> {
  const unit = state.unitsInProgress.find((u) => u.id === action.unitId);
  if (!unit) return state;
  const waitUntil = Date.now() + state.options.dirtyHandling.debounceDelay;

  // Check if text changed since request started (stale response)
  const isStale =
    unit.requestText !== undefined && unit.requestText !== unit.text;

  if (isStale) {
    // Response is stale - mark DIRTY to trigger reprocessing
    return updateUnit(state, action.unitId, {
      status: UnitStatus.DIRTY,
      requestText: undefined,
      waitUntil,
    });
  }

  // Create decorations from response
  const newDecorations = decorationFactory(action.response, unit, state.contextState);

  // Update unit status to DONE
  const updatedState = updateUnit(state, action.unitId, {
    status: UnitStatus.DONE,
    response: action.response,
    requestText: undefined,
  });

  return {
    ...updatedState,
    decorations: [...updatedState.decorations, ...newDecorations],
  };
}

// Handle unit error
function handleUnitError<ResponseType, ContextState, UnitMetadata>(
  state: RunnerStateActive<ResponseType, ContextState, UnitMetadata>,
  action: UnitErrorAction
): RunnerStateActive<ResponseType, ContextState, UnitMetadata> {
  const unit = state.unitsInProgress.find((u) => u.id === action.unitId);
  if (!unit) return state;
  const waitUntil = Date.now() + state.options.dirtyHandling.debounceDelay;

  // Check if text changed since request started (stale error)
  const isStale =
    unit.requestText !== undefined && unit.requestText !== unit.text;
  if (isStale) {
    // Response is stale - mark DIRTY to trigger reprocessing instead of retrying stale request
    return updateUnit(state, action.unitId, {
      status: UnitStatus.DIRTY,
      requestText: undefined,
      waitUntil,
    });
  }

  const newRetryCount = unit.retryCount + 1;

  if (newRetryCount >= state.options.maxRetries) {
    // Final failure
    return updateUnit(state, action.unitId, {
      status: UnitStatus.ERROR,
      retryCount: newRetryCount,
      requestText: undefined,
    });
  }

  // Schedule retry with backoff
  return updateUnit(state, action.unitId, {
    status: UnitStatus.BACKOFF,
    retryCount: newRetryCount,
    waitUntil:
      Date.now() + calculateBackoff(newRetryCount, state.options.backoffBase),
    requestText: undefined,
  });
}

// Handle unit started
function handleUnitStarted<ResponseType, ContextState, UnitMetadata>(
  state: RunnerStateActive<ResponseType, ContextState, UnitMetadata>,
  unitId: object
): RunnerStateActive<ResponseType, ContextState, UnitMetadata> {
  const unit = state.unitsInProgress.find((u) => u.id === unitId);
  if (!unit) return state;

  return updateUnit(state, unitId, {
    status: UnitStatus.PROCESSING,
    requestText: unit.text, // Capture text being processed for staleness detection
  });
}

// Handle map unit metadata
function handleMapUnitMetadata<ResponseType, ContextState, UnitMetadata>(
  state: RunnerState<ResponseType, ContextState, UnitMetadata>,
  action: MapUnitMetadataAction<UnitMetadata>
): RunnerState<ResponseType, ContextState, UnitMetadata> {
  if (!state.unitsInProgress) return state;

  let changed = false;
  const newUnits = state.unitsInProgress.map((unit) => {
    const result = action.mapFunction(unit.metadata);
    if (result === false) return unit;
    changed = true;
    return {
      ...unit,
      metadata: result,
      status: UnitStatus.DIRTY,
    };
  });

  if (!changed) return state;

  return {
    ...state,
    unitsInProgress: newUnits,
  };
}

// Main action handler - pure function that returns new state
export function handleAction<ResponseType, ContextState, UnitMetadata>(
  state: RunnerState<ResponseType, ContextState, UnitMetadata>,
  action: Action<ResponseType, ContextState, UnitMetadata>,
  decorationFactory: DecorationFactory<ResponseType, UnitMetadata, ContextState>,
  editorState: EditorState
): RunnerState<ResponseType, ContextState, UnitMetadata> {
  nonBlockingForceRerender(state);
  switch (action.type) {
    case ActionType.INIT:
      return initializeUnits(
        state,
        action,
        editorState.doc,
        editorState.selection
      );

    case ActionType.UNIT_STARTED:
      if (state.status !== RunnerStatus.ACTIVE) return state;
      return handleUnitStarted(state, action.unitId);

    case ActionType.UNIT_SUCCESS:
      if (state.status !== RunnerStatus.ACTIVE) return state;
      return handleUnitSuccess(
        state,
        action as UnitSuccessAction<ResponseType>,
        decorationFactory
      );

    case ActionType.UNIT_ERROR:
      if (state.status !== RunnerStatus.ACTIVE) return state;
      return handleUnitError(state, action);

    case ActionType.FINISH:
      return {
        ...state,
        status: RunnerStatus.IDLE,
      } as RunnerState<ResponseType, ContextState, UnitMetadata>;

    case ActionType.CLEAR:
      return {
        ...state,
        decorations: [],
        unitsInProgress: undefined,
        status: RunnerStatus.IDLE,
        selected: undefined,
      } as RunnerState<ResponseType, ContextState, UnitMetadata>;

    case ActionType.RESUME:
      // Only resume if IDLE with units to process
      if (state.status !== RunnerStatus.IDLE) return state;
      if (!state.unitsInProgress?.length) return state;

      return {
        ...state,
        status: RunnerStatus.ACTIVE,
      } as RunnerState<ResponseType, ContextState, UnitMetadata>;

    case ActionType.UPDATE_CONTEXT:
      return {
        ...state,
        contextState: action.contextState,
      };

    case ActionType.MAP_UNIT_METADATA:
      return handleMapUnitMetadata(state, action);

    case ActionType.REMOVE_DECORATION:
      return {
        ...state,
        decorations: state.decorations.filter((d) => d.spec.id !== action.id),
      };

    case ActionType.SELECT_DECORATION:
      return {
        ...state,
        selected: action.id,
      };

    case ActionType.DESELECT_DECORATION:
      return {
        ...state,
        selected: undefined,
      };

    default:
      return state;
  }
}

// Create initial state
export function createInitialState<ResponseType, ContextState, UnitMetadata>(
  contextState: ContextState,
  options: RunnerOptions<ResponseType, ContextState, UnitMetadata>
): RunnerState<ResponseType, ContextState, UnitMetadata> {
  return {
    status: RunnerStatus.IDLE,
    decorations: [],
    selected: undefined,
    contextState,
    options,
  };
}
