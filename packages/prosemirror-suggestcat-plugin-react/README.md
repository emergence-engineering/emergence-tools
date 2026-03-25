# prosemirror-suggestcat-plugin-react

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> React UI components for prosemirror-suggestcat-plugin: slash menu, suggestion overlay, and grammar popup

## Features

- Slash menu to select and filter AI commands (Complete, Simplify, Translate, Change Tone, etc.)
- "Ask AI" tooltip that appears when text is selected
- Suggestion overlay showing streaming results with accept/reject controls
- Grammar popup displaying corrections with accept, discard, and hint actions
- Built on top of prosemirror-slash-menu-react for keyboard and mouse navigation

## Installation

```bash
npm install prosemirror-suggestcat-plugin-react
```

### Peer dependencies

```bash
npm install prosemirror-suggestcat-plugin prosemirror-slash-menu prosemirror-slash-menu-react prosemirror-state prosemirror-view react react-dom
```

## Quick Start

```tsx
import { SlashMenuPlugin } from "prosemirror-slash-menu";
import { completePluginV2, grammarSuggestPluginV2 } from "prosemirror-suggestcat-plugin";
import {
  ProsemirrorSuggestcatPluginReact,
  GrammarPopup,
  promptCommands,
  slashOpeningCondition,
} from "prosemirror-suggestcat-plugin-react";

// 1. Add plugins to your editor
const state = EditorState.create({
  plugins: [
    completePluginV2("<YOUR_API_KEY>"),
    grammarSuggestPluginV2("<YOUR_API_KEY>", { createPopup: "react" }),
    SlashMenuPlugin(promptCommands, undefined, slashOpeningCondition),
  ],
});

const view = new EditorView(document.querySelector("#editor"), {
  state,
  dispatchTransaction(tr) {
    const newState = view.state.apply(tr);
    view.updateState(newState);
    setEditorState(newState);
  },
});

// 2. Render the React components alongside your editor
<ProsemirrorSuggestcatPluginReact
  editorView={view}
  editorState={editorState}
/>
<GrammarPopup
  editorView={view}
  editorState={editorState}
  apiKey="<YOUR_API_KEY>"
/>
```

## API

| Export | Type | Description |
|---|---|---|
| `ProsemirrorSuggestcatPluginReact` | React component | Renders the slash menu and suggestion overlay |
| `GrammarPopup` | React component | Renders the grammar suggestion popup |
| `promptCommands` | `(CommandItem \| SubMenu)[]` | Pre-built slash menu commands for all AI actions |
| `promptIcons` | `Record<string, string>` | Icon mapping for prompt commands |
| `slashOpeningCondition` | `OpeningConditions` | Slash menu opening/closing rules (opens on `/` with text selected) |

### ProsemirrorSuggestcatPluginReact Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `editorView` | `EditorView` | Yes | ProseMirror EditorView instance |
| `editorState` | `EditorState` | Yes | Current ProseMirror EditorState |
| `domReference` | `HTMLElement` | No | Custom element for Popper positioning (defaults to selection node) |

### GrammarPopup Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `editorView` | `EditorView` | Yes | ProseMirror EditorView instance |
| `editorState` | `EditorState` | Yes | Current ProseMirror EditorState |
| `apiKey` | `string` | Yes | API key for fetching hint explanations |
| `apiEndpoint` | `string` | No | Custom endpoint for hint requests |
| `model` | `string` | No | Model to use for generating hint explanations |
| `hintSystemPrompt` | `string` | No | Custom system prompt for hint explanations (overrides default hint behavior) |

## Styles

```typescript
import "prosemirror-suggestcat-plugin-react/dist/styles/styles.css";
```

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#suggestcat) in the monorepo playground.

## License

MIT
