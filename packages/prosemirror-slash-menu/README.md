# prosemirror-slash-menu

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> Headless slash menu plugin for ProseMirror -- type `/` to open, search, and execute commands via keyboard.

## Features

- Opens with `/` in an empty paragraph or after a space
- Keyboard navigation (arrow keys, Enter/Tab to execute, Escape to close)
- Filter commands by typing while the menu is open
- Nested submenus with arbitrary depth
- Grouping support for visual separators in the UI
- Dynamic item availability via `available` callbacks
- Custom opening/closing conditions
- Locked (hidden) submenus openable only via transactions
- Headless — bring your own UI, or use [prosemirror-slash-menu-react](https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-slash-menu-react)

## Installation

```bash
npm install prosemirror-slash-menu
```

### Peer dependencies

```bash
npm install prosemirror-model prosemirror-state prosemirror-view
```

## Quick Start

> **Important:** Register `SlashMenuPlugin` **before** other plugins (e.g. `exampleSetup`) in the plugins array. This ensures the menu captures keyboard events (Arrow keys, Enter, Escape) for navigation before other key bindings consume them.

```ts
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { setBlockType, toggleMark } from "prosemirror-commands";
import {
  SlashMenuPlugin,
  SlashMenuKey,
  type CommandItem,
  type MenuElement,
} from "prosemirror-slash-menu";

const menuElements: MenuElement[] = [
  {
    id: "heading1",
    label: "Heading 1",
    type: "command",
    command: (view) => {
      setBlockType(view.state.schema.nodes.heading, { level: 1 })(
        view.state, view.dispatch, view,
      );
    },
    available: () => true,
  } as CommandItem,
  {
    id: "bold",
    label: "Bold",
    type: "command",
    command: (view) => {
      toggleMark(view.state.schema.marks.strong)(view.state, view.dispatch, view);
    },
    available: () => true,
  } as CommandItem,
];

// SlashMenuPlugin MUST come first so it handles keyboard events before other plugins
const state = EditorState.create({
  schema,
  plugins: [
    SlashMenuPlugin(menuElements),
    ...exampleSetup({ schema }),
  ],
});

const view = new EditorView(document.getElementById("editor")!, {
  state,
  dispatchTransaction(tr) {
    const newState = view.state.apply(tr);
    view.updateState(newState);
    // Read menu state for your UI:
    const menuState = SlashMenuKey.getState(newState);
  },
});
```

## Options

`SlashMenuPlugin` accepts the following arguments:

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `menuElements` | `MenuElement[]` | **(required)** | Array of `CommandItem` or `SubMenu` objects. Every element must have a unique `id`. |
| `ignoredKeys` | `string[]` | `undefined` | Additional key codes the menu ignores during filtering (appended to built-in `defaultIgnoredKeys`). |
| `customConditions` | `OpeningConditions` | `undefined` | Override when the menu opens/closes. |
| `openInSelection` | `boolean` | `false` | Allow opening the menu even when text is selected. |
| `inlineFilter` | `boolean` | `false` | When `true`, filter characters are also inserted into the document. |
| `onMenuClose` | `(tr: Transaction, state: SlashMenuState) => void` | `undefined` | Callback fired when the menu closes. |

### Menu Element Types

```ts
type CommandItem = {
  id: string;
  label: string;
  type: "command";
  command: (view: EditorView) => void;
  available: (view: EditorView) => boolean;
  locked?: boolean;   // hidden from the user
  group?: string;      // visual group label
};

type SubMenu = {
  id: string;
  label: string;
  type: "submenu";
  elements: MenuElement[];
  available: (view: EditorView) => boolean;
  locked?: boolean;
  group?: string;
  callbackOnClose?: () => void;
};
```

### Opening Conditions

```ts
interface OpeningConditions {
  shouldOpen: (state: SlashMenuState, event: KeyboardEvent, view: EditorView) => boolean;
  shouldClose: (state: SlashMenuState, event: KeyboardEvent, view: EditorView) => boolean;
}
```

## API

| Export | Type | Description |
| --- | --- | --- |
| `SlashMenuPlugin` | `(menuElements, ignoredKeys?, customConditions?, openInSelection?, inlineFilter?, onMenuClose?) => Plugin` | Creates the slash menu plugin. |
| `SlashMenuKey` | `PluginKey<SlashMenuState>` | Plugin key to read menu state from editor state. |
| `SlashMetaTypes` | `enum` | Transaction meta types (`open`, `close`, `execute`, etc.). |
| `dispatchWithMeta` | `(view, key, meta) => void` | Helper to dispatch a transaction with slash menu metadata. |
| `getElementById` | `(id, state) => MenuElement \| undefined` | Look up a menu element by id. |
| `defaultIgnoredKeys` | `string[]` | Default list of ignored key codes (Shift, Control, Home, etc.). |

### State Shape

```ts
type SlashMenuState = {
  selected: string;              // id of the currently highlighted item
  filteredElements: MenuElement[]; // items matching the current filter
  open: boolean;
  subMenuId?: string;            // id of the currently open submenu
  filter: string;                // current filter text
  elements: MenuElement[];       // all registered elements
  ignoredKeys: string[];
};
```

## TipTap

```ts
import { Extension } from "@tiptap/core";
import { SlashMenuPlugin } from "prosemirror-slash-menu";

const SlashMenuExtension = Extension.create({
  name: "slashMenu",
  addProseMirrorPlugins() {
    return [SlashMenuPlugin(myMenuElements)];
  },
});
```

## React

For a ready-made React UI component, see [prosemirror-slash-menu-react](https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-slash-menu-react).

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#slashMenuVanilla) in the monorepo playground.

## License

MIT
