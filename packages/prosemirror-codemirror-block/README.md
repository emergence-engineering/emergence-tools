# prosemirror-codemirror-block

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> CodeMirror 6 code blocks inside ProseMirror — syntax highlighting for 100+ languages, a language selector, theme support, and keyboard shortcuts.

## Features

- Replaces ProseMirror `code_block` nodes with full CodeMirror 6 editors
- Lazy-loaded language support via dynamic `import()`
- 100+ languages through CM6 native loaders and CM5 legacy modes
- Customizable language selector dropdown
- Theme switching at runtime (`updateTheme`)
- Arrow-key escape from code blocks
- Toggle shortcut (`Cmd/Ctrl+Alt+C`)
- Read-only mode support
- Copy button support

## Installation

```bash
npm install prosemirror-codemirror-block
```

### Peer dependencies

```bash
npm install @codemirror/state prosemirror-commands prosemirror-model prosemirror-state prosemirror-view
```

## Quick Start

```ts
import { Schema } from "prosemirror-model";
import { schema as basicSchema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import { keymap } from "prosemirror-keymap";
import { undo, redo } from "prosemirror-history";
import {
  codeMirrorBlockPlugin,
  defaultSettings,
  languageLoaders,
  legacyLanguageLoaders,
  codeBlockKeymap,
  CodeBlockNodeName,
} from "prosemirror-codemirror-block";

// 1. Add a "lang" attr to the code_block node
const codeBlockSpec = basicSchema.spec.nodes.get(CodeBlockNodeName);
const schema = new Schema({
  nodes: basicSchema.spec.nodes.update(CodeBlockNodeName, {
    ...(codeBlockSpec || {}),
    attrs: { ...codeBlockSpec?.attrs, lang: { default: null } },
  }),
  marks: basicSchema.spec.marks,
});

// 2. Create the editor
const state = EditorState.create({
  schema,
  plugins: [
    ...exampleSetup({ schema }),
    codeMirrorBlockPlugin({
      ...defaultSettings,
      languageLoaders: { ...languageLoaders, ...legacyLanguageLoaders },
      undo,
      redo,
    }),
    keymap(codeBlockKeymap),
  ],
});

const view = new EditorView(document.getElementById("editor")!, { state });
```

## Options

`CodeBlockSettings` — passed to `codeMirrorBlockPlugin()`:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `createSelect` | `(settings, dom, node, view, getPos) => () => void` | Built-in `<select>` | Callback to create a language selector. Returns a cleanup function. |
| `updateSelect` | `(settings, dom, node, view, getPos, oldNode) => void` | Built-in | Called when the node updates; should sync selector to the node's `lang` attr. |
| `createCopyButton` | `(settings, dom, node, view, cmView, getPos) => () => void` | Built-in | Callback to create a copy button. Returns a cleanup function. |
| `languageLoaders` | `Record<string, () => Promise<LanguageSupport>>` | `undefined` | Map of language names to lazy loader functions. |
| `languageNameMap` | `Record<string, string>` | `undefined` | Display-name aliases for languages in the selector. |
| `languageWhitelist` | `string[]` | `undefined` | Restrict the selector to only these languages. |
| `undo` | `(state, dispatch) => void` | — | Undo command (`prosemirror-history` or `y-prosemirror`). |
| `redo` | `(state, dispatch) => void` | — | Redo command (`prosemirror-history` or `y-prosemirror`). |
| `theme` | `Extension[]` | `undefined` | Additional CodeMirror extensions (e.g. a theme). |
| `themes` | `Array<{ extension: Extension; name: string }>` | `[]` | Named themes for runtime switching. |
| `getCurrentTheme` | `() => string` | `undefined` | Returns the theme name to apply when creating a new code block. |
| `stopEvent` | `(e, node, getPos, view, dom) => boolean` | Built-in | Override the NodeView `stopEvent` handler. |
| `readOnly` | `boolean` | `false` | Whether the code blocks are read-only. |
| `codeBlockName` | `string` | `"code_block"` | Name of the code block node in your schema. |

## API

| Export | Type | Description |
| --- | --- | --- |
| `codeMirrorBlockPlugin` | `(settings: CodeBlockSettings) => Plugin` | Creates the ProseMirror plugin with CodeMirror node views. |
| `codeMirrorBlockNodeView` | `(settings: CodeBlockSettings) => NodeViewConstructor` | The raw node view factory (if you need manual registration). |
| `codeMirrorBlockKey` | `PluginKey` | Plugin key for accessing plugin state. |
| `defaultSettings` | `CodeBlockSettings` | Sensible defaults (built-in select, no languages, not read-only). |
| `languageLoaders` | `LanguageLoaders` | CM6 native language loaders (JS, TS, Python, Rust, etc.). |
| `legacyLanguageLoaders` | `LanguageLoaders` | CM5 legacy mode loaders via `@codemirror/legacy-modes`. |
| `codeBlockKeymap` | `Record<string, Command>` | Keymap with toggle shortcut and arrow-key handlers. |
| `codeBlockArrowHandlers` | `Keymap` | Arrow-key handlers for escaping code blocks. |
| `CodeBlockNodeName` | `string` | The node name constant (`"code_block"`). |
| `CodeBlockLanguages` | `enum` | Enum of built-in CM6 language names. |
| `LegacyLanguages` | `enum` | Enum of legacy CM5 language names. |
| `createCodeBlock` | `Command` | ProseMirror command to create a code block. |
| `removeCodeBlock` | `Command` | ProseMirror command to remove a code block. |
| `toggleCodeBlock` | `Command` | ProseMirror command to toggle a code block. |
| `codeBlockToggleShortcut` | `Record<string, Command>` | Keymap entry for `Cmd/Ctrl+Alt+C`. |
| `updateTheme` | `(theme: string) => void` | Switch all code blocks to a named theme at runtime. |

## Styles

A minimal starter style for the language selector:

```css
.codeblock-select {
  position: absolute;
  right: 0;
  z-index: 100;
  opacity: 0;
  transition: all 0.3s ease;
  margin: 6px 14px;
}
.codeblock-root {
  position: relative;
}
.codeblock-root:hover .codeblock-select {
  opacity: 1;
}
```

## TipTap

```ts
import { Extension } from "@tiptap/core";
import {
  codeMirrorBlockPlugin,
  defaultSettings,
  languageLoaders,
  codeBlockKeymap,
} from "prosemirror-codemirror-block";
import { undo, redo } from "prosemirror-history";
import { keymap } from "prosemirror-keymap";

const CodeBlockExtension = Extension.create({
  name: "codemirrorBlock",
  addProseMirrorPlugins: () => [
    codeMirrorBlockPlugin({
      ...defaultSettings,
      languageLoaders,
      undo,
      redo,
    }),
    keymap(codeBlockKeymap),
  ],
});
```

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#codeMirrorBlock) in the monorepo playground.

## License

MIT
