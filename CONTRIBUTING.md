# Contributing to EE ProseMirror Tools

## Getting Started

```bash
git clone https://github.com/emergence-engineering/emergence-tools.git
cd emergence-tools
pnpm install
pnpm build
```

**Requirements:** Node.js >= 18, pnpm 9.15.0+

## Development Workflow

```bash
# Start the playground (frontend + backend) — live-reloads package source changes
pnpm playground

# Start only frontend or backend
pnpm playground:fe
pnpm playground:be

# Build all packages
pnpm build

# Run all tests
pnpm test

# Lint & format
pnpm lint
pnpm format

# Type check
pnpm typecheck
```

## Package Conventions

- Each package lives in `packages/<name>/` with its own `package.json`, `tsconfig.json`, and `src/` directory
- Build output goes to `dist/` using Rollup
- ProseMirror core libs (`prosemirror-model`, `prosemirror-state`, `prosemirror-view`) are **peer dependencies**
- React is a **peer dependency** for React-specific packages

**Naming:** Some packages are scoped (`@emergence-engineering/`), others are global. This is intentional from their original npm names. Never rename a package or change its scope.

| Scope | Packages |
|-------|----------|
| `@emergence-engineering/` | `prosemirror-text-map`, `fast-diff-merge` |
| Global (no scope) | All other packages |

## Versioning & Publishing

This monorepo uses [Changesets](https://github.com/changesets/changesets) for versioning. Each package is versioned independently.

### 1. Create a changeset (before merging a PR)

```bash
pnpm changeset
```

This interactive CLI will ask you to:
- Select which packages were affected
- Choose the bump type: **major** / **minor** / **patch**
- Write a short description of the change

A changeset file (`.changeset/<id>.md`) is created and should be committed with your PR. Multiple changesets can accumulate across PRs.

### 2. Apply version bumps

When ready to release, a maintainer runs:

```bash
pnpm version-packages
```

This reads all accumulated `.changeset/*.md` files, bumps the version in each affected `package.json`, updates `CHANGELOG.md` files, and deletes the consumed changeset files. If a package depends on another workspace package that was bumped, it gets a patch bump automatically.

Commit the resulting changes.

### 3. Publish to npm

```bash
pnpm release
```

This builds all packages (via Turborepo) and publishes changed packages to npm.

### 4. Tag and push

```bash
git tag v<version>
git push origin main --tags
```

The `v*` tag triggers CI to:
- Deploy the playground frontend to GitHub Pages
- Deploy the playground backend to Fly.io

### Summary

```
pnpm changeset            # 1. describe your changes (per PR)
pnpm version-packages     # 2. bump versions & changelogs
pnpm release              # 3. build & publish to npm
git tag v<x> && git push origin main --tags  # 4. trigger deployments
```

## Verifying Published Packages

After publishing, you may want to verify that the npm packages actually work in the playground. By default, the playground uses `workspace:*` links, which resolve to local source code — not the published npm artifacts.

### `pnpm verify:published`

This command temporarily swaps the playground's workspace dependencies for the exact published versions and starts the playground using packages from npm.

**What it does:**

1. Scans every `packages/*/package.json` to read the current `name` and `version`
2. Backs up `playground/fe/package.json`
3. Replaces all `workspace:*` entries with the exact versions from step 1
4. Deletes `playground/fe/node_modules` (pnpm caches workspace symlinks, so a clean install is required)
5. Runs `pnpm install` with retry logic — newly published packages may take a few minutes to propagate on the npm registry (up to 10 retries, ~8 minutes worst case)
6. Starts the full playground (frontend + backend)

**Cleanup is automatic.** When you press `Ctrl+C`:
- The original `playground/fe/package.json` is restored from backup
- `playground/fe/node_modules` is deleted
- `pnpm install` runs to re-establish workspace links

**Important:** Never commit or push `playground/fe/package.json` while it contains non-workspace versions. The cleanup handles this automatically, but if the script is killed forcefully (`kill -9`), you may need to restore manually:

```bash
# If cleanup didn't run, restore manually:
git checkout playground/fe/package.json
rm -rf playground/fe/node_modules
pnpm install
```

## Adding a New Package

1. Create `packages/<name>/` with `package.json`, `tsconfig.json`, `src/index.ts`
2. Add ProseMirror deps as `peerDependencies` (and as `devDependencies` for local development)
3. Extend `../../tsconfig.base.json` in your `tsconfig.json`
4. Add a demo component in `playground/fe/src/demos/`
5. Register the demo in `playground/fe/src/App.tsx`
6. Add the package to the `packages` array in `playground/fe/src/demos/WelcomePage.tsx` (set `scoped: true` for `@emergence-engineering/` packages, `scoped: false` for global packages)
