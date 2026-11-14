import type { GatewayBranch } from './GatewayController';
import type { NameLayout } from './ViewportLayoutPolicy';
import { DEFAULT_HERO_INPUT_PROFILE, idleSway, type HeroInputProfile } from './HeroMotion';

export interface IHeroNameDualIdentity {
  init(container: HTMLElement): void;
  updatePointerTilt(normalizedX: number, normalizedY: number): void;
  setVisualState(branch: GatewayBranch): void;
  triggerLaunchBurst(branch: 'dev' | 'drone'): Promise<void>;
  dispose(): void;
}

export class HeroNameDualIdentity implements IHeroNameDualIdentity {
  private container: HTMLElement | null = null;
  private textElement: HTMLElement | null = null;
  private initialized = false;
  private baseRotX = 0;
  private baseRotY = 0;
  private tiltRangeX = 28;
  private tiltRangeY = 36;
  private shiftRangeX = 18;
  private shiftRangeY = 12;
  private profile: HeroInputProfile = { ...DEFAULT_HERO_INPUT_PROFILE };
  private dragging = false;
  private orientationTilt: { x: number; y: number } | null = null;
  private idleFrameId: number | null = null;

  public init(container: HTMLElement): void {
    this.container = container;
    this.textElement =
      container.querySelector<HTMLElement>('#heroNameText') ||
      container.querySelector<HTMLElement>('.wf-gateway-name');
    this.container.dataset.state = 'none';

    if (this.textElement && typeof document !== 'undefined') {
      this.build3DLayers(this.textElement, 'JIMMY RUSS');
    }
    this.initialized = true;
    this.applyTilt(0, 0);
  }

  private build3DLayers(element: HTMLElement, text: string): void {
    if (element.querySelector('.wf-3d-slice')) return;
    element.innerHTML = '';
    const layerCount = 12;
    for (let i = 0; i < layerCount; i++) {
      const span = document.createElement('span');
      const isFront = i === layerCount - 1;
      span.className = `wf-3d-slice ${isFront ? 'is-front' : 'is-side'}`;
      span.style.setProperty('--layer-index', String(i));
      if (!isFront) {
        const factor = i / (layerCount - 1);
        const grayVal = Math.round(62 + factor * 48); // 62 -> 110: visible slate-graphite tone
        span.style.setProperty('--side-color', `rgb(${grayVal}, ${grayVal + 6}, ${grayVal + 16})`);
      }
      // Words in their own spans so CSS can stack them; textContent stays 'JIMMY RUSS'.
      text.split(' ').forEach((word, w) => {
        if (w > 0) span.append(' ');
        const wordEl = document.createElement('span');
        wordEl.className = 'wf-name-word';
        wordEl.textContent = word;
        span.append(wordEl);
      });
      span.setAttribute('aria-hidden', isFront ? 'false' : 'true');
      element.appendChild(span);
    }
  }

  /** The CSS fallback stacks via [data-name-layout='stacked'] on the root; nothing to rebuild here. */
  public setNameLayout(_layout: NameLayout): void {}

  public isInitialized(): boolean {
    return this.initialized;
  }

  public setVisualState(branch: GatewayBranch): void {
    if (!this.container) return;
    this.container.dataset.state = branch;
  }

  /** Pushed from the shared viewport layout adapter; no matchMedia in the hero. */
  public setInputProfile(profile: HeroInputProfile): void {
    this.profile = { ...profile };
    if (!profile.tiltEnabled) {
      this.dragging = false;
      this.orientationTilt = null;
    }
    this.applyRestPose();
    this.syncIdleLoop();
  }

  public setDragging(active: boolean): void {
    this.dragging = active && this.profile.tiltEnabled;
    if (!active) this.applyRestPose();
  }

  private applyRestPose(): void {
    const o = this.profile.tiltEnabled && this.profile.inputMode === 'touch' ? this.orientationTilt : null;
    this.applyTilt(o?.x ?? 0, o?.y ?? 0);
  }

  /** Phone-rotation tilt from the owner of the deviceorientation listener; null clears it. */
  public setOrientationTilt(x: number | null, y: number | null = null): void {
    if (x === null || y === null || !this.profile.tiltEnabled || this.profile.inputMode !== 'touch') {
      const had = this.orientationTilt !== null;
      this.orientationTilt = null;
      if (had && !this.dragging) this.applyRestPose();
      return;
    }
    this.orientationTilt = { x, y };
    if (!this.dragging) this.applyRestPose();
  }

  /** Time-based idle sway for touch devices; no-op while dragging or when drift is off. */
  public updateIdle(timeMs: number): void {
    if (!this.profile.tiltEnabled || !this.profile.idleDrift || this.dragging || this.orientationTilt) return;
    if (this.profile.inputMode !== 'touch') return;
    const s = idleSway(timeMs);
    this.applyTilt(s.x, s.y);
  }

  private syncIdleLoop(): void {
    const wanted =
      this.profile.tiltEnabled && this.profile.idleDrift && this.profile.inputMode === 'touch' &&
      this.textElement &&
      !this.container?.classList?.contains('has-3d');
    if (!wanted) {
      if (this.idleFrameId !== null) cancelAnimationFrame(this.idleFrameId);
      this.idleFrameId = null;
      return;
    }
    if (this.idleFrameId !== null || typeof requestAnimationFrame === 'undefined') return;
    const loop = (now: number) => {
      this.updateIdle(now);
      this.idleFrameId = requestAnimationFrame(loop);
    };
    this.idleFrameId = requestAnimationFrame(loop);
  }

  public updatePointerTilt(normalizedX: number, normalizedY: number): void {
    if (!this.profile.tiltEnabled) return;
    if (this.profile.inputMode === 'touch' && !this.dragging) return;
    this.applyTilt(normalizedX, normalizedY);
  }

  private applyTilt(normalizedX: number, normalizedY: number): void {
    if (!this.textElement) return;

    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));

    const rotX = this.baseRotX + clampedY * this.tiltRangeX;
    const rotY = this.baseRotY + clampedX * this.tiltRangeY;
    const transX = clampedX * this.shiftRangeX;
    const transY = clampedY * this.shiftRangeY;

    this.textElement.style.transform = `perspective(850px) translate3d(${transX.toFixed(1)}px, ${transY.toFixed(1)}px, 0px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
  }

  public triggerLaunchBurst(branch: 'dev' | 'drone'): Promise<void> {
    if (!this.container) return Promise.resolve();

    this.setVisualState(branch);
    if (this.textElement) {
      this.textElement.style.transition = 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease';
      this.textElement.style.transform = 'perspective(850px) scale(1.15) translateZ(40px)';
    }

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 400);
    });
  }

  public dispose(): void {
    if (this.idleFrameId !== null && typeof cancelAnimationFrame !== 'undefined') cancelAnimationFrame(this.idleFrameId);
    this.idleFrameId = null;
    if (this.textElement) {
      this.textElement.style.transform = '';
      this.textElement.style.transition = '';
    }
    this.container = null;
    this.textElement = null;
    this.initialized = false;
  }
}
