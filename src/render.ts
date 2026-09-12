import type { Project } from "./types";

/** Escape everything that reaches innerHTML. The data is mine, but it comes off an API. */
export const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * One card.
 *
 * The title carries the only stretched link, so the whole card is one hit target with one
 * accessible name. Adding a second stretched link would make the card ambiguous to anything
 * that is not a mouse, and adding none would leave a 21rem target that does nothing.
 *
 * Which link that is depends on what exists: a live demo if there is one, because that is what
 * someone wants from a portfolio, and the repository otherwise.
 */
export function card(p: Project): string {
  const primary = p.demo ?? p.repo;
  const primaryLabel = p.demo ? `${p.name}, open the live demo` : `${p.name} on GitHub`;

  const chips = [
    p.language ? `<span class="chip lang">${esc(p.language)}</span>` : "",
    ...p.topics.map((t) => `<span class="chip">${esc(t)}</span>`),
  ].join("");

  return `
<article class="card">
  <!--
    The tilt goes on this inner layer, not on the article. A rotated element can rotate out
    from under the cursor near its own edges, firing pointerleave and dropping the effect; the
    article stays put, so the hit area and the stretched link never move.
  -->
  <div class="card-inner">
  <div class="card-band" aria-hidden="true"></div>
  <div class="card-body">
    <h2><a href="${esc(primary)}" aria-label="${esc(primaryLabel)}">${esc(p.name)}</a></h2>
    ${p.demo ? `<span class="live">live</span>` : ""}
    <p>${esc(p.blurb)}</p>
    <div class="card-meta">${chips}</div>
    <div class="card-actions">
      ${p.demo ? `<a class="btn primary" href="${esc(p.demo)}">Open</a>` : ""}
      <a class="btn" href="${esc(p.repo)}">Code</a>
    </div>
  </div>
  </div>
</article>`;
}

export const grid = (projects: Project[]): string => projects.map(card).join("");
