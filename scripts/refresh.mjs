#!/usr/bin/env node
/**
 * Rebuild `src/projects.json` from what is actually public on GitHub.
 *
 * Hand-maintaining this list is how a portfolio ends up linking to a repository that went
 * private, or missing one that went public. The API is the truth; this file is a cache of it,
 * committed so the site builds without a token and renders identically offline.
 *
 * Two things are NOT taken from the API, because it does not know them:
 *   order  - how much each project is worth showing, which is a judgement
 *   blurb  - the one line under the title, which is written rather than generated
 * Both live in CURATED below, keyed by repo name. A repo with no entry still renders, at the
 * end, using its GitHub description. Silence is better than dropping it.
 */
import { readFileSync, writeFileSync } from "node:fs";

const USER = "rlawoals0529";

/** Rank, and the line that says why it is worth a click. Lower rank shows first. */
const CURATED = {
  secondread: { rank: 1, blurb: "Six checks over a real syntax tree. It asks the questions a reviewer would, and says what it cannot answer itself." },
  notepad:    { rank: 2, blurb: "A language for the back of an envelope. Units, money and dates, each line worked out in the margin." },
  discern:    { rank: 3, blurb: "Wilson intervals and paired McNemar, so two eval runs are not called apart when the difference is noise." },
  depgraph:   { rank: 4, blurb: "One recursive CTE walks the whole npm graph, so a package reachable forty ways is still counted once." },
  decoder:    { rank: 5, blurb: "Paste a token, a hash, a timestamp. It names it, opens it, and keeps opening what it finds inside." },
  tokenview:  { rank: 6, blurb: "Watch a sentence break into the pieces a model reads, then watch its meaning land on a map." },
  hikari:     { rank: 7, blurb: "Desktop widgets that are a folder and two files. A capability has to be asked for, and is refused by default." },
  yozora:     { rank: 8, blurb: "Fifteen palettes, a type scale and the texture rules, as one small system every page here runs on." },
  "skill-radar": { rank: 9, blurb: "Which agent skill actually fires for a given sentence, and which two are quietly competing." },
  shelfwear:  { rank: 10, blurb: "Reads the files Steam already wrote to tell you what you bought and never launched." },
  "streaming-markdown": { rank: 11, blurb: "Trim a half-arrived markdown frame to the longest valid prefix, so nothing has to be un-rendered." },
  pane:       { rank: 12, blurb: "Drive a Chrome tab from a script. Caching off, fonts waited for, clips clamped, frames matched." },
  "neon-bar": { rank: 13, blurb: "A status bar for Windows that reskins from one accent colour." },
  "skill-lint": { rank: 14, blurb: "Broken references, colliding triggers and context bloat in an agent's SKILL.md." },
  "agent-skills": { rank: 15, blurb: "The skills themselves, each one written because a specific failure kept happening." },
};

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
  .map((r) => {
    const curated = CURATED[r.name];
    return {
      name: r.name,
      blurb: curated?.blurb ?? r.description ?? "",
      description: r.description ?? "",
      language: r.language ?? null,
      topics: (r.topics ?? []).slice(0, 4),
      repo: r.html_url,
      // A homepage is a live thing you can open. Treat an empty string as absent.
      demo: r.homepage && r.homepage.trim() !== "" ? r.homepage : null,
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
