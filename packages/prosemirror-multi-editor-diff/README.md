# @emergence-engineering/prosemirror-multi-editor-diff

Multi-editor diff visualization for ProseMirror. Compare two editors side-by-side with inline diff decorations, spacer synchronization, and automatic node pairing using sequence alignment.

## Installation

```bash
npm install @emergence-engineering/prosemirror-multi-editor-diff
```

## Usage

```typescript
import {
  createMultiEditorDiffVisuPlugin,
  multiEditorDiffStateHolder,
} from "@emergence-engineering/prosemirror-multi-editor-diff";

// 1. Add the plugin to both editors
const leftState = EditorState.create({
  plugins: [...yourPlugins, createMultiEditorDiffVisuPlugin()],
});
const rightState = EditorState.create({
  plugins: [...yourPlugins, createMultiEditorDiffVisuPlugin()],
});

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

## API

### `createMultiEditorDiffVisuPlugin()`

Creates a ProseMirror plugin that handles diff decoration rendering. Add this to both editors.

### `multiEditorDiffStateHolder(config?)`

Creates a state holder that orchestrates the diff between two editors. Returns:

- `addEditor(uuidWithVersion, view, scrollerDivRef)` - Register an editor
- `selectEditor(side, uuidWithVersion)` - Select which editor is left/right
- `switchShowDiff(value)` - Enable/disable diff visualization
- `scrollChanged(topPos, uuidWithVersion)` - Sync scroll position
- `updatePairingsCallback()` - Recalculate node pairings

### `MultiEditorDiffConfig`

Optional configuration:

- `diffableNodeTypes` - Node types to diff (default: `Set(["heading", "paragraph"])`)
- `nonDiffableNodeTypes` - Node types to skip (default: `Set(["codeBlock"])`)
- `onToggleCollapsible` - Callback for collapsible header sync
- `collapsibleHeadersPluginKey` - PluginKey for detecting toggle transactions

## CSS Classes

Add styles for these classes:

- `.highlight-addition` - Added text highlight (green)
- `.highlight-deletion` - Deleted text highlight (red)
- `.multi-editor-diff.empty-rect` - Spacer decorations for height sync
- `.multi-editor-diff.non-matching-node-type` - Node type mismatch indicator

## License

MIT
