import * as THREE from 'three';
import { joined, softBox, uvMetric } from '../common';
import { bx } from '../house/geo';
import type { Mats } from '../materials';
import { plain } from '../materials';
import { clothMap, knitMap, rugMap, tiled } from '../textures';

// What a family leaves in a room: the furniture of the living room, a blanket over the armchair, a drying rack with the washing, a lamp, books, a rug, a plant, boots by the door. Every one built from boxes, lathes and thin
// extrusions merged per material, in its own frame (feet on y = 0). Scenery that says someone lives here: none of it is a part, but the armchair. Sizes are an estimate of the time's furniture. UVs in metres.

const part = (g: THREE.BufferGeometry, m: THREE.Material, cast = true): THREE.Mesh => {
  const o = new THREE.Mesh(g, m);
  o.castShadow = cast;
  o.receiveShadow = true;
  return o;
};
const cyl = (r0: number, r1: number, h: number, seg = 12): THREE.BufferGeometry =>
  uvMetric(new THREE.CylinderGeometry(r0, r1, h, seg));
const fabric = (mats: Mats, color: number, rough = 1): THREE.MeshStandardMaterial => {
  const m = mats.cloth.clone();
  m.color.set(color);
  m.roughness = rough;
  m.userData = { noShare: true };
  return m;
};

/** A ladder-back chair, facing +z, its feet at y = 0. */
export function buildChair(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.name = 'chair';
  const p: THREE.BufferGeometry[] = [bx(-0.21, 0.43, -0.2, 0.21, 0.47, 0.2)];
  for (const sx of [-0.18, 0.18])
    for (const sz of [-0.17, 0.17]) p.push(bx(sx - 0.016, 0, sz - 0.016, sx + 0.016, 0.43, sz + 0.016));
  for (const sx of [-0.18, 0.18]) p.push(bx(sx - 0.016, 0.47, -0.2, sx + 0.016, 0.92, -0.17));
  for (const y of [0.62, 0.78]) p.push(bx(-0.18, y, -0.2, 0.18, y + 0.05, -0.185));
  p.push(bx(-0.18, 0.12, -0.17, 0.18, 0.135, -0.155), bx(-0.18, 0.12, 0.155, 0.18, 0.135, 0.17));
  g.add(part(joined(p), mats.timber));
  return g;
}

