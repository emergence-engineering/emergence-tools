# EE ProseMirror Tools

A monorepo of ProseMirror plugins and utilities by [Emergence Engineering](https://emergence-engineering.com/).

## Packages

| Package | Description | Status |
|---------|-------------|--------|
| [`prosemirror-text-map`](./packages/prosemirror-text-map) | Text mapping utilities for ProseMirror documents | Migrated |
| `prosemirror-suggestcat-plugin` | AI-powered suggestion plugin | Planned |
| `prosemirror-suggestcat-plugin-react` | React bindings for suggestcat | Planned |
| `prosemirror-suggest-changes` | Track changes / suggestions | Planned |
| [`prosemirror-link-preview`](./packages/prosemirror-link-preview) | Link preview cards | Migrated |
| [`prosemirror-slash-menu`](./packages/prosemirror-slash-menu) | Slash menu state management | Migrated |
| [`prosemirror-slash-menu-react`](./packages/prosemirror-slash-menu-react) | Slash menu React UI | Migrated |
| [`fast-diff-merge`](./packages/fast-diff-merge) | Fast diff and merge utilities | Migrated |
| `prosemirror-loading-plugin` | Loading state plugin | Planned |
| `prosemirror-slash-menu-ui` | Slash menu UI components | Planned |
| [`prosemirror-image-plugin`](./packages/prosemirror-image-plugin) | Image handling plugin | Migrated |
| `prosemirror-codemirror-block` | CodeMirror code blocks | Planned |
| `prosemirror-paste-link` | Paste URL as link | Planned |
| `prosemirror-link-plugin` | Link editing plugin | Planned |

## Quick Start

```bash
git clone https://github.com/emergence-engineering/ee-prosemirror-tools.git
cd ee-prosemirror-tools
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

The interactive playground demos all available plugins. Run it locally with `pnpm playground` or visit the [live demo](https://emergence-engineering.github.io/ee-prosemirror-tools/).

## License

MIT
