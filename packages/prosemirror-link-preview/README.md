# prosemirror-link-preview

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> Renders rich link preview cards when URLs are pasted into a ProseMirror editor.

## Features

- Automatically fetches and renders link previews (title, description, image) when a URL is pasted
- Supports both plain ProseMirror and Yjs collaborative editing
- Configurable fetch callback — bring your own backend (required due to browser CORS restrictions)
- Click-to-open support for preview cards
- Placeholder decoration shown while the preview is loading
- Bundled CSS with customisable card structure

## Installation

```bash
npm install prosemirror-link-preview
```

### Peer dependencies

```bash
npm install prosemirror-model prosemirror-state prosemirror-view prosemirror-commands
```

For Yjs collaboration (optional):

```bash
npm install yjs y-prosemirror
```

## Quick Start

```typescript
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  addPreviewNode,
  previewPlugin,
  apply,
  createDecorations,
  findPlaceholder,
} from "prosemirror-link-preview";
import "prosemirror-link-preview/dist/styles/styles.css";

// 1. Add the preview node to your schema
const mySchema = new Schema({
  nodes: addPreviewNode(schema.spec.nodes),
  marks: schema.spec.marks,
});

// 2. Define your fetch callback
async function fetchLinkPreview(link: string) {
  const res = await fetch("/api/link-preview", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ link }),
  });
  const { data } = await res.json();
  return { url: data.url, title: data.title, description: data.description, images: data.images };
}

// 3. Create the editor
const view = new EditorView(document.getElementById("editor")!, {
  state: EditorState.create({
    schema: mySchema,
    plugins: [
      ...exampleSetup({ schema: mySchema }),
      previewPlugin(
        fetchLinkPreview,
        apply,
        createDecorations,
        findPlaceholder,
        undefined,
        { openLinkOnClick: true },
      ),
    ],
  }),
});
```

### Yjs mode

For collaborative editing, swap in the Yjs-aware helpers:

```typescript
import {
  previewPlugin,
  applyYjs,
  createDecorationsYjs,
  findPlaceholderYjs,
} from "prosemirror-link-preview";
import { ySyncPlugin, yUndoPlugin } from "y-prosemirror";

previewPlugin(
  fetchLinkPreview,
  applyYjs,
  createDecorationsYjs,
  findPlaceholderYjs,
  undefined,
  { openLinkOnClick: true, pasteLink: true },
);
```

## Options

### `previewPlugin(callback, apply, createDecorations, findPlaceholder, customYSyncPluginKey?, options?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `callback` | `(url: string) => Promise<{url, title, description, images}>` | *required* | Fetches link metadata — must return a promise with preview data |
| `apply` | `function` | *required* | State apply function (`apply` for plain, `applyYjs` for Yjs) |
| `createDecorations` | `function` | *required* | Decoration factory (`createDecorations` or `createDecorationsYjs`) |
| `findPlaceholder` | `function` | *required* | Placeholder finder (`findPlaceholder` or `findPlaceholderYjs`) |
| `customYSyncPluginKey` | `PluginKey` | `undefined` | Custom ySyncPlugin key (if using a non-default key) |
| `options.openLinkOnClick` | `boolean` | `false` | Open the original URL in a new tab when the preview card is clicked |
| `options.pasteLink` | `boolean` | `false` | Automatically trigger a preview fetch when a URL is pasted |

## API

| Export | Type | Description |
|---|---|---|
| `previewPlugin` | `function` | Creates the plugin instance |
| `previewNodeView` | `function` | Node view factory for the preview node |
| `addPreviewNode` | `function` | Injects a `preview` node type into a schema's node spec |
| `apply` | `function` | Plain ProseMirror state apply handler |
| `applyYjs` | `function` | Yjs-aware state apply handler |
| `createDecorations` | `function` | Plain ProseMirror decoration factory |
| `createDecorationsYjs` | `function` | Yjs-aware decoration factory |
| `findPlaceholder` | `function` | Plain ProseMirror placeholder finder |
| `findPlaceholderYjs` | `function` | Yjs-aware placeholder finder |
| `defaultOptions` | `object` | Default options object |
| `insertPreview` | `function` | Programmatically insert a preview node |
| `previewPluginKey` | `PluginKey` | Plugin key for accessing state or dispatching meta |
| `IDefaultOptions` | `interface` | Options type |

## Styles

```typescript
import "prosemirror-link-preview/dist/styles/styles.css";
```

The default card structure:

```html
<div class="preview-root">
  <div class="preview-image" />
  <div class="preview-title" />
  <div class="preview-description" />
</div>
```

Override these classes with your own CSS for custom styling.

## TipTap

Register as a ProseMirror plugin via TipTap's `addProseMirrorPlugins()`:

```typescript
import { Extension } from "@tiptap/core";
import { addPreviewNode, previewPlugin, apply, createDecorations, findPlaceholder } from "prosemirror-link-preview";

const LinkPreviewExtension = Extension.create({
  name: "linkPreview",
  addProseMirrorPlugins() {
    return [
      previewPlugin(fetchLinkPreview, apply, createDecorations, findPlaceholder, undefined, { openLinkOnClick: true }),
    ];
  },
});
```

Note: you also need to add the preview node to your TipTap schema.

## Why a Backend?

Browsers enforce [CORS (Cross-Origin Resource Sharing)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) restrictions that prevent client-side JavaScript from fetching HTML from arbitrary domains. Most websites do not set permissive CORS headers, so a direct `fetch()` from the browser will fail. A server-side endpoint can fetch the target page without CORS restrictions, scrape the Open Graph / meta tags, and return the structured preview data to your frontend.

## How It Works

1. When a URL is pasted, the plugin intercepts the paste event via `transformPasted`
2. A placeholder decoration is inserted at the paste position
3. The `callback` function is called to fetch link metadata from your backend
4. On success, the placeholder is replaced with a `preview` node containing the fetched data
5. The `previewNodeView` renders the node as a styled card with title, description, and image

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#linkPreview) in the monorepo playground.

## License

MIT