/** A table of oak boards, with a cloth runner, a teapot, two cups, a bowl of apples and a pile of papers on it. 1.4 × 0.8. */
export function buildTable(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.name = 'table';
  const top = bx(-0.7, 0.72, -0.4, 0.7, 0.76, 0.4);
  const legs: THREE.BufferGeometry[] = [];
  for (const sx of [-0.64, 0.64])
    for (const sz of [-0.34, 0.34]) legs.push(bx(sx - 0.03, 0, sz - 0.03, sx + 0.03, 0.72, sz + 0.03));
  legs.push(bx(-0.64, 0.64, -0.3, 0.64, 0.72, -0.28), bx(-0.64, 0.64, 0.28, 0.64, 0.72, 0.3));
  g.add(part(top, mats.oak));
  g.add(part(joined(legs), mats.timber));
  // runner: a woven strip along the table's length
  g.add(part(bx(-0.5, 0.76, -0.1, 0.5, 0.762, 0.1), fabric(mats, 0x9d4b36), false));
  // teapot: a belly, a spout, a lid
  const pot: THREE.BufferGeometry[] = [];
  const belly = new THREE.SphereGeometry(0.075, 14, 10);
  belly.scale(1, 0.85, 1);
  belly.translate(0, 0.762 + 0.065, 0);
  pot.push(belly);
  const lid = new THREE.SphereGeometry(0.04, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  lid.translate(0, 0.762 + 0.125, 0);
  pot.push(lid);
  const spout = new THREE.CylinderGeometry(0.01, 0.018, 0.1, 8);
  spout.rotateZ(-0.9);
  spout.translate(0.1, 0.762 + 0.085, 0);
  pot.push(spout);
  const handle = new THREE.TorusGeometry(0.042, 0.007, 6, 12, Math.PI);
  handle.rotateZ(Math.PI / 2 + 0.2);
  handle.translate(-0.08, 0.762 + 0.07, 0);
  pot.push(handle);
  const potMesh = part(joined(pot), plain(0xd8d2c4, 0.35));
  potMesh.position.set(-0.15, 0, 0.0);
  g.add(potMesh);
  for (const [x, z] of [
    [0.1, 0.18],
    [0.28, -0.12],
  ] as const) {
    const cup = new THREE.Mesh(cyl(0.04, 0.032, 0.075, 14), plain(0xdad4c6, 0.4));
    cup.position.set(x, 0.762 + 0.0375, z);
    cup.castShadow = true;
    g.add(cup);
  }
  // a bowl of apples
  const bowl = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
    plain(0x6a4b30, 0.7),
  );
  bowl.position.set(0.45, 0.762 + 0.1, -0.2);
  bowl.scale.set(1, 0.55, 1);
  bowl.castShadow = true;
  g.add(bowl);
  const apples: THREE.BufferGeometry[] = [];
  for (const [dx, dz, dy] of [
    [0.0, 0.0, 0.05],
    [0.05, 0.03, 0.04],
    [-0.04, 0.04, 0.045],
    [0.0, -0.05, 0.04],
  ] as const) {
    const a = new THREE.SphereGeometry(0.032, 8, 6);
    a.translate(0.45 + dx, 0.762 + dy + 0.03, -0.2 + dz);
    apples.push(a);
  }
  g.add(part(joined(apples), plain(0xa83a2a, 0.5)));
  // a pile of papers and a pen
  g.add(
    part(
      joined([bx(-0.55, 0.762, 0.12, -0.33, 0.776, 0.32), bx(-0.52, 0.776, 0.14, -0.31, 0.782, 0.3)]),
      plain(0xece6d6, 0.9),
      false,
    ),
  );
  g.add(part(bx(-0.3, 0.762, 0.2, -0.16, 0.768, 0.212), plain(0x203a6a, 0.4), false));
  return g;
}

export interface ArmchairBuild {
  group: THREE.Group;
  /** The blanket thrown over its back. */
  blanket: THREE.Mesh;
}

/** An armchair of timber and a green fabric, facing +z, with a knitted blanket thrown over the back and arm. 0.85 × 0.82. */
export function buildArmchair(mats: Mats): ArmchairBuild {
  const group = new THREE.Group();
  group.name = 'armchair';
  const wood: THREE.BufferGeometry[] = [];
  for (const sx of [-0.38, 0.38])
    for (const sz of [-0.34, 0.34]) wood.push(bx(sx - 0.025, 0, sz - 0.025, sx + 0.025, 0.2, sz + 0.025));
  wood.push(bx(-0.42, 0.2, -0.38, 0.42, 0.26, 0.38));
  group.add(part(joined(wood), mats.timberDark));
  const cloth = fabric(mats, 0x5b7352);
  const parts: THREE.BufferGeometry[] = [];
  parts.push(softBox(0, 0.34, 0.04, 0.62, 0.14, 0.64, 0.05, 3));
  // back: tilted back a little
  const back = softBox(0, 0, 0, 0.82, 0.58, 0.14, 0.05, 3);
  back.rotateX(-0.16);
  back.translate(0, 0.66, -0.3);
  parts.push(back);
  for (const sx of [-0.37, 0.37]) parts.push(softBox(sx, 0.5, 0.02, 0.12, 0.42, 0.7, 0.04, 3));
  group.add(part(joined(parts), cloth));
  // blanket: a rectangle of knit draped from the back over the seat's left corner: displaced plane
  const W = 0.62;
  const Hh = 1.0;
  const geo = new THREE.PlaneGeometry(W, Hh, 14, 20);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const u = pos.getX(i);
    const v = pos.getY(i);
    // v from −Hh/2 (hanging end) to +Hh/2 (over the back's top): the cloth follows the back's slope, then the seat
    const t = (v + Hh / 2) / Hh;
    const ripple = 0.012 * Math.sin(u * 22 + t * 6) + 0.008 * Math.sin(u * 9 - t * 11);
    // along the cloth: from the back's top (t = 1) it goes down the back's front, across the seat
    const y = 0.97 - (1 - t) * 0.62 * (t > 0.5 ? 1 : 0.55);
    const z = -0.27 + (1 - t) * (t > 0.45 ? 0.2 : 0.95);
    pos.setXYZ(i, u + 0.18, y + ripple * 0.5, z + ripple);
  }
  geo.computeVertexNormals();
  const blanketMat = new THREE.MeshStandardMaterial({
    color: 0xc97b4a,
    roughness: 1,
    map: tiled(knitMap(), 1 / 0.3),
    side: THREE.DoubleSide,
  });
  blanketMat.userData = { noShare: true };
  const blanket = part(geo, blanketMat);
  blanket.name = 'blanket';
  group.add(blanket);
  return { group, blanket };
}

