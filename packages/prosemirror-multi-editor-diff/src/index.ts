// Core algorithm
export {
  stringNodePairing,
  defaultStringSimilarity,
} from "./stringNodePairing";
export type {
  NodeHelper,
  NodePairing,
  SimilarityFromString,
} from "./stringNodePairing";

// Visualization plugin
export {
  createMultiEditorDiffVisuPlugin,
  multiEditorDiffVisuPluginKey,
  getOtherNode,
  getThisNode,
  setOtherNode,
  setThisNode,
  startingState,
} from "./multiEditorDiffVisu";
export type {
  MultiEditorDiffVisuResponse,
  MultiEditorDiffVisuState,
  MultiEditorDiffVisuAdditionalNodeData,
  NodeListEntry,
} from "./multiEditorDiffVisu";

// Transaction helper plugin
export {
  multiEditorDiffVisuHelperPlugin,
  MultiEditorDiffVisuHelperPluginKey,
} from "./multiEditorDiffVisuTransactionHelper";

// State holder (orchestrator)
export { multiEditorDiffStateHolder } from "./multiEditorDiffService";
export type {
  MultiEditorStateHolderIdType,
  MultiEditorDiffStateHolder,
} from "./multiEditorDiffService";

// Types & config
export type { UuidWithVersion, MultiEditorDiffConfig } from "./types";
export { isSameVersion, DEFAULT_DIFFABLE_NODE_TYPES } from "./types";

// Re-exported block-runner types for consumers
export type {
  RunnerState,
  ProcessingUnit,
  ResultDecoration,
  Action,
} from "@emergence-engineering/prosemirror-block-runner";
export {
  RunnerStatus,
  UnitStatus,
  ActionType,
} from "@emergence-engineering/prosemirror-block-runner";

// Utilities (re-exported for consumers who need them)
export { getParentTypeList } from "./utils/parentTypeList";
