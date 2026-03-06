# prosemirror-slash-menu-react

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> React UI component for [prosemirror-slash-menu](https://github.com/emergence-engineering/emergence-tools/tree/main/packages/prosemirror-slash-menu) -- renders a positioned, keyboard-navigable command palette with icons and submenus.

## Features

- Renders the slash menu as a React component
- Positions at the cursor via Popper.js
- Automatic flip when the menu would overflow the viewport
- Default icons and menu elements included
- Custom icons, right-side icons, and submenu icons
- Clickable mode for mouse interaction
- Customizable filter placeholder and main menu label
- Optional Popper reference element and placement
- Outside-click handling to close the menu
- Ships with default CSS (overridable via class names)

## Installation

```bash
npm install prosemirror-slash-menu-react
```

### Peer dependencies

```bash
npm install prosemirror-slash-menu prosemirror-commands prosemirror-schema-basic prosemirror-state prosemirror-view react react-dom
```

## Quick Start

```tsx
import { useState, useEffect, useRef } from "react";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import { schema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { SlashMenuPlugin } from "prosemirror-slash-menu";
import {
  SlashMenuReact,
  defaultElements,
  defaultIcons,
  Icons,
} from "prosemirror-slash-menu-react";

// Import default styles
import "prosemirror-slash-menu-react/dist/styles/menu-style.css";

function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorState, setEditorState] = useState<EditorState>();

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      schema,
      plugins: [SlashMenuPlugin(defaultElements), ...exampleSetup({ schema })],
    });

    const view = new EditorView(editorRef.current, {
      state,
      dispatchTransaction(tr) {
        const newState = view.state.apply(tr);
        view.updateState(newState);
        setEditorState(newState);
      },
    });

    viewRef.current = view;
    setEditorState(state);
    return () => view.destroy();
  }, []);

  return (
    <>
      <div ref={editorRef} />
      {editorState && viewRef.current && (
        <SlashMenuReact
          editorState={editorState}
          editorView={viewRef.current}
          icons={{
            [Icons.HeaderMenu]: defaultIcons.HeadingIcon,
            [Icons.Level1]: defaultIcons.H1Icon,
            [Icons.Level2]: defaultIcons.H2Icon,
            [Icons.Level3]: defaultIcons.H3Icon,
            [Icons.Bold]: defaultIcons.BoldIcon,
            [Icons.Italic]: defaultIcons.ItalicIcon,
            [Icons.Code]: defaultIcons.CodeIcon,
            [Icons.Link]: defaultIcons.LinkIcon,
          }}
          filterPlaceHolder="Type to filter..."
          clickable
        />
      )}
    </>
  );
}
```

## Options

`SlashMenuReact` props:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `editorState` | `EditorState` | **(required)** | Current ProseMirror editor state. |
| `editorView` | `EditorView` | **(required)** | ProseMirror editor view instance. |
| `icons` | `{ [id: string]: FC }` | `undefined` | Left-side icon components keyed by menu element id. |
| `rightIcons` | `{ [id: string]: FC }` | `undefined` | Right-side icon components (e.g. submenu arrows). |
| `subMenuIcon` | `ReactNode` | Arrow left icon | Icon shown next to the submenu back-label. |
| `filterFieldIcon` | `ReactNode` | `undefined` | Icon rendered inside the filter input. |
| `filterPlaceHolder` | `string` | `undefined` | Placeholder text for the filter field. |
| `mainMenuLabel` | `string` | `undefined` | Label shown above top-level menu items. |
| `popperReference` | `HTMLElement` | Cursor position | Anchor element for Popper.js positioning. |
| `popperOptions` | `PopperOptions` | `{ placement: "bottom-start" }` | Placement and offset for Popper.js. |
| `clickable` | `boolean` | `false` | Enable mouse clicks on menu items. |
| `disableInput` | `boolean` | `false` | Hide the filter input area entirely. |
| `emptySearchComponent` | `ReactNode` | `"No matching items"` | Component shown when filter matches nothing. |

## API

| Export | Type | Description |
| --- | --- | --- |
| `SlashMenuReact` | `FC<SlashMenuProps>` | The React menu component. |
| `defaultElements` | `MenuElement[]` | Pre-built menu elements (headings, bold, italic, code, link). |
| `defaultIcons` | `object` | Pre-built SVG icon components (`H1Icon`, `H2Icon`, `H3Icon`, `HeadingIcon`, `BoldIcon`, `ItalicIcon`, `CodeIcon`, `LinkIcon`, `ArrowLeft`, `ArrowRight`). |
| `Icons` | `enum` | Enum of default element ids (`HeaderMenu`, `Level1`, `Level2`, `Level3`, `Bold`, `Italic`, `Code`, `Link`). |
| `Placement` | `enum` | Popper.js placement values (`auto`, `top`, `bottom`, `left`, `right`, and variants). |
| `PopperOptions` | `interface` | Shape for `popperOptions` prop (`placement`, `offsetModifier`). |
| `SlashMenuProps` | `interface` | Full prop type for `SlashMenuReact`. |

## Styles

Import the default styles:

```ts
import "prosemirror-slash-menu-react/dist/styles/menu-style.css";
```

Override with your own CSS using these class names:

| Class | Description |
| --- | --- |
| `menu-display-root` | Root container for the menu |
| `menu-element-wrapper` | Wrapper for each menu item |
| `menu-element-wrapper-clickable` | Menu item wrapper when `clickable` is enabled |
| `menu-element-selected` | Added to the currently highlighted item |
| `menu-element-icon` | Left icon container |
| `menu-element-right-icon` | Right icon container |
| `menu-element-label` | Item label text |
| `menu-placeholder` | "No matching items" placeholder |
| `menu-filter-wrapper` | Filter field container |
| `menu-filter` | Filter text display |
| `menu-filter-placeholder` | Filter placeholder text |
| `menu-filter-icon` | Filter field icon container |
| `submenu-label` | Submenu header label |
| `group-wrapper` | Group container |
| `group-label` | Group header label |

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#slashMenuReact) in the monorepo playground.

## License

MIT
