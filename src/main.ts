import './styles/wireframe.css';
import './styles/gateway.css';
import './styles/intro-trace.css';
import { PersonaController, type PersonaMode } from './components/PersonaController';
import { GatewayController } from './components/GatewayController';
import { HeroNameDualIdentity } from './components/HeroNameDualIdentity';
import { HeroName3D } from './components/HeroName3D';
import { IntroSequenceController } from './components/IntroSequenceController';
import { tactileAudio } from './components/TactileAudio';
import { siteConfig } from './config/siteConfig';

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

// Aliases for backward compatibility with existing links
projectDetails['telemetry-ops-app'] = projectDetails['drone-desktop'];
projectDetails['spatial-media-engine'] = projectDetails['photography-portfolio'];

document.addEventListener('DOMContentLoaded', () => {
  const viewOverview = document.getElementById('viewOverview');
  const viewDroneOverview = document.getElementById('viewDroneOverview');
  const viewDetail = document.getElementById('viewDetail');
  const backBtn = document.getElementById('backToOverviewBtn');

  const floatingToggleContainer = document.getElementById('floatingToggleContainer');
  const personaPillDev = document.getElementById('personaPillDev');
  const personaPillDrone = document.getElementById('personaPillDrone');
  const personaController = new PersonaController();

  const isFlightOpsEnabled =
    siteConfig.features.enableFlightOps || window.location.search.includes('enableFlightOps=true');

  if (floatingToggleContainer) {
    floatingToggleContainer.hidden = !isFlightOpsEnabled;
    floatingToggleContainer.style.display = isFlightOpsEnabled ? 'flex' : 'none';
  }

  function applyPersonaMode(mode: PersonaMode) {
    const updateDOM = () => {
      // Clear detail view if open
      if (viewDetail && !viewDetail.hidden) {
        viewDetail.hidden = true;
      }

      if (mode === 'dev') {
        if (viewOverview) viewOverview.hidden = false;
        if (viewDroneOverview) viewDroneOverview.hidden = true;
        personaPillDev?.classList.add('is-active');
        personaPillDev?.setAttribute('aria-selected', 'true');
        personaPillDrone?.classList.remove('is-active');
        personaPillDrone?.setAttribute('aria-selected', 'false');
      } else {
        if (viewOverview) viewOverview.hidden = true;
        if (viewDroneOverview) viewDroneOverview.hidden = false;
        personaPillDrone?.classList.add('is-active');
        personaPillDrone?.setAttribute('aria-selected', 'true');
        personaPillDev?.classList.remove('is-active');
        personaPillDev?.setAttribute('aria-selected', 'false');
      }
    };

    if (document.startViewTransition) {
      document.startViewTransition(updateDOM);
    } else {
      updateDOM();
    }
  }

  // Always bind toggle listeners so the toggle is fully functional whenever displayed
  personaPillDev?.addEventListener('click', () => {
    personaController.setMode('dev');
  });

  personaPillDrone?.addEventListener('click', () => {
    personaController.setMode('drone');
  });

  personaController.subscribe((mode) => {
    applyPersonaMode(mode);
  });

  // Apply initial mode: if flight ops is enabled, honor stored or url mode; otherwise default to dev
  if (isFlightOpsEnabled) {
    applyPersonaMode(personaController.getMode());
  } else {
    applyPersonaMode('dev');
  }

  // ==================== GATEWAY & DUAL-IDENTITY HERO ====================
  const viewGateway = document.getElementById('viewGateway') as HTMLElement | null;
  const heroNameAnchor = document.getElementById('heroNameAnchor') as HTMLElement | null;
  const hero3dCanvas = document.getElementById('hero3dCanvasGateway') as HTMLCanvasElement | null;
  const gatewayAudioToggle = document.getElementById('gatewayAudioToggle') as HTMLButtonElement | null;
  const gatewayAudioLabel = document.getElementById('gatewayAudioLabel') as HTMLElement | null;
  const gatewayDevBtn = document.getElementById('gatewayDevBtn') as HTMLButtonElement | null;
  const gatewayDroneBtn = document.getElementById('gatewayDroneBtn') as HTMLButtonElement | null;

  const hasDeepLink = GatewayController.hasDeepLink(window.location.search);
  const gatewayController = new GatewayController();
  const heroNameHero = new HeroNameDualIdentity();
  const heroName3d = new HeroName3D();

  if (heroNameAnchor) {
    heroNameHero.init(heroNameAnchor);
    heroName3d.init(heroNameAnchor, hero3dCanvas);
  }

  function runDevBootSequence(autoStart = false) {
    // Ensure viewOverview is visible with hero in pending-intro state
    if (viewOverview) viewOverview.hidden = false;
    const heroNameEl = document.getElementById('wfHeroName');
    const heroTraceSvg = document.getElementById('heroTraceSvg') as SVGElement | null;

    if (heroNameEl) {
      heroNameEl.classList.remove('is-materialized', 'is-tracing');
      heroNameEl.classList.add('is-pending-intro');
    }

    const introOverlay = document.getElementById('introOverlay');
    if (introOverlay) {
      introOverlay.style.display = 'flex';
      introOverlay.style.opacity = '1';
      introOverlay.classList.remove('is-fading');

      const promptWrap = introOverlay.querySelector('.intro-prompt-wrap') as HTMLElement | null;
      if (promptWrap) promptWrap.style.display = autoStart ? 'none' : 'block';

      const terminalLog = introOverlay.querySelector('.intro-terminal-log') as HTMLElement | null;
      if (terminalLog) {
        terminalLog.innerHTML = '';
        terminalLog.classList.remove('is-active');
      }

      const introController = new IntroSequenceController();
      introController.mount(
        introOverlay,
        () => {
          // Intro complete: hero is fully materialized
        },
        heroNameEl,
        heroTraceSvg
      );

      if (autoStart) {
        void introController.triggerSequence();
      }
    }
  }

  function launchModeFromGateway(mode: PersonaMode) {
    tactileAudio.playImpulse();

    if (mode === 'dev') {
      // Immediate, smooth in-place transition for Dev:
      // Fade out gateway controls quickly and transition directly to in-place terminal stream
      if (viewGateway) {
        viewGateway.style.transition = 'opacity 0.2s ease';
        viewGateway.style.opacity = '0';
        viewGateway.style.pointerEvents = 'none';
        setTimeout(() => {
          viewGateway.hidden = true;
        }, 200);
      }
      personaController.setMode('dev');
      if (floatingToggleContainer && isFlightOpsEnabled) {
        floatingToggleContainer.hidden = false;
        floatingToggleContainer.style.display = 'flex';
      }
      runDevBootSequence(true);
      return;
    }

    // Drone flight launch:
    Promise.all([
      heroNameHero.triggerLaunchBurst(mode),
      heroName3d.triggerBurst(mode),
    ]).then(() => {
      if (viewGateway) {
        viewGateway.style.opacity = '0';
        viewGateway.style.pointerEvents = 'none';
        setTimeout(() => {
          viewGateway.hidden = true;
          if (floatingToggleContainer && isFlightOpsEnabled) {
            floatingToggleContainer.hidden = false;
            floatingToggleContainer.style.display = 'flex';
          }
          personaController.setMode('drone');
        }, 300);
      } else {
        personaController.setMode('drone');
      }
    });
  }

  if (viewGateway && !hasDeepLink) {
    viewGateway.hidden = false;
    if (floatingToggleContainer) {
      floatingToggleContainer.hidden = true;
      floatingToggleContainer.style.display = 'none';
    }
    if (viewOverview) viewOverview.hidden = true;
    if (viewDroneOverview) viewDroneOverview.hidden = true;

    gatewayController.mount(viewGateway, {
      initialAudioEnabled: tactileAudio.isEnabled(),
      onLaunchDev: () => launchModeFromGateway('dev'),
      onLaunchDrone: () => launchModeFromGateway('drone'),
    });

    if (window.location.search.includes('previewGlow=dev')) {
      gatewayController.setBranch('dev');
      heroNameHero.setVisualState('dev');
      heroName3d.setGlowState('dev');
    } else if (window.location.search.includes('previewGlow=drone')) {
      gatewayController.setBranch('drone');
      heroNameHero.setVisualState('drone');
      heroName3d.setGlowState('drone');
    }

    gatewayAudioToggle?.addEventListener('click', () => {
      const enabled = gatewayController.toggleAudio();
      tactileAudio.setEnabled(enabled);
      if (gatewayAudioLabel) {
        gatewayAudioLabel.textContent = enabled ? 'SOUND: ON' : 'SOUND: OFF';
      }
      gatewayAudioToggle.classList.toggle('is-active', enabled);
      gatewayAudioToggle.setAttribute('aria-pressed', String(enabled));
    });

    gatewayController.onAudioChange((enabled) => {
      tactileAudio.setEnabled(enabled);
      if (gatewayAudioLabel) {
        gatewayAudioLabel.textContent = enabled ? 'SOUND: ON' : 'SOUND: OFF';
      }
      gatewayAudioToggle?.classList.toggle('is-active', enabled);
      gatewayAudioToggle?.setAttribute('aria-pressed', String(enabled));
    });

    window.addEventListener('pointermove', (e) => {
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      heroNameHero.updatePointerTilt(normX, normY);
      heroName3d.updatePointer(normX, normY);
    });

    gatewayDevBtn?.addEventListener('mouseenter', () => {
      gatewayController.setBranch('dev');
      heroNameHero.setVisualState('dev');
      heroName3d.setGlowState('dev');
      tactileAudio.playTick(980);
    });
    gatewayDevBtn?.addEventListener('mouseleave', () => {
      gatewayController.setBranch('none');
      heroNameHero.setVisualState('none');
      heroName3d.setGlowState('none');
    });
    gatewayDevBtn?.addEventListener('click', () => launchModeFromGateway('dev'));

    gatewayDroneBtn?.addEventListener('mouseenter', () => {
      gatewayController.setBranch('drone');
      heroNameHero.setVisualState('drone');
      heroName3d.setGlowState('drone');
      tactileAudio.playTick(520);
    });
    gatewayDroneBtn?.addEventListener('mouseleave', () => {
      gatewayController.setBranch('none');
      heroNameHero.setVisualState('none');
      heroName3d.setGlowState('none');
    });
    gatewayDroneBtn?.addEventListener('click', () => launchModeFromGateway('drone'));
  } else if (viewGateway) {
    viewGateway.hidden = true;
    if (window.location.search.includes('boot=true')) {
      runDevBootSequence();
    }
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

  // Same-Document View Transition: Overview -> Detail (same-document-transitions guidance)
  function showProjectDetail(projectId: string, clickedCard: HTMLElement | null) {
    lastActiveCard = clickedCard;

    // Prepare shared view-transition elements
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
      // MANDATORY Accessibility Routing: Route focus to detail heading
      detailTitle?.focus();
      return;
    }

    const transition = document.startViewTransition(updateDOM);

    transition.finished.finally(() => {
      // Clean up temporary view-transition-name classes
      thumb?.classList.remove('is-transitioning');
      title?.classList.remove('is-transitioning');
      detailViewport?.classList.remove('is-transitioning');
      detailTitle?.classList.remove('is-transitioning');

      // Route programmatic focus to heading
      detailTitle?.focus();
    });
  }

  // Same-Document View Transition: Detail -> Overview
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

      // Restore focus to the card that opened the project
      lastActiveCard?.scrollIntoView({ block: 'center' });
      lastActiveCard?.focus();
    });
  }

  // Card click listener
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

  // Browser Back/Forward navigation support
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

  // Check initial hash on page load
  if (window.location.hash.startsWith('#project/')) {
    const id = window.location.hash.replace('#project/', '');
    showProjectDetail(id, null);
  }

  // Copy email listeners
  const copyBtn = document.getElementById('copyEmailBtn');
  const droneCopyBtn = document.getElementById('droneCopyEmailBtn');
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
  droneCopyBtn?.addEventListener('click', handleCopyEmail);
});
