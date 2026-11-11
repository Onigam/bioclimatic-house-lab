import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';
import { joined, softBox, stick, uvMetric } from '../common';
import { BALCONY, BAY, RECESS_BAYS, X_EAST, X_WEST, Z_NORTH, Z_SOUTH, bayX } from '../dims';
import { groundY } from '../land/ground';
import type { Mats } from '../materials';
import { plain } from '../materials';
import { bx } from './geo';
import { knitMap, tiled } from '../textures';
import { buildChair } from '../room/furniture';

// The yard of a house that is lived in: a washing line with the week's wash, a wheelbarrow with a spade, a bucket by the stair, a vegetable bed, planks stacked against the gable, a chair and two pots on the balcony. Each
// stands on the ground at its own x and z (the tests measure it). Scenery: none of it is a part, all of it says someone lives here, and has hands.

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const part = (g: THREE.BufferGeometry, m: THREE.Material, cast = true): THREE.Mesh => {
  const o = new THREE.Mesh(g, m);
  o.castShadow = cast;
  o.receiveShadow = true;
  return o;
};

export interface Yard {
  group: THREE.Group;
  /** Things that stand on the ground, with where: for the tests (the lowest point of each against the land). */
  grounded: { object: THREE.Object3D; x: number; z: number }[];
  /** The chair, the pots and the boots on the balcony, in a group of their own: they stand on the balcony, not on the land, and follow it (hidden with it, exploded with it). */
  balcony: THREE.Group;
  /** The washing, swayed by the wind. */
  wash: THREE.Mesh[];
  update(time: number, wind: number): void;
}

/** A garment on a line: a hanging cloth, pinned at its top edge, with a ripple. Its top edge is at y = 0. */
function garment(w: number, h: number, color: number, mats: Mats, seed: number): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(w, h, 8, 10);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i);
    const v = pos.getY(i);
    const t = (h / 2 - v) / h;
    pos.setXYZ(i, u, v - h / 2, 0.015 * Math.sin(u * 16 + seed) * t + 0.01 * Math.sin(v * 9 + seed * 2) * t);
  }
  geo.computeVertexNormals();
  const m = mats.cloth.clone();
  m.color.set(color);
  m.side = THREE.DoubleSide;
  m.userData = { noShare: true };
  const o = part(geo, m);
  return o;
}

