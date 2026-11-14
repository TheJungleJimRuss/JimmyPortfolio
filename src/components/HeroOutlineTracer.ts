import { tactileAudio } from './TactileAudio';

/**
 * The Dev hero is always two rows (JIMMY over RUSS, line pitch 940 font units), so the outline
 * geometry is fixed: the glyph contours in dev.html and this viewBox match the solid text.
 */
export const OUTLINE_LAYOUTS = {
  stacked: { viewBox: '0 -150 3191 1903', russOffset: [0, 0] as [number, number] },
};

// Pre-computed vector spline arc lengths for J-I-M-M-Y R-U-S-S in font units
const KNOWN_PATH_LENGTHS = [3007, 1776, 4234, 4234, 2692, 3690, 3426, 3259, 3259];

export class HeroOutlineTracer {
  private svg: SVGElement | null = null;
  private heroElement: HTMLElement | null = null;
  private paths: SVGPathElement[] = [];
  private activeTimers: ReturnType<typeof setTimeout>[] = [];

  public init(svgElement: SVGElement, heroElement: HTMLElement): void {
    this.svg = svgElement;
    this.heroElement = heroElement;
    this.paths = Array.from(svgElement.querySelectorAll<SVGPathElement>('.hero-trace-path'));

    this.applyLayout();
    this.syncBounds();
    this.preparePaths();

    heroElement.classList.add('is-pending-intro');
    heroElement.classList.remove('is-materialized');
  }

  /** Applies the fixed two-row outline geometry (viewBox + RUSS group offset). */
  private applyLayout(): void {
    const svg = this.svg;
    if (!svg || typeof svg.setAttribute !== 'function') return;
    const { viewBox, russOffset } = OUTLINE_LAYOUTS.stacked;
    svg.setAttribute('viewBox', viewBox);
    const russ = typeof svg.querySelector === 'function' ? svg.querySelector('.hero-trace-russ') : null;
    russ?.setAttribute('transform', `translate(${russOffset[0]} ${russOffset[1]})`);
  }

  private syncBounds(): void {
    if (!this.svg || !this.heroElement || typeof this.heroElement.getBoundingClientRect !== 'function') return;
    const hRect = this.heroElement.getBoundingClientRect();
    const parent = typeof this.heroElement.parentElement?.getBoundingClientRect === 'function'
      ? this.heroElement.parentElement.getBoundingClientRect()
      : undefined;
    if (parent && hRect.width > 0 && hRect.height > 0) {
      this.svg.style.position = 'absolute';
      this.svg.style.top = `${hRect.top - parent.top}px`;
      this.svg.style.left = `${hRect.left - parent.left}px`;
      this.svg.style.width = `${hRect.width}px`;
      this.svg.style.height = `${hRect.height}px`;
      this.svg.style.transform = 'none';
      this.svg.style.maxWidth = 'none';
    }
  }

  private getScreenScale(): number {
    if (!this.svg) return 1;
    try {
      if (typeof (this.svg as any).getScreenCTM === 'function') {
        const ctm = (this.svg as any).getScreenCTM();
        if (ctm && typeof ctm.a === 'number' && ctm.a > 0) {
          return ctm.a;
        }
      }
      if (this.svg.clientWidth) {
        const vbWidth = (this.svg as any).viewBox?.baseVal?.width;
        if (typeof vbWidth === 'number' && vbWidth > 0) {
          return this.svg.clientWidth / vbWidth;
        }
      }
    } catch {
      // Fallback
    }
    return 1;
  }

  private getPathLength(path: SVGPathElement, index: number, scale: number): number {
    let length = 0;
    try {
      length = typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0;
    } catch {
      length = 0;
    }

    if (!length || length < 50) {
      length = KNOWN_PATH_LENGTHS[index] || 800;
    }

    // With vector-effect="non-scaling-stroke", browsers evaluate stroke-dasharray &
    // stroke-dashoffset in host screen pixels rather than SVG viewBox user units.
    const hasNonScaling =
      typeof path.getAttribute === 'function' &&
      path.getAttribute('vector-effect') === 'non-scaling-stroke';

    if (hasNonScaling && scale > 0) {
      length = length * scale;
    }

    return Math.ceil(length);
  }

  private preparePaths(): void {
    const scale = this.getScreenScale();
    this.paths.forEach((path, index) => {
      const safeLength = this.getPathLength(path, index, scale);
      path.style.strokeDasharray = `${safeLength} ${safeLength}`;
      path.style.strokeDashoffset = `${safeLength}`;
      path.style.transition = 'none';
      path.style.fill = 'transparent';
      path.style.opacity = '0';
    });
  }

  public async startTrace(durationMs = 1800, onMaterialize?: () => void): Promise<void> {
    if (!this.svg || !this.paths.length) {
      this.completeImmediately();
      return;
    }

    this.svg.classList.remove('is-fading-out');
    this.svg.classList.add('is-active');
    this.syncBounds();
    this.preparePaths();

    // Cascade letters smoothly with a brisk 50ms stagger
    const stagger = 50;
    // Each letter traces at a steady constant speed so strokes actively move right up to completion
    const letterDuration = Math.max(1000, durationMs - (this.paths.length - 1) * stagger);

    this.paths.forEach((path, index) => {
      const timer = setTimeout(() => {
        path.style.opacity = '1';
        path.style.transition = `stroke-dashoffset ${letterDuration}ms linear`;
        path.style.strokeDashoffset = '0';
        tactileAudio.playTick(1350);
      }, index * stagger);
      this.activeTimers.push(timer);
    });

    const totalAnimTime = (this.paths.length - 1) * stagger + letterDuration;

    return new Promise<void>((resolve) => {
      // The exact moment the final letter's stroke closes, immediately trigger bloom materialization
      const switchTimer = setTimeout(() => {
        if (this.heroElement) {
          this.heroElement.classList.remove('is-pending-intro');
          this.heroElement.classList.add('is-materialized');
        }
        if (this.svg) {
          this.svg.classList.add('is-fading-out');
        }
        tactileAudio.playImpulse();
        onMaterialize?.();
      }, totalAnimTime);
      this.activeTimers.push(switchTimer);

      // Resolve once the bloom cross-fade finishes (850ms)
      const finishTimer = setTimeout(() => {
        if (this.svg) {
          this.svg.classList.remove('is-active', 'is-fading-out');
          this.svg.style.display = 'none';
        }
        resolve();
      }, totalAnimTime + 850);
      this.activeTimers.push(finishTimer);
    });
  }

  public completeImmediately(): void {
    this.clearTimers();

    this.paths.forEach((path) => {
      path.style.transition = 'none';
      path.style.strokeDashoffset = '0';
      path.style.opacity = '1';
    });

    if (this.heroElement) {
      this.heroElement.classList.remove('is-pending-intro');
      this.heroElement.classList.add('is-materialized');
    }

    if (this.svg) {
      this.svg.classList.remove('is-active', 'is-fading-out');
      this.svg.style.display = 'none';
    }
  }

  private clearTimers(): void {
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers = [];
  }

  public dispose(): void {
    this.clearTimers();
    this.paths = [];
    this.svg = null;
    this.heroElement = null;
  }
}
