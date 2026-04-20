# prosemirror-image-plugin

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> A ProseMirror plugin for advanced image handling -- drag & drop, paste, resize, align, and upload with placeholders.

## Features

- Drag and drop or paste images from anywhere
- Upload images to endpoints, showing a placeholder until upload finishes
- Optional `deleteSrc` callback to remove images from the server when deleted from the document
- Customisable overlay for alignment controls, captions, or any interactive elements
- Image resizing with body resize listeners so images always fit the editor
- Proportional scaling with editor width
- Four alignment modes: left, right, center, full width
- Optional image title field (block images only)
- Custom download function for images behind authentication
- Built-in image caching helpers (in-memory and localStorage)
- Yjs collaboration support out of the box

## Installation

```bash
npm install prosemirror-image-plugin
```

### Peer dependencies

```bash
npm install prosemirror-model prosemirror-state prosemirror-view prosemirror-commands prosemirror-transform
```

## Quick Start

```typescript
import { Schema } from "prosemirror-model";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import {
  defaultSettings,
  updateImageNode,
  imagePlugin,
} from "prosemirror-image-plugin";

import "prosemirror-image-plugin/dist/styles/common.css";
import "prosemirror-image-plugin/dist/styles/withResize.css";
import "prosemirror-image-plugin/dist/styles/sideResize.css";

const imageSettings = { ...defaultSettings };

const imageSchema = new Schema({
  nodes: updateImageNode(schema.spec.nodes, imageSettings),
  marks: schema.spec.marks,
});

const state = EditorState.create({
  doc: imageSchema.nodeFromJSON(initialDoc),
  plugins: [
    ...exampleSetup({ schema: imageSchema }),
    imagePlugin(imageSettings),
  ],
});

const view = new EditorView(document.getElementById("editor")!, { state });
```

## Options

### `ImagePluginSettings`

| Option | Type | Default | Description |
|---|---|---|---|
| `uploadFile` | `(file: File) => Promise<string>` | returns data URI | Uploads the image and returns the hosted URL |
| `deleteSrc` | `(src: string) => Promise<void>` | no-op | Deletes the image from the server |
| `hasTitle` | `boolean` | `true` | Show a title field below the image (`isBlock` must be `true`) |
| `extraAttributes` | `Record<string, string \| null>` | built-in defaults | Extra attributes on the image node |
| `createOverlay` | `(node, getPos, view) => Node \| undefined` | built-in alignment overlay | Custom overlay DOM element |
| `updateOverlay` | `(overlayRoot, getPos, view, node) => void` | built-in updater | Called when the image node changes |
| `defaultTitle` | `string` | `""` | Default title for new images |
| `defaultAlt` | `string` | `""` | Default alt text for new images |
| `enableResize` | `boolean` | `true` | Enable resize handles |
| `isBlock` | `boolean` | `true` | Block images (`true`) or inline images (`false`) |
| `resizeCallback` | `(el, updateCallback) => () => void` | built-in | Creates and destroys resize listeners |
| `imageMargin` | `number` | `50` | Space in px on each side of the image |
| `minSize` | `number` | `50` | Minimum image width in px |
| `maxSize` | `number` | `2000` | Maximum image width in px |
| `scaleImage` | `boolean` | `true` | Scale images proportionally with editor width |
| `showPreviewDuringUpload` | `boolean` | `false` | Shows the local image inside the upload placeholder (via `URL.createObjectURL`) until `uploadFile` resolves. The preview lives only in the decoration — no `blob:` URL enters the document. Only applies to `startImageUpload` (drop / paste / file picker); `startImageUploadFn` has no `File` to preview. |
| `downloadImage` | `(url: string) => Promise<string>` | `undefined` | Custom image download function (for auth or caching) |
| `downloadPlaceholder` | `(url, view) => string \| {src?, className?}` | `undefined` | Placeholder shown while `downloadImage` runs |
| `createDecorations` | `(state) => DecorationSet` | built-in | Custom decoration factory (needed with Yjs) |
| `createState` | `(pluginSettings) => StateField` | built-in | Custom state field (needed with Yjs) |
| `findPlaceholder` | `(state, id) => number \| undefined` | built-in | Custom placeholder finder (needed with Yjs) |

## API

| Export | Type | Description |
|---|---|---|
| `imagePlugin` | `function` | Creates the plugin instance |
| `updateImageNode` | `function` | Injects an enhanced `image` node into a schema's node spec |
| `defaultSettings` | `object` | Default plugin settings |
| `startImageUpload` | `function` | Programmatically upload an image from a File object |
| `startImageUploadFn` | `function` | Programmatically upload via an async function (returns `Promise<ImageUploadReturn>`) |
| `imagePluginKey` | `PluginKey` | Plugin key for accessing state or dispatching meta |
| `imageAlign` | `enum` | Alignment values: `left`, `right`, `center`, `fullWidth` |
| `fetchImageAsBase64` | `function` | Helper to fetch a URL and return base64-encoded image data |
| `imageCache` | `function` | Higher-order caching wrapper for download functions |
| `localStorageCache` | `function` | localStorage-backed cache for `imageCache` |
| `ImagePluginSettings` | `interface` | Settings type |
| `ImagePluginState` | `type` | Plugin state type (DecorationSet) |
| `ImagePluginAction` | `type` | Action type for insert/remove placeholders |
| `ImageUploadReturn` | `type` | Return type of upload functions: `{ url: string; alt?: string }` |

## Styles

```typescript
import "prosemirror-image-plugin/dist/styles/common.css";
import "prosemirror-image-plugin/dist/styles/withResize.css";
import "prosemirror-image-plugin/dist/styles/sideResize.css";
// or for non-resize mode:
import "prosemirror-image-plugin/dist/styles/withoutResize.css";
```

### Showing the local image while upload is in progress

If you enable `showPreviewDuringUpload`, the placeholder widget renders the
local image via an object URL while the upload runs. The preview lives
entirely in the widget decoration — nothing is written to the document —
so autosaves, Yjs sync, and reloads stay clean.

When the preview is active, the placeholder element carries a
`data-preview` attribute and contains an `<img>` child, so you can style
it with:

```css
placeholder[data-preview] { /* your styles */ }
placeholder[data-preview] img { /* your image styles */ }
```

The object URL is revoked when the upload resolves, rejects, or the
placeholder is removed.

## TipTap

Register as a ProseMirror plugin via TipTap's `addProseMirrorPlugins()`:

```typescript
import { Extension } from "@tiptap/core";
import { imagePlugin, defaultSettings } from "prosemirror-image-plugin";

const ImagePluginExtension = Extension.create({
  name: "imagePlugin",
  addProseMirrorPlugins() {
    return [imagePlugin({ ...defaultSettings })];
  },
});
```

Note: you also need to update the image node in your TipTap schema using `updateImageNode`.

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#imagePlugin) in the monorepo playground.

## License

MIT
