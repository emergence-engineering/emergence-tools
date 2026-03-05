import { PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

export interface UuidWithVersion {
  uuid: string;
  versionId: number | null;
}

export const isSameVersion = (a: UuidWithVersion, b: UuidWithVersion) =>
  a.uuid === b.uuid && a.versionId === b.versionId;

export interface MultiEditorDiffConfig {
  /** Node types that should be diffed. Default: Set(["heading", "paragraph"]) */
  diffableNodeTypes?: Set<string>;
  /** Node types whose children should NOT be traversed. Default: Set(["codeBlock"]) */
  nonDiffableNodeTypes?: Set<string>;
  /** Optional callback to toggle collapsible headers on the other editor.
   *  If not provided, collapsible sync is disabled. */
  onToggleCollapsible?: (
    view: EditorView,
    pos: number,
    enableEscalation: boolean,
  ) => void;
  /** Optional PluginKey for collapsible headers to detect toggle transactions. */
  collapsibleHeadersPluginKey?: PluginKey;
}

export const DEFAULT_DIFFABLE_NODE_TYPES = new Set(["heading", "paragraph"]);
export const DEFAULT_NON_DIFFABLE_NODE_TYPES = new Set(["codeBlock"]);
