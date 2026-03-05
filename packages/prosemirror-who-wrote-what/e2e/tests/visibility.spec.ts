import { test, expect } from "@playwright/test";
import {
  waitForHarness,
  getDecorationCount,
  getPluginState,
  setVisibility,
  typeText,
  waitForDecorations,
  waitForExactDecorationCount,
} from "../helpers/test-utils";

test.describe("Visibility Toggle", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHarness(page);
    await page.waitForTimeout(300);
  });

  test("toggle off removes all decorations", async ({ page }) => {
    await typeText(page, "Hello world");
    await waitForDecorations(page, 1);

    await setVisibility(page, false);
    // Small delay for state update
    await page.waitForTimeout(100);

    const state = await getPluginState(page);
    expect(state.visible).toBe(false);
    expect(state.decorationCount).toBe(0);
  });

  test("toggle on restores decorations without needing an edit", async ({
    page,
  }) => {
    await typeText(page, "Hello world");
    await waitForDecorations(page, 1);

    const countBefore = await getDecorationCount(page);

    await setVisibility(page, false);
    await page.waitForTimeout(100);
    expect(await getDecorationCount(page)).toBe(0);

    await setVisibility(page, true);
    // Wait for recomputation (setTimeout(computeDecorations, 0) in plugin's update)
    await waitForDecorations(page, 1);

    const countAfter = await getDecorationCount(page);
    expect(countAfter).toBeGreaterThan(0);
  });

  test("toggle off, type more, toggle on shows all text decorated", async ({
    page,
  }) => {
    await typeText(page, "First ");
    await waitForDecorations(page, 1);

    await setVisibility(page, false);
    await page.waitForTimeout(100);

    // Type while hidden — Yjs still tracks authorship
    await typeText(page, "Second ");
    await page.waitForTimeout(200);

    await setVisibility(page, true);
    await waitForDecorations(page, 1);

    const state = await getPluginState(page);
    expect(state.visible).toBe(true);
    expect(state.decorationCount).toBeGreaterThan(0);
  });
});
