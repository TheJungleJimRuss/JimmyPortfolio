export type GatewayBranch = 'none' | 'dev' | 'drone';

export interface GatewayConfig {
  initialAudioEnabled?: boolean;
  defaultBranch?: GatewayBranch;
  onLaunchDev: () => void;
  onLaunchDrone: () => void;
}

export interface IGatewayController {
  mount(rootElement: HTMLElement, config: GatewayConfig): void;
  setBranch(branch: GatewayBranch): void;
  toggleAudio(): boolean;
  handleKey(event: KeyboardEvent): void;
  dispose(): void;
}

export class GatewayController implements IGatewayController {
  private branch: GatewayBranch = 'none';
  private audioEnabled = false;
  private config: GatewayConfig | null = null;
  private rootElement: HTMLElement | null = null;
  private isDisposed = false;
  private branchSubscribers: ((branch: GatewayBranch) => void)[] = [];
  private audioSubscribers: ((enabled: boolean) => void)[] = [];
  private keydownListener: ((e: KeyboardEvent) => void) | null = null;

  constructor(initialBranch: GatewayBranch = 'none', initialAudio = false) {
    this.branch = initialBranch;
    this.audioEnabled = initialAudio;
  }

  public static hasDeepLink(searchString: string): boolean {
    const params = new URLSearchParams(searchString);
    return params.has('mode') || params.has('view');
  }

  public getRootElement(): HTMLElement | null {
    return this.rootElement;
  }

  public getBranch(): GatewayBranch {
    return this.branch;
  }

  public isAudioEnabled(): boolean {
    return this.audioEnabled;
  }

  public onBranchChange(fn: (branch: GatewayBranch) => void): () => void {
    this.branchSubscribers.push(fn);
    return () => {
      this.branchSubscribers = this.branchSubscribers.filter((s) => s !== fn);
    };
  }

  public onAudioChange(fn: (enabled: boolean) => void): () => void {
    this.audioSubscribers.push(fn);
    return () => {
      this.audioSubscribers = this.audioSubscribers.filter((s) => s !== fn);
    };
  }

  public setBranch(branch: GatewayBranch): void {
    if (this.isDisposed || this.branch === branch) return;
    this.branch = branch;
    this.branchSubscribers.forEach((fn) => fn(branch));
  }

  public toggleAudio(): boolean {
    if (this.isDisposed) return this.audioEnabled;
    this.audioEnabled = !this.audioEnabled;
    this.audioSubscribers.forEach((fn) => fn(this.audioEnabled));
    return this.audioEnabled;
  }

  public mount(rootElement: HTMLElement | null, config: GatewayConfig): void {
    this.rootElement = rootElement;
    this.config = config;
    this.isDisposed = false;
    if (config.initialAudioEnabled !== undefined) {
      this.audioEnabled = config.initialAudioEnabled;
    }
    if (config.defaultBranch !== undefined) {
      this.branch = config.defaultBranch;
    }

    if (typeof window !== 'undefined') {
      this.keydownListener = (e: KeyboardEvent) => this.handleKey(e);
      window.addEventListener('keydown', this.keydownListener);
    }
  }

  public handleKey(event: { key: string }): void {
    if (this.isDisposed || !this.config) return;

    const key = event.key.toLowerCase();
    if (key === 'd') {
      this.config.onLaunchDev();
    } else if (key === 'f') {
      this.config.onLaunchDrone();
    } else if (key === 'm') {
      this.toggleAudio();
    }
  }

  public dispose(): void {
    this.isDisposed = true;
    if (this.keydownListener && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.keydownListener);
      this.keydownListener = null;
    }
    this.rootElement = null;
    this.config = null;
    this.branchSubscribers = [];
    this.audioSubscribers = [];
  }
}
