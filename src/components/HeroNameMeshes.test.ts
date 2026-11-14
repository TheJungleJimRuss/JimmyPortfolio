import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { HeroNameMeshes } from './HeroNameMeshes';

const mats = () => [new THREE.MeshStandardMaterial(), new THREE.MeshStandardMaterial()];
const geoOf = (m: HeroNameMeshes, i: number) => (m.group.children[i] as THREE.Mesh).geometry;

describe('HeroNameMeshes', () => {
  it('single-line builds one mesh', () => {
    const m = new HeroNameMeshes(mats());
    m.setLayout('single-line');
    expect(m.lineCount).toBe(1);
  });

  it('stacked builds two centered line meshes with a gap and is taller/narrower than single-line', () => {
    const m = new HeroNameMeshes(mats());
    m.setLayout('single-line');
    const single = m.getSize();
    m.setLayout('stacked');
    expect(m.lineCount).toBe(2);
    const [a, b] = m.group.children as THREE.Mesh[];
    expect(a.position.y).toBeGreaterThan(0);
    expect(b.position.y).toBeLessThan(0);
    const hA = a.geometry.boundingBox!.max.y - a.geometry.boundingBox!.min.y;
    expect(a.position.y - b.position.y).toBeGreaterThan(hA);
    const stacked = m.getSize();
    expect(stacked.width).toBeLessThan(single.width);
    expect(stacked.height).toBeGreaterThan(single.height);
    expect(a.geometry.boundingBox!.min.x + a.geometry.boundingBox!.max.x).toBeCloseTo(0, 3);
  });

  it('switching disposes previous geometries and rebuilds', () => {
    const m = new HeroNameMeshes(mats());
    m.setLayout('stacked');
    const spies = [0, 1].map((i) => vi.spyOn(geoOf(m, i), 'dispose'));
    m.setLayout('single-line');
    spies.forEach((s) => expect(s).toHaveBeenCalledTimes(1));
    expect(m.lineCount).toBe(1);
    const spy = vi.spyOn(geoOf(m, 0), 'dispose');
    m.setLayout('single-line');
    expect(spy).not.toHaveBeenCalled();
    m.setLayout('stacked');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(m.lineCount).toBe(2);
  });

  it('dispose clears all meshes', () => {
    const m = new HeroNameMeshes(mats());
    m.setLayout('stacked');
    m.dispose();
    expect(m.lineCount).toBe(0);
  });

  it('shares both materials across every line', () => {
    const materials = mats();
    const m = new HeroNameMeshes(materials);
    m.setLayout('stacked');
    (m.group.children as THREE.Mesh[]).forEach((c) => expect(c.material).toBe(materials));
  });
});
