import { esc } from "./render";

type Visual = "thread" | "probability" | "sky" | "shelf";

type Spotlight = {
  name: string;
  eyebrow: string;
  summary: string;
  stack: string;
  scope: string;
  problem: string;
  decisions: string[];
  takeaway: string;
  demo: string;
  repo: string;
  visual: Visual;
};

const SPOTLIGHTS: Spotlight[] = [
  {
    name: "Ariadne",
    eyebrow: "Evidence-aware search",
    summary:
      "A public-username footprint tool that keeps verified matches separate from plausible pages instead of turning every response into a confident yes or no.",
    stack: "React 19 · TypeScript · Vite · Cloudflare Workers",
    scope: "Search model · source adapters · comparison UX · Worker",
    problem:
      "Username-finding tools are useful, but broad profile checks are noisy. A page that happens to load should not automatically count as proof that the account belongs to the username being searched.",
    decisions: [
      "Separate exact first-party adapters from broad profile-page checks, and expose that distinction in the UI.",
      "Keep Found separate from Maybe when comparing friends so uncertain pages do not inflate overlap.",
      "Keep credentialed integrations server-side and avoid storing searches or comparisons.",
    ],
    takeaway:
      "This project shows how I handle uncertainty in a product: the evidence model is part of the interface, not hidden behind it.",
    demo: "https://ariadne.rlawoals0529.workers.dev",
    repo: "https://github.com/rlawoals0529/Ariadne",
    visual: "thread",
  },
  {
    name: "FantasyStats",
    eyebrow: "Data product",
    summary:
      "Fantasy football as probability instead of a single projection. The project started by testing whether a model could beat a simple season-average baseline.",
    stack: "TypeScript · nflverse data · Sleeper identifiers",
    scope: "Model evaluation · probability UX · data pipeline · scorecard",
    problem:
      "Weekly fantasy scores are noisy enough that a confident-looking point projection can imply precision the data does not support.",
    decisions: [
      "Benchmark the model against a simple season-average baseline before deciding what the product should promise.",
      "When the model did not beat that baseline, make uncertainty and distributions the product instead of hiding the result.",
      "Grade prior claims with a scorecard so the product has to account for what actually happened.",
    ],
    takeaway:
      "The interesting part is not a model score; it is the product decision that came after the evaluation result.",
    demo: "https://fantasystats.rlawoals0529.workers.dev",
    repo: "https://github.com/rlawoals0529/FantasyStats",
    visual: "probability",
  },
  {
    name: "sidereal",
    eyebrow: "Real-time visualization",
    summary:
      "A live night sky where every visible event traces back to measured data: Wikipedia edits, earthquakes, the ISS, NOAA aurora forecasts, and other connected viewers.",
    stack: "Cloudflare Workers · Durable Objects · WebSockets · WebGL",
    scope: "Realtime feeds · provenance rules · WebGL · shared presence",
    problem:
      "A real-time visualization gets less trustworthy when decorative effects are visually indistinguishable from actual events.",
    decisions: [
      "Make 'every light traces to a measured event' a renderer rule rather than just a design intention.",
      "Label the regional approximation used for Wikipedia edits instead of inventing a precise editor location.",
      "Use the real sidereal rotation rate and a Durable Object-backed shared room for live presence.",
    ],
    takeaway:
      "This is a visual project, but the main design constraint is provenance: motion and decoration have to mean something.",
    demo: "https://sidereal.rlawoals0529.workers.dev",
    repo: "https://github.com/rlawoals0529/sidereal",
    visual: "sky",
  },
  {
    name: "shelfwear",
    eyebrow: "Privacy + product",
    summary:
      "A Steam-library analyzer with two deliberately different data paths: local files for maximum privacy and a public-profile mode for easy sharing.",
    stack: "TypeScript · React · Vite · Cloudflare Workers",
    scope: "Local parsing · privacy boundaries · sharing UX · Worker API",
    problem:
      "The easiest way to analyze a game library is not necessarily the most private, and Steam's local files and public API expose different kinds of information.",
    decisions: [
      "Parse local Steam files in-browser so private local data does not need to be uploaded.",
      "Keep the Steam API key server-side for public-profile mode and do not persist imported libraries.",
      "Make share cards and comparisons stateless so the social layer does not require user accounts.",
    ],
    takeaway:
      "The product is intentionally shaped around what each data source is allowed to know, rather than pretending the two modes are equivalent.",
    demo: "https://shelfwear.rlawoals0529.workers.dev",
    repo: "https://github.com/rlawoals0529/shelfwear",
    visual: "shelf",
  },
];

