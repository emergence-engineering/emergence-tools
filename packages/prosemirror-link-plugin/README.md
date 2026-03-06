# prosemirror-link-plugin

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> Automatically decorates words matching a configurable alias list in ProseMirror documents.

## Features

- Add inline decorations around words that match a given list of aliases
- Update the alias list at runtime and see decorations recalculate immediately
- Get notified via callbacks when aliases appear or disappear from the document
- Fully customisable decoration factory — render aliases as links, tooltips, badges, or anything else
- Supply a custom regex generator for fine-grained matching rules
- Generic over alias spec type — attach any extra data (URLs, IDs, etc.) to each alias

## Installation

```bash
npm install prosemirror-link-plugin
```

### Peer dependencies

```bash
npm install prosemirror-model prosemirror-state prosemirror-view prosemirror-commands prosemirror-transform prosemirror-tables
```

## Quick Start

```typescript
import { schema } from "prosemirror-schema-basic";
import { EditorState } from "prosemirror-state";
import { EditorView, Decoration } from "prosemirror-view";
import { exampleSetup } from "prosemirror-example-setup";
import {
  autoLinkingPlugin,
  LinksKeyState,
} from "prosemirror-link-plugin";

interface LinkSpec {
  alias: string;
  url: string;
}

const aliases: LinkSpec[] = [
  { alias: "ProseMirror", url: "https://prosemirror.net" },
  { alias: "TypeScript", url: "https://typescriptlang.org" },
];

const createAliasDecoration = (
  start: number,
  end: number,
  alias: string,
  matchPos: number,
  pluginState: LinksKeyState<LinkSpec>,
) => {
  const spec = pluginState.aliasToSpec[alias];
  return Decoration.inline(start, end, {
    class: "autoLink",
    title: spec?.url,
  }, { alias, url: spec?.url });
};

const state = EditorState.create({
  doc: schema.nodeFromJSON(initialDoc),
  plugins: [
    ...exampleSetup({ schema }),
    autoLinkingPlugin<LinkSpec>(aliases, createAliasDecoration),
  ],
});

const view = new EditorView(document.getElementById("editor")!, { state });
```

## Options

### `autoLinkingPlugin(aliasesWithSpec, createAliasDecoration, onLinkAdd?, onLinkRemove?, regexGenerator?)`

| Option | Type | Default | Description |
|---|---|---|---|
| `aliasesWithSpec` | `Array<SpecWithAlias<T>>` | *required* | Initial list of aliases (each must have an `alias` string field) |
| `createAliasDecoration` | `(start, end, alias, matchPos, pluginState, doc) => Decoration` | *required* | Factory called for every alias match — returns a ProseMirror Decoration |
| `onLinkAdd` | `(addedLinks: Array<SpecWithAlias<T>>) => void` | `undefined` | Called when new alias matches appear in the document |
| `onLinkRemove` | `(removedLinks: Array<SpecWithAlias<T>>) => void` | `undefined` | Called when alias matches are removed from the document |
| `regexGenerator` | `(aliases: string[]) => RegExp` | built-in | Custom regex factory for matching aliases |

### Updating aliases at runtime

```typescript
import { linksKey, LinksMetaType } from "prosemirror-link-plugin";

view.dispatch(
  view.state.tr.setMeta(linksKey, {
    type: LinksMetaType.linkUpdate,
    specs: updatedAliases,
  }),
);
```

## API

| Export | Type | Description |
|---|---|---|
| `autoLinkingPlugin` | `function` | Creates the plugin instance |
| `linksKey` | `PluginKey` | Plugin key for accessing state or dispatching meta |
| `LinksMetaType` | `enum` | Meta type enum (`linkUpdate`) |
| `defaultAliasDecoration` | `function` | Built-in decoration factory (inline with background) |
| `LinksKeyState` | `interface` | Plugin state shape (decorations, regex, aliasToSpec) |
| `SpecWithAlias` | `type` | Alias spec type — `T & { alias: string }` |
| `LinksMeta` | `type` | Meta object type for dispatching updates |
| `LinksUpdateMeta` | `interface` | Update meta shape |

## TipTap

Register as a ProseMirror plugin via TipTap's `addProseMirrorPlugins()`:

```typescript
import { Extension } from "@tiptap/core";
import { autoLinkingPlugin } from "prosemirror-link-plugin";

const LinkPluginExtension = Extension.create({
  name: "linkPlugin",
  addProseMirrorPlugins() {
    return [autoLinkingPlugin(aliases, createAliasDecoration)];
  },
});
```

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#linkPlugin) in the monorepo playground.

## License

MIT
