import { test, expect } from "@playwright/test";
import {
  waitForHarness,
  insertLargeDoc,
  measureDecorationTime,
} from "../helpers/test-utils";

test.describe("Performance", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHarness(page);
    await page.waitForTimeout(300);
  });

  test("500 paragraphs — decoration computation under 500ms", async ({
    page,
  }) => {
    await insertLargeDoc(page, 500, 5);

    const time = await measureDecorationTime(page);
    console.log(`500 paragraphs: ${time.toFixed(2)}ms`);
    expect(time).toBeGreaterThan(0);
    expect(time).toBeLessThan(500);
  });

  test("1000 paragraphs — decoration computation under 1000ms", async ({
    page,
  }) => {
    await insertLargeDoc(page, 1000, 5);

    const time = await measureDecorationTime(page);
    console.log(`1000 paragraphs: ${time.toFixed(2)}ms`);
    expect(time).toBeGreaterThan(0);
    expect(time).toBeLessThan(1000);
  });

  test("2000 paragraphs — decoration computation under 2000ms", async ({
    page,
  }) => {
    await insertLargeDoc(page, 2000, 5);

    const time = await measureDecorationTime(page);
    console.log(`2000 paragraphs: ${time.toFixed(2)}ms`);
    expect(time).toBeGreaterThan(0);
    expect(time).toBeLessThan(2000);
  });
});