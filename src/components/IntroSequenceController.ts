import { HeroOutlineTracer } from './HeroOutlineTracer';
import { tactileAudio } from './TactileAudio';
import type { ViewportLayoutAdapter } from './ViewportLayoutAdapter';
import {
  DEFAULT_BOOT_LINES,
  HANDOVER_HOLD_MS,
  buildBootSchedule,
  completeFrame,
  nextPhase,
  type BootEvent,
  type BootLines,
  type BootPhase,
} from './BootShell';
import { createBootShellView, type BootShellViewLike } from './BootShellView';
import { NAME_TRACE_MS, buildOsTrace, shouldTrace, type DesktopTraceLike } from './DesktopTrace';

export interface IntroSequenceOptions {
  /** Holds the Hero name layout from the trace start until the hero materializes. */
  layoutAdapter?: Pick<ViewportLayoutAdapter, 'decision' | 'lock' | 'release'>;
  /** Boot shell copy; defaults to the placeholder lines. */
  lines?: BootLines;
  /** Draws the Desktop's lines (Taskbar, icons, File Explorer, Hero window) before the Hero name trace. */
  desktopTrace?: DesktopTraceLike;
  /** Test seam: replaces the DOM view. */
  view?: BootShellViewLike;
  /** Test seam: replaces the prefers-reduced-motion check (read at each input). */
  reducedMotion?: () => boolean;
}

export class IntroSequenceController {
  private overlay: HTMLElement | null = null;
  private view: BootShellViewLike | null = null;
  private targetHero: HTMLElement | null = null;
  private heroTraceSvg: SVGElement | null = null;
  private onFinish: (() => void) | null = null;

  private outlineTracer = new HeroOutlineTracer();
  private readonly lines: BootLines;

  private phase: BootPhase = 'waiting';
  private reduced = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private isFinished = false;
  private layoutLocked = false;

  constructor(private readonly options: IntroSequenceOptions = {}) {
    this.lines = options.lines ?? DEFAULT_BOOT_LINES;
  }

  private boundPointerHandler = (e: Event) => this.handleInput(e);
  private boundKeyHandler = (e: KeyboardEvent) => this.handleKey(e);

  public mount(
    rootElement: HTMLElement,
    onFinish: () => void,
    targetHero?: HTMLElement | null,
    heroTraceSvg?: SVGElement | null
  ): void {
    this.overlay = rootElement;
    this.onFinish = onFinish;
    this.view = this.options.view ?? createBootShellView(rootElement, this.lines);
    this.view.render(null);

    this.targetHero = targetHero || (typeof document !== 'undefined' ? document.getElementById('wfHeroName') : null);
    this.heroTraceSvg = heroTraceSvg || (typeof document !== 'undefined' ? (document.getElementById('heroTraceSvg') as SVGElement | null) : null);

    if (this.heroTraceSvg && this.targetHero) {
      this.outlineTracer.init(this.heroTraceSvg, this.targetHero);
    }

    this.overlay.addEventListener('pointerdown', this.boundPointerHandler);
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.boundKeyHandler);
    }
  }

  private handleInput(e: Event): void {
    e.stopPropagation();
    this.input();
  }

  private handleKey(e: KeyboardEvent): void {
    if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    this.input();
  }

  /** Any key, click or tap. Must run synchronously in the gesture so iOS lets timer-driven ticks play. */
  public input(): void {
    tactileAudio.unlock();
    this.dispatch('input');
  }

  private isReducedMotion(): boolean {
    if (this.options.reducedMotion) return this.options.reducedMotion();
    return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  }

  private dispatch(event: BootEvent): void {
    if (this.isFinished) return;
    const from = this.phase;
    if (from === 'waiting' && event === 'input') this.reduced = this.isReducedMotion();
    const to = nextPhase(from, event, this.reduced);
    if (to === from) return;
    this.phase = to;
    this.clearTimers();

    if (to === 'printing') {
      this.startPrinting();
    } else if (to === 'printed') {
      this.view?.render(completeFrame(this.lines));
      if (from === 'waiting') tactileAudio.playTick(1200);
      if (!this.reduced) this.later(HANDOVER_HOLD_MS, () => this.dispatch('holdDone'));
    } else if (to === 'handover') {
      this.view?.render(completeFrame(this.lines));
      void this.handover();
    }
  }

  private startPrinting(): void {
    const frames = buildBootSchedule(this.lines, false);
    const commandLen = this.lines.command.length;
    let prevRows = 0;
    frames.forEach((frame, i) => {
      this.later(frame.atMs, () => {
        this.view?.render(frame);
        if (frame.rows > prevRows) {
          prevRows = frame.rows;
          tactileAudio.playTick(1200);
        }
        if (i === frames.length - 1 && frame.commandChars === commandLen) this.dispatch('printDone');
      });
    });
  }

  private later(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }

  /** Shell text fades quickly, then the trace draws on clean black and the hero materializes. */
  private async handover(): Promise<void> {
    this.lockLayout();

    if (this.overlay) {
      this.overlay.classList.add('is-dissolving');
      this.overlay.style.opacity = '0';
      this.overlay.classList.add('is-fading');
    }

    if (!shouldTrace(this.reduced)) {
      this.skipToEnd();
      return;
    }

    // Wait for the shell to fade before the laser stroke begins
    await new Promise((r) => setTimeout(r, 320));
    if (this.isFinished) return;
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }

    // Outline trace, outside in: the Desktop's parts (about 1.2s), then the Hero name (about 1.8s).
    const desktopTrace = this.options.desktopTrace;
    if (desktopTrace) {
      await desktopTrace.play(buildOsTrace(desktopTrace.layout()));
      if (this.isFinished) return;
    }
    await this.outlineTracer.startTrace(NAME_TRACE_MS, () => this.releaseLayout());

    this.finish();
  }

  public skipToEnd(): void {
    if (this.isFinished) return;
    this.clearTimers();
    this.outlineTracer.completeImmediately();
    this.finish();
  }

  private lockLayout(): void {
    if (this.layoutLocked || !this.options.layoutAdapter) return;
    this.options.layoutAdapter.lock();
    this.layoutLocked = true;
  }

  /** Idempotent: applies any layout change requested while the intro held the lock. */
  private releaseLayout(): void {
    if (!this.layoutLocked) return;
    this.layoutLocked = false;
    this.options.layoutAdapter?.release();
  }

  private finish(): void {
    if (this.isFinished) return;
    this.isFinished = true;
    this.phase = 'handover';
    this.clearTimers();
    this.releaseLayout();
    this.options.desktopTrace?.finish();

    if (this.overlay) {
      this.overlay.style.opacity = '0';
      this.overlay.classList.add('is-fading');
      this.overlay.style.display = 'none';
    }
    if (this.onFinish) {
      this.onFinish();
    }
  }

  public dispose(): void {
    this.releaseLayout();
    this.clearTimers();
    this.outlineTracer.dispose();
    this.view?.dispose();
    if (this.overlay) {
      this.overlay.removeEventListener('pointerdown', this.boundPointerHandler);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyHandler);
    }
  }
}
