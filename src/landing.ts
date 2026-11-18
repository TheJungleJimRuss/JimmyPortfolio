import './styles/tokens.css';
import './styles/wireframe.css';
import './styles/gateway.css';

import { tactileAudio } from './components/TactileAudio';
import { GatewayController, type PathwayPhase } from './components/GatewayController';
import { HeroNameDualIdentity } from './components/HeroNameDualIdentity';
import { HeroName3D } from './components/HeroName3D';
import type { NameLayout } from './components/ViewportLayoutPolicy';
import { createViewportLayoutAdapter } from './components/ViewportLayoutAdapter';
import { createDeviceOrientationTilt, type OrientationWindow } from './components/DeviceOrientationTilt';

function initLanding() {
  const layout = createViewportLayoutAdapter();
  const viewGateway = document.getElementById('viewGateway') as HTMLElement | null;
  const heroNameAnchor = document.getElementById('heroNameAnchor') as HTMLElement | null;
  const hero3dCanvas = document.getElementById('hero3dCanvasGateway') as HTMLCanvasElement | null;
  const gatewayAudioToggle = document.getElementById('gatewayAudioToggle') as HTMLButtonElement | null;
  const gatewayAudioLabel = document.getElementById('gatewayAudioLabel') as HTMLElement | null;
  const gatewayDevBtn = document.getElementById('gatewayDevBtn') as HTMLAnchorElement | HTMLButtonElement | null;
  const gatewayDroneBtn = document.getElementById('gatewayDroneBtn') as HTMLAnchorElement | HTMLButtonElement | null;

  const gatewayController = new GatewayController();
  const heroNameHero = new HeroNameDualIdentity();
  const heroName3d = new HeroName3D();

  if (heroNameAnchor) {
    heroNameHero.init(heroNameAnchor);
    heroName3d.init(heroNameAnchor, hero3dCanvas);
  }

  // Phone-rotation tilt: owned here so the heroes stay free of device APIs.
  const orientationTilt = createDeviceOrientationTilt(window as unknown as OrientationWindow, (x, y) => {
    heroNameHero.setOrientationTilt(x, y);
    heroName3d.setOrientationTilt(x, y);
  });

  const applyInputProfile = (d: { inputMode: 'touch' | 'mouse'; idleDrift: boolean; tiltEnabled: boolean; nameLayout: NameLayout }) => {
    heroNameHero.setNameLayout(d.nameLayout);
    heroName3d.setNameLayout(d.nameLayout);
    const profile = { inputMode: d.inputMode, idleDrift: d.idleDrift, tiltEnabled: d.tiltEnabled };
    heroNameHero.setInputProfile(profile);
    heroName3d.setInputProfile(profile);
    orientationTilt.setEnabled(d.inputMode === 'touch' && d.tiltEnabled);
  };
  applyInputProfile(layout.decision);
  layout.subscribe(applyInputProfile);

  function updateAudioToggleUI(enabled: boolean) {
    if (!gatewayAudioToggle || !gatewayAudioLabel) return;
    gatewayAudioToggle.setAttribute('aria-pressed', enabled ? 'true' : 'false');
    gatewayAudioToggle.classList.toggle('is-active', enabled);
    gatewayAudioLabel.textContent = enabled ? 'SOUND: ON' : 'SOUND: OFF';
  }

  updateAudioToggleUI(tactileAudio.isEnabled());

  gatewayAudioToggle?.addEventListener('click', () => {
    const nextState = tactileAudio.toggle();
    updateAudioToggleUI(nextState);
  });

  window.addEventListener('keydown', (e) => {
    if ((e.key === 'm' || e.key === 'M') && !e.repeat) {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) return;
      const nextState = tactileAudio.toggle();
      updateAudioToggleUI(nextState);
    }
  });

  const updateTilt = (e: PointerEvent) => {
    const rect = heroNameAnchor?.getBoundingClientRect();
    const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const normX = (e.clientX - centerX) / (window.innerWidth / 2);
    const normY = (e.clientY - centerY) / (window.innerHeight / 2);
    heroNameHero.updatePointerTilt(normX, normY);
    heroName3d.updatePointer(normX, normY);
  };

  // Mouse/pen: tilt follows the pointer anywhere on the page (unchanged).
  window.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch') return;
    updateTilt(e);
  });

  window.addEventListener('pointerleave', () => {
    heroNameHero.updatePointerTilt(0, 0);
    heroName3d.updatePointer(0, 0);
  });

  // Touch: finger drag on the hero area tilts it; release or cancel eases back to idle.
  let activeTouchId: number | null = null;
  const setDragging = (active: boolean) => {
    heroNameHero.setDragging(active);
    heroName3d.setDragging(active);
  };
  const endTouch = (e: PointerEvent) => {
    if (e.pointerId !== activeTouchId) return;
    activeTouchId = null;
    setDragging(false);
  };
  heroNameAnchor?.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'touch') return;
    // iOS motion permission must be requested inside the gesture; only the hero triggers it.
    void orientationTilt.requestPermissionOnce();
    // Drag hint fades on the first touch of this visit (not remembered across visits).
    document.getElementById('heroDragHint')?.classList.add('is-dismissed');
    if (activeTouchId !== null) return;
    activeTouchId = e.pointerId;
    heroNameAnchor.setPointerCapture?.(e.pointerId);
    setDragging(true);
    updateTilt(e);
  });
  heroNameAnchor?.addEventListener('pointermove', (e) => {
    if (e.pointerId === activeTouchId) updateTilt(e);
  });
  heroNameAnchor?.addEventListener('pointerup', endTouch);
  heroNameAnchor?.addEventListener('pointercancel', endTouch);

  // Restored from back/forward cache: clear the exit fade so the page is visible again.
  window.addEventListener('pageshow', () => {
    viewGateway?.classList.remove('page-is-exiting');
    document.body.classList.remove('page-is-exiting');
    gatewayController.setBranch('none');
  });

  function navigateToDev() {
    tactileAudio.playImpulse();
    if (viewGateway) {
      viewGateway.classList.add('page-is-exiting');
    }
    setTimeout(() => {
      window.location.href = './dev.html';
    }, 160);
  }

  if (viewGateway) {
    gatewayController.mount(viewGateway, {
      initialAudioEnabled: tactileAudio.isEnabled(),
      onLaunchDev: navigateToDev,
      onLaunchDrone: () => {
        tactileAudio.playImpulse();
      },
    });

    gatewayController.onBranchChange((branch) => {
      heroNameHero.setVisualState(branch);
      heroName3d.setGlowState(branch);
    });

    const bindPathway = (el: HTMLElement | null, branch: 'dev' | 'drone') => {
      if (!el) return;
      const phases: [string, PathwayPhase][] = [
        ['pointerenter', 'enter'],
        ['pointerleave', 'leave'],
        ['pointerdown', 'down'],
        ['pointerup', 'up'],
        ['pointercancel', 'cancel'],
        ['blur', 'blur'],
      ];
      for (const [type, phase] of phases) {
        el.addEventListener(type, () => gatewayController.handlePathwayPointer(branch, phase));
      }
      // Keyboard focus only; a tapped link keeps focus and must not leave the glow stuck.
      el.addEventListener('focus', () => {
        if (el.matches(':focus-visible')) gatewayController.handlePathwayPointer(branch, 'focus');
      });
    };
    bindPathway(gatewayDevBtn, 'dev');
    bindPathway(gatewayDroneBtn, 'drone');

    gatewayDevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      navigateToDev();
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLanding);
} else {
  initLanding();
}
