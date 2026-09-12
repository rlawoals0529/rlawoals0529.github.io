import { expect, test } from "@playwright/test";
import { describeFailures, probeContrast } from "./contrast-probe.js";
import themes from "../src/theme/palettes.json" with { type: "json" };

/**
 * The palette grid, as a control and as fifteen colours.
 *
 * The swatches here are cells in the page's own rule grid rather than the cards the React
 * picker draws, and that is on purpose: the look is this page's. What is shared is the
 * behaviour, so that is what is checked.
 */

test("the whole grid is one tab stop, and the arrows move inside it", async ({ page }) => {
  await page.goto("/");
  const options = page.getByRole("radio");
  expect(await options.count()).toBeGreaterThan(10);

  // Fifteen swatches used to be fifteen tab stops between you and the rest of the page.
  const tabbable = await options.evaluateAll((els) => els.filter((e) => (e as HTMLElement).tabIndex === 0).length);
  expect(tabbable).toBe(1);
});

test("arrowing tries each palette on the page, and Escape puts back the one you arrived with", async ({ page }) => {
  await page.goto("/");
  const started = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
  const paint = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  const before = await paint();

  await page.locator('[role="radio"][aria-checked="true"]').focus();
  await page.keyboard.press("ArrowRight");

  await expect
    .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
    .not.toBe(started);
  // The PAGE changed, not just the attribute.
  await expect.poll(paint).not.toBe(before);

  await page.keyboard.press("Escape");
  await expect
    .poll(() => page.evaluate(() => document.documentElement.getAttribute("data-theme")))
    .toBe(started);
});

test("a chosen palette survives a reload, colour scheme and all", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "Sakura Lake" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sakura-lake");
  // color-scheme rides along, or the browser paints native scrollbars for the other one.
  expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe("light");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sakura-lake");
});

test("no text on the page is below AA contrast, in any palette", async ({ page }) => {
  await page.goto("/");
  const probe = await probeContrast(page, themes);

  // A selector that stopped matching would make this pass by measuring nothing.
  expect(probe.styles).toBeGreaterThan(9);
  expect(probe.measured).toBeGreaterThan(140);

  // The sweep has to have actually swept. Fewer distinct paintings than palettes means some
  // of them never applied, and those numbers are another palette measured twice.
  expect(probe.distinctPalettes, "some palettes painted nothing of their own").toBe(themes.length);
  expect(probe.failures, describeFailures(probe.failures)).toEqual([]);
});
