import "./style.css";
import projects from "./projects.json";
import palettes from "./theme/palettes.json";
import { grid } from "./render";
import type { Project } from "./types";
import { createThemeStore, grouped, type Theme } from "./lib/theme";
import { attachTilt } from "./tilt";

const THEMES = palettes as Theme[];
const all = projects as Project[];

/* ---- the grid ----------------------------------------------------------------------------- */

const live = all.filter((p) => p.demo);
const rest = all.filter((p) => !p.demo);

const mount = (id: string, html: string) => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} is not in the page`);
  el.innerHTML = html;
};

mount("live-grid", grid(live));
// Continues from where the first grid stopped, so the numbers read as one list of fifteen.
mount("rest-grid", grid(rest, live.length));

// After both grids are mounted, or it finds no cards.
attachTilt();

const count = document.getElementById("counts");
if (count) count.textContent = `${all.length} projects, ${live.length} you can open right now`;

/* ---- palette ------------------------------------------------------------------------------ */

const store = createThemeStore(THEMES, "rain-lantern", "portfolio:theme");
const list = document.getElementById("palette-list");

if (list) {
  list.innerHTML = grouped(THEMES)
    .map(
      (g) => `
    <fieldset>
      <legend>${g.label}</legend>
      <div class="swatches">
        ${g.themes
          .map(
            (t) => `<button class="swatch" type="button" data-theme="${t.id}" aria-pressed="false">
              <span class="swatch-chip" aria-hidden="true"></span>
              <span class="swatch-name">${t.label}</span>
            </button>`,
          )
          .join("")}
      </div>
    </fieldset>`,
    )
    .join("");

  const buttons = [...list.querySelectorAll<HTMLButtonElement>("button[data-theme]")];
  const select = (id: string) => {
    const applied = store.apply(id);
    for (const b of buttons) b.setAttribute("aria-pressed", String(b.dataset.theme === applied));
  };
  for (const b of buttons) b.addEventListener("click", () => b.dataset.theme && select(b.dataset.theme));
  select(store.initial());
}
