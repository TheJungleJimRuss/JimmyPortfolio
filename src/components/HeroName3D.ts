import * as THREE from 'three';
import { HeroNameMeshes } from './HeroNameMeshes';
import type { NameLayout } from './ViewportLayoutPolicy';
import {
  DEFAULT_HERO_INPUT_PROFILE,
  idleSway,
  pixelRatioCap,
  type HeroInputProfile,
} from './HeroMotion';

export type GlowState = 'none' | 'dev' | 'drone';

export class HeroName3D {
  private initialized = false;
  private glowState: GlowState = 'none';
  private readonly baseRot = { x: 0, y: 0 };
  private targetRot = { x: 0, y: 0 };
  private readonly basePos = { x: 0, y: 0 };
  private targetPos = { x: 0, y: 0 };
  private readonly targetFrontEmissive = new THREE.Color(0x000000);
  private readonly targetSidesEmissive = new THREE.Color(0x000000);
  private targetFrontIntensity = 0;
  private targetSidesIntensity = 0;
  private readonly targetFrontColor = new THREE.Color(0xf4f5f8);
  private readonly targetSidesColor = new THREE.Color(0x525c6d);
  private readonly targetPointLightColor = new THREE.Color(0xffffff);
  private targetPointLightIntensity = 1.5;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private meshes: HeroNameMeshes | null = null;
  private nameLayout: NameLayout = 'single-line';
  private materials: THREE.MeshStandardMaterial[] = [];
  private pointLight: THREE.PointLight | null = null;
  private animFrameId: number | null = null;

  private resizeObserver: ResizeObserver | null = null;
  private profile: HeroInputProfile = { ...DEFAULT_HERO_INPUT_PROFILE };
  private dragging = false;
  /** Phone-rotation pose (normalized); null when unavailable. Replaces idle sway while set. */
  private orientationTilt: { x: number; y: number } | null = null;
  /** Frames left to render while motion is off (static frame only when something changed). */
  private dirtyFrames = 0;
  private lastFrameTime = 0;

  public init(container: HTMLElement, canvas: HTMLCanvasElement | null): void {
    this.initialized = true;
    if (!canvas || typeof window === 'undefined') return;

    try {
      const testCanvas = document.createElement('canvas');
      const hasWebGL = Boolean(
        typeof window !== 'undefined' &&
        window.WebGLRenderingContext &&
        (testCanvas.getContext('webgl2') || testCanvas.getContext('webgl'))
      );
      if (!hasWebGL) return;

      this.scene = new THREE.Scene();
      const width = canvas.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
      const height = canvas.clientHeight || 200;
      const aspect = Math.max(0.5, width / height);
      this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      if (!this.renderer.getContext()) return;

      container.classList.add('has-3d');
      this.renderer.setSize(width, height, false);
      this.applyPixelRatio();

      if (typeof ResizeObserver !== 'undefined') {
        this.resizeObserver = new ResizeObserver(() => {
          this.updateCameraDistance();
          this.dirtyFrames = 3;
        });
        this.resizeObserver.observe(canvas.parentElement ?? container);
      }

      // Studio Lighting: Ambient, Key, Fill, and Interactive Point Light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.45);
      this.scene.add(ambientLight);

      const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
      keyLight.position.set(4, 7, 6);
      this.scene.add(keyLight);

      const fillLight = new THREE.DirectionalLight(0x8894a4, 1.2);
      fillLight.position.set(-5, -3, 4);
      this.scene.add(fillLight);

      this.pointLight = new THREE.PointLight(0xffffff, 1.5, 20);
      this.pointLight.position.set(0, 2, 5);
      this.scene.add(this.pointLight);

      // Matte Architectural Solid Materials (Non-Metallic, Zero Edge Bevel)
      const matFront = new THREE.MeshStandardMaterial({
        color: 0xf4f5f8,
        metalness: 0.0,
        roughness: 0.88,
      });
      const matSides = new THREE.MeshStandardMaterial({
        color: 0x525c6d,
        metalness: 0.0,
        roughness: 0.88,
      });
      this.materials = [matFront, matSides];

      // Font is parsed synchronously (zero network latency) inside HeroNameMeshes
      this.buildGeometry();

      this.startRenderLoop();
    } catch {
      container.classList.remove('has-3d');
    }
  }

  private buildGeometry(): void {
    if (!this.scene) return;
    if (!this.meshes) {
      this.meshes = new HeroNameMeshes(this.materials);
      this.meshes.group.rotation.set(this.baseRot.x, this.baseRot.y, 0);
      this.scene.add(this.meshes.group);
    }
    this.meshes.setLayout(this.nameLayout);
    this.setGlowState(this.glowState, true);
    this.updateCameraDistance();
  }

