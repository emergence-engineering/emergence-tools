# @emergence-engineering/prosemirror-block-runner

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> Generic task queue processor for ProseMirror — process document blocks through configurable parallel workers with state management, retry logic, and visual feedback decorations.

## Features

- Parallel batch processing with configurable concurrency (`batchSize`)
- Automatic retry with exponential backoff on processor errors
- Decoration and widget factories for visual feedback
- Dirty tracking with debounced re-processing on document edits
- Accept/decline decorations (select, remove, deselect actions)
- Pause/resume support
- Position remapping as the document changes
- Includes four example processors (link detector, word complexity, sentence length, random)

## Installation

```bash
npm install @emergence-engineering/prosemirror-block-runner
```

### Peer dependencies

```bash
npm install prosemirror-model prosemirror-state prosemirror-transform prosemirror-view
```

## Quick Start

```ts
import {
  blockRunnerPlugin,
  createBlockRunnerKey,
  ActionType,
  dispatchAction,
} from "@emergence-engineering/prosemirror-block-runner";
import type {
  ProcessingUnit,
  UnitProcessorResult,
} from "@emergence-engineering/prosemirror-block-runner";
import { Decoration } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { EditorView } from "prosemirror-view";

// 1. Create a plugin key
const myKey = createBlockRunnerKey("my-processor");

// 2. Define a processor function
async function myProcessor(view, unit: ProcessingUnit): Promise<UnitProcessorResult<string>> {
  const result = await analyzeText(unit.text);
  return { data: result };
}

// 3. Define a decoration factory
function myDecorationFactory(response, unit) {
  return [
    Decoration.inline(unit.from, unit.to, { class: "highlight" }, {
      id: {},
      unitId: unit.id,
      originalText: unit.text,
      response,
    }),
  ];
}

// 4. Add the plugin to your editor
const state = EditorState.create({
  schema,
  plugins: [
    blockRunnerPlugin({
      pluginKey: myKey,
      unitProcessor: myProcessor,
      decorationFactory: myDecorationFactory,
      initialContextState: {},
      options: { batchSize: 2, maxRetries: 3 },
    }),
  ],
});

const view = new EditorView(document.getElementById("editor")!, { state });

// 5. Start processing
dispatchAction(view, myKey, { type: ActionType.INIT, metadata: { single: {} } });
```

## Options

`BlockRunnerPluginConfig` fields:

| Option | Type | Default | Description |
|---|---|---|---|
| `pluginKey` | `PluginKey` | _(required)_ | Unique key created via `createBlockRunnerKey()` |
| `unitProcessor` | `UnitProcessor<R, M>` | _(required)_ | Async function that processes a single unit |
| `decorationFactory` | `DecorationFactory<R, M, C>` | _(required)_ | Converts processor response to decorations |
| `initialContextState` | `C` | _(required)_ | Initial context state shared across units |
| `decorationTransformer` | `DecorationTransformer<R, C, M>` | `undefined` | Post-process decorations (e.g. highlight selected) |
| `widgetFactory` | `WidgetFactory<M>` | `undefined` | Creates loading/error widgets for in-progress units |
| `handleKeyDown` | `(view, event) => boolean \| void` | `undefined` | Optional keyboard handler |
| `options.nodeTypes` | `string \| string[]` | `"paragraph"` | Node types to process |
| `options.batchSize` | `number` | `4` | Parallel worker count |
| `options.maxRetries` | `number` | `3` | Max retry attempts per unit |
| `options.backoffBase` | `number` | `1000` | Initial backoff delay in ms |
| `options.dirtyHandling.shouldRecalculate` | `boolean` | `true` | Re-process when text changes |
| `options.dirtyHandling.debounceDelay` | `number` | `2000` | Debounce delay before re-processing (ms) |
| `options.dirtyHandling.skipDirtyOnSelfChange` | `boolean` | `true` | Skip dirty marking for plugin's own changes |

## API

| Export | Type | Description |
|---|---|---|
| `blockRunnerPlugin` | `function` | Creates the ProseMirror plugin |
| `createBlockRunnerKey` | `function` | Creates a typed `PluginKey` for the runner |
| `dispatchAction` | `function` | Dispatches an action to a runner plugin |
| `pauseRunner` | `function` | Pauses the runner (dispatches `FINISH`) |
| `resumeRunner` | `function` | Resumes a paused runner |
| `canResume` | `function` | Checks if a runner can be resumed |
| `getProgress` | `function` | Returns `{ completed, total, decorations }` |
| `ActionType` | `enum` | `INIT`, `FINISH`, `CLEAR`, `RESUME`, `UNIT_STARTED`, `UNIT_SUCCESS`, `UNIT_ERROR`, etc. |
| `RunnerStatus` | `enum` | `IDLE`, `ACTIVE` |
| `UnitStatus` | `enum` | `DIRTY`, `WAITING`, `QUEUED`, `PROCESSING`, `DONE`, `BACKOFF`, `ERROR` |
| `defaultRunnerOptions` | `object` | Default option values |
| `mergeOptions` | `function` | Merges partial options with defaults |
| `createUnitsFromDocument` | `function` | Extracts processing units from a document |
| `getUnitsInRange` | `function` | Gets units within a document range |
| `textPosToDocPos` | `function` | Maps text position to document position |
| `remapPositions` | `function` | Remaps unit/decoration positions after doc changes |
| `calculateBackoff` | `function` | Computes retry delay for a given attempt |
| `executeParallel` | `function` | Core parallel execution loop |
| `handleAction` | `function` | State reducer for runner actions |
| `createInitialState` | `function` | Creates the initial runner state |

## How It Works

1. **INIT** — The document is scanned for matching node types (default: paragraphs). Each node becomes a `ProcessingUnit` with text, position range, and text-to-doc position mapping.
2. **Parallel execution** — Units are picked up in batches (`batchSize`). Each unit is passed to the `unitProcessor`. On success, the `decorationFactory` converts the response into ProseMirror decorations.
3. **Retry/backoff** — If a processor returns `{ error }`, the unit enters `BACKOFF` status and is retried after an exponentially increasing delay (`backoffBase * 2^retryCount`), up to `maxRetries`.
4. **Dirty tracking** — When the document changes, affected units are marked `DIRTY` and re-processed after a debounce delay. Position mappings are updated automatically via ProseMirror's transaction mapping.
5. **Accept/decline** — Users interact with decorations via `SELECT_DECORATION` (highlight one), `REMOVE_DECORATION` (accept or decline), and `DESELECT_DECORATION` (clear selection). To accept a suggestion, apply the change to the document and remove the decoration in a single transaction. To decline, just remove the decoration without modifying the document.
6. **FINISH/CLEAR** — Processing completes automatically when all units are done. Dispatch `CLEAR` to remove all decorations and reset.

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#blockRunner) in the monorepo playground.

## License

MIT
