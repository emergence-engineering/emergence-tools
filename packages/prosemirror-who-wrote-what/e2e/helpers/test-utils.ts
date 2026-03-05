import { Page } from "@playwright/test";

/** Wait for the test harness bridge to be available on the page. */
export async function waitForHarness(page: Page, timeout = 10000) {
  await page.waitForFunction(() => !!(window as any).__WWW_TEST__, {
    timeout,
  });
}

/** Get the number of active decorations. */
export async function getDecorationCount(page: Page): Promise<number> {
  return page.evaluate(() => (window as any).__WWW_TEST__.getDecorationCount());
}

/** Get decoration details (from, to, style). */
export async function getDecorations(
  page: Page,
): Promise<Array<{ from: number; to: number; style: string }>> {
  return page.evaluate(() => (window as any).__WWW_TEST__.getDecorations());
}

/** Get plugin state summary. */
export async function getPluginState(
  page: Page,
): Promise<{ visible: boolean; decorationCount: number }> {
  return page.evaluate(() => (window as any).__WWW_TEST__.getPluginState());
}

/** Get document content size. */
export async function getDocSize(page: Page): Promise<number> {
  return page.evaluate(() => (window as any).__WWW_TEST__.getDocSize());
}

/** Get document text content. */
export async function getDocText(page: Page): Promise<string> {
  return page.evaluate(() => (window as any).__WWW_TEST__.getDocText());
}

/** Toggle visibility of who-wrote-what decorations. */
export async function setVisibility(
  page: Page,
  visible: boolean,
): Promise<void> {
  await page.evaluate(
    (v) => (window as any).__WWW_TEST__.setVisibility(v),
    visible,
  );
}

/** Type text into the editor at the current cursor position. */
export async function typeText(page: Page, text: string): Promise<void> {
  await page.evaluate(
    (t) => (window as any).__WWW_TEST__.typeText(t),
    text,
  );
}

/** Insert a paragraph as a specific user (uses a secondary Y.Doc for a unique clientID). */
export async function insertAsUser(
  page: Page,
  userId: string,
  text: string,
): Promise<void> {
  await page.evaluate(
    ({ userId, text }) => (window as any).__WWW_TEST__.insertAsUser(userId, text),
    { userId, text },
  );
}

/** Bulk-insert paragraphs via Yjs transact. Optionally round-robin across userCount users. */
export async function insertLargeDoc(
  page: Page,
  paragraphCount: number,
  userCount = 1,
): Promise<void> {
  await page.evaluate(
    ({ count, users }) => (window as any).__WWW_TEST__.insertLargeDoc(count, users),
    { count: paragraphCount, users: userCount },
  );
}

/** Measure decoration computation time in ms. */
export async function measureDecorationTime(page: Page): Promise<number> {
  return page.evaluate(() =>
    (window as any).__WWW_TEST__.measureDecorationTime(),
  );
}

/**
 * Wait for decorations to appear (at least minCount).
 * Polls every 100ms up to timeout.
 */
export async function waitForDecorations(
  page: Page,
  minCount: number,
  timeout = 5000,
): Promise<number> {
  return page.evaluate(
    ({ minCount, timeout }) => {
      return new Promise<number>((resolve, reject) => {
        const start = Date.now();
        const check = () => {
          const count = (window as any).__WWW_TEST__.getDecorationCount();
          if (count >= minCount) return resolve(count);
          if (Date.now() - start > timeout)
            return reject(
              new Error(
                `Timed out waiting for ${minCount} decorations (got ${count})`,
              ),
            );
          setTimeout(check, 100);
        };
        check();
      });
    },
    { minCount, timeout },
  );
}

/**
 * Wait for decoration count to be exactly expectedCount.
 */
export async function waitForExactDecorationCount(
  page: Page,
  expectedCount: number,
  timeout = 5000,
): Promise<void> {
  await page.evaluate(
    ({ expectedCount, timeout }) => {
      return new Promise<void>((resolve, reject) => {
        const start = Date.now();
        const check = () => {
          const count = (window as any).__WWW_TEST__.getDecorationCount();
          if (count === expectedCount) return resolve();
          if (Date.now() - start > timeout)
            return reject(
              new Error(
                `Timed out waiting for exactly ${expectedCount} decorations (got ${count})`,
              ),
            );
          setTimeout(check, 100);
        };
        check();
      });
    },
    { expectedCount, timeout },
  );
}
