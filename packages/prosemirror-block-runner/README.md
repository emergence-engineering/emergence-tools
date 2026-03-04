# @emergence-engineering/prosemirror-block-runner

Generic task queue processor for ProseMirror. Processes document blocks through configurable parallel workers with state management, retry logic, and visual feedback decorations.

## Install

```bash
npm install @emergence-engineering/prosemirror-block-runner
```

## Usage

```typescript
import {
  blockRunnerPlugin,
  createBlockRunnerKey,
  ActionType,
  dispatchAction,
} from "@emergence-engineering/prosemirror-block-runner";
import type { ProcessingUnit, UnitProcessorResult } from "@emergence-engineering/prosemirror-block-runner";

// 1. Create a plugin key
const myKey = createBlockRunnerKey("my-processor");

// 2. Define a processor function
async function myProcessor(view, unit: ProcessingUnit) {
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
const plugins = [
  blockRunnerPlugin({
    pluginKey: myKey,
    unitProcessor: myProcessor,
    decorationFactory: myDecorationFactory,
    options: { batchSize: 2, maxRetries: 3 },
  }),
];

// 5. Start processing
dispatchAction(view, myKey, { type: ActionType.INIT });
```

## Features

- Parallel batch processing with configurable concurrency
- Automatic retry with exponential backoff
- Decoration and widget factories for visual feedback
- Dirty tracking and debounced re-processing on edits
- Pause/resume support
- Position remapping as the document changes

## Examples

The package includes four example processors:

- **linkDetector** — detects URLs in text
- **wordComplexity** — highlights complex words by syllable count
- **sentenceLength** — flags long sentences
- **randomProcessor** — demonstrates async processing with simulated delays and errors

## License

MIT
