import './styles/tokens.css';
import './styles/wireframe.css';
import './styles/layout.css';
import './styles/intro-trace.css';
import './styles/desktop.css';

import { DesktopController } from './components/DesktopController';
import { createFileExplorer } from './components/FileExplorerView';
import { createProjectWindow, type ProjectWindowHandle } from './components/ProjectWindowView';
import { createAboutWindow } from './components/AboutWindowView';
import { createContactWindow } from './components/ContactWindowView';
import { slugFromWindowId } from './components/ProjectModel';
import { IntroSequenceController } from './components/IntroSequenceController';
import { DeepLinkHistory, parseDeepLink } from './components/DeepLink';
import { PROJECTS } from './data/projects';
import { createDesktopTraceView } from './components/DesktopTraceView';
import { createViewportLayoutAdapter } from './components/ViewportLayoutAdapter';
import { mountPowerMenu } from './components/PowerMenu';
import { tactileAudio } from './components/TactileAudio';

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
    document.body.classList.remove('page-is-exiting', 'is-powering-off');
    resetToInitialViewport();
  });
  window.addEventListener('beforeunload', () => {
    resetToInitialViewport();
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  // Admin mode: dev build only (stripped from production), switched on by ?admin=1. The saved draft is applied
  // to the data before any window is created.
  let mountAdmin: (() => void) | null = null;
  if (import.meta.env.DEV && new URLSearchParams(window.location.search).get('admin') === '1') {
    const admin = await import('./admin');
    admin.applyAdminDraft();
    mountAdmin = admin.mountAdmin;
  }
  const layoutAdapter = createViewportLayoutAdapter();
  resetToInitialViewport();

  const powerBtn = document.getElementById('powerBtn');
  const powerMenu = document.getElementById('powerMenu');
  if (powerBtn instanceof HTMLButtonElement && powerMenu) {
    mountPowerMenu(
      { trigger: powerBtn, menu: powerMenu },
      {
        onExit(action, reduced) {
          if (action === 'shutdown' && !reduced) {
            tactileAudio.playImpulse();
            document.body.classList.add('is-powering-off');
          } else {
            document.body.classList.add('page-is-exiting');
          }
        },
        navigate(url) {
          window.location.href = url;
        },
      },
    );
  }

  const root = document.getElementById('desktop');
  const surface = document.getElementById('deskSurface');
  const icons = document.getElementById('deskIcons');
  const taskbarButtons = document.getElementById('taskbarButtons');
  const clock = document.getElementById('taskbarClock');
  const live = document.getElementById('deskLive');
  const heroSource = document.getElementById('heroSource');
  const heroInner = heroSource?.querySelector<HTMLElement>('.wf-hero-inner');
  if (!root || !surface || !icons || !taskbarButtons || !clock || !live || !heroInner) return;

  let deepLinkHistory: DeepLinkHistory | null = null;
  const projectWindows = new Map<string, ProjectWindowHandle>();
  const desktop = new DesktopController(
    { root, surface, icons, taskbarButtons, clock, live },
    {
      content: { hero: heroInner },
      deepLink: parseDeepLink(window.location.hash, PROJECTS.map((p) => p.slug)),
      onState(state) {
        deepLinkHistory?.sync(state.deepLinked);
        for (const handle of projectWindows.values()) handle.update(state);
      },
      contentFor(id, dispatch) {
        if (id === 'projects') return createFileExplorer(dispatch);
        if (id === 'about') return createAboutWindow();
        if (id === 'contact') return createContactWindow();
        const slug = slugFromWindowId(id);
        if (slug === null) return null;
        const handle = createProjectWindow(slug, dispatch);
        if (!handle) return null;
        projectWindows.set(slug, handle);
        return handle.el;
      },
    },
  );
  desktop.mount();
  mountAdmin?.();
  deepLinkHistory = new DeepLinkHistory(() => desktop.dispatch({ type: 'back' }));
  heroSource?.remove();

  const introOverlay = document.getElementById('introOverlay');
  const heroNameEl = document.getElementById('wfHeroName');
  const heroTraceSvg = document.getElementById('heroTraceSvg') as SVGElement | null;
  if (!introOverlay || !heroNameEl || !heroTraceSvg) {
    desktop.reveal();
    desktop.openDeepLink();
    return;
  }

  heroNameEl.classList.add('is-pending-intro');
  heroNameEl.classList.remove('is-materialized');
  introOverlay.style.display = 'flex';
  introOverlay.style.opacity = '1';
  introOverlay.classList.remove('is-fading');

  // The Layout lock covers the whole Desktop: it holds from handover to the trace until the hero materializes,
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

  const introController = new IntroSequenceController({
    layoutAdapter: introLayout,
    desktopTrace: createDesktopTraceView(root, () => desktop.getState().layout),
  });
  // Waits at the Boot shell prompt on every visit until the first key, click or tap. The deep-linked
  // window opens once the bloom has finished.
  introController.mount(
    introOverlay,
    () => {
      desktop.reveal();
      desktop.openDeepLink();
    },
    heroNameEl,
    heroTraceSvg,
  );
});
