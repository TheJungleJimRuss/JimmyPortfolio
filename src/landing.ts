import './styles/tokens.css';
import './styles/wireframe.css';
import './styles/gateway.css';
import './styles/effects3d.css';

import { tactileAudio } from './components/TactileAudio';
import { GatewayController } from './components/GatewayController';
import { HeroNameDualIdentity } from './components/HeroNameDualIdentity';
import { HeroName3D } from './components/HeroName3D';

document.addEventListener('DOMContentLoaded', () => {
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

  if (viewGateway) {
    gatewayController.mount(viewGateway, {
      initialAudioEnabled: tactileAudio.isEnabled(),
      onLaunchDev: () => {
        tactileAudio.playImpulse();
        window.location.href = './dev.html';
      },
      onLaunchDrone: () => {
        tactileAudio.playImpulse();
      },
    });

    gatewayDevBtn?.addEventListener('mouseenter', () => {
      gatewayController.setBranch('dev');
      heroNameHero.setVisualState('dev');
      heroName3d.setGlowState('dev');
    });
    gatewayDevBtn?.addEventListener('mouseleave', () => {
      gatewayController.setBranch('none');
      heroNameHero.setVisualState('none');
      heroName3d.setGlowState('none');
    });
    gatewayDevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      tactileAudio.playImpulse();
      window.location.href = './dev.html';
    });

    gatewayDroneBtn?.addEventListener('mouseenter', () => {
      gatewayController.setBranch('drone');
      heroNameHero.setVisualState('drone');
      heroName3d.setGlowState('drone');
    });
    gatewayDroneBtn?.addEventListener('mouseleave', () => {
      gatewayController.setBranch('none');
      heroNameHero.setVisualState('none');
      heroName3d.setGlowState('none');
    });
  }
});
