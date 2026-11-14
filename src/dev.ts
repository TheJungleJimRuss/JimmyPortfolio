import './styles/tokens.css';
import './styles/wireframe.css';
import './styles/layout.css';
import './styles/intro-trace.css';
import './styles/desktop.css';

import { DesktopController } from './components/DesktopController';
import { IntroSequenceController } from './components/IntroSequenceController';
import { createViewportLayoutAdapter } from './components/ViewportLayoutAdapter';

// Enforce manual scroll restoration so reloading always starts at the top
if (typeof window !== 'undefined' && 'scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function resetToInitialViewport(): void {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }
}

resetToInitialViewport();

if (typeof window !== 'undefined') {
  window.addEventListener('pageshow', () => {
    document.body.classList.remove('page-is-exiting');
    resetToInitialViewport();
  });
  window.addEventListener('beforeunload', () => {
    resetToInitialViewport();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const layoutAdapter = createViewportLayoutAdapter();
  resetToInitialViewport();

  document.getElementById('navGatewayBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.body.classList.add('page-is-exiting');
    setTimeout(() => {
      window.location.href = './index.html';
    }, 160);
  });

  const root = document.getElementById('desktop');
  const surface = document.getElementById('deskSurface');
  const icons = document.getElementById('deskIcons');
  const taskbarButtons = document.getElementById('taskbarButtons');
  const clock = document.getElementById('taskbarClock');
  const live = document.getElementById('deskLive');
  const heroSource = document.getElementById('heroSource');
  const heroInner = heroSource?.querySelector<HTMLElement>('.wf-hero-inner');
  if (!root || !surface || !icons || !taskbarButtons || !clock || !live || !heroInner) return;

  const desktop = new DesktopController(
    { root, surface, icons, taskbarButtons, clock, live },
    { content: { hero: heroInner } },
  );
  desktop.mount();
  heroSource?.remove();

  const introOverlay = document.getElementById('introOverlay');
  const heroNameEl = document.getElementById('wfHeroName');
  const heroTraceSvg = document.getElementById('heroTraceSvg') as SVGElement | null;
  if (!introOverlay || !heroNameEl || !heroTraceSvg) {
    desktop.reveal();
    return;
  }

  heroNameEl.classList.add('is-pending-intro');
  heroNameEl.classList.remove('is-materialized');
  introOverlay.style.display = 'flex';
  introOverlay.style.opacity = '1';
  introOverlay.classList.remove('is-fading');

  const promptWrap = introOverlay.querySelector<HTMLElement>('.intro-prompt-wrap');
  if (promptWrap) promptWrap.style.display = 'none';
  const terminalLog = introOverlay.querySelector<HTMLElement>('.intro-terminal-log');
  if (terminalLog) {
    terminalLog.innerHTML = '';
    terminalLog.classList.remove('is-active');
  }

  // The Layout lock covers the whole Desktop: it holds from trace start until the hero materializes,
  // and the Desktop becomes visible at that moment.
  const introLayout = {
    get decision() {
      return layoutAdapter.decision;
    },
    lock() {
      layoutAdapter.lock();
      desktop.lock();
    },
    release() {
      const layout = layoutAdapter.release();
      desktop.release();
      desktop.reveal();
      return layout;
    },
  };

  const introController = new IntroSequenceController({ layoutAdapter: introLayout });
  introController.mount(introOverlay, () => desktop.reveal(), heroNameEl, heroTraceSvg);
  void introController.triggerSequence();
});
