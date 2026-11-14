import * as THREE from 'three';
import { FontLoader, type Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontData from '../assets/outfit_hero.typeface.json';
import type { NameLayout } from './ViewportLayoutPolicy';

/** Exact single-line values; do not change (see PROJECT_NOTES HeroName3D). */
const TEXT_SIZE = 1.65;
const TEXT_DEPTH = 0.44;
const CURVE_SEGMENTS = 8;
/** Gap between the two stacked lines, as a fraction of text size (bounding-box to bounding-box). */
export const STACKED_LINE_GAP = 0.34;

const LINES: Record<NameLayout, string[]> = {
  'single-line': ['JIMMY RUSS'],
  stacked: ['JIMMY', 'RUSS'],
};

let cachedFont: Font | null = null;
function getFont(): Font {
  if (!cachedFont) {
    const loader = new FontLoader();
    cachedFont = loader.parse(fontData as unknown as Parameters<typeof loader.parse>[0]);
  }
  return cachedFont;
}

/**
 * The hero's text meshes as one Group (rotated/translated as a unit by HeroName3D).
 * Single-line = one mesh; stacked = two centered line meshes with deliberate spacing.
 */
export class HeroNameMeshes {
  public readonly group = new THREE.Group();
  private layout: NameLayout | null = null;
  private readonly bounds = new THREE.Box3();

  constructor(private readonly materials: THREE.Material[]) {}

  public getLayout(): NameLayout | null {
    return this.layout;
  }

  public get lineCount(): number {
    return this.group.children.length;
  }

  /** Local-space bounds of all lines together (ignores group rotation/translation). */
  public getSize(): { width: number; height: number } {
    return { width: this.bounds.max.x - this.bounds.min.x, height: this.bounds.max.y - this.bounds.min.y };
  }

  /** Rebuilds the line meshes for a layout, disposing the previous geometries. No-op if unchanged. */
  public setLayout(layout: NameLayout): void {
    if (layout === this.layout) return;
    this.clear();
    this.layout = layout;
    const font = getFont();
    const geos = LINES[layout].map((line) => {
      const geo = new TextGeometry(line, {
        font,
        size: TEXT_SIZE,
        depth: TEXT_DEPTH,
        curveSegments: CURVE_SEGMENTS,
        bevelEnabled: false,
      });
      geo.center();
      geo.computeBoundingBox();
      return geo;
    });

    const heights = geos.map((g) => (g.boundingBox ? g.boundingBox.max.y - g.boundingBox.min.y : 0));
    const gap = geos.length > 1 ? TEXT_SIZE * STACKED_LINE_GAP : 0;
    const total = heights.reduce((a, h) => a + h, 0) + gap * (geos.length - 1);
    let top = total / 2;
    geos.forEach((geo, i) => {
      const mesh = new THREE.Mesh(geo, this.materials);
      mesh.position.y = top - heights[i] / 2;
      top -= heights[i] + gap;
      this.group.add(mesh);
    });
    this.group.updateMatrixWorld(true);
    this.bounds.setFromObject(this.group);
  }

  private clear(): void {
    for (const child of [...this.group.children]) {
      this.group.remove(child);
      (child as THREE.Mesh).geometry?.dispose();
    }
  }

  /** Disposes geometries only; the shared materials belong to the owner. */
  public dispose(): void {
    this.clear();
    this.layout = null;
  }
}
