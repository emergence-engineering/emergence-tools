import { expect, Page, test } from "@playwright/test";

const imgUrlString = "https://picsum.photos/400/300**";

const testImageMockEndpoint = async (cb: () => void, page: Page) => {
  await page.route(imgUrlString, async (route) => {
    cb();
    const response = await route.fetch();
    await route.fulfill({
      response,
      // @ts-expect-error - we need to forcefully null this
      headers: { "Cache-Control": null },
    });
  });
};

test("importing an image only download it once", async ({ page }) => {
  let callCounter = 0;
  testImageMockEndpoint(() => {
    callCounter += 1;
  }, page);
  await page.goto("/");
  // Navigate to Image Plugin demo
  await page.getByRole("button", { name: "Image Plugin" }).click();
  // Switch to Infinite Load mode
  await page.getByRole("button", { name: "Infinite Load" }).click();
  // Add an image (upload gate blocks, placeholder appears)
  await page.getByRole("button", { name: "Add image" }).click();
  await expect(
    page.locator("placeholder.ProseMirror-widget"),
  ).toBeVisible();
  // Resolve the upload gate — node is inserted and downloadImage fetches directly
  await page.getByRole("button", { name: "Resolve All Image" }).click();
  // Wait for the image to appear (downloadImage fetches picsum)
  const img = page.locator("img.imagePluginImg");
  await expect(img).toBeVisible();
  // Image should have been fetched exactly once
  await expect(callCounter).toBe(1);
  // Placeholder class should be gone
  await expect(
    page.locator("img.imagePluginImg.placeholderClassName"),
  ).toBeHidden();
  // Wait and verify no extra fetches happened
  await page.waitForTimeout(1000);
  await expect(callCounter).toBe(1);
});
