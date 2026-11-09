export interface CommandLogLine {
  text: string;
  delayMs: number;
}

export class IntroCommandRunner {
  private readonly defaultCommands: CommandLogLine[] = [
    { text: 'alex@workstation:~$ ./initialize_portfolio.sh', delayMs: 120 },
    { text: '[0.012s] Mounting kinematic_character_motor.cs ......................... [OK]', delayMs: 140 },
    { text: '[0.028s] Calculating zero-allocation collision loops ................... [OK]', delayMs: 130 },
    { text: '[0.045s] Linking Three.js spatial canvas pipeline ...................... [OK]', delayMs: 150 },
    { text: '[0.061s] Calibrating aerial telemetry & mission buffers ................ [OK]', delayMs: 140 },
    { text: '[0.075s] System armed. Resolving hero vector topology... [OK]', delayMs: 120 },
  ];

  private isCancelled = false;
  private activeTimers: ReturnType<typeof setTimeout>[] = [];
  private currentResolver: (() => void) | null = null;

  public getCommandSequence(): CommandLogLine[] {
    return [...this.defaultCommands];
  }

  public async run(onLine: (line: string) => void): Promise<void> {
    this.isCancelled = false;
    this.activeTimers = [];

    return new Promise<void>((resolve) => {
      this.currentResolver = resolve;
      let cumulativeDelay = 0;

      this.defaultCommands.forEach((cmd, index) => {
        cumulativeDelay += cmd.delayMs;
        const timer = setTimeout(() => {
          if (!this.isCancelled) {
            onLine(cmd.text);
            if (index === this.defaultCommands.length - 1) {
              this.currentResolver = null;
              resolve();
            }
          }
        }, cumulativeDelay);
        this.activeTimers.push(timer);
      });
    });
  }

  public cancel(): void {
    this.isCancelled = true;
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers = [];
    if (this.currentResolver) {
      const resolve = this.currentResolver;
      this.currentResolver = null;
      resolve();
    }
  }
}
