import { IntroCommandRunner } from './IntroCommandRunner';
import { HeroOutlineTracer } from './HeroOutlineTracer';
import { tactileAudio } from './TactileAudio';

export class IntroSequenceController {
  private overlay: HTMLElement | null = null;
  private promptWrap: HTMLElement | null = null;
  private terminalLog: HTMLElement | null = null;
  private targetHero: HTMLElement | null = null;
  private heroTraceSvg: SVGElement | null = null;
  private onFinish: (() => void) | null = null;

  private commandRunner = new IntroCommandRunner();
  private outlineTracer = new HeroOutlineTracer();

  private isRunning = false;
  private isFinished = false;

  private boundPointerHandler = (e: Event) => this.handleTrigger(e);
  private boundKeyHandler = (e: KeyboardEvent) => this.handleKeyTrigger(e);

  public mount(
    rootElement: HTMLElement,
    onFinish: () => void,
    targetHero?: HTMLElement | null,
    heroTraceSvg?: SVGElement | null
  ): void {
    this.overlay = rootElement;
    this.onFinish = onFinish;

    this.promptWrap = rootElement.querySelector('.intro-prompt-wrap');
    this.terminalLog = rootElement.querySelector('.intro-terminal-log');
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

  private handleTrigger(e: Event): void {
    e.stopPropagation();
    if (!this.isRunning && !this.isFinished) {
      void this.triggerSequence();
    } else if (this.isRunning && !this.isFinished) {
      this.skipToEnd();
    }
  }

  private handleKeyTrigger(e: KeyboardEvent): void {
    if (e.repeat) return;
    if (!this.isRunning && !this.isFinished) {
      void this.triggerSequence();
    } else if (this.isRunning && !this.isFinished) {
      this.skipToEnd();
    }
  }

  public async triggerSequence(): Promise<void> {
    if (this.isRunning || this.isFinished) return;
    this.isRunning = true;

    if (this.promptWrap) {
      this.promptWrap.style.display = 'none';
    }
    if (this.terminalLog) {
      this.terminalLog.classList.add('is-active');
    }

    // Check prefers-reduced-motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      this.skipToEnd();
      return;
    }

    await this.commandRunner.run((line) => {
      if (this.terminalLog && typeof document !== 'undefined') {
        const lineEl = document.createElement('div');
        lineEl.className = 'intro-log-line';
        lineEl.textContent = line;
        this.terminalLog.appendChild(lineEl);
      }
      tactileAudio.playTick(1200);
    });

    // Dissolve terminal log lines upward gracefully
    if (this.terminalLog) {
      this.terminalLog.classList.add('is-dissolving');
    }
    if (this.overlay) {
      this.overlay.style.opacity = '0';
      this.overlay.classList.add('is-fading');
    }

    // Wait for terminal log to dissolve before laser stroke begins
    await new Promise((r) => setTimeout(r, 320));
    if (this.overlay) {
      this.overlay.style.display = 'none';
    }

    // Trace the outline of each character in-place
    await this.outlineTracer.startTrace();

    this.finish();
  }

  public skipToEnd(): void {
    if (this.isFinished) return;
    this.commandRunner.cancel();
    this.outlineTracer.completeImmediately();
    this.finish();
  }

  private finish(): void {
    if (this.isFinished) return;
    this.isFinished = true;
    this.isRunning = false;

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
    this.commandRunner.cancel();
    this.outlineTracer.dispose();
    if (this.overlay) {
      this.overlay.removeEventListener('pointerdown', this.boundPointerHandler);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.boundKeyHandler);
    }
  }
}
