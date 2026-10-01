import "./style.css";
import projects from "./projects.json";
import palettes from "./theme/palettes.json";
import { grid } from "./render";
import { renderSpotlights } from "./spotlights";
import type { Project } from "./types";
import { createThemeStore, DEFAULT_THEME, grouped, type Theme } from "./lib/theme";
import { wirePalette } from "./lib/palette-keys";
import { attachTilt } from "./tilt";

const THEMES = palettes as Theme[];
const HIDDEN_PROJECTS = new Set(["arc-agi-3-agent"]);
const all = (projects as Project[]).filter((project) => !HIDDEN_PROJECTS.has(project.name.toLowerCase()));

/* ---- the grid ----------------------------------------------------------------------------- */

const live = all.filter((p) => p.demo);
const rest = all.filter((p) => !p.demo);

const mount = (id: string, html: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} is not in the page`);
  el.innerHTML = html;
};

mount("spotlight-grid", renderSpotlights());
mount("live-grid", grid(live));
// Continues from where the first grid stopped, so the numbers read as one list.
mount("rest-grid", grid(rest, live.length));

// After both grids are mounted, or it finds no cards.
attachTilt();

const count = document.getElementById("counts");
if (count) count.textContent = `${all.length} projects · ${live.length} live in your browser`;

const heroProjectCount = document.getElementById("hero-project-count");
const heroLiveCount = document.getElementById("hero-live-count");
if (heroProjectCount) heroProjectCount.textContent = String(all.length);
if (heroLiveCount) heroLiveCount.textContent = String(live.length);

/* ---- project explorer --------------------------------------------------------------------- */

const searchInput = document.getElementById("project-search") as HTMLInputElement | null;
const filterButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-filter]")];
const projectCards = [...document.querySelectorAll<HTMLElement>(".card")];
const projectSections = [...document.querySelectorAll<HTMLElement>("[data-project-section]")];
const emptyState = document.getElementById("project-empty");
let activeFilter = "all";

const gamingTerms = ["gaming", "fantasy-football", "nfl", "steam", "desktop-widgets", "optimization"];
const dataTerms = ["data-visualization", "monte-carlo", "evaluation", "llm", "browser-ml", "embeddings", "ab-testing", "confidence-intervals", "ai-agents"];

const cardMatchesFilter = (card: HTMLElement, filter: string) => {
  const language = card.dataset.language ?? "";
  const topics = card.dataset.topics ?? "";
  if (filter === "all") return true;
  if (filter === "live") return card.dataset.live === "true";
  if (filter === "typescript" || filter === "python") return language === filter;
  if (filter === "gaming") return gamingTerms.some((term) => topics.includes(term));
  if (filter === "data") return dataTerms.some((term) => topics.includes(term));
  return true;
};

const applyProjectFilters = () => {
  const query = (searchInput?.value ?? "").trim().toLowerCase();
  let visible = 0;

  for (const card of projectCards) {
    const matchesFilter = cardMatchesFilter(card, activeFilter);
    const matchesSearch = !query || (card.dataset.search ?? "").includes(query);
    const show = matchesFilter && matchesSearch;
    card.hidden = !show;
    if (show) visible += 1;
  }

  for (const section of projectSections) {
    section.hidden = !section.querySelector(".card:not([hidden])");
  }

  if (emptyState) emptyState.hidden = visible !== 0;
  if (count) {
    const suffix = visible === all.length ? `${live.length} live in your browser` : `${visible} matching`;
    count.textContent = `${all.length} projects · ${suffix}`;
  }
};

for (const button of filterButtons) {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter ?? "all";
    for (const candidate of filterButtons) {
      const active = candidate === button;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-pressed", String(active));
    }
    applyProjectFilters();
  });
}

searchInput?.addEventListener("input", applyProjectFilters);

/* ---- contact ------------------------------------------------------------------------------ */

for (const button of document.querySelectorAll<HTMLButtonElement>("[data-copy]")) {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy;
    const action = button.querySelector<HTMLElement>(".contact-action");
    if (!value || !navigator.clipboard) return;

    try {
      await navigator.clipboard.writeText(value);
      if (action) action.textContent = "Copied";
      window.setTimeout(() => {
        if (action) action.textContent = "Copy";
      }, 1600);
    } catch {
      if (action) action.textContent = value;
    }
  });
}

/* ---- palette ------------------------------------------------------------------------------ */

const store = createThemeStore(THEMES, DEFAULT_THEME, "portfolio:theme");
const list = document.getElementById("palette-list");
const paletteToggle = document.getElementById("palette-toggle") as HTMLButtonElement | null;
const paletteDropdown = document.getElementById("palette-dropdown");
const paletteLabel = document.getElementById("palette-toggle-label");
const paletteChip = document.getElementById("palette-toggle-chip");

if (list && paletteToggle && paletteDropdown && paletteLabel && paletteChip) {
  list.innerHTML = grouped(THEMES)
    .map(
      (g) => `
    <fieldset class="palette-group">
      <legend>${g.label}</legend>
      <div class="swatches">
        ${g.themes
          .map(
            (t) => `<button class="swatch" type="button" data-theme="${t.id}">
              <span class="swatch-page" aria-hidden="true">
                <span class="swatch-ink">Aa</span>
                <span class="swatch-dot accent"></span>
                <span class="swatch-dot second"></span>
              </span>
              <span class="swatch-name">${t.label}</span>
            </button>`,
          )
          .join("")}
      </div>
    </fieldset>`,
    )
    .join("");

  const buttons = [...list.querySelectorAll<HTMLButtonElement>("button[data-theme]")];
  let chosen = store.initial();

  const syncToggle = () => {
    const theme = THEMES.find((t) => t.id === chosen);
    paletteLabel.textContent = theme?.label ?? "Palette";
    paletteChip.dataset.theme = chosen;
  };

  const select = (id: string) => {
    chosen = store.apply(id);
    syncToggle();
  };

  const closePalette = () => {
    paletteDropdown.hidden = true;
    paletteToggle.setAttribute("aria-expanded", "false");
  };

  const openPalette = () => {
    paletteDropdown.hidden = false;
    paletteToggle.setAttribute("aria-expanded", "true");
  };

  const picker = wirePalette(list, buttons, {
    select,
    current: () => chosen,
    onEscape: () => {
      closePalette();
      paletteToggle.focus();
    },
  });

  paletteToggle.addEventListener("click", () => {
    if (paletteDropdown.hidden) openPalette();
    else closePalette();
  });

  document.addEventListener("click", (event) => {
    const target = event.target as Node;
    if (paletteDropdown.hidden || paletteDropdown.contains(target) || paletteToggle.contains(target)) return;
    closePalette();
  });

  select(chosen);
  picker.refresh();
}
