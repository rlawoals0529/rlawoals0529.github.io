import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Read rather than imported. Playwright runs this file through its own loader, which is stricter
 * about JSON modules than Vite is, and an import attribute here would not survive the tsconfig
 * the app is built with. Reading it keeps one source of truth without fighting two loaders.
 */
const projects: { name: string; demo: string | null }[] = JSON.parse(
  readFileSync(fileURLToPath(new URL("../src/projects.json", import.meta.url)), "utf8"),
);
const live = projects.filter((p) => p.demo);

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator(".card").first()).toBeVisible();
}

test("every project is on the page, and the live ones are marked", async ({ page }) => {
  await ready(page);
  await expect(page.locator(".card")).toHaveCount(projects.length);
  await expect(page.locator(".live")).toHaveCount(live.length);
  await expect(page.locator("#counts")).toContainText(`${projects.length} projects`);
});

test("the whole card is the target, not the title text", async ({ page }) => {
  await ready(page);
  const card = page.locator(".card").first();
  const box = (await card.boundingBox())!;
  // A corner well away from the title. A card whose only hit area is its heading is a 21rem
  // rectangle that looks clickable and is not.
  const hit = await page.evaluate(
    ({ x, y }: { x: number; y: number }) =>
      document.elementFromPoint(x, y)?.closest("a")?.getAttribute("href") ?? null,
    { x: box.x + box.width - 20, y: box.y + 24 },
  );
  expect(hit).toBeTruthy();
});

test("a card carries exactly one stretched link, so it has one accessible name", async ({ page }) => {
  await ready(page);
  const stretched = await page.evaluate(
    () =>
      [...document.querySelectorAll(".card")].map(
        (c) => [...c.querySelectorAll("a")].filter((a) => getComputedStyle(a, "::after").position === "absolute").length,
      ),
  );
  expect(new Set(stretched)).toEqual(new Set([1]));
});

test("no demo link is a dead one", async ({ page, request }) => {
  await ready(page);
  const hrefs = await page.locator(".card-actions a.primary").evaluateAll((els) =>
    els.map((e) => (e as HTMLAnchorElement).href),
  );
  expect(hrefs.length).toBe(live.length);
  for (const href of hrefs) {
    const res = await request.get(href);
    expect(res.status(), `${href} did not respond`).toBeLessThan(400);
  }
});

test("the skip link moves focus, not only the viewport", async ({ page }) => {
  await ready(page);
  await page.keyboard.press("Tab");
  await expect(page.locator("a.skip")).toBeFocused();
  await expect.poll(async () => (await page.locator("a.skip").boundingBox())!.y).toBeGreaterThanOrEqual(0);
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => document.activeElement?.id)).toBe("work");
});

test("a palette choice repaints the page and survives a reload", async ({ page }) => {
  await ready(page);
  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.locator('.swatch[data-theme="sakura-lake"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sakura-lake");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(before);
  expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe("light");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sakura-lake");
});

test("body text clears AA in every palette", async ({ page }) => {
  await ready(page);
  const lum = ([r, g, b]: number[]) => {
    const f = (c: number) => (c / 255 <= 0.03928 ? c / 255 / 12.92 : ((c / 255 + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
  };
  const rgb = (s: string) => (s.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number);
  const ratio = (a: string, b: string) => {
    const [x, y] = [lum(rgb(a)), lum(rgb(b))].sort((m, n) => n - m) as [number, number];
    return (x + 0.05) / (y + 0.05);
  };

  const ids = await page.locator(".swatch").evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.theme!));
  expect(ids.length).toBe(15);
  for (const id of ids) {
    const c = await page.evaluate((theme) => {
      document.documentElement.dataset.theme = theme;
      const p = document.querySelector(".card p")!;
      return { text: getComputedStyle(p).color, bg: getComputedStyle(document.querySelector(".card")!).backgroundColor };
    }, id);
    // 4.5:1, the threshold for text this size. It was failing in thirteen of fifteen before the
    // card copy moved off --dim, which is a metadata colour.
    expect(ratio(c.text, c.bg), `${id} card copy`).toBeGreaterThanOrEqual(4.5);
  }
});

test("nothing scrolls sideways, at any width", async ({ page }) => {
  await page.goto("/");
  for (const width of [1440, 1280, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    const m = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, view: window.innerWidth }));
    expect(m.doc, `overflow at ${width}`).toBeLessThanOrEqual(m.view);
  }
});