/** A bookshelf against a wall, facing +z: five shelves, books of a dozen colours, a few lying flat, a clock. 1.1 wide. */
export function buildBookshelf(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.name = 'bookshelf';
  const frame: THREE.BufferGeometry[] = [
    bx(-0.55, 0, -0.14, -0.53, 1.9, 0.14),
    bx(0.53, 0, -0.14, 0.55, 1.9, 0.14),
    bx(-0.55, 1.88, -0.14, 0.55, 1.9, 0.14),
    bx(-0.55, 0, -0.14, 0.55, 0.04, 0.14),
    bx(-0.55, 0, -0.14, 0.55, 1.9, -0.13),
  ];
  const ys = [0.04, 0.4, 0.78, 1.16, 1.52];
  for (const y of ys) frame.push(bx(-0.55, y, -0.14, 0.55, y + 0.02, 0.14));
  g.add(part(joined(frame), mats.timberDark));
  const colors = [0x7a2f2a, 0x2f4d6a, 0x8a7a3a, 0x3d5a40, 0xb08a5b, 0x4a3a2a, 0x8a4a5a, 0xc8bfa8];
  const buckets = new Map<number, THREE.BufferGeometry[]>();
  let seed = 7;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  for (let s = 0; s < ys.length; s++) {
    const y0 = ys[s]! + 0.02;
    const h = s === 0 ? 0.3 : 0.32;
    let x = -0.51;
    while (x < 0.48) {
      const w = 0.022 + rnd() * 0.03;
      const bh = h * (0.7 + 0.28 * rnd());
      const c = colors[Math.floor(rnd() * colors.length)]!;
      const arr = buckets.get(c) ?? [];
      arr.push(bx(x, y0, -0.1, x + w, y0 + bh, 0.1));
      buckets.set(c, arr);
      x += w + 0.002;
      if (rnd() < 0.05) x += 0.1;
    }
  }
  // a few lying on the top shelf
  buckets.set(0x8a7a3a, [
    ...(buckets.get(0x8a7a3a) ?? []),
    bx(-0.4, 1.9, -0.1, 0.0, 1.93, 0.12),
    bx(-0.38, 1.93, -0.08, -0.02, 1.96, 0.1),
  ]);
  for (const [c, arr] of buckets) g.add(part(joined(arr), plain(c, 0.85), false));
  return g;
}

