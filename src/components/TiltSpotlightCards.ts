import { tactileAudio } from './TactileAudio';

export function initMouseAnd3DEffects(): void {
  // 1. Global Cursor Tracking for Background Spatial Grid Spotlight
  window.addEventListener(
    'pointermove',
    (e: PointerEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    },
    { passive: true }
  );

  // 2. Multi-Layer 3D Perspective Tilt & Radial Specular Sheen
  const tiltCards = document.querySelectorAll<HTMLElement>('.tilt-card-3d');
  tiltCards.forEach((card) => {
    card.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width * 0.5;
      const centerY = rect.height * 0.5;

      // Smooth 3D rotation angles bounded to +-6.5 deg
      const rotateX = ((y - centerY) / centerY) * -6.5;
      const rotateY = ((x - centerX) / centerX) * 6.5;

      card.style.setProperty('--card-mouse-x', `${x}px`);
      card.style.setProperty('--card-mouse-y', `${y}px`);
      card.style.setProperty('--rotate-x', `${rotateX.toFixed(2)}deg`);
      card.style.setProperty('--rotate-y', `${rotateY.toFixed(2)}deg`);
    });

    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--rotate-x', '0deg');
      card.style.setProperty('--rotate-y', '0deg');
    });
  });

  // 3. Magnetic UI Buttons & Interactive Pills
  const magneticTargets = document.querySelectorAll<HTMLElement>('.magnetic-target');
  magneticTargets.forEach((el) => {
    el.addEventListener('pointermove', (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width * 0.5);
      const dy = e.clientY - (rect.top + rect.height * 0.5);

      el.style.transform = `translate3d(${(dx * 0.24).toFixed(1)}px, ${(dy * 0.28).toFixed(1)}px, 0)`;
    });

    el.addEventListener('pointerenter', () => {
      tactileAudio.playTick(1120);
    });

    el.addEventListener('pointerleave', () => {
      el.style.transform = 'translate3d(0px, 0px, 0)';
    });
  });

  // 4. Monospace Telemetry Scramble Effect on Section Eyebrows
  const glyphPool = '0123456789ABCDEF_//<>[]*+=';
  document.querySelectorAll<HTMLElement>('[data-scramble]').forEach((el) => {
    const original = el.textContent || '';
    let timer: number | null = null;

    el.addEventListener('pointerenter', () => {
      let step = 0;
      if (timer !== null) window.clearInterval(timer);

      timer = window.setInterval(() => {
        el.textContent = original
          .split('')
          .map((ch, idx) => {
            if (idx < step) return original[idx];
            if (ch === ' ') return ' ';
            return glyphPool[Math.floor(Math.random() * glyphPool.length)];
          })
          .join('');

        if (step >= original.length && timer !== null) {
          window.clearInterval(timer);
        }
        step += 0.55;
      }, 22);
    });
  });
}
