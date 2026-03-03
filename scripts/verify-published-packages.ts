// verify-published-packages.ts
//
// Verifies that published npm packages work correctly in the playground.
//
// What it does:
// 1. Scans each package's package.json to discover names and versions
// 2. Backs up playground/fe/package.json
// 3. Replaces all workspace:* deps with exact published versions
// 4. Clears playground/fe/node_modules for a clean install
// 5. Runs pnpm install with retry logic (npm propagation can be slow)
// 6. Starts the playground (frontend + backend)
// 7. On exit: restores the original package.json, clears node_modules, reinstalls
//
// WARNING: Never commit playground/fe/package.json while running this script.
//          The cleanup runs automatically on exit (Ctrl+C).

import { execSync, spawn, type ChildProcess } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, existsSync, rmSync } from "node:fs";
import { resolve, join } from "node:path";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const PACKAGES_DIR = join(ROOT, "packages");
const PLAYGROUND_FE_DIR = join(ROOT, "playground", "fe");
const PLAYGROUND_PKG_PATH = join(PLAYGROUND_FE_DIR, "package.json");
const BACKUP_PATH = join(PLAYGROUND_FE_DIR, "package.json.bak");

// ── Package discovery ──────────────────────────────────────────────────────────

interface PackageInfo {
  name: string;
  version: string;
}

function discoverWorkspacePackages(): PackageInfo[] {
  const packages: PackageInfo[] = [];
  const dirs = readdirSync(PACKAGES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const dir of dirs) {
    const pkgPath = join(PACKAGES_DIR, dir.name, "package.json");
    if (!existsSync(pkgPath)) continue;

    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    if (pkg.name && pkg.version) {
      packages.push({ name: pkg.name, version: pkg.version });
    }
  }

  return packages;
}

// ── Swap workspace deps for published versions ────────────────────────────────

function swapToPublishedVersions(packages: PackageInfo[]): void {
  const versionMap = new Map(packages.map((p) => [p.name, p.version]));
  const playgroundPkg = JSON.parse(readFileSync(PLAYGROUND_PKG_PATH, "utf-8"));

  let swapCount = 0;
  for (const [dep, version] of Object.entries(playgroundPkg.dependencies ?? {})) {
    if (version === "workspace:*" && versionMap.has(dep)) {
      playgroundPkg.dependencies[dep] = versionMap.get(dep);
      swapCount++;
      console.log(`  ${dep}: workspace:* -> ${versionMap.get(dep)}`);
    }
  }

  if (swapCount === 0) {
    console.log("No workspace:* dependencies found to swap.");
    process.exit(0);
  }

  writeFileSync(PLAYGROUND_PKG_PATH, JSON.stringify(playgroundPkg, null, 2) + "\n");
  console.log(`\nSwapped ${swapCount} dependencies to published versions.\n`);
}

// ── Install with retries ───────────────────────────────────────────────────────

function getRetryDelay(attempt: number): number {
  // Attempts 1-4: 10s, 20s, 30s, 40s
  // Attempts 5-10: 60s each
  if (attempt <= 4) return attempt * 10;
  return 60;
}

function sleep(seconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
}

async function installWithRetries(maxRetries: number = 10): Promise<void> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Install attempt ${attempt}/${maxRetries}...`);
      execSync("pnpm install --no-frozen-lockfile", {
        cwd: ROOT,
        stdio: "inherit",
      });
      console.log("Install succeeded.\n");
      return;
    } catch {
      if (attempt === maxRetries) {
        throw new Error(
          `pnpm install failed after ${maxRetries} attempts. ` +
          `The published versions may not be available on npm yet.`
        );
      }

      const delay = getRetryDelay(attempt);
      console.log(
        `Install failed (attempt ${attempt}/${maxRetries}). ` +
        `Retrying in ${delay}s — npm may still be propagating the new versions...\n`
      );
      await sleep(delay);
    }
  }
}

// ── Cleanup ────────────────────────────────────────────────────────────────────

let cleanedUp = false;

function cleanup(): void {
  if (cleanedUp) return;
  cleanedUp = true;

  console.log("\n\nCleaning up...");

  // Restore backup
  if (existsSync(BACKUP_PATH)) {
    copyFileSync(BACKUP_PATH, PLAYGROUND_PKG_PATH);
    rmSync(BACKUP_PATH);
    console.log("Restored original playground/fe/package.json");
  }

  // Clear node_modules so workspace links are properly re-established
  const nodeModulesPath = join(PLAYGROUND_FE_DIR, "node_modules");
  if (existsSync(nodeModulesPath)) {
    console.log("Removing playground/fe/node_modules...");
    rmSync(nodeModulesPath, { recursive: true, force: true });
  }

  // Reinstall with workspace links
  console.log("Reinstalling with workspace links...");
  try {
    execSync("pnpm install", { cwd: ROOT, stdio: "inherit" });
    console.log("Workspace dependencies restored successfully.");
  } catch {
    console.error(
      "WARNING: Failed to reinstall workspace dependencies. " +
      "Run `pnpm install` manually to restore workspace links."
    );
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log("=== Verify Published Packages ===\n");
  console.log("WARNING: Do NOT commit playground/fe/package.json while this script is running.\n");

  // 1. Discover packages
  console.log("Scanning workspace packages...\n");
  const packages = discoverWorkspacePackages();

  if (packages.length === 0) {
    console.error("No packages found in packages/ directory.");
    process.exit(1);
  }

  console.log(`Found ${packages.length} packages:\n`);
  for (const pkg of packages) {
    console.log(`  ${pkg.name}@${pkg.version}`);
  }
  console.log();

  // 2. Backup playground package.json
  copyFileSync(PLAYGROUND_PKG_PATH, BACKUP_PATH);
  console.log("Backed up playground/fe/package.json\n");

  // Register cleanup handlers
  process.on("SIGINT", () => { cleanup(); process.exit(0); });
  process.on("SIGTERM", () => { cleanup(); process.exit(0); });
  process.on("exit", cleanup);

  // 3. Swap to published versions
  console.log("Swapping workspace dependencies to published versions:\n");
  swapToPublishedVersions(packages);

  // 4. Clear node_modules
  const nodeModulesPath = join(PLAYGROUND_FE_DIR, "node_modules");
  if (existsSync(nodeModulesPath)) {
    console.log("Clearing playground/fe/node_modules...\n");
    rmSync(nodeModulesPath, { recursive: true, force: true });
  }

  // 5. Install with retries
  await installWithRetries();

  // 6. Start playground (frontend + backend)
  console.log("Starting playground (frontend + backend)...\n");
  console.log("Press Ctrl+C to stop and restore workspace dependencies.\n");

  const playgroundProcess: ChildProcess = spawn("pnpm", ["playground"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: true,
  });

  await new Promise<void>((resolve) => {
    playgroundProcess.on("close", () => resolve());
  });
}

main().catch((err) => {
  console.error("\nError:", err.message);
  cleanup();
  process.exit(1);
});
