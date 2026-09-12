import "./style.css";
import projects from "./projects.json";
import palettes from "./theme/palettes.json";
import { grid } from "./render";
import type { Project } from "./types";
import { createThemeStore, grouped, type Theme } from "./lib/theme";
import { wirePalette } from "./lib/palette-keys";
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

const store = createThemeStore(THEMES, "twilight-comet", "portfolio:theme");
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
            (t) => `<button class="swatch" type="button" data-theme="${t.id}">
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
  let chosen = store.initial();
  const select = (id: string) => {
    chosen = store.apply(id);
  };
  /*
   * One tab stop and the arrow keys, from the same helper the React picker's behaviour lives
   * in. Fifteen swatches were fifteen tab stops, and trying one was a one-way door: there was
   * no way to look through them and keep the palette you came in with.
   *
   * The look stays this page's own. Only the keys are shared.
   */
  wirePalette(list, buttons, { select, current: () => chosen });
  select(chosen);
}