  /** Stacked (two lines) vs single-line. Rebuilds the meshes live; no reload. */
  public setNameLayout(layout: NameLayout): void {
    this.nameLayout = layout;
    if (!this.meshes) return;
    this.meshes.setLayout(layout);
    this.updateCameraDistance();
    this.dirtyFrames = 60;
  }

  public getNameLayout(): NameLayout {
    return this.nameLayout;
  }

  private updateCameraDistance(): void {
    if (!this.camera || !this.renderer) return;
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
    const w = (rect && rect.width > 0 ? rect.width : canvas.clientWidth) || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const h = (rect && rect.height > 0 ? rect.height : canvas.clientHeight) || 200;
    const aspect = Math.max(0.5, w / h);
    this.camera.aspect = aspect;

    if (this.meshes && this.meshes.lineCount > 0) {
      const { width: textW, height: textH } = this.meshes.getSize();
      const halfFovRad = (this.camera.fov * Math.PI) / 360;
      const stacked = this.nameLayout === 'stacked';
      // Narrow single-line gets generous clearance so yaw and parallax never clip.
      // Stacked bounds are far narrower, so the same drift margin allows a larger fill.
      const fillFraction = stacked ? 0.78 : aspect < 2.8 ? 0.60 : 0.80;
      const heightFill = stacked ? 0.74 : 0.65;
      const targetW = (textW * 1.15 + 0.9) / fillFraction;
      const targetH = (textH + 0.45) / heightFill;
      const zForWidth = (targetW / 2) / (Math.tan(halfFovRad) * aspect);
      const zForHeight = (targetH / 2) / Math.tan(halfFovRad);
      const z = Math.max(zForWidth, zForHeight);
      this.camera.position.set(0, 0, z);
      // Publish where the resting text ends (px from the anchor's top) so overlays like the drag hint sit right under it.
      const visibleH = 2 * z * Math.tan(halfFovRad);
      const textBottomPx = canvas.offsetTop + (0.5 + textH / 2 / visibleH) * h;
      canvas.parentElement?.style.setProperty('--hero-text-bottom', `${Math.round(textBottomPx)}px`);
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  private applyPixelRatio(): void {
    if (!this.renderer || typeof window === 'undefined') return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, pixelRatioCap(this.profile.inputMode)));
  }

  /** Pushed from the shared viewport layout adapter; the hero never queries matchMedia itself. */
  public setInputProfile(profile: HeroInputProfile): void {
    this.profile = { ...profile };
    this.applyPixelRatio();
    if (!profile.tiltEnabled) {
      this.dragging = false;
      this.orientationTilt = null;
    }
    if (!profile.tiltEnabled || (profile.inputMode === 'touch' && !this.dragging)) {
      this.applyRestPose();
    }
    this.updateCameraDistance();
    this.dirtyFrames = 60;
  }

  /** Touch drag begin/end. Release eases back to rest through the render loop lerp. */
  public setDragging(active: boolean): void {
    this.dragging = active && this.profile.tiltEnabled;
    if (!active) this.applyRestPose();
  }

  /** Rotation pose when available, else centered. Used wherever the hero eases back to rest. */
  private applyRestPose(): void {
    const o = this.profile.tiltEnabled && this.profile.inputMode === 'touch' ? this.orientationTilt : null;
    this.applyNormalized(o?.x ?? 0, o?.y ?? 0);
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
    this.applyNormalized(s.x, s.y);
  }

  public getGlowState(): GlowState {
    return this.glowState;
  }

  public getTargetRotation(): { x: number; y: number } {
    return { ...this.targetRot };
  }

