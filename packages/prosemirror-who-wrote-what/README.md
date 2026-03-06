# @emergence-engineering/prosemirror-who-wrote-what

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> Track text authorship in collaborative ProseMirror editors using Yjs. Highlights which user wrote which text with colored inline decorations.

## Features

- Colored inline decorations showing who wrote what
- Automatic Yjs clientID-to-userId mapping via shared YMap
- Adaptive debounce that scales with document size
- Customizable color palette and decoration factory
- Toggle visibility on/off at runtime
- Works with any ProseMirror schema — no schema changes needed

## Installation

```bash
npm install @emergence-engineering/prosemirror-who-wrote-what
```

### Peer dependencies

```bash
npm install prosemirror-state prosemirror-view yjs y-prosemirror
```

## Quick Start

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

const view = new EditorView(document.getElementById("editor")!, {
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
| `debounceFactor` | `number` | `1.5` | Multiplier for adaptive debounce. Debounce delay = lastComputeMs * debounceFactor. Set to `0` to disable. |
| `createDecoration` | `(from, to, color, userId) => Decoration` | inline with `background-color` | Custom decoration factory for full control over how authorship is displayed. |

## API

| Export | Type | Description |
|--------|------|-------------|
| `createWhoWroteWhatPlugin` | `(options: WhoWroteWhatOptions) => Plugin` | Creates the authorship tracking plugin. |
| `setWhoWroteWhatVisibility` | `(view: EditorView, visible: boolean) => void` | Toggles decoration visibility at runtime. |
| `whoWroteWhatPluginKey` | `PluginKey` | Plugin key for reading plugin state. |
| `DEFAULT_COLORS` | `string[]` | The 16 built-in pastel colors. |
| `createColorAssigner` | `(colors: string[]) => (userId) => string` | Creates a function that assigns colors to user IDs. |
| `WhoWroteWhatMetaType` | `enum` | Meta transaction types (`SetVisibility`). |

## How It Works

1. The plugin observes the Yjs XML fragment and user map for changes.
2. On each change, it writes the current user's `clientID -> userId` mapping to a shared YMap.
3. It walks the Yjs document tree, resolves each text item's author via the user map, and creates colored inline decorations.
4. Decorations are dispatched to the ProseMirror plugin state and rendered by the editor.
5. An adaptive debounce mechanism scales the recomputation delay with document complexity to keep the editor responsive.

## TipTap

Register the plugin via TipTap's extension API:

```ts
import { Extension } from "@tiptap/core";
import { createWhoWroteWhatPlugin } from "@emergence-engineering/prosemirror-who-wrote-what";

const WhoWroteWhat = Extension.create({
  name: "whoWroteWhat",
  addProseMirrorPlugins() {
    return [createWhoWroteWhatPlugin({ userId: "current-user" })];
  },
});
```

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#whoWroteWhat) in the monorepo playground.

## License

MIT
