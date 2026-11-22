const travelSteps = 12;
const cycle = 4200;

function drift(dot: SVGCircleElement) {
  const x = dot.cx.baseVal.value;
  const y = dot.cy.baseVal.value;
  // Adjacent dots share a current. The diagonal cut travels a little farther.
  const column = (x - 6.8) / 7.2;
  const row = (y - 17.6) / 7.2;
  const phase = Math.floor((column + 0.01) / 2) * 0.92 + row * 0.39;
  const reach = dot.r.baseVal.value < 2 ? 4.8 : 2.8 + column * 0.24;
  const start = 0.025 + column * 0.014;
  const end = 0.86 + column * 0.012;
  const home = 'translate(0px, 0px)';
  const frames: Keyframe[] = [{ offset: 0, transform: home }];
  for (let step = 0; step <= travelSteps; step++) {
    const t = step / travelSteps;
    const envelope = Math.sin(Math.PI * t) ** 2;
    const arc = t * Math.PI * 2 + phase;
    const dx = envelope * (Math.cos(arc) * reach + (column - 3.5) * 0.48);
    const dy = envelope * (Math.sin(arc) * (reach + 0.6) + (row - 2) * 0.57);
    frames.push({
      offset: start + t * (end - start),
      transform: `translate(${dx.toFixed(3)}px, ${dy.toFixed(3)}px)`,
    });
  }
  frames.push({ offset: 1, transform: home });
  return dot.animate(frames, { duration: cycle });
}

export function animateCloud(mark: HTMLElement) {
  const dots = Array.from(mark.querySelectorAll<SVGCircleElement>('svg circle'));
  if (!dots.length || !('animate' in SVGElement.prototype) || !('IntersectionObserver' in window))
    return;
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let animations: Animation[] = [];

  function driftIn() {
    if (!visible || preference.matches || document.hidden) return;
    if (animations.some((animation) => animation.playState === 'running')) return;
    animations = dots.map(drift);
  }
  function refresh() {
    if (visible && !preference.matches && !document.hidden) {
      driftIn();
    } else {
      for (const animation of animations) animation.cancel();
      animations = [];
    }
  }
  const visibility = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    refresh();
  });
  visibility.observe(mark);
  const cover = mark.closest('.family-cover');
  cover?.addEventListener('pointerenter', driftIn);
  document.addEventListener('visibilitychange', refresh);
  preference.addEventListener('change', refresh);
}
