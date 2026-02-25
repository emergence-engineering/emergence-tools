# prosemirror-suggestcat-plugin-react

[![made by Emergence Engineering](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence-Engineering**](https://emergence-engineering.com/)

React UI for [prosemirror-suggestcat-plugin](https://github.com/emergence-engineering/prosemirror-suggestcat-plugin).

## Features

![feature-gif](https://suggestcat.com/basic-suggestr-eact-example.gif)

- A slash menu to select and filter AI commands, implemented with [prosemirror-slash-menu-react](https://github.com/emergence-engineering/prosemirror-slash-menu-react)
- An "Ask AI" tooltip that appears when text is selected
- A suggestion overlay to show streaming results and accept/reject them
- A grammar popup to display grammar suggestions with accept, discard, and hint actions

## How to use?

- Import `SlashMenuPlugin` from [`prosemirror-slash-menu`](https://github.com/emergence-engineering/prosemirror-slash-menu)
- Import `ProsemirrorSuggestcatPluginReact` and `promptCommands` from this package
- Add `SlashMenuPlugin` and `completePluginV2` to your editor
- Add the component next to your editor div

```tsx
import { SlashMenuPlugin } from "prosemirror-slash-menu";
import { completePluginV2 } from "prosemirror-suggestcat-plugin";
import {
  promptCommands,
  ProsemirrorSuggestcatPluginReact,
} from "prosemirror-suggestcat-plugin-react";

const Editor: FC = () => {
  const [editorState, setEditorState] = useState<EditorState>();
  const [editorView, setEditorView] = useState<EditorView>();
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const state = EditorState.create({
      doc: schema.nodeFromJSON(initialDoc),
      plugins: [
        completePluginV2("<YOUR_API_KEY>"),
        SlashMenuPlugin(promptCommands, undefined, undefined, false, true),
      ],
    });
    const view = new EditorView(document.querySelector("#editor"), {
      state,
      dispatchTransaction: (tr) => {
        try {
          const newState = view.state.apply(tr);
          view.updateState(newState);
          setEditorState(newState);
        } catch (e) {}
      },
    });
    setEditorView(view);
    setEditorState(view.state);
    return () => {
      view.destroy();
    };
  }, [editorRef]);

  return (
    <Root>
      <StyledEditor id="editor" ref={editorRef} />
      {editorView && editorView?.state && (
        <ProsemirrorSuggestcatPluginReact
          editorView={editorView}
          editorState={editorView.state}
        />
      )}
    </Root>
  );
};
```

### Props

- `editorView` — ProseMirror EditorView
- `editorState` — ProseMirror EditorState
- `domReference` — optional HTMLElement for Popper positioning (defaults to the current selection node)

## Grammar Popup

The `GrammarPopup` component displays an inline popup for grammar suggestions created by `grammarSuggestPlugin`. It shows the original text with strikethrough, the suggested replacement, and action buttons to accept, discard, or request an explanation.

### Usage

```tsx
import { grammarSuggestPlugin } from "prosemirror-suggestcat-plugin";
import { GrammarPopup } from "prosemirror-suggestcat-plugin-react";

// Add grammarSuggestPlugin to your editor plugins
const state = EditorState.create({
  plugins: [
    grammarSuggestPlugin("<YOUR_API_KEY>"),
    // ...other plugins
  ],
});

// Render the component alongside your editor
<GrammarPopup
  editorView={editorView}
  editorState={editorView.state}
  apiKey="<YOUR_API_KEY>"
  model="cerebras:gpt-oss-120b" // optional
  apiEndpoint="/custom"   // optional
/>
```

### Grammar Popup Props

- `editorView` — ProseMirror EditorView
- `editorState` — ProseMirror EditorState
- `apiKey` — API key used to fetch hint explanations
- `apiEndpoint` — _(optional)_ custom endpoint for hint requests
- `model` — _(optional)_ model to use for generating hint explanations

### How it works

When the cursor is inside a grammar decoration, the popup appears with:

- The **original text** (red, strikethrough) and the **suggested replacement** (green)
- **Accept** (`✓`) — applies the suggestion
- **Discard** (`✕`) — removes the suggestion without applying
- **Hint** (`?`) — fetches an AI explanation of why the change is suggested

### Styles

```typescript
import "prosemirror-suggestcat-plugin-react/dist/styles/styles.css";
```

### UI behaviour

Navigation works with keyboard (arrows, Tab, Enter, Escape) and mouse clicks. The slash menu is powered by [prosemirror-slash-menu-react](https://github.com/emergence-engineering/prosemirror-slash-menu-react).

### Customization

This package is intended as a quick way to get a working UI. You can customize it by:

- Providing your own `domReference` for positioning
- Overriding the CSS classes
- Passing your own commands into `SlashMenuPlugin` to change labels or icons

The command functions themselves must stay the same to work with [prosemirror-suggestcat-plugin](https://github.com/emergence-engineering/prosemirror-suggestcat-plugin).