export function buildYard(mats: Mats): Yard {
  const group = new THREE.Group();
  group.name = 'yard';
  const grounded: Yard['grounded'] = [];
  const r = rng(404);
  const ground = (o: THREE.Object3D, x: number, z: number, ry = 0, lift = 0): void => {
    o.position.set(x, groundY(x, z) + lift, z);
    o.rotation.y = ry;
    group.add(o);
    grounded.push({ object: o, x, z });
  };

  // ---- the washing line: two posts, a line, seven garments pinned along it (a sheet, shirts, a towel, socks)
  const wash: THREE.Mesh[] = [];
  {
    const xl = X_WEST - 3.8;
    const z0 = 0.2;
    const z1 = 6.0;
    const hPost = 2.1;
    const line = new THREE.Group();
    line.name = 'washing-line';
    // each post is a thing of its own, set in the ground at its own foot, with its cross-arm
    for (const z of [z0, z1]) {
      const post = new THREE.Group();
      post.name = 'washing-post';
      post.add(
        part(
          joined([
            stick(V(xl, groundY(xl, z) - 0.4, z), V(xl, groundY(xl, z) + hPost, z), 0.045, 8),
            bx(xl - 0.3, groundY(xl, z) + hPost - 0.1, z - 0.025, xl + 0.3, groundY(xl, z) + hPost - 0.05, z + 0.025),
          ]),
          mats.timberDark,
        ),
      );
      group.add(post);
      grounded.push({ object: post, x: xl, z });
    }
    group.add(line);
    const yTop = (z: number): number => groundY(xl, z) + hPost - 0.1 - 0.0;
    const sag = (t: number): number => 0.11 * Math.sin(Math.PI * t);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const z = z0 + (z1 - z0) * t;
      pts.push(V(xl, yTop(z0) + (yTop(z1) - yTop(z0)) * t - sag(t), z));
    }
    const lineMesh = part(
      joined([new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.004, 5)]),
      plain(0x2a2a2a, 0.6),
      false,
    );
    line.add(lineMesh);
    const items: [number, number, number, number][] = [
      [0.12, 0.9, 1.3, 0xe9e3d0], // a sheet
      [0.3, 0.45, 0.62, 0x3d6f9c],
      [0.4, 0.45, 0.6, 0xb5543a],
      [0.52, 0.55, 0.9, 0xd9c27a],
      [0.63, 0.14, 0.2, 0x4a5a49],
      [0.68, 0.14, 0.2, 0x4a5a49],
      [0.78, 0.5, 0.65, 0x8a8f9a],
      [0.88, 0.5, 0.7, 0xe9e3d0],
    ];
    items.forEach(([t, w, h, c], i) => {
      const g = garment(w, h, c, mats, i * 1.7);
      const z = z0 + (z1 - z0) * t;
      g.position.set(xl, yTop(z0) + (yTop(z1) - yTop(z0)) * t - sag(t) - 0.0, z);
      g.rotation.y = Math.PI / 2;
      line.add(g);
      wash.push(g);
    });
  }

  // ---- a wheelbarrow with a spade in it, on the east side of the east gable
  {
    const wb = new THREE.Group();
    wb.name = 'wheelbarrow';
    const tub = softBox(0, 0.52, 0.0, 0.62, 0.3, 0.9, 0.05, 2);
    wb.add(part(tub, plain(0x3b6b4a, 0.5)));
    wb.add(
      part(
        joined([
          stick(V(-0.22, 0.45, 0.25), V(-0.3, 0.86, 0.92), 0.017, 6),
          stick(V(0.22, 0.45, 0.25), V(0.3, 0.86, 0.92), 0.017, 6),
          bx(-0.3, 0.0, -0.4, -0.27, 0.45, -0.37),
          bx(0.27, 0.0, -0.4, 0.3, 0.45, -0.37),
          bx(-0.3, 0.0, 0.3, -0.27, 0.45, 0.33),
          bx(0.27, 0.0, 0.3, 0.3, 0.45, 0.33),
        ]),
        mats.timber,
      ),
    );
    const wheel = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
    wheel.rotateZ(Math.PI / 2);
    wheel.translate(0, 0.2, -0.5);
    wb.add(part(wheel, plain(0x1c1c1c, 0.9)));
    // the spade, leant in the tub
    wb.add(part(joined([stick(V(0.08, 0.6, 0.2), V(0.18, 1.15, -0.1), 0.014, 6)]), mats.timber));
    wb.add(part(bx(0.12, 0.38, 0.2, 0.26, 0.7, 0.215), mats.steel));
    ground(wb, X_EAST + 1.7, -0.6, -0.5);
  }

  // ---- a bucket and a watering can by the stair's foot
  {
    const b = new THREE.Group();
    b.name = 'bucket';
    const body = uvMetric(new THREE.CylinderGeometry(0.17, 0.13, 0.28, 16));
    body.translate(0, 0.14, 0);
    b.add(part(body, mats.zinc));
    const handle = new THREE.TorusGeometry(0.15, 0.006, 4, 14, Math.PI);
    handle.translate(0, 0.28, 0);
    b.add(part(handle, mats.steel));
    ground(b, 1.5, Z_SOUTH + BALCONY.depth + 4.5);
  }

  // ---- a vegetable bed, east of the stair's path: a timber frame of boards on edge, soil, rows of leeks and cabbages
  {
    const bed = new THREE.Group();
    bed.name = 'vegetable-bed';
    const w = 3.0;
    const d = 1.4;
    const frame = joined([
      bx(-w / 2, 0, -d / 2, w / 2, 0.22, -d / 2 + 0.04),
      bx(-w / 2, 0, d / 2 - 0.04, w / 2, 0.22, d / 2),
      bx(-w / 2, 0, -d / 2, -w / 2 + 0.04, 0.22, d / 2),
      bx(w / 2 - 0.04, 0, -d / 2, w / 2, 0.22, d / 2),
    ]);
    bed.add(part(frame, mats.timber));
    bed.add(part(bx(-w / 2 + 0.04, 0.0, -d / 2 + 0.04, w / 2 - 0.04, 0.18, d / 2 - 0.04), plain(0x3d2c1e, 1), false));
    const leaves: THREE.BufferGeometry[] = [];
    for (let row = 0; row < 3; row++)
      for (let i = 0; i < 9; i++) {
        const g = new THREE.SphereGeometry(0.1 + 0.03 * r(), 7, 5);
        g.scale(1, 0.6, 1);
        g.translate(-w / 2 + 0.25 + i * 0.3 + 0.05 * (r() - 0.5), 0.24, -d / 2 + 0.25 + row * 0.45);
        leaves.push(g);
      }
    bed.add(part(joined(leaves), plain(0x5a7a34, 0.8)));
    ground(bed, 4.4, Z_SOUTH + BALCONY.depth + 3.6, 0.04, 0.0);
  }

  // ---- planks stacked against the west gable, under a sheet of roofing
  {
    const stack = new THREE.Group();
    stack.name = 'planks';
    const parts: THREE.BufferGeometry[] = [];
    for (let k = 0; k < 6; k++) parts.push(bx(-0.6, 0.12 + k * 0.045, -0.1, 0.6, 0.12 + k * 0.045 + 0.04, 0.1));
    parts.push(bx(-0.5, 0, -0.08, -0.4, 0.12, 0.08), bx(0.4, 0, -0.08, 0.5, 0.12, 0.08));
    stack.add(part(joined(parts), mats.timber));
    stack.add(part(bx(-0.65, 0.4, -0.14, 0.65, 0.415, 0.14), mats.zinc));
    ground(stack, X_WEST - 0.3 - 0.0, Z_NORTH + 1.8, Math.PI / 2, 0);
  }

  // ---- on the balcony: a chair, two pots of geraniums and a pair of boots at the rail
  const balcony = new THREE.Group();
  balcony.name = 'balcony-things';
  group.add(balcony);
  {
    const chair = buildChair(mats);
    chair.position.set(bayX(RECESS_BAYS[0]!) + 0.3, 0.0, Z_SOUTH + 0.65);
    chair.rotation.y = Math.PI - 0.35;
    balcony.add(chair);
    for (const [x, z] of [
      [bayX(RECESS_BAYS[1]!) + BAY * 0.38, Z_SOUTH + BALCONY.depth - 0.28],
      [bayX(RECESS_BAYS[0]!) - BAY * 0.38, Z_SOUTH + BALCONY.depth - 0.28],
    ] as const) {
      const pot = new THREE.Group();
      const body = uvMetric(new THREE.CylinderGeometry(0.16, 0.11, 0.24, 14));
      body.translate(0, 0.12, 0);
      pot.add(part(body, plain(0xb7683f, 0.7)));
      const leaves: THREE.BufferGeometry[] = [];
      for (let i = 0; i < 7; i++) {
        const g = new THREE.SphereGeometry(0.07, 7, 5);
        g.scale(1, 0.5, 1);
        g.translate(0.1 * Math.cos(i * 1.9), 0.3 + 0.06 * (i % 3), 0.1 * Math.sin(i * 1.9));
        leaves.push(g);
      }
      pot.add(part(joined(leaves), plain(0x4a7a34, 0.7)));
      const bloom: THREE.BufferGeometry[] = [];
      for (let i = 0; i < 5; i++) {
        const g = new THREE.SphereGeometry(0.035, 6, 4);
        g.translate(0.09 * Math.cos(i * 2.5), 0.4 + 0.02 * (i % 2), 0.09 * Math.sin(i * 2.5));
        bloom.push(g);
      }
      pot.add(part(joined(bloom), plain(0xc93a3a, 0.6)));
      pot.position.set(x, 0, z);
      balcony.add(pot);
    }
  }

  // a woven mat at the foot of the stair, and a boot scraper
  const mat = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.025, 0.45),
    new THREE.MeshStandardMaterial({ color: 0x8a6a3a, roughness: 1, map: tiled(knitMap(), 1 / 0.2) }),
  );
  mat.castShadow = false;
  mat.receiveShadow = true;
  ground(mat, 0.0, Z_SOUTH + BALCONY.depth + 4.55 + 0.3, 0, 0.01);

  return {
    group,
    grounded,
    balcony,
    wash,
    update(time, wind) {
      const a = 0.04 + 0.025 * Math.min(1, wind / 4);
      wash.forEach((g, i) => (g.rotation.x = a * Math.sin(time * 1.3 + i * 1.1)));
    },
  };
}
