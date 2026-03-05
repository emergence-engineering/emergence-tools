# @emergence-engineering/prosemirror-who-wrote-what

Track text authorship in collaborative ProseMirror editors using Yjs. Highlights which user wrote which text with colored inline decorations.

## Install

```bash
npm install @emergence-engineering/prosemirror-who-wrote-what
```

### Peer dependencies

```bash
npm install prosemirror-state prosemirror-view yjs y-prosemirror
```

## Usage

```ts
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { ySyncPlugin } from "y-prosemirror";
import * as Y from "yjs";
import {
  createWhoWroteWhatPlugin,
  setWhoWroteWhatVisibility,
} from "@emergence-engineering/prosemirror-who-wrote-what";

const ydoc = new Y.Doc();
const yXmlFragment = ydoc.getXmlFragment("default");

const view = new EditorView(document.getElementById("editor"), {
  state: EditorState.create({
    plugins: [
      ySyncPlugin(yXmlFragment),
      createWhoWroteWhatPlugin({ userId: "alice" }),
    ],
  }),
});

// Toggle authorship highlighting on/off
setWhoWroteWhatVisibility(view, false);
setWhoWroteWhatVisibility(view, true);
```

## Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `colors` | `string[]` | 16 built-in colors | Color palette for author highlights. Cycles through sequentially. |
| `userMapKey` | `string` | `"userMap"` | Key for the shared YMap storing clientID-to-userId mappings. |
| `startVisible` | `boolean` | `true` | Whether decorations are visible when the plugin initializes. |
| `createDecoration` | `(from, to, color, userId) => Decoration` | inline with `background-color` | Custom decoration factory. |

## How it works

1. The plugin observes the Yjs XML fragment and user map for changes.
2. On each change, it writes the current user's `clientID -> userId` mapping to a shared YMap.
3. It walks the Yjs document tree, resolves each text item's author via the user map, and creates colored inline decorations.
4. Decorations are dispatched to the ProseMirror plugin state and rendered by the editor.

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#whoWroteWhat) in the monorepo playground.
