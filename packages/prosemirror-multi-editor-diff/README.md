# @emergence-engineering/prosemirror-multi-editor-diff

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

Sponsored by [<img src="https://lex.page/apple-touch-icon.png" alt="Lex" width="16" height="16" style="vertical-align: middle;" /> **Lex**](https://lex.page) & **Nathan Baschez**

> Multi-editor diff visualization for ProseMirror — compare two editors side-by-side with inline diff decorations, spacer synchronization, and node pairing.

## Features

- Side-by-side diff comparison between two ProseMirror editors
- Inline addition/deletion highlights using word-level diffing
- Spacer widget decorations to vertically align paired nodes across editors
- Sequence alignment algorithm for intelligent node pairing
- Node type mismatch indicators (type, heading level, parent structure)
- Automatic recalculation when either editor is edited
- Scroll synchronization between editors
- Collapsible header integration support
- Configurable diffable node types and custom similarity functions

## Installation

```bash
npm install @emergence-engineering/prosemirror-multi-editor-diff
```

### Peer dependencies

```bash
npm install prosemirror-model prosemirror-state prosemirror-transform prosemirror-view
```

## Quick Start

```ts
import {
  createMultiEditorDiffVisuPlugin,
  multiEditorDiffStateHolder,
} from "@emergence-engineering/prosemirror-multi-editor-diff";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

// 1. Add the plugin to both editors
const leftState = EditorState.create({
  doc: leftDoc,
  plugins: [...yourPlugins, createMultiEditorDiffVisuPlugin()],
});
const rightState = EditorState.create({
  doc: rightDoc,
  plugins: [...yourPlugins, createMultiEditorDiffVisuPlugin()],
});

const leftView = new EditorView(leftEl, { state: leftState });
const rightView = new EditorView(rightEl, { state: rightState });

// 2. Create a state holder to orchestrate diffing
const stateHolder = multiEditorDiffStateHolder();

// 3. Register editors
stateHolder.addEditor({ uuid: "doc1", versionId: 1 }, leftView, leftScrollRef);
stateHolder.addEditor({ uuid: "doc2", versionId: 1 }, rightView, rightScrollRef);
stateHolder.selectEditor("left", { uuid: "doc1", versionId: 1 });
stateHolder.selectEditor("right", { uuid: "doc2", versionId: 1 });

// 4. Toggle diff visualization
stateHolder.switchShowDiff(true);  // show
stateHolder.switchShowDiff(false); // hide
```

## Options

`MultiEditorDiffConfig` (passed to both `createMultiEditorDiffVisuPlugin` and `multiEditorDiffStateHolder`):

| Option | Type | Default | Description |
|---|---|---|---|
| `diffableNodeTypes` | `Set<string>` | `Set(["heading", "paragraph"])` | Node types to include in the diff |
| `textExtractionOptions` | `Partial<MappingOptions>` | `undefined` | Options passed to text extraction (e.g. custom node-to-text overrides) |
| `onToggleCollapsible` | `(view, pos, enableEscalation) => void` | `undefined` | Callback to sync collapsible header toggles between editors |
| `collapsibleHeadersPluginKey` | `PluginKey` | `undefined` | PluginKey to detect collapsible toggle transactions |

## API

| Export | Type | Description |
|---|---|---|
| `createMultiEditorDiffVisuPlugin` | `(config?) => Plugin` | Creates the diff visualization plugin (add to both editors) |
| `multiEditorDiffVisuPluginKey` | `PluginKey` | The plugin key for accessing diff plugin state |
| `multiEditorDiffStateHolder` | `(config?) => MultiEditorDiffStateHolder` | Creates the orchestrator that manages both editors |
| `multiEditorDiffVisuHelperPlugin` | `function` | Internal helper plugin for transaction watching (auto-managed) |
| `MultiEditorDiffVisuHelperPluginKey` | `PluginKey` | Key for the helper plugin |
| `stringNodePairing` | `(props) => NodePairing<T>[]` | Sequence alignment algorithm for node pairing |
| `defaultStringSimilarity` | `(a, b) => number` | Default string similarity function (from `string-similarity-js`) |
| `getOtherNode` | `(editorId, pair) => NodeHelper \| undefined` | Gets the opposite editor's node from a pairing |
| `getThisNode` | `(editorId, pair) => NodeHelper \| undefined` | Gets this editor's node from a pairing |
| `setOtherNode` | `(editorId, pair, node) => NodePairing` | Creates a new pairing with the other node replaced |
| `setThisNode` | `(editorId, pair, node) => NodePairing` | Creates a new pairing with this node replaced |
| `startingState` | `MultiEditorDiffVisuState` | Initial plugin state |
| `isSameVersion` | `(a, b) => boolean` | Compares two `UuidWithVersion` objects |
| `DEFAULT_DIFFABLE_NODE_TYPES` | `Set<string>` | Default set: `["heading", "paragraph"]` |
| `getParentTypeList` | `(doc, pos) => string[]` | Returns ancestor node type names at a position |

### State Holder Methods

| Method | Description |
|---|---|
| `addEditor(uuidWithVersion, view, scrollerDivRef)` | Register an editor |
| `selectEditor(side, uuidWithVersion)` | Select which editor is left/right |
| `switchShowDiff(value)` | Enable/disable diff visualization |
| `scrollChanged(topPos, uuidWithVersion)` | Sync scroll position to the other editor |
| `updatePairingsCallback()` | Manually recalculate node pairings |

## Styles

Add these CSS classes to your application:

```css
.highlight-addition {
  background-color: rgba(0, 200, 0, 0.25);
}

.highlight-deletion {
  background-color: rgba(255, 0, 0, 0.2);
}

.multi-editor-diff.empty-rect {
  width: 100%;
}

.multi-editor-diff.non-matching-node-type,
.multi-editor-diff.non-matching-node-level,
.multi-editor-diff.non-matching-node-parent-length,
.multi-editor-diff.non-matching-node-parent-type {
  display: inline-block;
  background: #ff9800;
  color: white;
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  margin-right: 4px;
}
```

## How It Works

1. **Node extraction** — Both editors are scanned for diffable node types (headings and paragraphs by default). Each node's text content is extracted.
2. **Sequence alignment** — The `stringNodePairing` algorithm uses a Needleman-Wunsch-style dynamic programming approach with string similarity scores to optimally pair nodes between the left and right editors.
3. **Word-level diffing** — For each paired node, `diff.diffWordsWithSpace` computes the inline changes. Added text is highlighted green on the right, deleted text is highlighted red on the left.
4. **Spacer decorations** — Widget decorations are inserted after each node to pad the shorter side, keeping paired nodes vertically aligned across both editors. Spacer heights are computed dynamically using `ResizeObserver`.
5. **Mismatch indicators** — When paired nodes have different types (e.g. heading vs paragraph), different heading levels, or different parent structures, small orange badge widgets are shown.
6. **Live updates** — A helper plugin watches for document changes in both editors and triggers `updatePairingsCallback` to recalculate pairings and refresh decorations automatically.

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#multiEditorDiff) in the monorepo playground.

## License

MIT
