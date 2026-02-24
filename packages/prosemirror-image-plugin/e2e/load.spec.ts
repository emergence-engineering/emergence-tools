import { expect, Page, test } from "@playwright/test";

const imgUrlString = "https://picsum.photos/200/300**";

const testImageMockEndpoint = async (cb: () => void, page: Page) => {
  await page.route(imgUrlString, async (route) => {
    cb();
    const response = await route.fetch();
    //console.log(response);
    await route.fulfill({
      response,
      headers: { "Cache-Control": null },
    });
  });
};

test("importing an image only download it once", async ({ page }) => {
  let callCounter = 0;
  testImageMockEndpoint(() => {
    callCounter += 1;
  }, page);
  await page.goto("prosemirror2");
  await page.getByRole("button", { name: "Add image" }).click();
  await expect(
    await page.locator("placeholder.ProseMirror-widget")
  ).toBeVisible();
  await page.getByRole("button", { name: "Resolve All Image" }).click();
  await expect(
    await page.locator("img.imagePluginImg.placeholderClassName")
  ).toBeVisible();
  await expect(callCounter).toBe(0);
  await page.getByRole("button", { name: "Resolve All Image" }).click();
  await expect(callCounter).toBe(1);
  await expect(
    page.locator("img.imagePluginImg.placeholderClassName")
  ).toBeVisible({ visible: false });
  await expect(callCounter).toBe(1);
  const img = await page.locator("img.imagePluginImg");
  await expect(img).toBeVisible();
  await page.waitForTimeout(1000);
  await expect(callCounter).toBe(1);
  //the strange thing that in FF and Safari the counter is 1, even if we fetch the image 2 times...
});
