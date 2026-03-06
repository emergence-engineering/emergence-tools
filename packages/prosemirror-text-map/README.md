# @emergence-engineering/prosemirror-text-map

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> Convert ProseMirror documents to plain text with bidirectional position mapping.

## Features

- Extract plain text from any ProseMirror document
- Bidirectional position mapping between text and document positions
- Custom node serializers for non-text nodes (images, embeds, etc.)
- Useful for integrating text-only libraries (diffing, NLP, search) with ProseMirror

## Installation

```bash
npm install @emergence-engineering/prosemirror-text-map
```

### Peer dependencies

```bash
npm install prosemirror-model
```

## Quick Start

```ts
import {
  docToTextWithMapping,
  textPosToDocPos,
} from "@emergence-engineering/prosemirror-text-map";

// Convert a ProseMirror doc to plain text with position mapping
const { text, mapping } = docToTextWithMapping(editorView.state.doc);

// Map a position in the plain text back to the document
const docPos = textPosToDocPos(42, mapping);
```

## Options

`docToTextWithMapping` accepts an optional `MappingOptions` parameter:

| Option | Type | Description |
|--------|------|-------------|
| `nodeToTextMappingOverride` | `Record<string, (node: Node) => TextWithMapping>` | Custom serializers for specific node types. The key is the node type name. |

### Custom node serializer example

```ts
const { text, mapping } = docToTextWithMapping(doc, {
  nodeToTextMappingOverride: {
    image: (node) => ({
      text: node.attrs.alt || "[image]",
      mapping: [{ docPos: 0, textPos: 0 }],
    }),
  },
});
```

## API

| Export | Type | Description |
|--------|------|-------------|
| `docToTextWithMapping` | `(doc: Node, options?: Partial<MappingOptions>) => TextWithMapping` | Converts a ProseMirror document to plain text with position mapping. |
| `textPosToDocPos` | `(textPos: number, mapping: TextMappingItem[]) => number` | Maps a position in the extracted text back to the corresponding document position. |
| `TextMappingItem` | `type` | `{ docPos: number; textPos: number }` |
| `TextWithMapping` | `type` | `{ text: string; mapping: TextMappingItem[] }` |
| `MappingOptions` | `type` | `{ nodeToTextMappingOverride: Record<string, (node: Node) => TextWithMapping> }` |

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#textMap) in the monorepo playground.

## License

MIT
