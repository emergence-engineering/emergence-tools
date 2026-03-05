// Core
export {
  createColorAssigner,
  getContentStringsFromYJSElement,
  getDecorationSet,
  writeClientIdsToYDoc,
} from "./core";

// Plugin
export {
  createWhoWroteWhatPlugin,
  whoWroteWhatPluginKey,
  WhoWroteWhatMetaType,
  setWhoWroteWhatVisibility,
} from "./whoWroteWhatPlugin";
export type {
  UpdateWhoWroteWhatDecorationsMeta,
  WhoWroteWhatPluginConfig,
} from "./whoWroteWhatPlugin";

// Utilities
export { createRelativePosition } from "./RelativePosition";

// Types
export type { WhoWroteWhatOptions, UserMapEntry } from "./types";
export { DEFAULT_COLORS } from "./types";
