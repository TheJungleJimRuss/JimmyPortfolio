import './styles/tokens.css';
import './styles/wireframe.css';
import './styles/layout.css';
import './styles/intro-trace.css';
import './styles/scroll-animations.css';

import { IntroSequenceController } from './components/IntroSequenceController';

interface ProjectDetailData {
  id: string;
  title: string;
  category: string;
  summary: string;
  stageHint: string;
  controlsHint: string;
  specs: { label: string; value: string }[];
  repoUrl: string;
}

const projectDetails: Record<string, ProjectDetailData> = {
  'kinematic-controller': {
    id: 'kinematic-controller',
    title: 'Kinematic Character Controller',
    category: 'Unity 6 • C# Kinematics',
    summary:
      '[ Kinematic Character Controller Summary Placeholder — Custom collide-and-slide movement motor in Unity 6 solving slope sliding, step snapping, and wall deflection without Rigidbody jitter ]',
    stageHint: 'Interactive 16:9 Unity WebGL Simulation Viewport',
    controlsHint: 'Controls: WASD to move • Space to jump • Click to deflect',
    specs: [
      { label: 'Algorithm', value: 'Collide & Slide' },
      { label: 'Engine', value: 'Unity 6 / C#' },
      { label: 'Allocations', value: 'Zero-GC Loops' },
    ],
    repoUrl: 'https://github.com/TheJungleJimRuss/Kinematic-Unity-Character-Controller',
  },
  'drone-desktop': {
    id: 'drone-desktop',
    title: 'Drone Desktop',
    category: 'TypeScript • Electron • React',
    summary:
      '[ Drone Desktop Summary Placeholder — Desktop ground control station and telemetry operations hub for flight mission monitoring, live sensor logging, and airframe diagnostics ]',
    stageHint: 'Desktop GCS Interface & Flight Telemetry Viewport',
    controlsHint: 'Interactive flight instrument gauges & mission logs',
    specs: [
      { label: 'Platform', value: 'Electron / Node.js' },
      { label: 'State Model', value: 'Deterministic FSM' },
      { label: 'Latency', value: '< 8ms Response' },
    ],
    repoUrl: 'https://github.com/TheJungleJimRuss/DronePilotApp',
  },
  'photography-portfolio': {
    id: 'photography-portfolio',
    title: 'Photography Portfolio',
    category: 'Modern Web • Canvas • Visuals',
    summary:
      '[ Photography Portfolio Summary Placeholder — High-resolution imagery showcase with EXIF telemetry extraction, pan-and-zoom inspection, and responsive masonry gallery ]',
    stageHint: 'High-Bitrate Media Viewport & Lightbox Inspection',
    controlsHint: 'Pan & zoom inspection with metadata overlays',
    specs: [
      { label: 'Color Space', value: 'OKLCH Perceptual' },
      { label: 'Performance', value: '60+ FPS Viewport' },
      { label: 'Layout Shift', value: '0.000 CLS' },
    ],
    repoUrl: 'https://github.com/TheJungleJimRuss/Photography-Portfolio',
  },
  'music-studio': {
    id: 'music-studio',
    title: 'Music Studio Website',
    category: 'Web Audio API • Interactive Audio',
    summary:
      '[ Music Studio Website Summary Placeholder — Interactive studio production environment featuring real-time audio playback, visual waveform monitoring, and session booking ]',
    stageHint: 'Interactive Audio Console & Waveform Viewport',
    controlsHint: 'Click to play stems • Drag faders to mix',
    specs: [
      { label: 'Audio Engine', value: 'Web Audio API' },
      { label: 'DSP Latency', value: 'Low Buffer Realtime' },
      { label: 'Visualizer', value: 'FFT Spectrum / Canvas' },
    ],
    repoUrl: 'https://github.com/TheJungleJimRuss',
  },
};

projectDetails['telemetry-ops-app'] = projectDetails['drone-desktop'];
projectDetails['spatial-media-engine'] = projectDetails['photography-portfolio'];

