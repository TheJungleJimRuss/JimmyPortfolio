import type { GatewayBranch } from './GatewayController';

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
  private baseRotX = 6;
  private baseRotY = -9;
  private tiltRangeX = 14;
  private tiltRangeY = 18;

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
    this.updatePointerTilt(0, 0);
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
      span.textContent = text;
      span.setAttribute('aria-hidden', isFront ? 'false' : 'true');
      element.appendChild(span);
    }
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public setVisualState(branch: GatewayBranch): void {
    if (!this.container) return;
    this.container.dataset.state = branch;
  }

  public updatePointerTilt(normalizedX: number, normalizedY: number): void {
    if (!this.textElement) return;

    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));

    const rotX = this.baseRotX - clampedY * this.tiltRangeX;
    const rotY = this.baseRotY + clampedX * this.tiltRangeY;

    this.textElement.style.transform = `perspective(850px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
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
    if (this.textElement) {
      this.textElement.style.transform = '';
      this.textElement.style.transition = '';
    }
    this.container = null;
    this.textElement = null;
    this.initialized = false;
  }
}
