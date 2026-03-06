# @emergence-engineering/fast-diff-merge

[![logo](https://emergence-engineering.com/ee-logo.svg)](https://emergence-engineering.com)

[**Made by Emergence Engineering**](https://emergence-engineering.com/)

> Word-level diffing that returns `Replace` spans instead of raw character diffs — ideal for building track-changes UIs.

## Features

- Word-level diffs between two strings
- Returns `Replace[]` with positions, original text, and replacement text
- Configurable word separators (default: space, or full Unicode whitespace set)
- Smart merging of adjacent diff segments into word-aligned replace spans
- Built on top of `fast-diff` for character-level diffing

## Installation

```bash
npm install @emergence-engineering/fast-diff-merge
```

## Quick Start

```ts
import { getDiff } from "@emergence-engineering/fast-diff-merge";

const original = "The quick brown fox jumps over the lazy dog.";
const modified = "The quick red fox leaps over the lazy dog.";

const diffs = getDiff(original, modified);
// [
//   { from: 0, to: 10, original: "The quick ", replacement: "The quick " },
//   { from: 10, to: 20, original: "brown fox ", replacement: "red fox " },
//   ...
// ]
```

## Options

`getDiff` accepts an optional `DiffOptions` parameter:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `separators` | `string[]` | `[" "]` | Characters used to split text into words. Determines word boundaries for merging adjacent diffs. |

## API

| Export | Type | Description |
|--------|------|-------------|
| `getDiff` | `(original: string, fixed: string, options?: Partial<DiffOptions>) => Replace[]` | Computes word-level diffs between two strings. |
| `mergeReplacePair` | `(left: Replace, right: Replace, ...) => Replace[]` | Merges two adjacent `Replace` entries based on word boundaries. Used internally by `getDiff`. |
| `convertDiffToReplaceSet` | `(diffSet: Diff[]) => Replace[]` | Converts raw `fast-diff` output to `Replace[]`. |
| `isIdentity` | `(replace: Replace) => boolean` | Returns `true` if a `Replace` span is unchanged (`original === replacement`). |
| `whitespaceSeparators` | `string[]` | Full Unicode whitespace separator set (spaces, tabs, newlines, etc.). |
| `Replace` | `type` | `{ from: number; to: number; original: string; replacement: string }` |
| `DiffOptions` | `type` | `{ separators: string[] }` |
| `SeparatorWithIndex` | `type` | `{ s: string; i: number }` |
| `FirstAndLastSeparator` | `type` | `{ first: SeparatorWithIndex; last: SeparatorWithIndex }` |

## Playground

See the [interactive demo](https://emergence-engineering.github.io/emergence-tools/#fastDiffMerge) in the monorepo playground.

## License

MIT
