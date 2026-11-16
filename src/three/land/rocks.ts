import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { joined, uvMetric } from '../common';
import { fbm } from '../textures';
import { groundY } from './ground';

// Granite outcrops and boulders, the plateau's rock: a rough icosphere pushed by two octaves of noise, flattened where it sits on the ground, its foot sunk a hand's breadth into the slope. Merged into one mesh, with a
// UV in metres so the granite map keeps its size. Placed by a seeded list, so the same stones lie where they lay.

export interface Boulder {
  x: number;
  z: number;
  r: number;
  /** Squash in y, and the share of its height sunk in the ground. */
  squash: number;
  sink: number;
  seed: number;
}

/** `smooth`: the icosphere's corners are shared before the normals are computed, so that the stone is round and not a polyhedron (the `site` keeps its stones as they were: `false`; the `wall`, which sees them at ten metres, asks for it). */
export function boulderGeometry(b: Boulder, y: number, detail = 3, smooth = false): THREE.BufferGeometry {
  let g: THREE.BufferGeometry = new THREE.IcosahedronGeometry(b.r, detail);
  g.deleteAttribute('uv');
  if (smooth) {
    g.deleteAttribute('normal');
    g = mergeVertices(g);
  }
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i).normalize();
    const n1 = fbm(v.x * 1.6 + b.seed, v.y * 1.6 + v.z * 1.3, 3) - 0.5;
    const n2 = fbm(v.x * 5 + b.seed * 2, v.z * 5 + v.y * 3, 2) - 0.5;
    // angular, blocky: the noise pulls the corners out, the facets are kept by rounding to a coarse grid of directions
    const k = 1 + 0.42 * n1 + 0.1 * n2;
    p.setXYZ(i, v.x * b.r * k * 1.15, v.y * b.r * k * b.squash, v.z * b.r * k);
  }
  g.computeVertexNormals();
  g.translate(b.x, y + b.r * b.squash * (1 - 2 * b.sink) * 0.5, b.z);
  return uvMetric(g);
}

/** A seeded list of boulders in a box, avoiding a rectangle (the house's yard). */
export function scatterBoulders(
  seed: number,
  n: number,
  box: { x0: number; x1: number; z0: number; z1: number },
  avoid: { x0: number; x1: number; z0: number; z1: number },
  r0 = 0.5,
  r1 = 1.8,
): Boulder[] {
  const r = rng(seed);
  const out: Boulder[] = [];
  let guard = 0;
  while (out.length < n && guard++ < n * 30) {
    const x = box.x0 + r() * (box.x1 - box.x0);
    const z = box.z0 + r() * (box.z1 - box.z0);
    if (x > avoid.x0 && x < avoid.x1 && z > avoid.z0 && z < avoid.z1) continue;
    const s = r0 + (r1 - r0) * Math.pow(r(), 2.2);
    out.push({ x, z, r: s, squash: 0.55 + 0.25 * r(), sink: 0.28 + 0.18 * r(), seed: r() * 50 });
  }
  return out;
}

/** The boulders as one mesh in the granite material; each stands on the ground at its own x and z. */
export function boulderMesh(list: Boulder[], material: THREE.Material, detail = 3): THREE.Mesh {
  const parts = list.map((b) => boulderGeometry(b, groundY(b.x, b.z), detail));
  const m = new THREE.Mesh(joined(parts), material);
  m.name = 'boulders';
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}
