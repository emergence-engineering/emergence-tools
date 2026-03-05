import { PluginKey } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import type { MappingOptions } from "@emergence-engineering/prosemirror-text-map";

export interface UuidWithVersion {
  uuid: string;
  versionId: number | null;
}

export const isSameVersion = (a: UuidWithVersion, b: UuidWithVersion) =>
  a.uuid === b.uuid && a.versionId === b.versionId;

export interface MultiEditorDiffConfig {
  /** Node types that should be diffed. Default: Set(["heading", "paragraph"]) */
  diffableNodeTypes?: Set<string>;
  /** Text extraction options passed to block-runner / docToTextWithMapping.
   *  Use `nodeToTextMappingOverride` for custom node types (e.g. images). */
  textExtractionOptions?: Partial<MappingOptions>;
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
