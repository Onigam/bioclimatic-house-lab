import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';
import { joined, smoothstep, uvMetric } from '../common';
import { barkMap, fbm, leafMap, tiled } from '../textures';

// Trees of the plateau, built from nothing: a Scots or mountain pine, with its straight bole, its high flat crown of clumped needles and a few bare lower limbs; a downy oak, short in the bole, wide in the crown, its leaves
// brown through the winter as the species keeps them; a juniper bush. Each is one trunk geometry and one foliage geometry, merged, with the colour of each clump in the vertices, so a stand of hundreds is two draw calls
// of instances. The species are an estimate (the research: « pine and oak, to look at »). No random number but the lab's seeded one: the same trees on every load.

const V3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** A noisy blob (a clump of foliage): an icosphere pushed in and out by value noise, squashed, with one colour in its vertices. */
function blob(
  r: number,
  squash: number,
  seed: number,
  at: THREE.Vector3,
  tone: THREE.Color,
  detail = 1,
  rough = 0.32,
): THREE.BufferGeometry {
  const g = new THREE.IcosahedronGeometry(r, detail);
  g.deleteAttribute('uv');
  const p = g.attributes.position as THREE.BufferAttribute;
  const n = new THREE.Vector3();
  const colors = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    n.fromBufferAttribute(p, i).normalize();
    const k = 1 + rough * (fbm(n.x * 2.3 + seed, n.y * 2.3 + n.z * 1.7, 3) - 0.5) * 2;
    p.setXYZ(i, n.x * r * k, n.y * r * k * squash, n.z * r * k);
    // lighter on top, darker underneath
    const lit = 0.8 + 0.36 * (n.y * 0.5 + 0.5);
    c.copy(tone).multiplyScalar(lit);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.translate(at.x, at.y, at.z);
  g.computeVertexNormals();
  return g;
}

