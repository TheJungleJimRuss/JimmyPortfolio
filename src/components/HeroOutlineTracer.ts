import { tactileAudio } from './TactileAudio';

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

    this.syncBounds();
    this.preparePaths();

    heroElement.classList.add('is-pending-intro');
    heroElement.classList.remove('is-materialized');
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

  private preparePaths(): void {
    this.paths.forEach((path, index) => {
      let length = 0;
      try {
        length = typeof path.getTotalLength === 'function' ? path.getTotalLength() : 0;
      } catch {
        length = 0;
      }

      if (!length || length < 50) {
        length = KNOWN_PATH_LENGTHS[index] || 800;
      }

      const safeLength = Math.ceil(length * 1.05);
      path.style.strokeDasharray = `${safeLength} ${safeLength}`;
      path.style.strokeDashoffset = `${safeLength}`;
      path.style.transition = 'none';
      path.style.fill = 'transparent';
      path.style.opacity = '0';
    });
  }

  public async startTrace(durationMs = 2800): Promise<void> {
    if (!this.svg || !this.paths.length) {
      this.completeImmediately();
      return;
    }

    this.syncBounds();
    // Re-verify path lengths in case DOM layout updated
    this.preparePaths();

    this.svg.classList.remove('is-fading-out');
    this.svg.classList.add('is-active');

    const stagger = this.paths.length > 1 ? Math.floor((durationMs * 0.6) / (this.paths.length - 1)) : 100;
    const letterDuration = Math.max(300, Math.floor(durationMs * 0.45));

    this.paths.forEach((path, index) => {
      const timer = setTimeout(() => {
        path.style.opacity = '1';
        path.style.transition = `stroke-dashoffset ${letterDuration}ms cubic-bezier(0.2, 0.9, 0.3, 1)`;
        path.style.strokeDashoffset = '0';
        tactileAudio.playTick(1350);
      }, index * stagger);
      this.activeTimers.push(timer);
    });

    const totalAnimTime = (this.paths.length - 1) * stagger + letterDuration;

    return new Promise<void>((resolve) => {
      // 1. Materialize solid hero text right as tracing finishes
      const materializeTimer = setTimeout(() => {
        if (this.heroElement) {
          this.heroElement.classList.remove('is-pending-intro');
          this.heroElement.classList.add('is-materialized');
        }
      }, totalAnimTime);
      this.activeTimers.push(materializeTimer);

      // 2. Smoothly fade out SVG trace overlay after text begins materializing
      const fadeTimer = setTimeout(() => {
        if (this.svg) {
          this.svg.classList.add('is-fading-out');
        }
      }, totalAnimTime + 400);
      this.activeTimers.push(fadeTimer);

      // 3. Resolve and complete
      const finishTimer = setTimeout(() => {
        if (this.svg) {
          this.svg.classList.remove('is-active');
        }
        resolve();
      }, totalAnimTime + 1600);
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
