import * as THREE from 'three';
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontData from '../assets/outfit_hero.typeface.json';

export type GlowState = 'none' | 'dev' | 'drone';

export class HeroName3D {
  private initialized = false;
  private glowState: GlowState = 'none';
  private readonly baseRot = { x: 0.1, y: -0.15 };
  private targetRot = { x: 0.1, y: -0.15 };
  private readonly targetFrontEmissive = new THREE.Color(0x000000);
  private readonly targetSidesEmissive = new THREE.Color(0x000000);
  private targetFrontIntensity = 0;
  private targetSidesIntensity = 0;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;
  private textMesh: THREE.Mesh | null = null;
  private materials: THREE.MeshStandardMaterial[] = [];
  private pointLight: THREE.PointLight | null = null;
  private animFrameId: number | null = null;

  private resizeListener: (() => void) | null = null;

  public init(container: HTMLElement, canvas: HTMLCanvasElement | null): void {
    this.initialized = true;
    if (!canvas || typeof window === 'undefined') return;

    try {
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return;

      this.scene = new THREE.Scene();
      const width = canvas.clientWidth || (typeof window !== 'undefined' ? window.innerWidth : 800);
      const height = canvas.clientHeight || 200;
      const aspect = Math.max(0.5, width / height);
      this.camera = new THREE.PerspectiveCamera(38, aspect, 0.1, 100);
      this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      if (!this.renderer.getContext()) return;

      container.classList.add('has-3d');
      this.renderer.setSize(width, height, false);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      this.resizeListener = () => {
        this.updateCameraDistance();
      };
      window.addEventListener('resize', this.resizeListener);

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

      // Parse 3D Font synchronously (zero network latency)
      const loader = new FontLoader();
      const font = loader.parse(fontData as unknown as Parameters<typeof loader.parse>[0]);
      this.buildGeometry(font);

      this.startRenderLoop();
    } catch {
      container.classList.remove('has-3d');
    }
  }

  private buildGeometry(font: Font): void {
    if (!this.scene) return;
    const geo = new TextGeometry('JIMMY RUSS', {
      font,
      size: 1.65,
      depth: 0.44,
      curveSegments: 8,
      bevelEnabled: false,
    });
    geo.center();

    this.textMesh = new THREE.Mesh(geo, this.materials);
    this.textMesh.rotation.x = this.baseRot.x;
    this.textMesh.rotation.y = this.baseRot.y;
    this.scene.add(this.textMesh);
    this.setGlowState(this.glowState, true);
    this.updateCameraDistance();
  }

  private updateCameraDistance(): void {
    if (!this.camera || !this.renderer) return;
    const canvas = this.renderer.domElement;
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
    const w = (rect && rect.width > 0 ? rect.width : canvas.clientWidth) || (typeof window !== 'undefined' ? window.innerWidth : 800);
    const h = (rect && rect.height > 0 ? rect.height : canvas.clientHeight) || 200;
    const aspect = Math.max(0.5, w / h);
    this.camera.aspect = aspect;

    if (this.textMesh && this.textMesh.geometry) {
      const geo = this.textMesh.geometry;
      if (!geo.boundingBox) geo.computeBoundingBox();
      const bb = geo.boundingBox;
      if (bb) {
        const textW = bb.max.x - bb.min.x;
        const textH = bb.max.y - bb.min.y;
        const halfFovRad = (this.camera.fov * Math.PI) / 360;
        // On mobile / narrow viewports (aspect < 2.8), give generous clearance so isometric yaw never clips
        const fillFraction = aspect < 2.8 ? 0.62 : 0.82;
        const targetW = (textW * 1.12) / fillFraction;
        const targetH = textH / 0.65;
        const zForWidth = (targetW / 2) / (Math.tan(halfFovRad) * aspect);
        const zForHeight = (targetH / 2) / Math.tan(halfFovRad);
        const z = Math.max(zForWidth, zForHeight);
        this.camera.position.set(0, 0, z);
      }
    }
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  public getGlowState(): GlowState {
    return this.glowState;
  }

  public getTargetRotation(): { x: number; y: number } {
    return { ...this.targetRot };
  }

  public isInitialized(): boolean {
    return this.initialized;
  }

  public setGlowState(state: GlowState, immediate = false): void {
    this.glowState = state;
    if (this.glowState === 'dev') {
      this.targetFrontEmissive.setHex(0x00ff41);
      this.targetFrontIntensity = 1.0;
      this.targetSidesEmissive.setHex(0x00cc33);
      this.targetSidesIntensity = 0.8;
    } else if (this.glowState === 'drone') {
      this.targetFrontEmissive.setHex(0x64b5f6);
      this.targetFrontIntensity = 1.0;
      this.targetSidesEmissive.setHex(0x42a5f5);
      this.targetSidesIntensity = 0.8;
    } else {
      this.targetFrontIntensity = 0;
      this.targetSidesIntensity = 0;
    }

    if (immediate && this.materials.length >= 2) {
      const [front, sides] = this.materials;
      front.emissive.copy(this.targetFrontEmissive);
      front.emissiveIntensity = this.targetFrontIntensity;
      sides.emissive.copy(this.targetSidesEmissive);
      sides.emissiveIntensity = this.targetSidesIntensity;
    }
  }

  public updatePointer(normalizedX: number, normalizedY: number): void {
    const clampedX = Math.max(-1, Math.min(1, normalizedX));
    const clampedY = Math.max(-1, Math.min(1, normalizedY));
    this.targetRot.y = this.baseRot.y + clampedX * 0.28;
    this.targetRot.x = this.baseRot.x - clampedY * 0.18;

    if (this.pointLight) {
      this.pointLight.position.x = clampedX * 4;
      this.pointLight.position.y = -clampedY * 2.5 + 1;
    }
  }

  private startRenderLoop(): void {
    const loop = () => {
      if (this.textMesh) {
        this.textMesh.rotation.y += (this.targetRot.y - this.textMesh.rotation.y) * 0.12;
        this.textMesh.rotation.x += (this.targetRot.x - this.textMesh.rotation.x) * 0.12;
      }

      // Smooth buttery color & glow intensity interpolation
      if (this.materials.length >= 2) {
        const [front, sides] = this.materials;
        const colorLerpSpeed = 0.08;
        const intensityLerpSpeed = 0.09;
        front.emissive.lerp(this.targetFrontEmissive, colorLerpSpeed);
        front.emissiveIntensity += (this.targetFrontIntensity - front.emissiveIntensity) * intensityLerpSpeed;
        sides.emissive.lerp(this.targetSidesEmissive, colorLerpSpeed);
        sides.emissiveIntensity += (this.targetSidesIntensity - sides.emissiveIntensity) * intensityLerpSpeed;
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  public triggerBurst(branch: 'dev' | 'drone'): Promise<void> {
    this.setGlowState(branch);
    if (this.textMesh) {
      this.textMesh.scale.set(1.15, 1.15, 1.15);
    }
    return new Promise((resolve) => setTimeout(resolve, 400));
  }

  public dispose(): void {
    this.initialized = false;
    if (this.animFrameId && typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(this.animFrameId);
    }
    if (this.resizeListener && typeof window !== 'undefined') {
      window.removeEventListener('resize', this.resizeListener);
      this.resizeListener = null;
    }
    this.materials.forEach((m) => m.dispose());
    this.scene = null;
    this.camera = null;
    this.renderer?.dispose();
    this.renderer = null;
  }
}
