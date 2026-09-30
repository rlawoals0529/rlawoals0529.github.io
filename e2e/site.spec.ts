import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Read rather than imported. Playwright runs this file through its own loader, which is stricter
 * about JSON modules than Vite is, and an import attribute here would not survive the tsconfig
 * the app is built with. Reading it keeps one source of truth without fighting two loaders.
 */
const HIDDEN_PROJECTS = new Set(["arc-agi-3-agent"]);
const projects: { name: string; demo: string | null }[] = JSON.parse(
  readFileSync(fileURLToPath(new URL("../src/projects.json", import.meta.url)), "utf8"),
).filter((p: { name: string }) => !HIDDEN_PROJECTS.has(p.name.toLowerCase()));
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

test("the whole card is the target, not only its title text", async ({ page }) => {
  await ready(page);
  const card = page.locator(".card").first();
  const hit = card.locator(".card-hit");
  const [cardBox, hitBox] = await Promise.all([card.boundingBox(), hit.boundingBox()]);
  expect(cardBox).toBeTruthy();
  expect(hitBox).toBeTruthy();
  expect(Math.abs(hitBox!.width - cardBox!.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(hitBox!.height - cardBox!.height)).toBeLessThanOrEqual(2);
});

test("a card carries exactly one overlay link, so it has one primary accessible target", async ({ page }) => {
  await ready(page);
  const cards = page.locator(".card");
  const count = await cards.count();
  for (let i = 0; i < count; i += 1) {
    const hit = cards.nth(i).locator("a.card-hit");
    await expect(hit).toHaveCount(1);
    expect(await hit.getAttribute("aria-label")).toBeTruthy();
  }
});

test("no demo link is a dead one", async ({ page, request }) => {
  await ready(page);
  // The first action link in a card is the demo when there is one. Scoped to cards that carry
  // a live marker, so this counts the same set the page claims is live.
  const hrefs = await page
    .locator(".card:has(.live) .card-actions a")
    .evaluateAll((els) => els.map((e) => (e as HTMLAnchorElement).href).filter((h) => !h.includes("github.com")));
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

test("contact exposes the public handles without the old Discord discriminator", async ({ page }) => {
  await ready(page);
  await expect(page.getByRole("link", { name: "Contact", exact: true })).toHaveAttribute("href", "#contact");
  await expect(page.getByRole("heading", { name: "Say hello." })).toBeVisible();
  await expect(page.getByText("rlawoals00529@gmail.com")).toBeVisible();
  await expect(page.getByText("jaemin", { exact: true })).toBeVisible();
  await expect(page.getByText("Open to work", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy Discord username jaemin" })).toBeVisible();
  await expect(page.locator("#contact")).not.toContainText("#");
  await expect(page.getByRole("link", { name: "Resume" })).toHaveCount(0);
});

test("featured work exposes deeper project decisions without forcing navigation", async ({ page }) => {
  await ready(page);
  await expect(page.locator(".spotlight-card")).toHaveCount(4);
  const ariadne = page.locator(".spotlight-card").filter({ hasText: "Ariadne" });
  await expect(ariadne).toContainText("Evidence-aware search");
  await expect(ariadne.locator(".case-visual")).toHaveAttribute("aria-hidden", "true");
  await ariadne.locator("summary").click();
  await expect(ariadne).toContainText("Problem");
  await expect(ariadne).toContainText("exact first-party adapters");
  await expect(ariadne).toContainText("What this demonstrates");
  await expect(ariadne.getByRole("link", { name: /Open project/ })).toHaveAttribute(
    "href",
    "https://ariadne.rlawoals0529.workers.dev",
  );
});

test("project explorer filters and searches without losing the full index", async ({ page }) => {
  await ready(page);
  const allCards = page.locator(".card");
  await expect(allCards).toHaveCount(projects.length);

  await page.getByRole("button", { name: "Python", exact: true }).click();
  const visiblePython = page.locator('.card[data-language="python"]:visible');
  expect(await visiblePython.count()).toBeGreaterThan(0);
  await expect(page.locator('.card:not([data-language="python"]):visible')).toHaveCount(0);

  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.locator("#project-search").fill("Ariadne");
  await expect(page.locator(".card:visible")).toHaveCount(1);
  await expect(page.locator(".card:visible")).toContainText("Ariadne");

  await page.locator("#project-search").fill("");
  await expect(page.locator(".card:visible")).toHaveCount(projects.length);
});

test("palette picker is a disclosure and the choice survives a reload", async ({ page }) => {
  await ready(page);
  const toggle = page.locator("#palette-toggle");
  const dropdown = page.locator("#palette-dropdown");

  await expect(dropdown).toBeHidden();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.click();
  await expect(dropdown).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  const before = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await page.locator('.swatch[data-theme="sakura-lake"]').click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sakura-lake");
  await expect(page.locator("#palette-toggle-label")).toHaveText("Sakura Lake");
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).not.toBe(before);
  expect(await page.evaluate(() => document.documentElement.style.colorScheme)).toBe("light");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "sakura-lake");
  await expect(page.locator("#palette-toggle-label")).toHaveText("Sakura Lake");
  await expect(page.locator("#palette-dropdown")).toBeHidden();
});

test("Escape closes the palette dropdown and restores the palette from before previewing", async ({ page }) => {
  await ready(page);
  const toggle = page.locator("#palette-toggle");
  await toggle.click();
  const starting = await page.locator("html").getAttribute("data-theme");

  const selected = page.locator('.swatch[aria-checked="true"]');
  await selected.focus();
  await page.keyboard.press("ArrowRight");
  expect(await page.locator("html").getAttribute("data-theme")).not.toBe(starting);

  await page.keyboard.press("Escape");
  await expect(page.locator("html")).toHaveAttribute("data-theme", starting!);
  await expect(page.locator("#palette-dropdown")).toBeHidden();
  await expect(toggle).toBeFocused();
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
      // The cell is transparent now, so the substrate behind the text is the page itself.
      // Measuring against the card would read rgba(0,0,0,0) and score nothing.
      return { text: getComputedStyle(p).color, bg: getComputedStyle(document.body).backgroundColor };
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

test("the cards tilt toward the cursor, and stop when asked to", async ({ page, browser }) => {
  await ready(page);
  const card = page.locator(".card").first();
  // Into view first. boundingBox is page-relative and mouse.move is viewport-relative, so a card
  // hanging below the fold has its lower half at coordinates the pointer never reaches, and the
  // test moves to empty space while the effect works perfectly.
  await card.scrollIntoViewIfNeeded();
  const box = (await card.boundingBox())!;

  // Polled for the SIGN each time, not merely for a change. "not equal to the previous value"
  // is also satisfied by an empty string, so it passes when the effect has been cleared, which
  // is the opposite of what this test is for.
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.2);
  await expect
    .poll(() => card.locator(".card-inner").evaluate((e) => (e as HTMLElement).style.transform))
    .toMatch(/rotateX\(\d/);

  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.8);
  // Inverted, because the pointer crossed the centre. If it did not invert, nothing is tracking.
  await expect
    .poll(() => card.locator(".card-inner").evaluate((e) => (e as HTMLElement).style.transform))
    .toMatch(/rotateX\(-\d/);

  // Leaving clears it, or a card stays tilted with no pointer to straighten it.
  await page.mouse.move(2, 2);
  await expect.poll(() => card.locator(".card-inner").evaluate((e) => (e as HTMLElement).style.transform)).toBe("");

  const reduced = await browser.newContext({ reducedMotion: "reduce" });
  const quiet = await reduced.newPage();
  await quiet.goto("/");
  const qc = quiet.locator(".card").first();
  await qc.scrollIntoViewIfNeeded();
  const qb = (await qc.boundingBox())!;
  await quiet.mouse.move(qb.x + 20, qb.y + 20);
  await quiet.waitForTimeout(200);
  expect(await qc.locator(".card-inner").evaluate((e) => (e as HTMLElement).style.transform)).toBe("");
  await reduced.close();
});

test("the server under test is this app, not another app on the same port", async ({ page }) => {
  await page.goto("/");
  /*
   * playwright.config.ts reuses a server that is already listening, so a port two projects
   * share means one project's running preview quietly answers the other's tests. That has
   * happened here twice, and once it produced a completely green run against the wrong page.
   * Ports are unique now; this is what catches the next way it goes wrong.
   */
  await expect(page).toHaveTitle(/things I built/);
});
