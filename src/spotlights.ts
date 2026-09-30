import { esc } from "./render";

type Spotlight = {
  name: string;
  eyebrow: string;
  summary: string;
  stack: string;
  demo: string;
  repo: string;
  decisions: string[];
};

const SPOTLIGHTS: Spotlight[] = [
  {
    name: "Ariadne",
    eyebrow: "Evidence-aware search",
    summary:
      "A public-username footprint tool that keeps verified matches separate from plausible pages instead of turning every response into a confident yes or no.",
    stack: "React 19 · TypeScript · Vite · Cloudflare Workers",
    demo: "https://ariadne.rlawoals0529.workers.dev",
    repo: "https://github.com/rlawoals0529/Ariadne",
    decisions: [
      "Exact first-party adapters and broad profile checks are presented as different confidence tiers.",
      "Friend comparison keeps Found separate from Maybe, so overlap is not inflated by uncertain pages.",
      "Credentialed integrations stay server-side, and searches/comparisons are not stored by Ariadne.",
    ],
  },
  {
    name: "FantasyStats",
    eyebrow: "Data product",
    summary:
      "Fantasy football as probability instead of a single projection. The project started by testing whether a model could beat a simple season-average baseline.",
    stack: "TypeScript · nflverse data · Sleeper identifiers",
    demo: "https://fantasystats.rlawoals0529.workers.dev",
    repo: "https://github.com/rlawoals0529/FantasyStats",
    decisions: [
      "When the model did not beat the baseline, the product stopped selling the projection and focused on uncertainty instead.",
      "Players are shown as distributions and the interface avoids ranking players it cannot meaningfully separate.",
      "A scorecard grades prior claims against what actually happened rather than hiding misses.",
    ],
  },
  {
    name: "sidereal",
    eyebrow: "Real-time visualization",
    summary:
      "A live night sky where every visible event traces back to measured data: Wikipedia edits, earthquakes, the ISS, NOAA aurora forecasts, and other connected viewers.",
    stack: "Cloudflare Workers · Durable Objects · WebSockets · WebGL",
    demo: "https://sidereal.rlawoals0529.workers.dev",
    repo: "https://github.com/rlawoals0529/sidereal",
    decisions: [
      "The renderer has a hard rule: nothing appears without a backing event.",
      "Wikipedia edits do not expose editor coordinates, so the UI labels the regional approximation instead of pretending it is precise.",
      "The sky rotates at the real sidereal rate while a Durable Object holds the shared room over WebSockets.",
    ],
  },
  {
    name: "shelfwear",
    eyebrow: "Privacy + product",
    summary:
      "A Steam-library analyzer with two deliberately different data paths: local files for maximum privacy and a public-profile mode for easy sharing.",
    stack: "TypeScript · React · Vite · Cloudflare Workers",
    demo: "https://shelfwear.rlawoals0529.workers.dev",
    repo: "https://github.com/rlawoals0529/shelfwear",
    decisions: [
      "Local Steam files are parsed in-browser and are not uploaded.",
      "Public-profile mode keeps the Steam API key server-side and does not persist imported libraries.",
      "Shareable 3×3 cards and library comparisons stay stateless rather than requiring accounts.",
    ],
  },
];

export function renderSpotlights(): string {
  return SPOTLIGHTS.map(
    (project, index) => `
      <article class="spotlight-card">
        <div class="spotlight-topline">
          <span class="spotlight-number">${String(index + 1).padStart(2, "0")}</span>
          <span class="spotlight-eyebrow">${esc(project.eyebrow)}</span>
        </div>
        <h3>${esc(project.name)}</h3>
        <p class="spotlight-summary">${esc(project.summary)}</p>
        <p class="spotlight-stack">${esc(project.stack)}</p>
        <details class="spotlight-details">
          <summary>Why this one is interesting</summary>
          <ul>
            ${project.decisions.map((decision) => `<li>${esc(decision)}</li>`).join("")}
          </ul>
        </details>
        <div class="spotlight-actions">
          <a href="${esc(project.demo)}">Open project <span aria-hidden="true">↗</span></a>
          <a href="${esc(project.repo)}">Source <span aria-hidden="true">↗</span></a>
        </div>
      </article>`,
  ).join("");
}