  public getTargetPosition(): { x: number; y: number } {
    return { ...this.targetPos };
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public getEmissiveConfig(): { frontIntensity: number; sidesIntensity: number; frontHex: number } {
    return {
      frontIntensity: this.targetFrontIntensity,
      sidesIntensity: this.targetSidesIntensity,
      frontHex: this.targetFrontEmissive.getHex(),
    };
  }

  public setGlowState(state: GlowState, immediate = false): void {
    this.glowState = state;
    this.dirtyFrames = 60;
    if (this.glowState === 'dev') {
      this.targetFrontEmissive.setHex(0x00ff41);
      this.targetFrontIntensity = 1.4;
      this.targetSidesEmissive.setHex(0x00cc33);
      this.targetSidesIntensity = 0.9;
      this.targetFrontColor.setHex(0xd6f7df);
      this.targetSidesColor.setHex(0x386644);
      this.targetPointLightColor.setHex(0x00ff41);
      this.targetPointLightIntensity = 1.8;
    } else {
      // 'none' or 'drone' (drone has no glow effect; deferred for later)
      this.targetFrontEmissive.setHex(0x000000);
      this.targetFrontIntensity = 0;
      this.targetSidesEmissive.setHex(0x000000);
      this.targetSidesIntensity = 0;
      this.targetFrontColor.setHex(0xf4f5f8);
      this.targetSidesColor.setHex(0x525c6d);
      this.targetPointLightColor.setHex(0xffffff);
      this.targetPointLightIntensity = 1.5;
    }

    if (immediate) {
      if (this.materials.length >= 2) {
        const [front, sides] = this.materials;
        front.emissive.copy(this.targetFrontEmissive);
        front.emissiveIntensity = this.targetFrontIntensity;
        front.color.copy(this.targetFrontColor);
        sides.emissive.copy(this.targetSidesEmissive);
        sides.emissiveIntensity = this.targetSidesIntensity;
        sides.color.copy(this.targetSidesColor);
      }
      if (this.pointLight) {
        this.pointLight.color.copy(this.targetPointLightColor);
        this.pointLight.intensity = this.targetPointLightIntensity;
      }
    }
  }

  public updatePointer(normalizedX: number, normalizedY: number): void {
    if (!this.profile.tiltEnabled) return;
    if (this.profile.inputMode === 'touch' && !this.dragging) return;
    this.applyNormalized(normalizedX, normalizedY);
  }

  private applyNormalized(normalizedX: number, normalizedY: number): void {
    this.dirtyFrames = 60;
    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));
    this.targetRot.y = this.baseRot.y + clampedX * 0.55;
    this.targetRot.x = this.baseRot.x + clampedY * 0.35;
    this.targetPos.x = this.basePos.x + clampedX * 0.45;
    this.targetPos.y = this.basePos.y + clampedY * 0.22;

    if (this.pointLight) {
      this.pointLight.position.x = clampedX * 5.5;
      this.pointLight.position.y = clampedY * 3.5 + 1;
    }
  }

  private startRenderLoop(): void {
    const loop = (now: number = performance.now()) => {
      // 0.14 per frame at 60fps, scaled by elapsed time so it is frame-rate independent
      const dt = this.lastFrameTime ? Math.min((now - this.lastFrameTime) / 1000, 0.1) : 1 / 60;
      this.lastFrameTime = now;
      const k = 1 - Math.pow(1 - 0.14, dt * 60);
      this.updateIdle(now);
      if (this.meshes) {
        const g = this.meshes.group;
        g.rotation.y += (this.targetRot.y - g.rotation.y) * k;
        g.rotation.x += (this.targetRot.x - g.rotation.x) * k;
        g.position.x += (this.targetPos.x - g.position.x) * k;
        g.position.y += (this.targetPos.y - g.position.y) * k;
      }

      // Smooth buttery color, emissive, & light interpolation
      if (this.materials.length >= 2) {
        const [front, sides] = this.materials;
        const colorLerpSpeed = 0.10;
        const intensityLerpSpeed = 0.12;
        front.color.lerp(this.targetFrontColor, colorLerpSpeed);
        front.emissive.lerp(this.targetFrontEmissive, colorLerpSpeed);
        front.emissiveIntensity += (this.targetFrontIntensity - front.emissiveIntensity) * intensityLerpSpeed;
        sides.color.lerp(this.targetSidesColor, colorLerpSpeed);
        sides.emissive.lerp(this.targetSidesEmissive, colorLerpSpeed);
        sides.emissiveIntensity += (this.targetSidesIntensity - sides.emissiveIntensity) * intensityLerpSpeed;
      }

      if (this.pointLight) {
        this.pointLight.color.lerp(this.targetPointLightColor, 0.10);
        this.pointLight.intensity += (this.targetPointLightIntensity - this.pointLight.intensity) * 0.12;
      }

      // Reduced motion: render a static frame only while something is still changing.
      const needsRender = this.profile.tiltEnabled || this.dirtyFrames > 0;
      if (this.dirtyFrames > 0) this.dirtyFrames--;
      if (needsRender && this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public triggerBurst(branch: 'dev' | 'drone'): Promise<void> {
    this.setGlowState(branch);
    if (this.meshes) {
      this.meshes.group.scale.set(1.15, 1.15, 1.15);
    }
    return new Promise((resolve) => setTimeout(resolve, 400));
  }

  public dispose(): void {
    this.initialized = false;
    if (this.animFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animFrameId);
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.meshes?.dispose();
    this.meshes = null;
    this.materials.forEach((m) => m.dispose());
    this.scene = null;
    this.camera = null;
    this.renderer?.dispose();
    this.renderer = null;
  }
}