/** A folding drying rack, A-frames of thin timber, with the washing on it: shirts, a towel, socks. 0.9 wide, 1.2 high. */
export function buildDryingRack(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.name = 'drying-rack';
  const wood: THREE.BufferGeometry[] = [];
  for (const sz of [-0.25, 0.25]) {
    // two legs of an A, and rails across at four heights
    for (const dz of [-0.2, 0.2]) {
      const leg = new THREE.BoxGeometry(0.025, 1.18, 0.025);
      leg.rotateX(-Math.sign(dz) * 0.17);
      leg.translate(0, 0.59, sz + dz * 0.5);
      for (const sx of [-0.45, 0.45]) {
        const c = leg.clone();
        c.translate(sx, 0, 0);
        wood.push(uvMetric(c));
      }
      leg.dispose();
    }
  }
  for (const y of [0.35, 0.65, 0.95, 1.15]) {
    for (const dz of [-0.25, 0.25]) wood.push(bx(-0.45, y - 0.011, dz - 0.011, 0.45, y + 0.011, dz + 0.011));
  }
  g.add(part(joined(wood), mats.timber));
  const colors: [number, number][] = [
    [0x2f6f9c, 0.65],
    [0xd8d0b4, 0.95],
    [0xa84a3a, 0.65],
    [0x5d8a4a, 0.95],
  ];
  // washing: each a thin, hanging cloth over a rail (a bent sheet: top flap, a hanging body, a little ripple)
  const hang = (x: number, y: number, w: number, h: number, color: number, z: number): void => {
    const geo = new THREE.PlaneGeometry(w, h, 6, 8);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      const t = (v + h / 2) / h;
      pos.setXYZ(i, u, v, 0.012 * Math.sin(u * 14 + t * 5));
    }
    geo.computeVertexNormals();
    const m = part(geo, fabric(mats, color));
    m.position.set(x, y, z);
    (m.material as THREE.Material).side = THREE.DoubleSide;
    g.add(m);
  };
  hang(-0.28, 0.9, 0.34, 0.5, colors[0]![0], 0.25);
  hang(0.12, 0.85, 0.3, 0.55, colors[1]![0], 0.25);
  hang(0.3, 0.58, 0.45, 0.46, colors[2]![0], -0.25);
  hang(-0.2, 0.55, 0.3, 0.48, colors[3]![0], -0.25);
  hang(0.05, 1.1 - 0.12, 0.7, 0.24, 0xe9e3d0, 0.25);
  return g;
}

/** A floor lamp: a foot, a pole, a pleated shade. `bulb` glows at night. */
export function buildLamp(mats: Mats): { group: THREE.Group; bulb: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  group.name = 'lamp';
  const p: THREE.BufferGeometry[] = [];
  const foot = cyl(0.14, 0.14, 0.025, 20);
  foot.translate(0, 0.0125, 0);
  const pole = cyl(0.012, 0.012, 1.4, 8);
  pole.translate(0, 0.72, 0);
  p.push(foot, pole);
  group.add(part(joined(p), mats.brass));
  const shade = new THREE.CylinderGeometry(0.13, 0.2, 0.24, 20, 1, true);
  shade.translate(0, 1.5, 0);
  const shadeMat = new THREE.MeshStandardMaterial({
    color: 0xe8d6b0,
    roughness: 0.9,
    side: THREE.DoubleSide,
    emissive: 0xffd8a0,
    emissiveIntensity: 0,
  });
  shadeMat.userData = { noShare: true };
  group.add(part(shade, shadeMat, false));
  const bulb = new THREE.MeshStandardMaterial({
    color: 0xfff4d8,
    emissive: 0xffd8a0,
    emissiveIntensity: 0,
    roughness: 0.4,
  });
  bulb.userData = { noShare: true };
  const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), bulb);
  b.position.y = 1.46;
  group.add(b);
  group.userData.shade = shadeMat;
  return { group, bulb };
}

/** A rubber plant in a glazed pot. */
export function buildPlant(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'plant';
  const pot = new THREE.Mesh(cyl(0.17, 0.12, 0.3, 14), plain(0xb7683f, 0.7));
  pot.position.y = 0.15;
  pot.castShadow = true;
  g.add(pot);
  const soil = new THREE.Mesh(cyl(0.155, 0.155, 0.01, 14), plain(0x3b2a1c, 1));
  soil.position.y = 0.295;
  g.add(soil);
  const stems: THREE.BufferGeometry[] = [];
  const leaves: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4;
    const r = 0.04 + (i % 3) * 0.04;
    const h = 0.55 + (i % 4) * 0.18;
    const stem = new THREE.CylinderGeometry(0.007, 0.01, h, 5);
    stem.translate(0, h / 2, 0);
    stem.rotateZ(0.12 * Math.sin(a));
    stem.rotateY(a);
    stem.translate(0, 0.3, 0);
    stems.push(stem);
    const leaf = new THREE.SphereGeometry(0.1, 8, 6);
    leaf.scale(1, 0.12, 0.55);
    leaf.rotateZ(0.5 * Math.cos(a));
    leaf.rotateY(a + 0.7);
    leaf.translate(Math.cos(a) * r, 0.3 + h * 0.95 + (i % 2) * 0.06, Math.sin(a) * r);
    leaves.push(leaf);
  }
  g.add(part(joined(stems), plain(0x4a5a2a, 0.9)));
  g.add(part(joined(leaves), plain(0x3f6a34, 0.55)));
  return g;
}

