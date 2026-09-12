/**
 * Cursor-tracked tilt and glow on the project cards.
 *
 * This is delight, and delight has a right place. The frequency rule says an interaction seen
 * tens of times a day should be reduced or removed, and one seen once or twice can afford
 * something. A landing page is the second kind: most people see these cards once. The same
 * effect inside a tool that somebody opens forty times a day would be a tax, which is why it is
 * here and not in any of the tools this page links to.
 *
 * Three constraints it is built under:
 *
 * - **`transform` and `opacity` only**, so every frame stays on the compositor. Nothing here
 *   touches a property that would trigger layout or paint.
 * - **The transform is written to the element itself**, never inherited from a variable on a
 *   parent, which would recalculate styles for every child on every pointer move.
 * - **Pointer events, not mouse events**, so a touch drag does not leave a card tilted with no
 *   pointer to straighten it.
 */

const MAX_TILT = 2.2; // degrees. Enough to register as depth, not enough to notice as an effect.

/*
 * It was 6 in the first pass, which was right for a chunky playful card and wrong for this one.
 * At this scale the movement should be something you feel rather than see: the rule this page is
 * built on is precision, and a card swinging 6 degrees under the cursor is not precise.
 */

export function attachTilt(root: ParentNode = document): () => void {
  // Anyone who has asked for less motion gets none of this. Checked once at attach time and
  // again on change, because the setting can be toggled while the page is open.
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  // Listen on the card, write to the inner layer. The listener element never moves, so a fast
  // pointer cannot outrun the effect it is driving.
  const cards = [...root.querySelectorAll<HTMLElement>(".card")];
  const innerOf = (c: HTMLElement) => c.querySelector<HTMLElement>(".card-inner") ?? c;
  const cleanups: (() => void)[] = [];

  const reset = (card: HTMLElement) => {
    innerOf(card).style.removeProperty("transform");
    card.style.removeProperty("--glow-x");
    card.style.removeProperty("--glow-y");
    card.style.removeProperty("--glow");
  };

  const enable = () => {
    for (const card of cards) {
      let frame = 0;

      const onMove = (e: PointerEvent) => {
        // Coalesced into one write per frame. A pointermove can fire far more often than the
        // display refreshes, and doing the work each time is how this becomes the jank it is
        // meant to avoid.
        if (frame) return;
        frame = requestAnimationFrame(() => {
          frame = 0;
          const r = card.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          // Centre is 0.5, so this maps to -1..1 and then to degrees. Y inverted: pushing the
          // cursor up should tip the top of the card away, not toward you.
          const ry = (px - 0.5) * 2 * MAX_TILT;
          const rx = -(py - 0.5) * 2 * MAX_TILT;
          innerOf(card).style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translate3d(0, -1px, 0)`;
          card.style.setProperty("--glow-x", `${(px * 100).toFixed(1)}%`);
          card.style.setProperty("--glow-y", `${(py * 100).toFixed(1)}%`);
        });
      };

      const onEnter = () => card.style.setProperty("--glow", "1");
      const onLeave = () => {
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        reset(card);
      };

      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerenter", onEnter);
      card.addEventListener("pointerleave", onLeave);
      // A pointer that is cancelled (a touch becoming a scroll) never fires leave.
      card.addEventListener("pointercancel", onLeave);

      cleanups.push(() => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerenter", onEnter);
        card.removeEventListener("pointerleave", onLeave);
        card.removeEventListener("pointercancel", onLeave);
        onLeave();
      });
    }
  };

  const disable = () => {
    for (const c of cleanups.splice(0)) c();
    for (const card of cards) reset(card);
  };

  const sync = () => (query.matches ? disable() : enable());
  sync();
  query.addEventListener("change", sync);

  return () => {
    query.removeEventListener("change", sync);
    disable();
  };
}