/** A tapering bough along a few points: radius r0 at the first, r1 at the last. */
function bough(points: THREE.Vector3[], r0: number, r1: number, radial = 7, seg = 10): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const len = curve.getLength();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const c = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    a.crossVectors(tan, up);
    if (a.lengthSq() < 1e-6) a.set(1, 0, 0);
    a.normalize();
    b.crossVectors(tan, a).normalize();
    const r = r0 + (r1 - r0) * t;
    for (let k = 0; k <= radial; k++) {
      const ang = (k / radial) * Math.PI * 2;
      pos.push(
        c.x + (a.x * Math.cos(ang) + b.x * Math.sin(ang)) * r,
        c.y + (a.y * Math.cos(ang) + b.y * Math.sin(ang)) * r,
        c.z + (a.z * Math.cos(ang) + b.z * Math.sin(ang)) * r,
      );
      uv.push(k / radial, t * len * 0.8);
    }
  }
  for (let i = 0; i < seg; i++)
    for (let k = 0; k < radial; k++) {
      const p0 = i * (radial + 1) + k;
      const p1 = p0 + 1;
      const p2 = p0 + radial + 1;
      const p3 = p2 + 1;
      idx.push(p0, p1, p2, p1, p3, p2);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export interface TreeGeometry {
  trunk: THREE.BufferGeometry;
  crown: THREE.BufferGeometry;
  /** Height of the whole tree at scale 1, m. */
  height: number;
  /** Where the crown's radius is widest, m, for tests. */
  crownRadius: number;
}

/** A Scots or mountain pine, 11 m: a bole leaning a little, bare for the lower third, then limbs carrying flat, layered clumps of needles. */
export function pine(seed = 1, lod = 0): TreeGeometry {
  const r = rng(seed * 977 + 13);
  const H = 11;
  const lean = V3((r() - 0.5) * 0.9, 0, (r() - 0.5) * 0.9);
  const spine = [
    V3(0, 0, 0),
    V3(lean.x * 0.3, H * 0.25, lean.z * 0.3),
    V3(lean.x * 0.7, H * 0.6, lean.z * 0.7),
    V3(lean.x, H, lean.z),
  ];
  const trunk: THREE.BufferGeometry[] = [bough(spine, 0.26, 0.05, 8, 14)];
  const crown: THREE.BufferGeometry[] = [];
  const at = (t: number): THREE.Vector3 => new THREE.CatmullRomCurve3(spine, false, 'centripetal').getPointAt(t);
  // limbs: from 0.4 H upward, each with a clump at its end, flat, the lower ones wider
  const n = lod ? 4 : 9;
  for (let i = 0; i < n; i++) {
    const t = 0.42 + (0.55 * i) / (n - 1) + (r() - 0.5) * 0.04;
    const base = at(t);
    const ang = i * 2.4 + r();
    const reach = (1.0 + 2.6 * (1 - (t - 0.42) / 0.6)) * (0.8 + 0.4 * r());
    const tip = V3(base.x + Math.cos(ang) * reach, base.y + 0.3 + r() * 0.5, base.z + Math.sin(ang) * reach);
    const mid = base
      .clone()
      .lerp(tip, 0.5)
      .add(V3(0, 0.25, 0));
    if (!lod) trunk.push(bough([base, mid, tip], 0.07 * (1.2 - t * 0.6), 0.025, 5, 5));
    const tone = new THREE.Color().setHSL(0.27 + 0.02 * (r() - 0.5), 0.4, 0.33 + 0.07 * r());
    crown.push(
      blob((1.0 + 0.9 * (1 - t) + 0.3 * r()) * (lod ? 1.6 : 1), 0.45, i + seed * 7, tip, tone, lod ? 0 : 1, 0.28),
    );
    if (!lod && reach > 2)
      crown.push(
        blob(
          0.8 + 0.3 * r(),
          0.5,
          i + 40 + seed,
          mid
            .clone()
            .lerp(tip, 0.4)
            .add(V3(0, 0.15, 0)),
          tone,
          1,
          0.3,
        ),
      );
  }
  const top = spine[3]!;
  crown.push(blob(1.1, 0.7, seed, V3(top.x, top.y - 0.2, top.z), new THREE.Color().setHSL(0.28, 0.4, 0.36), 1, 0.3));
  return { trunk: uvMetric(joined(trunk)), crown: joined(crown), height: H + 1, crownRadius: 3.2 };
}

/** A downy oak, 8 m: a short bole, four limbs going out and up, a broad rounded crown of a dozen clumps. */
export function oak(seed = 1): TreeGeometry {
  const r = rng(seed * 811 + 5);
  const trunk: THREE.BufferGeometry[] = [
    bough([V3(0, 0, 0), V3(0.05, 1.0, 0.04), V3(0.0, 2.2, 0.0)], 0.38, 0.26, 9, 8),
  ];
  const crown: THREE.BufferGeometry[] = [];
  const limbs = 4 + Math.floor(r() * 2);
  for (let i = 0; i < limbs; i++) {
    const a = (i / limbs) * Math.PI * 2 + r() * 0.5;
    const out = 2.2 + r() * 1.2;
    const high = 5.4 + r() * 1.8;
    const b0 = V3(0, 2.1, 0);
    const b1 = V3(Math.cos(a) * out * 0.35, 3.2 + r() * 0.5, Math.sin(a) * out * 0.35);
    const b2 = V3(Math.cos(a) * out, high, Math.sin(a) * out);
    trunk.push(bough([b0, b1, b2], 0.2, 0.06, 6, 7));
    const tone = new THREE.Color().setHSL(0.24 + 0.03 * (r() - 0.5), 0.42, 0.4 + 0.07 * r());
    crown.push(blob(1.9 + 0.8 * r(), 0.78, i + seed * 3, V3(b2.x, b2.y + 0.2, b2.z), tone, 1, 0.3));
    crown.push(
      blob(1.5 + 0.6 * r(), 0.8, i + 70 + seed, V3(b2.x * 0.55, b2.y + 0.9 + r() * 0.6, b2.z * 0.55), tone, 1, 0.3),
    );
  }
  crown.push(blob(2.3, 0.8, seed + 3, V3(0, 6.6, 0), new THREE.Color().setHSL(0.25, 0.42, 0.42), 1, 0.3));
  return { trunk: uvMetric(joined(trunk)), crown: joined(crown), height: 9, crownRadius: 4.2 };
}

/** A juniper or broom: a low mound of dark foliage, a few stems. */
export function bush(seed = 1): TreeGeometry {
  const r = rng(seed * 313 + 1);
  const crown: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const a = r() * Math.PI * 2;
    const d = r() * 0.7;
    crown.push(
      blob(
        0.5 + 0.35 * r(),
        0.72,
        i + seed,
        V3(Math.cos(a) * d, 0.35 + 0.25 * r(), Math.sin(a) * d),
        new THREE.Color().setHSL(0.26, 0.34, 0.3 + 0.07 * r()),
        1,
        0.3,
      ),
    );
  }
  const stem = bough([V3(0, 0, 0), V3(0.02, 0.3, 0)], 0.04, 0.025, 5, 3);
  return { trunk: uvMetric(stem), crown: joined(crown), height: 1.2, crownRadius: 0.9 };
}

