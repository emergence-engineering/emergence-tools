# prosemirror-suggestcat-plugin

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> AI-powered grammar checking, text completion, and inline autocomplete for ProseMirror

## Features

- AI grammar and style corrections with paragraph-level processing and parallel execution
- AI text completion, rewriting, translation, tone changes, and more with streaming
- Inline autocomplete with ghost text (like GitHub Copilot)
- Multiple AI model support with automatic fallback
- Dirty-state tracking -- only edited paragraphs are re-checked
- Works with ProseMirror and TipTap

## Installation

```bash
npm install prosemirror-suggestcat-plugin
```

### Peer dependencies

```bash
npm install prosemirror-model prosemirror-state prosemirror-transform prosemirror-view
```

## Quick Start

Create an account on [SuggestCat](https://www.suggestcat.com/) and generate an API key, then register the plugins you need:

```typescript
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";
import {
  grammarSuggestPluginV2,
  grammarSuggestV2Key,
  completePluginV2,
  autoCompletePlugin,
} from "prosemirror-suggestcat-plugin";
import { ActionType } from "@emergence-engineering/prosemirror-block-runner";

const view = new EditorView(document.querySelector("#editor"), {
  state: EditorState.create({
    plugins: [
      grammarSuggestPluginV2("<YOUR_API_KEY>"),
      completePluginV2("<YOUR_API_KEY>"),
      autoCompletePlugin("<YOUR_API_KEY>"),
    ],
  }),
});

// Initialize the grammar checker
view.dispatch(
  view.state.tr.setMeta(grammarSuggestV2Key, {
    type: ActionType.INIT,
    metadata: {},
  }),
);
```

## Options

### GrammarSuggestV2Options

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | -- | SuggestCat API key (required, passed as first argument) |
| `apiEndpoint` | `string` | SuggestCat API | Custom endpoint URL |
| `model` | `string \| AIModel` | `"openai:gpt-4o-mini"` | AI model to use |
| `fallback` | `ModelFallbackConfig` | -- | Fallback model config (`{ fallbackModel, failureThreshold? }`) |
| `batchSize` | `number` | `2` | Number of parallel workers |
| `maxRetries` | `number` | `3` | Max retries per paragraph |
| `backoffBase` | `number` | `2000` | Base backoff delay in ms |
| `debounceMs` | `number` | `1000` | Debounce delay before re-checking |
| `systemPrompt` | `string` | -- | Custom system prompt for grammar requests (overrides default behavior) |
| `createPopup` | `"react" \| function` | -- | `"react"` for React popups, or a factory function returning an HTMLElement |

### CompleteV2Options

| Option | Type | Default | Description |
|---|---|---|---|
| `maxSelection` | `number` | `1000` | Max selected characters for a task |
| `apiEndpoint` | `string` | SuggestCat API | Custom endpoint URL |
| `model` | `string` | `"openai:gpt-4o-mini"` | AI model to use |

### AutoCompleteOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `debounceMs` | `number` | `500` | Debounce delay before requesting a suggestion |
| `maxContextLength` | `number` | `2000` | Max characters sent as context |
| `apiEndpoint` | `string` | SuggestCat API | Custom endpoint URL |
| `model` | `string` | `"openai:gpt-4o-mini"` | AI model to use |
| `ghostTextClass` | `string` | `"autoCompleteGhostText"` | CSS class for ghost text decoration |
| `systemPrompt` | `string` | -- | Custom system prompt for autocomplete requests |

## API

### Grammar plugin

| Export | Type | Description |
|---|---|---|
| `grammarSuggestPluginV2(apiKey, options?)` | Plugin factory | Creates the grammar checking plugin |
| `grammarSuggestV2Key` | `PluginKey` | Plugin key for dispatching metas |
| `acceptSuggestion(view, id)` | function | Accept a grammar suggestion |
| `discardSuggestion(view, id)` | function | Discard a grammar suggestion |
| `selectSuggestion(view, id)` | function | Select a suggestion (for popup) |
| `deselectSuggestion(view)` | function | Deselect the current suggestion |
| `requestHint(apiKey, original, replacement, options?)` | function | Request an AI explanation for a suggestion (options: `{ endpoint?, model?, systemPrompt? }`) |
| `getSelectedDecoration(view, key)` | function | Get the currently selected decoration |
| `setGrammarSystemPrompt(view, key, prompt?)` | function | Set or clear a custom system prompt for grammar checking |
| `grammarSuggestInit(view, key, systemPrompt?)` | function | Initialize grammar checking, optionally with a custom system prompt |
| `setGrammarSuggestEnabled(view, enabled)` | function | Enable/disable grammar checking |

### Complete plugin

| Export | Type | Description |
|---|---|---|
| `completePluginV2(apiKey, options?)` | Plugin factory | Creates the completion plugin |
| `completeV2Key` | `PluginKey` | Plugin key |
| `startTask(view, taskType, params?)` | function | Start an AI task |
| `startCustomTask(view, systemPrompt)` | function | Start a task with a custom system prompt |
| `acceptResult(view)` | function | Accept the streamed result |
| `rejectResult(view)` | function | Reject the streamed result |
| `cancelTask(view)` | function | Cancel an in-progress task |
| `getCompleteState(state)` | function | Get the current plugin state |
| `setEnabled(view, enabled)` | function | Enable/disable the plugin |
| `AiPromptsWithoutParam` | enum | `Complete`, `SmallComplete`, `Improve`, `MakeLonger`, `MakeShorter`, `Simplify`, `Explain`, `ActionItems` |
| `AiPromptsWithParam` | enum | `ChangeTone`, `Translate`, `Hint`, `Custom` |
| `MoodParamType` | enum | `Casual`, `Confident`, `Straightforward`, `Friendly` |
| `TranslationTargetLanguage` | enum | `English`, `Spanish`, `French`, `German`, `Italian`, `Portuguese`, `Dutch`, `Russian`, `Chinese`, `Korean`, `Japanese` |

### Autocomplete plugin

| Export | Type | Description |
|---|---|---|
| `autoCompletePlugin(apiKey, options?)` | Plugin factory | Creates the autocomplete plugin |
| `autoCompleteKey` | `PluginKey` | Plugin key |
| `setAutoCompleteEnabled(view, enabled, systemPrompt?)` | function | Enable/disable autocomplete, optionally with a custom prompt |
| `autoCompleteInit(view, systemPrompt?)` | function | Enable autocomplete with an optional custom system prompt |
| `setAutoCompleteSystemPrompt(view, prompt?)` | function | Set or clear a custom system prompt without toggling enabled |
| `acceptAutoCompletion(view)` | function | Accept the ghost text |
| `dismissAutoCompletion(view)` | function | Dismiss the ghost text |
| `isAutoCompleteEnabled(view)` | function | Check if autocomplete is enabled |
| `hasAutoCompletion(view)` | function | Check if a suggestion is showing |

### Low-level API

| Export | Type | Description |
|---|---|---|
| `streamingRequest(options, callbacks)` | function | Streaming POST with `onChunk`, `onComplete`, `onError` |
| `grammarRequest(options)` | function | Non-streaming POST for grammar corrections |
| `createApiConfig(apiKey, endpoint?, model?)` | function | Build an API config object |
| `createGrammarApiConfig(apiKey, endpoint?, model?)` | function | Build a grammar-specific API config |
| `getDiff(oldText, newText)` | function | Re-exported from `@emergence-engineering/fast-diff-merge` |

## Custom Prompts

All three plugins support custom system prompts, allowing you to control the AI behavior for your use case.

### Grammar — custom system prompt

Set a system prompt at plugin creation, at init time, or dynamically at runtime:

```typescript
// At creation time (baked into plugin options)
const grammarPlugin = grammarSuggestPluginV2("<API_KEY>", {
  systemPrompt: "You are a strict academic reviewer. Return only the fixed text, keeping separators intact.",
});

// At init time (recommended — combines init + system prompt)
import { grammarSuggestInit, grammarSuggestV2Key } from "prosemirror-suggestcat-plugin";

grammarSuggestInit(view, grammarSuggestV2Key, "Your custom prompt here");
// Without a custom prompt (uses default behavior):
grammarSuggestInit(view, grammarSuggestV2Key);

// Or dynamically at runtime (change prompt without re-init)
import { setGrammarSystemPrompt } from "prosemirror-suggestcat-plugin";

setGrammarSystemPrompt(view, grammarSuggestV2Key, "Your custom prompt here");
// Clear custom prompt to restore defaults:
setGrammarSystemPrompt(view, grammarSuggestV2Key, undefined);
```

### Autocomplete — custom system prompt

```typescript
// At creation time (baked into plugin options)
const autoComplete = autoCompletePlugin("<API_KEY>", {
  systemPrompt: "Complete sentences in a formal, technical tone.",
});

// At enable time (recommended — combines enable + system prompt)
import { autoCompleteInit } from "prosemirror-suggestcat-plugin";

autoCompleteInit(view, "Your custom prompt here");
// Or with setAutoCompleteEnabled:
setAutoCompleteEnabled(view, true, "Your custom prompt here");

// Dynamically change prompt without toggling enabled
import { setAutoCompleteSystemPrompt } from "prosemirror-suggestcat-plugin";

setAutoCompleteSystemPrompt(view, "Your custom prompt here");
// Clear:
setAutoCompleteSystemPrompt(view, undefined);
```

### Complete — custom task

```typescript
import { startCustomTask } from "prosemirror-suggestcat-plugin";

// Select text first, then:
startCustomTask(view, "Rewrite this text as API documentation.");
```

### Hint — custom system prompt

The grammar hint (the "?" button explaining a correction) also supports a custom prompt:

```typescript
import { requestHint } from "prosemirror-suggestcat-plugin";

const hint = await requestHint(apiKey, originalText, replacement, {
  systemPrompt: "Explain the correction as a writing tutor would, with examples.",
});
```

When using the React `GrammarPopup`, pass the `hintSystemPrompt` prop:

```tsx
<GrammarPopup
  editorView={view}
  editorState={editorState}
  apiKey={apiKey}
  hintSystemPrompt="Explain the correction in simple terms."
/>
```

## Styles

```typescript
import "prosemirror-suggestcat-plugin/dist/styles/styles.css";
```

CSS classes for grammar decorations:

- `.grammarSuggestionV2` -- inline decoration on suggestions
- `.removalSuggestionV2` -- when the suggestion is a deletion
- `.grammarSuggestionV2-selected` -- currently selected suggestion
- `.grammarPopupV2` -- popup container

CSS for autocomplete ghost text (add your own):

```css
.autoCompleteGhostText {
  color: #9ca3af;
  opacity: 0.7;
  pointer-events: none;
}
```

## TipTap

Wrap the plugins in a TipTap extension:

```typescript
import { Extension } from "@tiptap/core";
import {
  grammarSuggestPluginV2,
  completePluginV2,
  autoCompletePlugin,
} from "prosemirror-suggestcat-plugin";

const SuggestCatExtension = Extension.create({
  name: "suggestcat",
  addProseMirrorPlugins() {
    return [
      grammarSuggestPluginV2("<YOUR_API_KEY>"),
      completePluginV2("<YOUR_API_KEY>"),
      autoCompletePlugin("<YOUR_API_KEY>"),
    ];
  },
});
```

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#suggestcat) in the monorepo playground.

## License

MIT
