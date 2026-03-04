# Emergence Tools

A monorepo of ProseMirror plugins and utilities by [Emergence Engineering](https://emergence-engineering.com/).

## Packages

| Package | Description | Status         |
|---------|-------------|----------------|
| [`fast-diff-merge`](./packages/fast-diff-merge) | Fast diff and merge utilities | Migrated       |
| [`prosemirror-text-map`](./packages/prosemirror-text-map) | Text mapping utilities for ProseMirror documents | Migrated       |
| [`prosemirror-link-preview`](./packages/prosemirror-link-preview) | Link preview cards | Migrated       |
| [`prosemirror-image-plugin`](./packages/prosemirror-image-plugin) | Image handling plugin | Migrated       |
| [`prosemirror-slash-menu`](./packages/prosemirror-slash-menu) | Slash menu state management | Migrated       |
| [`prosemirror-slash-menu-react`](./packages/prosemirror-slash-menu-react) | Slash menu React UI | Migrated       |
| [`prosemirror-block-runner`](./packages/prosemirror-block-runner) | Generic task queue processor for ProseMirror | New |
| [`prosemirror-suggestcat-plugin`](./packages/prosemirror-suggestcat-plugin) | AI-powered suggestion plugin | Migrated       |
| [`prosemirror-suggestcat-plugin-react`](./packages/prosemirror-suggestcat-plugin-react) | React bindings for suggestcat | Migrated       |
| `prosemirror-suggest-changes` | Track changes / suggestions | Privat fork    |
| `prosemirror-loading-plugin` | Loading state plugin | Empty repo     |
| [`prosemirror-codemirror-block`](./packages/prosemirror-codemirror-block) | CodeMirror code blocks | Migrated       |
| [`prosemirror-paste-link`](./packages/prosemirror-paste-link) | Paste URL as link | Migrated       |
| [`prosemirror-link-plugin`](./packages/prosemirror-link-plugin) | Automatic alias linking plugin | Migrated       |
| `prosemirror-slash-menu-ui` | Slash menu UI components | Non maintained |

## Quick Start

```bash
git clone https://github.com/emergence-engineering/emergence-tools.git
cd emergence-tools
pnpm install
pnpm build
```

## Development

```bash
# Start the playground dev server (live-reloads package source changes)
pnpm playground

# Build all packages
pnpm build

# Run all tests
pnpm test

# Create a changeset for versioning
pnpm changeset
```

## Playground

The interactive playground demos all available plugins. Run it locally with `pnpm playground` or visit the [live demo](https://emergence-engineering.github.io/emergence-tools/).

## License

MIT
