import type Lenis from 'lenis';

const desktop = matchMedia(
  '(min-width: 761px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
);
let momentum: Lenis | undefined;

function destroyMomentum() {
  window.removeEventListener('pointermove', configureMomentum);
  window.removeEventListener('wheel', configureMomentum);
  momentum?.destroy();
  momentum = undefined;
}

function yieldToInput() {
  if (momentum?.isScrolling === 'smooth') {
    momentum.stop();
    momentum.start();
  }
}

async function configureMomentum() {
  window.removeEventListener('pointermove', configureMomentum);
  window.removeEventListener('wheel', configureMomentum);
  if (!desktop.matches) return;

  try {
    const { default: Lenis } = await import('lenis');
    if (desktop.matches && !momentum) {
      momentum = new Lenis({
        autoRaf: true,
        lerp: 0.22,
        allowNestedScroll: true,
        anchors: { immediate: true },
        stopInertiaOnNavigate: true,
      });
    }
  } catch {
    // Native scrolling provides the fallback if the optional chunk is unavailable.
  }
}

function watchMomentum() {
  destroyMomentum();
  if (desktop.matches) {
    window.addEventListener('pointermove', configureMomentum, { once: true, passive: true });
    window.addEventListener('wheel', configureMomentum, { once: true, passive: true });
  }
}

desktop.addEventListener('change', watchMomentum);
window.addEventListener('keydown', yieldToInput);
window.addEventListener('pointerdown', yieldToInput);
window.addEventListener('pagehide', destroyMomentum);
window.addEventListener('pageshow', watchMomentum);
watchMomentum();