export interface Placement {
  x: number;
  y: number;
  z: number;
  /** Uniform scale, and a turn about the vertical. */
  s: number;
  r: number;
}

export interface Stand {
  group: THREE.Group;
  trunks: THREE.InstancedMesh;
  crowns: THREE.InstancedMesh;
  placements: Placement[];
  /** The crown's material: the oak's is tinted by the season. */
  crownMaterial: THREE.MeshStandardMaterial;
}

let barkMat: THREE.MeshStandardMaterial | null = null;
const bark = (): THREE.MeshStandardMaterial =>
  (barkMat ??= new THREE.MeshStandardMaterial({ color: 0x6b5a48, roughness: 1, map: tiled(barkMap(), 1, 1) }));

/** A stand: `placements` of one kind of tree, as two instanced meshes. `yOf` ground heights are the caller's: each tree's foot stands at its own `y`. */
export function stand(kind: 'pine' | 'oak' | 'bush', placements: Placement[], variants = 3, lod = 0): Stand {
  const geo = (i: number): TreeGeometry =>
    kind === 'pine' ? pine(i + 1, lod) : kind === 'oak' ? oak(i + 1) : bush(i + 1);
  const group = new THREE.Group();
  group.name = `${kind}-stand`;
  const crownMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    vertexColors: true,
    roughness: 0.92,
    map: tiled(leafMap(), 1 / 2.5, 1 / 2.5),
    flatShading: false,
  });
  crownMat.userData.noShare = true;
  const trunks: THREE.InstancedMesh[] = [];
  const crowns: THREE.InstancedMesh[] = [];
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  for (let v = 0; v < variants; v++) {
    const mine = placements.filter((_, i) => i % variants === v);
    if (mine.length === 0) continue;
    const g = geo(v);
    const t = new THREE.InstancedMesh(g.trunk, bark(), mine.length);
    const c = new THREE.InstancedMesh(g.crown, crownMat, mine.length);
    mine.forEach((p, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.r);
      m.compose(new THREE.Vector3(p.x, p.y - 0.15 * p.s, p.z), q, new THREE.Vector3(p.s, p.s, p.s));
      t.setMatrixAt(i, m);
      c.setMatrixAt(i, m);
    });
    for (const o of [t, c]) {
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = true;
      o.instanceMatrix.needsUpdate = true;
      o.computeBoundingSphere();
      group.add(o);
    }
    trunks.push(t);
    crowns.push(c);
  }
  return { group, trunks: trunks[0]!, crowns: crowns[0]!, placements, crownMaterial: crownMat };
}

/** The oak's leaves by the season: green from May to September, russet and then brown (they stay on) the rest. `day` of the year. */
export function oakSeason(mat: THREE.MeshStandardMaterial, day: number): void {
  const spring = smoothstep(110, 140, day);
  const fall = smoothstep(270, 310, day);
  const green = new THREE.Color(0xfff6e0);
  const russet = new THREE.Color(0xd9a05a);
  const brown = new THREE.Color(0xb8895a);
  // day 1..110: brown; 110..140: green; 140..270: green; 270..310: russet; 310..365: brown
  const winter = 1 - spring + fall;
  mat.color
    .copy(green)
    .lerp(russet, fall * (1 - smoothstep(310, 345, day)))
    .lerp(brown, Math.min(1, winter) * (day < 200 ? 1 - spring : smoothstep(300, 330, day)));
}
