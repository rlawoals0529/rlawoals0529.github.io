#!/usr/bin/env node
/**
 * Rebuild `src/projects.json` from what is actually public on GitHub.
 *
 * Hand-maintaining this list is how a portfolio ends up linking to a repository that went
 * private, or missing one that went public. The API is the truth; this file is a cache of it,
 * committed so the site builds without a token and renders identically offline.
 *
 * Presentation details that GitHub does not know (order, portfolio blurb, and occasional
 * deployment/topic overrides) live in CURATED below, keyed by repo name. A repo with no
 * entry still renders at the end using its GitHub metadata. Silence is better than dropping it.
 */
import { readFileSync, writeFileSync } from "node:fs";

const USER = "rlawoals0529";

/** Rank, and the line that says why it is worth a click. Lower rank shows first. */
const CURATED = {
  Ariadne:    { rank: 1, blurb: "Follow a username across the public web without pretending every page response is proof.", description: "Evidence-aware public username search with explicit confidence and provenance.", demo: "https://ariadne.rlawoals0529.workers.dev", topics: ["public-web", "evidence", "cloudflare-workers", "react"] },
  FantasyStats: { rank: 2, blurb: "Fantasy football as odds. It does not sell you a projection, because a projection does not beat a season average, and it says so on the page." },
  sidereal:   { rank: 3, blurb: "A night sky you leave open while you work. Meteors are Wikipedia edits, the rings are earthquakes, and nothing in it is decorative." },
  shelfwear:  { rank: 4, blurb: "Reads the files Steam already wrote to tell you what you bought and never launched.", demo: "https://shelfwear.rlawoals0529.workers.dev" },
  secondread: { rank: 5, blurb: "Six checks over a real syntax tree. It asks the questions a reviewer would, and says what it cannot answer itself." },
  notepad:    { rank: 6, blurb: "A language for the back of an envelope. Units, money and dates, each line worked out in the margin." },
  "pc-audit": { rank: 7, blurb: "Reads what Windows already measured about itself, and prints \"not measured\" where the rest of the genre guesses." },
  discern:    { rank: 8, blurb: "Wilson intervals and paired McNemar, so two eval runs are not called apart when the difference is noise." },
  depgraph:   { rank: 9, blurb: "One recursive CTE walks the whole npm graph, so a package reachable forty ways is still counted once." },
  decoder:    { rank: 10, blurb: "Paste a token, a hash, a timestamp. It names it, opens it, and keeps opening what it finds inside." },
  tokenview:  { rank: 11, blurb: "Watch a sentence break into the pieces a model reads, then watch its meaning land on a map." },
  hikari:     { rank: 12, blurb: "Desktop widgets that are a folder and two files. A capability has to be asked for, and is refused by default." },
  yozora:     { rank: 13, blurb: "Fifteen palettes, a type scale and the texture rules, as one small system every page here runs on." },
  "skill-radar": { rank: 14, blurb: "Which agent skill actually fires for a given sentence, and which two are quietly competing." },
  "streaming-markdown": { rank: 15, blurb: "Trim a half-arrived markdown frame to the longest valid prefix, so nothing has to be un-rendered." },
  pane:       { rank: 16, blurb: "Drive a Chrome tab from a script. Caching off, fonts waited for, clips clamped, frames matched." },
  "neon-bar": { rank: 17, blurb: "A status bar for Windows, on fifteen palettes. Opaque, because a see-through bar is one a grey wallpaper can erase." },
  "skill-lint": { rank: 18, blurb: "Broken references, colliding triggers and context bloat in an agent's SKILL.md." },
  "agent-skills": { rank: 19, blurb: "The skills themselves, each one written because a specific failure kept happening." },
};
const HIDDEN_PROJECTS = new Set(["streaming-markdown", "arc-agi-3-agent"]);

const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
const res = await fetch(`https://api.github.com/users/${USER}/repos?per_page=100&sort=pushed`, {
  headers: { accept: "application/vnd.github+json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
});
if (!res.ok) {
  // Loud. A generator that writes an empty list on a 403 deletes the thing it maintains.
  console.error(`GitHub returned ${res.status}`);
  process.exit(1);
}

const repos = (await res.json())
  .filter((r) => !r.fork && !r.archived && !r.private && r.name !== USER && r.name !== `${USER}.github.io`);

if (repos.length === 0) {
  console.error("no public repositories came back, which cannot be right");
  process.exit(1);
}

const projects = repos
  .filter((r) => !HIDDEN_PROJECTS.has(r.name.toLowerCase()))
  .map((r) => {
    const curated = CURATED[r.name];
    return {
      name: r.name,
      blurb: curated?.blurb ?? r.description ?? "",
      description: curated?.description ?? r.description ?? "",
      language: r.language ?? null,
      topics: curated?.topics ?? (r.topics ?? []).slice(0, 4),
      repo: r.html_url,
      // Curated overrides cover live deployments that are intentionally not set as the repo homepage.
      demo: curated?.demo ?? (r.homepage && r.homepage.trim() !== "" ? r.homepage : null),
      stars: r.stargazers_count,
      rank: curated?.rank ?? 900,
    };
  })
  .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

const before = JSON.parse(readFileSync("src/projects.json", "utf8") ?? "[]");
if (projects.length < before.length) {
  console.error(`refusing to shrink the list from ${before.length} to ${projects.length}`);
  console.error("if a repository really did go private, delete it from src/projects.json by hand");
  process.exit(1);
}

writeFileSync("src/projects.json", JSON.stringify(projects, null, 2) + "\n");
console.log(`${projects.length} projects, ${projects.filter((p) => p.demo).length} with a live demo`);
for (const p of projects) if (!CURATED[p.name]) console.log(`  no blurb written for ${p.name}, using its GitHub description`);
