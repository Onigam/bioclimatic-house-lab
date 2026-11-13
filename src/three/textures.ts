import * as THREE from 'three';
import { rng } from '@onigam/lab-kit/three';
import { smoothstep } from './common';

// Procedural maps of the house, the machine and the land: no texture file, every map is generated once per page from a seeded lattice and stored as a DataTexture (no canvas, so
// it also builds in Node under vitest). No text in any of them: a film is captured with no interface.

const LN = 256;
const lattice = (() => {
  const r = rng(90210);
  const a = new Float32Array(LN * LN);
  for (let i = 0; i < a.length; i++) a[i] = r();
  return a;
})();

const sm = (t: number) => t * t * (3 - 2 * t);

/** Smooth value noise in 0..1 (any real x, y; the lattice repeats every 256 cells). */
export function vnoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = sm(x - ix);
  const fy = sm(y - iy);
  const x0 = ix & 255;
  const x1 = (ix + 1) & 255;
  const y0 = (iy & 255) * LN;
  const y1 = ((iy + 1) & 255) * LN;
  const a = lattice[y0 + x0];
  const b = lattice[y0 + x1];
  const c = lattice[y1 + x0];
  const d = lattice[y1 + x1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Fractal noise in about 0..1. */
export function fbm(x: number, y: number, octaves = 4, gain = 0.5): number {
  let s = 0;
  let amp = 0.5;
  let norm = 0;
  let f = 1;
  for (let o = 0; o < octaves; o++) {
    s += amp * vnoise(x * f + o * 17.3, y * f + o * 9.1);
    norm += amp;
    amp *= gain;
    f *= 2;
  }
  return s / norm;
}

/** Value noise that repeats every `px` cells in x and `py` in y (at most 256): for tileable maps. */
function tn(x: number, y: number, px: number, py: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = sm(x - ix);
  const fy = sm(y - iy);
  const x0 = ((ix % px) + px) % px;
  const x1 = (x0 + 1) % px;
  const y0 = (((iy % py) + py) % py) * LN;
  const y1 = (((((iy % py) + py) % py) + 1) % py) * LN;
  const a = lattice[y0 + x0];
  const b = lattice[y0 + x1];
  const c = lattice[y1 + x0];
  const d = lattice[y1 + x1];
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function tooFine(cells: number, cellsY: number, octaves: number): never {
  throw new Error(`a tileable noise of ${cells} × ${cellsY} cells over ${octaves} octaves: the lattice holds ${LN}`);
}

/** Tileable fractal noise: `cells` lattice cells across the unit square at the first octave. */
export function tf(u: number, v: number, cells: number, octaves = 3, cellsY = cells): number {
  // the lattice holds 256 cells: a finer octave would read past it (a band across a wall, in the sister lab, once)
  if (Math.max(cells, cellsY) << (octaves - 1) > LN) tooFine(cells, cellsY, octaves);
  let s = 0;
  let amp = 0.5;
  let norm = 0;
  let cx = cells;
  let cy = cellsY;
  for (let o = 0; o < octaves; o++) {
    s += amp * tn(u * cx + o * 3.7, v * cy + o * 1.9, cx, cy);
    norm += amp;
    amp *= 0.5;
    cx *= 2;
    cy *= 2;
  }
  return s / norm;
}

const hash1 = (a: number, b: number): number => {
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

const b8 = (x: number): number => Math.max(0, Math.min(255, Math.round(x * 255)));

export interface TextureStat {
  name: string;
  size: number;
  bytes: number;
}
const stats: TextureStat[] = [];
export const textureStats = (): TextureStat[] => stats;

const cache = new Map<string, THREE.DataTexture>();

/** A square RGBA map made once; `fill` returns sRGB components in 0..1. */
function map(
  name: string,
  size: number,
  fill: (u: number, v: number, i: number, j: number) => [number, number, number],
  srgb = true,
): THREE.DataTexture {
  const hit = cache.get(name);
  if (hit) return hit;
  const data = new Uint8Array(size * size * 4);
  for (let j = 0; j < size; j++)
    for (let i = 0; i < size; i++) {
      const [r, g, b] = fill(i / size, j / size, i, j);
      const k = (j * size + i) * 4;
      data[k] = b8(r);
      data[k + 1] = b8(g);
      data[k + 2] = b8(b);
      data[k + 3] = 255;
    }
  const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 16;
  t.name = name;
  t.needsUpdate = true;
  cache.set(name, t);
  stats.push({ name, size, bytes: Math.round(size * size * 4 * (4 / 3)) });
  return t;
}

/**
 * A tangent-space normal map from a tileable height (any unit): the slope between a texel's neighbours times `strength`. Built once, as the colour maps are; mipmapped, so the relief flattens with distance
 * instead of crawling.
 */
function normalMap(
  name: string,
  size: number,
  height: (u: number, v: number, i: number, j: number) => number,
  strength: number,
): THREE.DataTexture {
  const hit = cache.get(name);
  if (hit) return hit;
  const h = new Float32Array(size * size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) h[j * size + i] = height(i / size, j / size, i, j);
  return map(
    name,
    size,
    (_u, _v, i, j) => {
      const l = h[j * size + ((i + size - 1) % size)]!;
      const r = h[j * size + ((i + 1) % size)]!;
      const d = h[((j + size - 1) % size) * size + i]!;
      const t = h[((j + 1) % size) * size + i]!;
      const nx = -(r - l) * strength;
      const ny = -(t - d) * strength;
      const inv = 1 / Math.hypot(nx, ny, 1);
      return [0.5 + 0.5 * nx * inv, 0.5 + 0.5 * ny * inv, 0.5 + 0.5 * inv];
    },
    false,
  );
}

/** A copy of a map with its own repeat (same pixels on the GPU's side of three: `source` is shared). */
export function tiled(t: THREE.Texture, u: number, w = u): THREE.Texture {
  const c = t.clone();
  c.repeat.set(u, w);
  c.needsUpdate = true;
  return c;
}

/** Value of a tileable Voronoi: distance to the nearest of `G` × `G` jittered seeds, the second nearest, and an id. */
function voronoi(u: number, v: number, G: number, GY = G, jitter = 0.8): { d1: number; d2: number; id: number } {
  const gx = u * G;
  const gy = v * GY;
  const cx = Math.floor(gx);
  const cy = Math.floor(gy);
  let d1 = 9;
  let d2 = 9;
  let id = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const wx = (cx + dx + G) % G;
      const wy = (cy + dy + GY) % GY;
      const ox = 0.5 + jitter * (hash1(wx, wy) - 0.5);
      const oy = 0.5 + jitter * (hash1(wy + 7, wx + 3) - 0.5);
      const ex = cx + dx + ox - gx;
      const ey = cy + dy + oy - gy;
      const d = Math.sqrt(ex * ex + ey * ey);
      if (d < d1) {
        d2 = d1;
        d1 = d;
        id = wx * 31 + wy;
      } else if (d < d2) d2 = d;
    }
  return { d1, d2, id };
}

/** Cast concrete: mottled, a speckle of aggregate. */
export const concreteMap = (): THREE.DataTexture =>
  map('concrete', 256, (u, v, i, j) => {
    const n = tf(u, v, 6, 4) - 0.5;
    const speck = hash1(i, j) > 0.93 ? -0.05 : hash1(j, i) > 0.97 ? 0.04 : 0;
    const k = 0.6 + 0.2 * n + speck;
    return [k * 1.02, k, k * 0.94];
  });

/** Earth plaster: fine, warm, faint strokes of the float. To be tinted. */
export const plasterMap = (): THREE.DataTexture =>
  map('plaster', 512, (u, v, i, j) => {
    const broad = tf(u, v, 4, 3) - 0.5;
    const stroke = tf(u, v, 10, 2, 28) - 0.5;
    const grain = hash1(i, j) - 0.5;
    const k = 0.82 + 0.13 * broad + 0.05 * stroke + 0.015 * grain;
    return [k, k * 0.985, k * 0.955];
  });

/** A rubble wall: stones in rough courses, a recessed lime mortar, each stone its own tone and a broken face. Colour map; the same is its relief. One tile is about 1.75 m. */
export const masonryMap = (): THREE.DataTexture =>
  map('masonry', 512, (u, v, i, j) => {
    // courses: the cells are longer than high; the warp breaks their edges
    const warp = (tf(u, v, 22, 3) - 0.5) * 0.028;
    const warp2 = (tf(u + 0.3, v, 44, 2) - 0.5) * 0.009;
    const c = voronoi(u + warp + warp2, v - warp + warp2, 11, 19, 0.66);
    const edge = c.d2 - c.d1;
    const mortar = 1 - smoothstep(0.02, 0.07, edge);
    const tone = hash1(c.id, 13);
    const hue = hash1(c.id, 21);
    // a broken face: the stone's top lit, its foot in shadow, a fine grain
    const face = tf(u, v, 64, 3) - 0.5;
    const big = tf(u, v, 9, 2) - 0.5;
    const relief = smoothstep(0.0, 0.32, edge);
    const fine = tf(u, v, 128, 2) - 0.5;
    const k =
      (0.42 + 0.17 * tone + 0.12 * face + 0.08 * big + 0.13 * fine + 0.03 * (hash1(i, j) - 0.5)) *
      (0.86 + 0.14 * relief);
    const stone: [number, number, number] =
      hue > 0.72
        ? [k * 1.14, k * 0.93, k * 0.72]
        : hue > 0.38
          ? [k * 1.04, k * 0.97, k * 0.86]
          : [k * 0.95, k * 0.95, k * 0.91];
    // the joints lie deep and in shadow, a little lime in them
    const m = 0.3 + 0.05 * face;
    return [
      stone[0] * (1 - mortar) + m * mortar,
      stone[1] * (1 - mortar) + m * 0.95 * mortar,
      stone[2] * (1 - mortar) + m * 0.86 * mortar,
    ];
  });

/** Wide oak boards along U: a grain, end joints, dark gaps. One tile: 1.28 m of four boards across. */
export const oakMap = (): THREE.DataTexture =>
  map('oak', 512, (u, v, i, j) => {
    const boards = 4;
    const b = Math.floor(v * boards);
    const off = hash1(b, 41);
    const uu = (u + off) % 1;
    const fv = (v * boards) % 1;
    const gap = Math.min(fv, 1 - fv) * boards * 4 < 0.05 || Math.min(uu, 1 - uu) < 0.002;
    const grain = tn(uu * 16 + b * 19, v * 90, 256, 90);
    const cathedral = Math.sin((fv + 0.18 * tn(uu * 5 + b * 3, 3.3, 256, 8)) * 26 + b * 2.1);
    const tone = 0.82 + 0.3 * hash1(b, 77);
    // a quiet grain, and joints only a little darker: strong lines on a floor crawl as the camera moves
    const k =
      (0.5 + 0.07 * (grain - 0.5) + 0.018 * cathedral + 0.006 * (hash1(i, j) - 0.5)) * (0.93 + 0.07 * (tone / 0.97));
    if (gap) return [0.3, 0.21, 0.14];
    return [k * 1.0, k * 0.72, k * 0.46];
  });

/** Plain wood for furniture, grey to be tinted: grain along U. */
export const woodMap = (): THREE.DataTexture =>
  map('wood', 256, (u, v, i, j) => {
    const grain = tn(u * 8, v * 64, 256, 64);
    const ring = Math.sin((v + 0.2 * tn(u * 4, v * 3, 256, 256)) * 44);
    const k = 0.78 + 0.2 * (grain - 0.5) + 0.05 * ring + 0.02 * (hash1(i, j) - 0.5);
    return [k, k, k];
  });

/** A woven rug: bands and lozenges in madder, ochre and indigo, a fine weave. No word, no sign. */
export const rugMap = (): THREE.DataTexture =>
  map('rug', 512, (u, v, i, j) => {
    const weave = 1 + 0.02 * (((i >> 1) + (j >> 1)) % 2);
    const bx = Math.abs(u - 0.5) * 2;
    const by = Math.abs(v - 0.5) * 2;
    const edge = Math.max(bx, by);
    const lozenges = Math.abs(((u * 4 + 0.5) % 1) - 0.5) + Math.abs(((v * 6 + 0.5) % 1) - 0.5);
    const madder: [number, number, number] = [0.46, 0.13, 0.1];
    const ochre: [number, number, number] = [0.72, 0.5, 0.2];
    const indigo: [number, number, number] = [0.14, 0.17, 0.29];
    const cream: [number, number, number] = [0.8, 0.72, 0.58];
    let c = madder;
    if (edge > 0.93) c = indigo;
    else if (edge > 0.88) c = cream;
    else if (edge > 0.8) c = ochre;
    else if (lozenges < 0.14) c = cream;
    else if (lozenges < 0.28) c = indigo;
    else if (lozenges < 0.34) c = ochre;
    const wear = 0.88 + 0.22 * (tf(u, v, 7, 3) - 0.5) + 0.04 * (hash1(i, j) - 0.5);
    return [c[0] * weave * wear, c[1] * weave * wear, c[2] * weave * wear];
  });

/** Cloth: a fine weave, grey to be tinted. */
export const clothMap = (): THREE.DataTexture =>
  map('cloth', 256, (u, v, i, j) => {
    const w = ((i >> 1) + (j >> 1)) % 2 === 0 ? 1 : 0.9;
    const k = (0.86 + 0.12 * (tf(u, v, 10, 2) - 0.5)) * w + 0.02 * (hash1(i, j) - 0.5);
    return [k, k, k];
  });

/** Knitted wool: ribs across, a soft grain, grey to be tinted. */
export const knitMap = (): THREE.DataTexture =>
  map('knit', 256, (u, v) => {
    const rib =
      0.8 + 0.2 * Math.sin(v * Math.PI * 2 * 24) * Math.sin(u * Math.PI * 2 * 18 + Math.sin(v * Math.PI * 2 * 24));
    const k = rib * (0.92 + 0.14 * (tf(u, v, 12, 2) - 0.5));
    return [k, k, k];
  });

/** Bark of split wood: long fissures, brown-grey, in U round the trunk and V along it. */
export const barkMap = (): THREE.DataTexture =>
  map('bark', 256, (u, v, i, j) => {
    const fiss = tf(u, v, 22, 3, 4);
    const k = 0.3 + 0.26 * smoothstep(0.34, 0.62, fiss) + 0.05 * (hash1(i, j) - 0.5);
    return [k * 1.1, k * 0.92, k * 0.72];
  });

/** Sheets of wood shingle or slate on the roof, to be tinted: rows offset by half. */
export const shingleMap = (): THREE.DataTexture =>
  map('shingle', 256, (u, v, i, j) => {
    const rows = 8;
    const r = Math.floor(v * rows);
    const uu = (u * 6 + (r % 2 ? 0.5 : 0)) % 1;
    const col = Math.floor(u * 6 + (r % 2 ? 0.5 : 0));
    const vv = (v * rows) % 1;
    const tone = 0.78 + 0.34 * hash1(r * 13 + col, 3);
    const edge = (Math.min(uu, 1 - uu) < 0.03 ? 0.66 : 1) * (vv < 0.1 ? 0.62 : 1);
    const k = tone * edge * (0.9 + 0.1 * (hash1(i, j) - 0.5));
    return [k, k, k];
  });

/** Wooden boards, grey to be tinted: vertical boards, a grain, a dark joint. */
export const boardsMap = (): THREE.DataTexture =>
  map('boards', 256, (u, v, i) => {
    const boards = 8;
    const b = Math.floor(u * boards);
    const joint = Math.abs(((u * boards) % 1) - 0.5) > 0.46 ? 0.62 : 1;
    const grain = tn(u * 40 + b * 7.3, v * 4, 256, 4);
    const tone = 0.9 + 0.14 * hash1(b, 3) + 0.04 * Math.sin(i * 0.9 + b);
    const k = (0.82 + 0.16 * grain) * tone * joint;
    return [k, k, k];
  });

/** Lime render on the outside walls, to be tinted: broad patches, a roughcast grain. */
export const renderMap = (): THREE.DataTexture =>
  map('render', 256, (u, v, i, j) => {
    const k = 0.84 + 0.16 * (tf(u, v, 5, 4) - 0.5) + 0.05 * (hash1(i, j) - 0.5);
    return [k, k * 0.985, k * 0.95];
  });

/** A closed green ground under the snow, with the grain the eye reads close up. */
export const grassMap = (): THREE.DataTexture =>
  map(
    'grass',
    256,
    (u, v, i, j) => {
      const blade = tn(u * 90, v * 30, 90, 30);
      const k = 0.5 + 0.5 * ((tf(u, v, 20, 3) - 0.5) * 0.9 + (blade - 0.5) * 0.5 + (hash1(i, j) - 0.5) * 0.14);
      return [k, k, k];
    },
    false,
  );

// ---------------------------------------------------------------------------------------------- this lab's own maps

/** Cast concrete from board formwork: horizontal boards of 0.2 m, a grain and a fine mottle, a tie hole every 0.8 m. One tile: 0.8 m. */
export const shutteredConcreteMap = (): THREE.DataTexture =>
  map('shuttered-concrete', 256, (u, v, i, j) => {
    const boards = 4;
    const b = Math.floor(v * boards);
    const vv = (v * boards) % 1;
    const grain = tn(u * 6 + b * 11.3, v * 70, 256, 70) - 0.5;
    const n = tf(u, v, 5, 4) - 0.5;
    const seam = vv < 0.045 ? 0.9 : 1;
    const tone = 0.96 + 0.07 * (hash1(b, 5) - 0.5);
    let k = (0.6 + 0.17 * n + 0.05 * grain + 0.015 * (hash1(i, j) - 0.5)) * seam * tone;
    // a tie hole at the middle of the tile, a small dark dish
    const d = Math.hypot(u - 0.5, v - 0.5);
    if (d < 0.022) k *= 0.62;
    else if (d < 0.034) k *= 0.88;
    return [k * 1.0, k * 0.99, k * 0.96];
  });

/** Granite of the plateau: light grey, flecks of black mica, rust along the joints, lichen in patches. Tileable, one tile about 2 m. */
export const graniteMap = (): THREE.DataTexture =>
  map('granite', 512, (u, v, i, j) => {
    const big = tf(u, v, 6, 4) - 0.5;
    const grain = hash1(i, j);
    let k = 0.52 + 0.2 * big + 0.05 * (hash1(i >> 1, j >> 1) - 0.5);
    if (grain > 0.9) k -= 0.2;
    else if (grain < 0.04) k += 0.15;
    // joints and rust stains
    const crack = Math.abs(tf(u, v, 5, 3, 3) - 0.5);
    const rust = smoothstep(0.1, 0.0, crack) * 0.55;
    let r = k * 1.0 + rust * 0.12;
    let g = k * 0.98;
    let b = k * 0.95 - rust * 0.1;
    // lichen: yellow-green patches
    const lich = smoothstep(0.62, 0.74, tf(u, v, 9, 3)) * (0.5 + 0.5 * hash1(i >> 2, j >> 2));
    r = r * (1 - 0.42 * lich) + 0.46 * 0.42 * lich;
    g = g * (1 - 0.42 * lich) + 0.5 * 0.42 * lich;
    b = b * (1 - 0.42 * lich) + 0.22 * 0.42 * lich;
    return [r, g, b];
  });

/** Floor tiles, 0.2 m, terracotta: each its own tone, a pale grout. One tile of the map holds 4 × 4 tiles: 0.8 m. */
export const tileMap = (): THREE.DataTexture =>
  map('tile', 256, (u, v, i, j) => {
    const n = 4;
    const tx = Math.floor(u * n);
    const ty = Math.floor(v * n);
    const fu = (u * n) % 1;
    const fv = (v * n) % 1;
    const grout = Math.min(fu, 1 - fu, fv, 1 - fv) < 0.025;
    const tone = 0.88 + 0.24 * hash1(tx * 7 + ty, 31);
    const worn = 0.94 + 0.1 * (tf(u, v, 6, 3) - 0.5) + 0.02 * (hash1(i, j) - 0.5);
    if (grout) return [0.58, 0.55, 0.5];
    return [0.55 * tone * worn, 0.3 * tone * worn, 0.2 * tone * worn];
  });

/** The side of a block of land: topsoil on top, a brown subsoil, weathered granite (grus), then the rock with its joints. V is the height: it runs up, one tile is 8 m tall. */
export const strataMap = (): THREE.DataTexture =>
  map('strata', 512, (u, v, i, j) => {
    const warp = (tf(u, v, 4, 3, 2) - 0.5) * 0.06;
    const h = v + warp; // 0 at the foot, 1 at the top
    const grain = hash1(i, j) - 0.5;
    if (h > 0.93) {
      const k = 0.2 + 0.08 * (tf(u, v, 20, 2) - 0.5) + 0.02 * grain;
      return [k * 1.05, k * 0.85, k * 0.62];
    }
    if (h > 0.84) {
      const k = 0.42 + 0.1 * (tf(u, v, 14, 2) - 0.5) + 0.03 * grain;
      return [k * 1.1, k * 0.82, k * 0.55];
    }
    if (h > 0.62) {
      const c = voronoi(u, v, 18, 10, 0.85);
      const st = 0.45 + 0.2 * hash1(c.id, 3) + 0.04 * grain;
      const edge = smoothstep(0.0, 0.12, c.d2 - c.d1);
      const k = st * (0.7 + 0.3 * edge);
      return [k * 1.08, k * 0.93, k * 0.78];
    }
    const joint = Math.min(Math.abs(tf(u, v, 3, 3, 3) - 0.5), Math.abs(tf(u + 0.3, v, 5, 2, 4) - 0.5));
    const k = 0.5 + 0.14 * (tf(u, v, 8, 3) - 0.5) + 0.04 * grain - 0.1 * smoothstep(0.04, 0.0, joint);
    return [k * 1.0, k * 0.97, k * 0.93];
  });

/** Gravel and packed earth for a path or a yard: pale, with small stones. */
export const gravelMap = (): THREE.DataTexture =>
  map('gravel', 256, (u, v, i, j) => {
    const c = voronoi(u, v, 28, 28, 0.9);
    const tone = 0.4 + 0.3 * hash1(c.id, 4);
    const edge = smoothstep(0.0, 0.14, c.d2 - c.d1);
    const k = tone * (0.7 + 0.3 * edge) + 0.04 * (hash1(i, j) - 0.5);
    return [k * 1.04, k * 0.98, k * 0.88];
  });

/** A faceted mirror: a grid of small flat mirrors, each reflecting a slightly different part of the sky, a dark joint between. `cols` × `rows` facets over the tile. */
export const facetMap = (cols = 24, rows = 24, name = 'facets'): THREE.DataTexture =>
  map(name, 512, (u, v) => {
    const fu = (u * cols) % 1;
    const fv = (v * rows) % 1;
    const cx = Math.floor(u * cols);
    const cy = Math.floor(v * rows);
    const joint = Math.min(fu, 1 - fu, fv, 1 - fv) < 0.06;
    const t = hash1(cx * 31 + cy, 7);
    // a sky that darkens down the mirror, each facet a shade off
    const sky = 0.78 - 0.34 * v + 0.12 * (t - 0.5);
    if (joint) return [0.1, 0.12, 0.15];
    return [sky * 0.78, sky * 0.9, sky * 1.05];
  });

/** Roof slate, to be tinted: rows offset by half, each slate its own tone, a shadow line under each row. Wider than the shingle's. */
export const slateMap = (): THREE.DataTexture =>
  map('slate', 256, (u, v, i, j) => {
    const rows = 10;
    const r = Math.floor(v * rows);
    const cols = 5;
    const uu = (u * cols + (r % 2 ? 0.5 : 0)) % 1;
    const col = Math.floor(u * cols + (r % 2 ? 0.5 : 0));
    const vv = (v * rows) % 1;
    // quiet: a slate roof seen from thirty metres crawls when its joints are dark lines, so the joints are only a little darker
    const tone = 0.84 + 0.26 * hash1(r * 17 + col, 9);
    const edge = (Math.min(uu, 1 - uu) < 0.03 ? 0.88 : 1) * (vv < 0.12 ? 0.82 : 1);
    const k = tone * edge * (0.96 + 0.06 * (hash1(i, j) - 0.5));
    return [k * 0.96, k * 0.98, k * 1.04];
  });

/** Foliage of a conifer or an oak: a mottled green, light and dark clumps. Tileable. */
export const leafMap = (): THREE.DataTexture =>
  map('leaf', 256, (u, v, i, j) => {
    const clump = tf(u, v, 14, 4);
    const k = 0.62 + 0.38 * clump + 0.05 * (hash1(i, j) - 0.5);
    return [k * 0.86, k * 1.0, k * 0.72];
  });

// ---------------------------------------------------------------------------------------------- the material pass of 2026-11-13
// Concrete as a section shows it, a black paint on board-marked concrete, a tile floor with its joints. Every map is drawn for UVs in metres (`tiled(map, 1 / tile)`), once, from the seeded lattice.

/** The stones of a jittered grid laid over a unit tile that repeats: for each cell its seed, its radius, its axes and its outline's phase, drawn once (the per-pixel loop only reads them). */
interface Stones {
  G: number;
  x: Float32Array;
  y: Float32Array;
  r: Float32Array;
  ca: Float32Array;
  sa: Float32Array;
  q: Float32Array;
  /** cos and sin of the outline's two phases (the wobble is a sum of two sines of the angle, read without an arctangent). */
  c3: Float32Array;
  s3: Float32Array;
  c5: Float32Array;
  s5: Float32Array;
}
const stoneCache = new Map<string, Stones>();
function stones(G: number, rmin: number, rmax: number, salt: number): Stones {
  const key = `${G}|${rmin}|${rmax}|${salt}`;
  const hit = stoneCache.get(key);
  if (hit) return hit;
  const n = G * G;
  const out: Stones = {
    G,
    x: new Float32Array(n),
    y: new Float32Array(n),
    r: new Float32Array(n),
    ca: new Float32Array(n),
    sa: new Float32Array(n),
    q: new Float32Array(n),
    c3: new Float32Array(n),
    s3: new Float32Array(n),
    c5: new Float32Array(n),
    s5: new Float32Array(n),
  };
  for (let wy = 0; wy < G; wy++)
    for (let wx = 0; wx < G; wx++) {
      const k = wy * G + wx;
      out.x[k] = wx + 0.5 + 0.7 * (hash1(wy + salt, wx + 5) - 0.5);
      out.y[k] = wy + 0.5 + 0.7 * (hash1(wx + 11, wy + salt + 2) - 0.5);
      out.r[k] = rmin + (rmax - rmin) * hash1(wx + salt, wy + 31);
      const a = hash1(wx + 3, wy + salt + 9) * Math.PI;
      out.ca[k] = Math.cos(a);
      out.sa[k] = Math.sin(a);
      out.q[k] = 0.74 + 0.5 * hash1(wy + 17, wx + salt);
      const ph = hash1(wx * 7 + salt, wy * 13 + salt * 3) * 6.283;
      out.c3[k] = Math.cos(ph);
      out.s3[k] = Math.sin(ph);
      out.c5[k] = Math.cos(ph * 5);
      out.s5[k] = Math.sin(ph * 5);
    }
  stoneCache.set(key, out);
  return out;
}

/** What a layer of stones leaves on a map: at each texel the nearest stone whose outline holds it (its id, how far inside it is, 0 the centre and 1 the edge, and where from its centre in its own radii), or none. */
interface StoneLayer {
  id: Int32Array;
  d: Float32Array;
  ox: Float32Array;
  oy: Float32Array;
}
const layerCache = new Map<string, StoneLayer>();

/**
 * The stones of a layer laid on a `size` × `size` tile that repeats. Each stone writes its own texels (an ellipse of its own axes and a wobbling edge, never a disc), the nearest wins: the same answer as asking every
 * texel for its nine cells, for a quarter of the work. Drawn once for a size.
 */
function stoneLayer(S: Stones, size: number): StoneLayer {
  const key = `${S.G}|${S.x[0]}|${S.r[0]}|${size}`;
  const hit = layerCache.get(key);
  if (hit) return hit;
  const n = size * size;
  const L: StoneLayer = {
    id: new Int32Array(n).fill(-1),
    d: new Float32Array(n).fill(1.05),
    ox: new Float32Array(n),
    oy: new Float32Array(n),
  };
  const G = S.G;
  const cell = size / G;
  for (let wy = 0; wy < G; wy++)
    for (let wx = 0; wx < G; wx++) {
      const k = wy * G + wx;
      const r = S.r[k]!;
      const reach = r * 1.5;
      const sx = S.x[k]!;
      const sy = S.y[k]!;
      const ca = S.ca[k]!;
      const sa = S.sa[k]!;
      const sq = Math.sqrt(S.q[k]!);
      const c3 = S.c3[k]!;
      const s3 = S.s3[k]!;
      const c5 = S.c5[k]!;
      const s5 = S.s5[k]!;
      const y0 = Math.floor((sy - reach) * cell);
      const y1 = Math.ceil((sy + reach) * cell);
      const x0 = Math.floor((sx - reach) * cell);
      const x1 = Math.ceil((sx + reach) * cell);
      for (let py = y0; py <= y1; py++) {
        const jy = ((py % size) + size) % size;
        const ey = sy - py / cell;
        for (let px = x0; px <= x1; px++) {
          const ex = sx - px / cell;
          if (ex * ex + ey * ey > reach * reach) continue;
          const x = (ex * ca + ey * sa) / sq;
          const y = (-ex * sa + ey * ca) * sq;
          const rho = Math.hypot(x, y);
          // sin (3 theta + a) and sin (5 theta + b) from cos and sin of theta, by the multiple-angle polynomials
          const c = rho > 1e-9 ? x / rho : 1;
          const sn = rho > 1e-9 ? y / rho : 0;
          const c2 = c * c;
          const s2 = sn * sn;
          const sin3 = 3 * sn - 4 * s2 * sn;
          const cos3 = 4 * c2 * c - 3 * c;
          const sin5 = 16 * s2 * s2 * sn - 20 * s2 * sn + 5 * sn;
          const cos5 = 16 * c2 * c2 * c - 20 * c2 * c + 5 * c;
          const d = rho / (r * (1 + 0.12 * (sin3 * c3 + cos3 * s3) + 0.06 * (sin5 * c5 + cos5 * s5)));
          const at = jy * size + (((px % size) + size) % size);
          if (d < L.d[at]!) {
            L.d[at] = d;
            L.id[at] = k;
            L.ox[at] = ex / r;
            L.oy[at] = ey / r;
          }
        }
      }
    }
  layerCache.set(key, L);
  return L;
}

interface AggregateField {
  /** The tone of the section, 0..1, the paste at about 0.56. */
  k: Float32Array;
  /** Its mean over the tile: what the multiplier of the false colour is taken from, so that it averages one. */
  mean: number;
  /** A tint of each texel, to multiply the grey. */
  tint: Float32Array;
}
let aggregateCache: AggregateField | null = null;
const AGG_SIZE = 256;
/** The paste's own tone in the field. */
const PASTE = 0.56;

/**
 * Concrete cut across, drawn once: a cement paste with a slow mottle and a fine sand, aggregate of two sizes (stones of 13 to 21 mm and of 6 to 9 mm across, each its own tone, light limestone, grey granite, dark
 * basalt, a darker rim round each where the paste meets it), and a few air voids. One tile is 0.5 m. Not drawn twice: the colour map of the cut slab and the multiplier of the false colour read the same field.
 */
function aggregateField(): AggregateField {
  if (aggregateCache) return aggregateCache;
  const bigL = stoneLayer(stones(22, 0.34, 0.5, 1), AGG_SIZE);
  const midL = stoneLayer(stones(44, 0.26, 0.44, 5), AGG_SIZE);
  const k = new Float32Array(AGG_SIZE * AGG_SIZE);
  const tint = new Float32Array(AGG_SIZE * AGG_SIZE * 3);
  for (let j = 0; j < AGG_SIZE; j++)
    for (let i = 0; i < AGG_SIZE; i++) {
      const u = i / AGG_SIZE;
      const v = j / AGG_SIZE;
      let t = PASTE + 0.06 * (tf(u, v, 4, 1) - 0.5) + 0.06 * (hash1(i, j) - 0.5);
      let r = 1.02;
      let g = 1;
      let b = 0.95;
      const at = j * AGG_SIZE + i;
      const layer = bigL.id[at]! >= 0 ? bigL : midL;
      const hit = layer.id[at]! >= 0 ? { id: layer.id[at]! + (layer === bigL ? 0 : 5000), d: layer.d[at]! } : null;
      if (hit) {
        const h = hash1(hit.id, 77);
        const base =
          h < 0.34
            ? 0.66 + 0.13 * hash1(hit.id, 3)
            : h < 0.82
              ? 0.38 + 0.14 * hash1(hit.id, 3)
              : 0.2 + 0.1 * hash1(hit.id, 3);
        const grain = 0.05 * (hash1(i >> 1, j >> 1) - 0.5) + 0.02 * (hash1(i + 3, j) - 0.5);
        const rim = smoothstep(0.82, 1.02, hit.d);
        const inside = 1 - smoothstep(0.88, 1.04, hit.d);
        const stone = (base + grain) * (1 - 0.16 * rim);
        t = t + (stone - t) * inside;
        const hue = hash1(hit.id, 21);
        const warm = hue > 0.66 ? 1 : hue > 0.33 ? 0 : -1;
        r = r + (1 + 0.04 * warm - r) * inside;
        g = g + (1 - g) * inside;
        b = b + (1 - 0.07 * warm - b) * inside;
      }
      // a few air voids, small dark dishes (a hash of the cell: no more than one in a hundred and fifty)
      const cell = hash1((i >> 2) + 401, (j >> 2) + 77);
      if (cell > 0.993) t *= 0.6 + 0.4 * smoothstep(0.0, 2.2, Math.hypot((i & 3) - 1.5, (j & 3) - 1.5));
      const n = j * AGG_SIZE + i;
      k[n] = Math.min(1, Math.max(0, t));
      tint[n * 3] = r;
      tint[n * 3 + 1] = g;
      tint[n * 3 + 2] = b;
    }
  let sum = 0;
  for (let n = 0; n < k.length; n++) sum += k[n]!;
  aggregateCache = { k, mean: sum / k.length, tint };
  return aggregateCache;
}

/**
 * What the false colour of a concrete section is multiplied by: the tone of the cut concrete as a deviation from the tile's own mean, 0.5 being that mean (so that what multiplies the ramp averages one: the legend stays true) (a stone is lighter or darker than it, a void darker). Data, not
 * colour: the shader of the section reads it as it is. One tile is 0.5 m; the shader reads it twice, at 0.5 m and at 0.14 m, for a view from a metre and a view from a hand's breadth.
 */
export const aggregateMap = (): THREE.DataTexture =>
  map(
    'aggregate',
    AGG_SIZE,
    (_u, _v, i, j) => {
      const f = aggregateField();
      const d = 0.5 + (f.k[j * AGG_SIZE + i]! - f.mean) * 1.15;
      return [d, d, d];
    },
    false,
  );

/** The same cut concrete as a colour map, for the caps of what is not coloured by the model: the footing, the slab, the ceiling's band. To be tinted. One tile is 0.5 m. */
export const cutConcreteMap = (): THREE.DataTexture =>
  map('cut-concrete', AGG_SIZE, (_u, _v, i, j) => {
    const f = aggregateField();
    const n = j * AGG_SIZE + i;
    // a section of slab seen from a metre wants a quieter face than the false colour's multiplier: the stones keep a third of their contrast
    const t = PASTE + (f.k[n]! - PASTE) * 0.4;
    return [t * f.tint[n * 3]!, t * f.tint[n * 3 + 1]!, t * f.tint[n * 3 + 2]!];
  });

/**
 * Black acrylic on cast concrete that was poured against boards, as the collector's face is: the paint takes the formwork's imprint. Boards of 0.2 m (a joint with a pale fin where the paint was rubbed off its arris),
 * the grain of the planks along U, a tie hole at the middle of the tile (a recess, a pale ring of the concrete round it), a fine pitting where the paint did not fill a pore, a roller's uneven film. Colour map: a
 * black that is not a flat colour. One tile is 0.8 m.
 */
export const blackPaintMap = (): THREE.DataTexture =>
  map('black-paint', 256, (u, v, i, j) => {
    const boards = 4;
    const b = Math.floor(v * boards);
    const vv = (v * boards) % 1;
    const board = 0.15 + 0.012 * (hash1(b, 5) - 0.5);
    const grain = tn(u * 5 + b * 7.1, v * 150, 256, 150) - 0.5;
    const film = tf(u, v, 6, 3) - 0.5;
    const stipple = hash1(i >> 1, j >> 1) - 0.5;
    let k = board + 0.012 * grain + 0.022 * film + 0.012 * stipple + 0.005 * (hash1(i, j) - 0.5);
    // the joint between two boards: the arris rubbed through to a pale line, a shadow line under it
    const seam = Math.min(vv, 1 - vv);
    if (seam < 0.022) k += 0.07 * (1 - seam / 0.022);
    else if (vv > 0.9) k -= 0.025 * smoothstep(0.9, 0.975, vv);
    // pits the paint did not fill, a little more of them along the joints
    const pit = hash1(i * 3 + 1, j * 5 + 2);
    if (pit > 0.9965 - (seam < 0.05 ? 0.003 : 0)) k = 0.2 + 0.06 * hash1(j, i);
    // a tie hole: a recess with the concrete showing at its rim
    const d = Math.hypot(u - 0.5, v - 0.5);
    if (d < 0.013) k = 0.035;
    else if (d < 0.026) k = 0.13 + 0.05 * smoothstep(0.026, 0.016, d);
    return [k * 1.02, k, k * 0.97];
  });

/** The relief of that face: the planks' grain and joints, the pits, the tie hole's dish, a roller's orange peel. Tangent-space. One tile is 0.8 m, as the colour's. */
export const blackPaintNormalMap = (): THREE.DataTexture =>
  normalMap(
    'black-paint-normal',
    128,
    (u, v, i, j) => {
      const boards = 4;
      const b = Math.floor(v * boards);
      const vv = (v * boards) % 1;
      const seam = Math.min(vv, 1 - vv);
      const grain = tn(u * 5 + b * 7.1, v * 150, 256, 150);
      const peel = tf(u, v, 40, 2);
      const d = Math.hypot(u - 0.5, v - 0.5);
      const groove = seam < 0.04 ? -0.9 * Math.sin((seam / 0.04) * Math.PI * 0.5) - 0.2 : 0;
      const dish = d < 0.028 ? -3.2 * smoothstep(0.028, 0.006, d) : 0;
      const pit = hash1(i * 3 + 1, j * 5 + 2) > 0.9965 ? -0.6 : 0;
      return 0.03 * grain + 0.05 * peel + groove * 0.3 + dish * 0.25 + pit * 0.2;
    },
    1.6,
  );

/** The terracotta floor, the relief: a recessed joint round each tile, a tile that dishes a little, a face that is not glass. Tangent-space. One tile of the map holds 4 × 4 tiles: 0.8 m. */
export const tileNormalMap = (): THREE.DataTexture =>
  normalMap(
    'tile-normal',
    128,
    (u, v, i, j) => {
      const n = 4;
      const fu = (u * n) % 1;
      const fv = (v * n) % 1;
      const edge = Math.min(fu, 1 - fu, fv, 1 - fv);
      const joint = -smoothstep(0.05, 0.0, edge);
      const dish = 0.12 * (1 - Math.pow(Math.abs(fu - 0.5) * 2, 2)) * (1 - Math.pow(Math.abs(fv - 0.5) * 2, 2));
      return 0.9 * joint + dish + 0.05 * tf(u, v, 24, 2) + 0.02 * (hash1(i, j) - 0.5);
    },
    1.4,
  );

/**
 * Hardcore under a slab, cut across: broken stone of every size, angular, grey and buff, in a dark sandy fines that fills what the stones leave; each stone is lit from one side, so that it has a face. Two sizes (14 and 6 cm
 * cells). One tile is 1.0 m.
 */
const HC_BIG = (): StoneLayer => stoneLayer(stones(7, 0.32, 0.5, 2), 128);
const HC_SMALL = (): StoneLayer => stoneLayer(stones(16, 0.3, 0.48, 6), 128);
export const hardcoreMap = (): THREE.DataTexture =>
  map('hardcore', 128, (u, v, i, j) => {
    const fines = 0.3 + 0.05 * (tf(u, v, 8, 3) - 0.5) + 0.03 * (hash1(i, j) - 0.5);
    let k = fines;
    let r = 1.06;
    const g = 0.98;
    let b = 0.85;
    const at = j * 128 + i;
    // the small stones first, the large over them: a stone is never cut by a smaller one
    for (const [L, salt] of [
      [HC_SMALL(), 6],
      [HC_BIG(), 2],
    ] as const) {
      const id = L.id[at]!;
      if (id < 0) continue;
      const d = L.d[at]!;
      const inside = 1 - smoothstep(0.88, 1.0, d);
      if (inside <= 0) continue;
      const h = hash1(id, 9 + salt);
      const base = h < 0.3 ? 0.58 : h < 0.75 ? 0.46 : 0.36;
      // a face lit from the upper left, its rim a little darker
      const face = 1 + 0.14 * (-L.ox[at]! * 0.6 - L.oy[at]! * 0.8) - 0.1 * smoothstep(0.7, 1.0, d);
      const t = (base + 0.08 * hash1(id, 3) - 0.04) * face + 0.03 * (hash1(i + 5, j) - 0.5);
      const buff = hash1(id, 21) > 0.5;
      k = k + (t - k) * inside;
      r = r + ((buff ? 1.06 : 0.98) - r) * inside;
      b = b + ((buff ? 0.88 : 1.0) - b) * inside;
    }
    return [k * r, k * g, k * b];
  });

/** The relief of a lime render or an earth plaster put on by hand: a wall that is not a plane (the waves of a hand's reach), the float's low strokes, a roughcast's bumps. Tangent-space; one tile is 1.5 m, as the colour maps'. */
export const renderNormalMap = (): THREE.DataTexture =>
  normalMap(
    'render-normal',
    128,
    (u, v, i, j) => {
      const hand = tf(u, v, 3, 2);
      const stroke = tf(u, v, 8, 2, 20);
      const bump = tf(u, v, 24, 2);
      return 1.6 * hand + 0.5 * stroke + 0.55 * bump + 0.08 * (hash1(i, j) - 0.5);
    },
    1.1,
  );
