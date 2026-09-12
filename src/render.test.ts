import { describe, expect, it } from "vitest";
import { card, esc, grid } from "./render";
import type { Project } from "./types";

const base: Project = {
  name: "thing", blurb: "does a thing", description: "", language: "TypeScript",
  topics: ["a", "b"], repo: "https://github.com/x/thing", demo: null, stars: 0, rank: 1,
};

describe("a card", () => {
  it("points its one stretched link at the demo when there is one", () => {
    const html = card({ ...base, demo: "https://demo.example/" });
    expect(html).toContain(`<a href="https://demo.example/"`);
    // Exactly one stretched link, or the card is ambiguous to anything that is not a mouse.
    expect(html.match(/<h2><a /g) ?? []).toHaveLength(1);
    expect(html).toContain("Open");
  });

  it("falls back to the repository when nothing is deployed", () => {
    const html = card(base);
    expect(html).toContain(`<a href="https://github.com/x/thing" aria-label="thing on GitHub"`);
    expect(html).not.toContain(">Open<");
  });

  it("marks a card as live only when it is", () => {
    expect(card(base)).not.toContain('class="live"');
    expect(card({ ...base, demo: "https://d/" })).toContain('class="live"');
  });

  it("escapes everything that reaches innerHTML", () => {
    const html = card({ ...base, name: `<img src=x onerror=alert(1)>`, blurb: `a "quoted" & <b>bold</b>` });
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
    expect(html).toContain("&amp;");
  });

  it("renders a project with no language and no topics rather than dropping it", () => {
    const html = card({ ...base, language: null, topics: [] });
    expect(html).toContain("thing");
    expect(html).not.toContain("chip lang");
  });
});

describe("esc", () => {
  it("covers the four characters that matter in an attribute and a text node", () => {
    expect(esc(`<>&"`)).toBe("&lt;&gt;&amp;&quot;");
  });
});

describe("the grid", () => {
  it("renders one card per project and keeps their order", () => {
    const html = grid([base, { ...base, name: "second", rank: 2 }]);
    expect(html.match(/<article/g) ?? []).toHaveLength(2);
    expect(html.indexOf("thing")).toBeLessThan(html.indexOf("second"));
  });
});