document.addEventListener('DOMContentLoaded', () => {
  const viewOverview = document.getElementById('viewOverview');
  const viewDetail = document.getElementById('viewDetail');
  const backBtn = document.getElementById('backToOverviewBtn');
  const introOverlay = document.getElementById('introOverlay');
  const heroNameEl = document.getElementById('wfHeroName');
  const heroTraceSvg = document.getElementById('heroTraceSvg') as SVGElement | null;

  // Run terminal and laser outline trace boot on entry
  if (introOverlay && heroNameEl && heroTraceSvg) {
    heroNameEl.classList.add('is-pending-intro');
    heroNameEl.classList.remove('is-materialized');
    introOverlay.style.display = 'flex';
    introOverlay.style.opacity = '1';
    introOverlay.classList.remove('is-fading');

    const promptWrap = introOverlay.querySelector('.intro-prompt-wrap') as HTMLElement | null;
    if (promptWrap) promptWrap.style.display = 'none';

    const terminalLog = introOverlay.querySelector('.intro-terminal-log') as HTMLElement | null;
    if (terminalLog) {
      terminalLog.innerHTML = '';
      terminalLog.classList.remove('is-active');
    }

    const introController = new IntroSequenceController();
    introController.mount(
      introOverlay,
      () => {
        // Complete: hero fully materialized into view
      },
      heroNameEl,
      heroTraceSvg
    );
    void introController.triggerSequence();
  }

  const detailTitle = document.getElementById('detailTitle');
  const detailSummary = document.getElementById('detailSummary');
  const detailBadge = document.getElementById('detailBadge');
  const detailControlsHint = document.getElementById('detailControlsHint');
  const detailSpecList = document.getElementById('detailSpecList');
  const detailRepoLink = document.getElementById('detailRepoLink') as HTMLAnchorElement | null;
  const detailViewportHint = document.getElementById('detailViewportHint');

  let lastActiveCard: HTMLElement | null = null;

  function populateDetail(projectId: string) {
    const data = projectDetails[projectId] || projectDetails['kinematic-controller'];
    if (detailTitle) detailTitle.textContent = data.title;
    if (detailSummary) detailSummary.textContent = data.summary;
    if (detailBadge) detailBadge.textContent = data.category;
    if (detailControlsHint) detailControlsHint.textContent = data.controlsHint;
    if (detailViewportHint) detailViewportHint.textContent = `[ ${data.stageHint} ]`;

    if (detailSpecList) {
      detailSpecList.innerHTML = data.specs
        .map((s) => `<li><span>${s.label}</span> <strong>${s.value}</strong></li>`)
        .join('');
    }

    if (detailRepoLink) {
      detailRepoLink.href = data.repoUrl;
    }
  }

  function showProjectDetail(projectId: string, clickedCard: HTMLElement | null) {
    lastActiveCard = clickedCard;

    const thumb = clickedCard?.querySelector('.wf-project-thumb');
    const title = clickedCard?.querySelector('.wf-project-title');
    const detailViewport = document.getElementById('detailViewport');

    thumb?.classList.add('is-transitioning');
    title?.classList.add('is-transitioning');
    detailViewport?.classList.add('is-transitioning');
    detailTitle?.classList.add('is-transitioning');

    const updateDOM = () => {
      populateDetail(projectId);
      if (viewOverview) viewOverview.hidden = true;
      if (viewDetail) viewDetail.hidden = false;
      window.scrollTo(0, 0);
    };

    if (!document.startViewTransition) {
      updateDOM();
      detailTitle?.focus();
      return;
    }

    const transition = document.startViewTransition(updateDOM);

    transition.finished.finally(() => {
      thumb?.classList.remove('is-transitioning');
      title?.classList.remove('is-transitioning');
      detailViewport?.classList.remove('is-transitioning');
      detailTitle?.classList.remove('is-transitioning');
      detailTitle?.focus();
    });
  }

  function showOverview() {
    const detailViewport = document.getElementById('detailViewport');
    const thumb = lastActiveCard?.querySelector('.wf-project-thumb');

    detailViewport?.classList.add('is-transitioning');
    thumb?.classList.add('is-transitioning');

    const updateDOM = () => {
      if (viewDetail) viewDetail.hidden = true;
      if (viewOverview) viewOverview.hidden = false;
    };

    if (!document.startViewTransition) {
      updateDOM();
      lastActiveCard?.focus();
      return;
    }

    const transition = document.startViewTransition(updateDOM);

    transition.finished.finally(() => {
      detailViewport?.classList.remove('is-transitioning');
      thumb?.classList.remove('is-transitioning');
      lastActiveCard?.scrollIntoView({ block: 'center' });
      lastActiveCard?.focus();
    });
  }

  document.querySelectorAll<HTMLElement>('.wf-project-card').forEach((card) => {
    card.addEventListener('click', () => {
      const id = card.getAttribute('data-project-id') || 'kinematic-controller';
      history.pushState({ projectId: id }, '', `#project/${id}`);
      showProjectDetail(id, card);
    });
  });

  backBtn?.addEventListener('click', () => {
    history.pushState(null, '', window.location.pathname);
    showOverview();
  });

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.projectId) {
      showProjectDetail(e.state.projectId, null);
    } else if (window.location.hash.startsWith('#project/')) {
      const id = window.location.hash.replace('#project/', '');
      showProjectDetail(id, null);
    } else {
      showOverview();
    }
  });

  if (window.location.hash.startsWith('#project/')) {
    const id = window.location.hash.replace('#project/', '');
    showProjectDetail(id, null);
  }

  const copyBtn = document.getElementById('copyEmailBtn');
  const copyToast = document.getElementById('copyToast');

  const handleCopyEmail = (e: MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText('thejunglejimruss@gmail.com').then(() => {
      if (copyToast) {
        copyToast.textContent = '✓ Copied thejunglejimruss@gmail.com to clipboard';
        setTimeout(() => {
          copyToast.textContent = '';
        }, 3000);
      }
    });
  };

  copyBtn?.addEventListener('click', handleCopyEmail);
});