/** A woven rug, flat on the floor: 2.2 × 1.5. */
export function buildRug(): THREE.Mesh {
  const g = new THREE.BoxGeometry(2.2, 0.012, 1.5);
  const uv = g.attributes.uv as THREE.BufferAttribute;
  void uv;
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, map: rugMap() });
  m.userData = { noShare: true };
  const o = new THREE.Mesh(g, m);
  o.position.y = 0.006;
  o.receiveShadow = true;
  o.name = 'rug';
  return o;
}

/** Two curtains, pleated, tied back at a rod: the window's, 0.5 wide each, 2.7 high. */
export function buildCurtains(mats: Mats, spread = 0.5): THREE.Group {
  const g = new THREE.Group();
  g.name = 'curtains';
  const mat = fabric(mats, 0xd9c9a0);
  mat.side = THREE.DoubleSide;
  const H = 2.7;
  for (const s of [-1, 1]) {
    const geo = new THREE.PlaneGeometry(0.46, H, 24, 14);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const u = pos.getX(i);
      const v = pos.getY(i);
      const t = (v + H / 2) / H;
      // tied back: narrower at the waist, the pleats a sine across
      const gather = 1 - 0.42 * Math.exp(-Math.pow((t - 0.42) / 0.08, 2));
      pos.setXYZ(i, u * gather, v, 0.022 * Math.sin((u / 0.46) * 18 + 1.3) * (0.4 + 0.6 * t) + 0.04 * (1 - gather));
    }
    geo.computeVertexNormals();
    const m = part(geo, mat, true);
    m.position.set(s * spread, H / 2, 0);
    g.add(m);
  }
  g.add(part(bx(-spread - 0.3, H + 0.03, -0.02, spread + 0.3, H + 0.045, 0.02), mats.brass));
  return g;
}

/** A pair of boots by the door, on a mat. */
export function buildBoots(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.name = 'boots';
  const mat = plain(0x4a3a2a, 0.75);
  for (const [x, rot] of [
    [-0.08, 0.1],
    [0.1, -0.18],
  ] as const) {
    const sole = softBox(0, 0.02, 0, 0.1, 0.04, 0.3, 0.015, 2);
    const upper = softBox(0, 0.17, -0.06, 0.1, 0.25, 0.14, 0.03, 2);
    const o = part(joined([sole, upper]), mat);
    o.position.x = x;
    o.rotation.y = rot;
    g.add(o);
  }
  g.add(part(bx(-0.3, 0, -0.25, 0.3, 0.012, 0.25), fabric(mats, 0x6f5a3a), false));
  return g;
}

/** A toolbox and a hammer: the instruments of 1974–75 are fed by hand. */
export function buildToolbox(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.name = 'toolbox';
  g.add(
    part(
      joined([bx(-0.2, 0, -0.08, 0.2, 0.14, 0.08), bx(-0.19, 0.14, -0.075, 0.19, 0.155, 0.075)]),
      plain(0xb23a2a, 0.55),
    ),
  );
  g.add(part(bx(-0.02, 0.16, -0.01, 0.02, 0.17, 0.01), mats.steel));
  return g;
}

/** A framed picture on a wall, facing +z: a pale frame and a landscape in three flat bands. */
export function buildPicture(): THREE.Group {
  const g = new THREE.Group();
  g.name = 'picture';
  g.add(part(bx(-0.3, -0.22, -0.012, 0.3, 0.22, 0.012), plain(0x6b4a30, 0.6), false));
  g.add(part(bx(-0.27, -0.19, 0.012, 0.27, 0.0, 0.013), plain(0x9fb7c7, 0.9), false));
  g.add(part(bx(-0.27, -0.19, 0.012, 0.27, -0.08, 0.0135), plain(0x6a8a54, 0.9), false));
  g.add(part(bx(-0.27, -0.19, 0.012, 0.27, -0.15, 0.014), plain(0x8a7a4a, 0.9), false));
  return g;
}

export { clothMap };
