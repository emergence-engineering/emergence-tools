# EE ProseMirror Tools Monorepo

## Structure

- `packages/` — independently published npm packages
- `playground/` — Vite + React demo app for all plugins
- Root uses pnpm workspaces + Turborepo for build orchestration

## Key Commands

- `pnpm build` — build all packages (via Turbo)
- `pnpm test` — run all tests
- `pnpm playground` — start playground dev server
- `pnpm changeset` — create a changeset for versioning
- `pnpm release` — build + publish changed packages to npm

## Package Conventions

- Each package lives in `packages/<name>/`
- Each package has its own `package.json`, `tsconfig.json` (extends `../../tsconfig.base.json`), and `src/` directory
- Build output goes to `dist/` using tsup or tsc
- ProseMirror core libs (`prosemirror-model`, `prosemirror-state`, `prosemirror-view`) are **peer dependencies**
- React is a **peer dependency** for React-specific packages

## Packages

- prosemirror-text-map
- prosemirror-suggestcat-plugin
- prosemirror-suggestcat-plugin-react
- prosemirror-suggest-changes
- prosemirror-link-preview
- prosemirror-slash-menu-react
- prosemirror-slash-menu
- fast-diff-merge
- prosemirror-loading-plugin
- prosemirror-slash-menu-ui
- prosemirror-image-plugin
- prosemirror-codemirror-block
- prosemirror-paste-link
- prosemirror-link-plugin

## Versioning

- Uses [Changesets](https://github.com/changesets/changesets)
- Run `pnpm changeset` before merging PRs with package changes
- Publishing is done manually via `pnpm release`

## CI/CD

- GitHub Actions: build, lint, test, typecheck on all PRs and pushes to main
- Playground deploys to GitHub Pages on version tags (`v*`)

## Adding a New Package

1. Create `packages/<name>/` with `package.json`, `tsconfig.json`, `src/index.ts`
2. Add ProseMirror deps as peerDependencies
3. Add a demo component in `playground/src/demos/`
4. Register the demo in `playground/src/App.tsx`
