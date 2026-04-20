import { test, expect, Page, ConsoleMessage } from "@playwright/test";
import { waitForHarness, typeText, waitForDecorations } from "../helpers/test-utils";

// Yjs emits the "Tried to remove event handler that doesn't exist" message
// via console.error (yjs.cjs ~L2007), not console.warn — capture both.
function captureYjsLogs(page: Page): string[] {
  const logs: string[] = [];
  page.on("console", (msg: ConsoleMessage) => {
    const type = msg.type();
    if (type !== "warning" && type !== "error") return;
    const text = msg.text();
    if (text.includes("[yjs]")) logs.push(text);
  });
  return logs;
}

test.describe("Observer lifecycle", () => {
  test("destroying view before 100ms init does not emit yjs warnings", async ({
    page,
  }) => {
    const yjsLogs = captureYjsLogs(page);

    // Harness destroys the view at 10ms; plugin's observer registration
    // fires at 100ms. Without the guard, destroy() would call
    // unobserveDeep / unobserve on handlers that were never registered,
    // producing two "[yjs] Tried to remove event handler that doesn't
    // exist." warnings.
    await page.goto("/?destroyAfterMs=10");
    await waitForHarness(page);
    await page.waitForTimeout(300);

    expect(yjsLogs).toEqual([]);
  });

  test("normal mount → edit → destroy does not emit yjs warnings", async ({
    page,
  }) => {
    const yjsLogs = captureYjsLogs(page);

    await page.goto("/");
    await waitForHarness(page);
    await page.waitForTimeout(300);

    await typeText(page, "Hello world");
    await waitForDecorations(page, 1);

    await page.evaluate(() => (window as any).__editorView.destroy());
    await page.waitForTimeout(100);

    expect(yjsLogs).toEqual([]);
  });
});
