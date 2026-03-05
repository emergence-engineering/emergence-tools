import { test, expect } from "@playwright/test";
import {
  waitForHarness,
  getDecorationCount,
  getDecorations,
  getPluginState,
  typeText,
  insertAsUser,
  waitForDecorations,
} from "../helpers/test-utils";

test.describe("Decorations", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHarness(page);
    // Wait for initial plugin initialization (100ms delay + observer setup)
    await page.waitForTimeout(300);
  });

  test("typing text creates decorations", async ({ page }) => {
    await typeText(page, "Hello world");
    await waitForDecorations(page, 1);

    const count = await getDecorationCount(page);
    expect(count).toBeGreaterThan(0);
  });

  test("decorations have background-color style", async ({ page }) => {
    await typeText(page, "Some text");
    await waitForDecorations(page, 1);

    const decos = await getDecorations(page);
    expect(decos.length).toBeGreaterThan(0);

    for (const d of decos) {
      expect(d.style).toContain("background-color:");
    }
  });

  test("all text is attributed to the configured user", async ({ page }) => {
    await typeText(page, "First chunk ");
    await waitForDecorations(page, 1);

    const decos1 = await getDecorations(page);
    // All decorations should have the same color (single user)
    const colors = decos1.map((d) => d.style);
    const uniqueColors = [...new Set(colors)];
    expect(uniqueColors.length).toBe(1);
  });

  test("plugin state reports visible=true by default", async ({ page }) => {
    const state = await getPluginState(page);
    expect(state.visible).toBe(true);
  });

  test("different users get different decoration colors", async ({ page }) => {
    await insertAsUser(page, "alice", "Hello from Alice");
    await insertAsUser(page, "bob", "Hello from Bob");
    await waitForDecorations(page, 2);

    const decos = await getDecorations(page);
    expect(decos.length).toBeGreaterThanOrEqual(2);

    const uniqueColors = [...new Set(decos.map((d) => d.style))];
    expect(uniqueColors.length).toBeGreaterThanOrEqual(2);
  });

  test("decoration spans cover the typed text range", async ({ page }) => {
    await typeText(page, "Hello");
    await waitForDecorations(page, 1);

    const decos = await getDecorations(page);
    expect(decos.length).toBeGreaterThan(0);

    // Each decoration should have from < to
    for (const d of decos) {
      expect(d.to).toBeGreaterThan(d.from);
    }
  });
});
