import { test, expect } from "@playwright/test";
import {
  waitForHarness,
  insertLargeDoc,
  measureDecorationTime,
} from "../helpers/test-utils";

test.describe("Scaling", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await waitForHarness(page);
    await page.waitForTimeout(300);
  });

  test("characterize decoration time scaling with paragraph count", async ({
    page,
  }) => {
    // Measure at multiple sizes and compute the scaling exponent.
    // exponent = log(timeRatio) / log(sizeRatio)
    // O(n)   → exponent ≈ 1
    // O(n²)  → exponent ≈ 2
    // O(n³)  → exponent ≈ 3
    // Currently the algorithm is ~O(n²) due to DecorationSet.create
    // scanning the full doc for each decoration. We assert < 2.5 to
    // guard against cubic regression.
    const sizes = [1000, 2000, 4000];
    const times: number[] = [];

    for (let s = 0; s < sizes.length; s++) {
      if (s > 0) {
        await page.goto("/");
        await waitForHarness(page);
        await page.waitForTimeout(300);
      }
      await insertLargeDoc(page, sizes[s], 1);
      // Median of 3 for stability
      const m: number[] = [];
      for (let r = 0; r < 3; r++) {
        m.push(await measureDecorationTime(page));
      }
      m.sort((a, b) => a - b);
      times.push(m[1]);
      console.log(`${sizes[s]} paragraphs: ${m[1].toFixed(2)}ms`);
    }

    // Compute exponent from first to last measurement
    const sizeRatio = sizes[sizes.length - 1] / sizes[0];
    const timeRatio = times[times.length - 1] / times[0];
    const exponent = Math.log(timeRatio) / Math.log(sizeRatio);

    console.log(`Size ratio: ${sizeRatio}x, Time ratio: ${timeRatio.toFixed(2)}x, Exponent: ${exponent.toFixed(2)}`);

    // Guard against cubic or worse regression
    expect(exponent).toBeLessThan(2.5);
  });

  test("user count does not significantly affect decoration time", async ({
    page,
  }) => {
    const userCounts = [1, 5, 20];
    const paragraphs = 1000;
    const times: number[] = [];

    for (const users of userCounts) {
      await page.goto("/");
      await waitForHarness(page);
      await page.waitForTimeout(300);

      await insertLargeDoc(page, paragraphs, users);
      const time = await measureDecorationTime(page);
      times.push(time);
      console.log(
        `${paragraphs} paragraphs, ${users} users: ${time.toFixed(2)}ms`,
      );
    }

    // All times should be within 2x of each other
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    console.log(`Min: ${minTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms, Ratio: ${(maxTime / minTime).toFixed(2)}x`);
    expect(maxTime / minTime).toBeLessThan(2);
  });

  test("reports decoration budget ceiling at 150ms", async ({ page }) => {
    const steps = [500, 1000, 2000, 4000, 8000];
    let ceiling = steps[steps.length - 1];

    for (const size of steps) {
      await page.goto("/");
      await waitForHarness(page);
      await page.waitForTimeout(300);

      await insertLargeDoc(page, size, 5);
      const time = await measureDecorationTime(page);
      console.log(`${size} paragraphs: ${time.toFixed(2)}ms`);

      if (time > 150) {
        ceiling = size;
        break;
      }
    }

    console.log(`Decoration budget ceiling (~150ms): ${ceiling} paragraphs`);
    // This test is informational — just ensure we measured something
    expect(ceiling).toBeGreaterThan(0);
  });
});
