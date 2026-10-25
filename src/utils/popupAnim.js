// popup show/hide used to rely on a nested requestAnimationFrame to flip the
// "anim" state, and the panels gated pointer-events on that state. rAF gets
// throttled or paused on locked down machines (energy saver, reduced motion,
// remote desktop, background throttling) and then the panel stays rendered but
// unclickable, so clicks land on the backdrop and close it. fire on the next
// paint but always fall back to a timer so the panel can never get stuck.
export const onNextPaint = (cb) => {
  let fired = false;
  let inner = 0;
  const run = () => {
    if (fired) return;
    fired = true;
    cb();
  };
  const outer = requestAnimationFrame(() => {
    inner = requestAnimationFrame(run);
  });
  const t = setTimeout(run, 120);
  return () => {
    clearTimeout(t);
    cancelAnimationFrame(outer);
    cancelAnimationFrame(inner);
  };
};
