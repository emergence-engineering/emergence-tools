# prosemirror-paste-link

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> Paste a URL onto selected text to create a link, instead of replacing the selection with the URL.

## Features

- Detects when pasted text is a URL and text is selected
- Wraps the selection in a `link` mark with the pasted URL as `href`
- Zero configuration — just add to your plugins array
- Works with any schema that has a `link` mark

## Installation

```bash
npm install prosemirror-paste-link
```

### Peer dependencies

```bash
npm install prosemirror-state prosemirror-transform
```

## Quick Start

```ts
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import pasteLinkPlugin from "prosemirror-paste-link";

const view = new EditorView(document.getElementById("editor")!, {
  state: EditorState.create({
    schema, // must include a "link" mark with an "href" attribute
    plugins: [
      // ...other plugins
      pasteLinkPlugin,
    ],
  }),
});
```

## API

| Export | Type | Description |
|--------|------|-------------|
| `default` | `Plugin` | The paste-link plugin instance. Add directly to your plugins array. |

## TipTap

Register the plugin via TipTap's extension API:

```ts
import { Extension } from "@tiptap/core";
import pasteLinkPlugin from "prosemirror-paste-link";

const PasteLink = Extension.create({
  name: "pasteLink",
  addProseMirrorPlugins() {
    return [pasteLinkPlugin];
  },
});
```

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#pasteLink) in the monorepo playground.

## License

MIT