function visualMarkup(visual: Visual): string {
  if (visual === "thread") {
    return `
      <div class="case-visual case-thread" aria-hidden="true">
        <span class="thread-line line-a"></span>
        <span class="thread-line line-b"></span>
        <span class="thread-node node-a">Found</span>
        <span class="thread-node node-b">Maybe</span>
        <span class="thread-node node-c">Exact</span>
        <span class="thread-node node-d">?</span>
      </div>`;
  }

  if (visual === "probability") {
    return `
      <div class="case-visual case-probability" aria-hidden="true">
        <span class="prob-baseline"></span>
        <span class="prob-bar p1"></span><span class="prob-bar p2"></span><span class="prob-bar p3"></span>
        <span class="prob-bar p4"></span><span class="prob-bar p5"></span><span class="prob-bar p6"></span>
        <span class="prob-label">distribution, not a guess</span>
      </div>`;
  }

  if (visual === "sky") {
    return `
      <div class="case-visual case-sky" aria-hidden="true">
        <span class="sky-orbit orbit-one"></span>
        <span class="sky-orbit orbit-two"></span>
        <span class="sky-star s1"></span><span class="sky-star s2"></span><span class="sky-star s3"></span>
        <span class="sky-star s4"></span><span class="sky-star s5"></span><span class="sky-star s6"></span>
        <span class="sky-object">ISS</span>
      </div>`;
  }

  return `
    <div class="case-visual case-shelf" aria-hidden="true">
      <span class="shelf-line"></span>
      <span class="game-spine g1"></span><span class="game-spine g2"></span><span class="game-spine g3"></span>
      <span class="game-spine g4"></span><span class="game-spine g5"></span><span class="game-spine g6"></span>
      <span class="shelf-note">local / public</span>
    </div>`;
}

export function renderSpotlights(): string {
  return SPOTLIGHTS.map(
    (project, index) => {
      const caseId = `case-${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "")}`;
      return `
      <article id="${caseId}" class="spotlight-card ${index === 0 ? "spotlight-lead" : ""}" data-case="${esc(project.visual)}">
        <div class="spotlight-copy">
          <div class="spotlight-topline">
            <span class="spotlight-number">${String(index + 1).padStart(2, "0")}</span>
            <span class="spotlight-eyebrow">${esc(project.eyebrow)}</span>
          </div>
          <h3>${esc(project.name)}</h3>
          <p class="spotlight-summary">${esc(project.summary)}</p>
          <p class="spotlight-scope"><span>Built across</span> ${esc(project.scope)}</p>
          <p class="spotlight-stack">${esc(project.stack)}</p>
        </div>

        ${visualMarkup(project.visual)}

        <details class="spotlight-details">
          <summary>Open case notes <span aria-hidden="true">↘</span></summary>
          <div class="case-notes">
            <section>
              <span class="case-label">Problem</span>
              <p>${esc(project.problem)}</p>
            </section>
            <section>
              <span class="case-label">Key decisions</span>
              <ul>
                ${project.decisions.map((decision) => `<li>${esc(decision)}</li>`).join("")}
              </ul>
            </section>
            <section class="case-takeaway">
              <span class="case-label">What this demonstrates</span>
              <p>${esc(project.takeaway)}</p>
            </section>
          </div>
        </details>

        <div class="spotlight-actions">
          <a href="${esc(project.demo)}">Open project <span aria-hidden="true">↗</span></a>
          <a href="${esc(project.repo)}">Source <span aria-hidden="true">↗</span></a>
        </div>
      </article>`;
    },
  ).join("");
}
