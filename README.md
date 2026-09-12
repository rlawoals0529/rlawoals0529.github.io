# rlawoals0529.github.io

The landing page for everything I have built. A level-select screen: one card per project, the
eight you can open marked as such, and a button that opens them.

**[rlawoals0529.github.io](https://rlawoals0529.github.io)**

## The list is not hand-kept

`src/projects.json` is a cache of the GitHub API, refreshed by `npm run refresh-projects` and on
a weekly schedule in CI. Hand-maintaining it is how a portfolio ends up linking to a repository
that went private, or missing one that went public.

Two things are not taken from the API, because it does not know them: the order, which is a
judgement, and the one line under each title, which is written rather than generated. Both live
in `CURATED` in `scripts/refresh.mjs`. A repository with no entry still renders, at the end,
using its GitHub description, because dropping it silently is the worse failure.

The refresh **refuses to shrink the list**. A 403 that returns an empty array would otherwise
delete the thing this script exists to maintain.

## The look

Thick borders, a hard offset shadow with no blur, and a press that moves the control onto its own
shadow so it visibly sinks. Blur reads as elevation; offset reads as a physical edge, and this
wants the second one.

Cards lift on hover by translating, never by scaling. Scaling a card blurs its text mid-transition
and nudges its neighbours; `transform` is composited and touches nothing else. The entrance is
scroll-driven, guarded by `@supports` so a browser without view timelines never leaves a card at
`opacity: 0`, and by `prefers-reduced-motion` because fifteen things sliding in is a lot.

Colours are [yozora](https://github.com/rlawoals0529/yozora), all fifteen palettes, switched by
one attribute on the root element.

## What the audit changed

Contrast was measured across every palette rather than eyeballed in one, and it found two real
problems:

- **The card copy was on `--dim`**, a metadata colour. At 14.7px it needs 4.5:1 and it was landing
  between 2.4 and 4.4 in **thirteen of the fifteen palettes**. It is on `--fg` now, because that
  line is the card's whole argument rather than an aside. Lowest ratio went from 2.37 to 13.71.
- **The accent word in the title** measured 2.1:1 on one palette and 2.3:1 on another, under the
  3:1 that even display type needs. The colour moved to a bar underneath the word, where it is
  decoration and nothing has to be read off it.

`e2e/site.spec.ts` pins both, walking all fifteen palettes.

## Run it

```bash
npm install
npm run dev
npm test              # the card renderer and the theme store
npm run e2e           # 8 in a real browser
npm run refresh-projects
```

One of the browser tests fetches every live demo link and fails on a dead one, so a project that
stops deploying is caught here rather than by somebody clicking it.

MIT © James Kim
