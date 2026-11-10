import * as THREE from 'three';
import { grassDetail } from '@onigam/lab-kit/three';
import { smoothstep } from '../common';
import { BALCONY, SITE, Z_SOUTH } from '../dims';
import { fbm } from '../textures';
import { groundY, landY, roadZ, ROAD_WIDTH } from './ground';

// The land as meshes. One function for the diorama of `house` (a block of land with its strata showing on four sides and in the section) and one for the landscape of `site` (a graded grid out to the far hills). The colour
// of each vertex is computed here: a meadow in patches of greener and drier grass, bare earth and gravel round the house and along the path from the stair, the road, rock where the slope is steep. The snow is one uniform,
// the same everywhere: it lies on the faces that look up, and less under the trees.

export const SNOW = { value: 0 };

const C = (hex: number): THREE.Color => new THREE.Color(hex);
const GREEN = C(0x62702c);
const GREEN2 = C(0x7a8438);
const DRY = C(0x9a8f4c);
const EARTH = C(0x7a6246);
const GRAVEL = C(0x9a948a);
const ROCK = C(0x8b8782);
const ROAD = C(0x8d867a);

/** The path from the foot of the balcony's stair south to the road. */
const pathX = (z: number): number => 0.1 * Math.sin(z * 0.2) - 0.0;
const STAIR_FOOT_Z = Z_SOUTH + BALCONY.depth + 4.2;

/** Colour of the ground at (x, z), given the slope's steepness `steep` (0 flat, 1 sheer). */
export function landColor(x: number, z: number, steep: number, out = new THREE.Color()): THREE.Color {
  const broad = fbm(x * 0.03 + 3, z * 0.03 - 5, 3);
  const fine = fbm(x * 0.4, z * 0.4, 2);
  out
    .copy(GREEN)
    .lerp(GREEN2, smoothstep(0.35, 0.7, broad))
    .lerp(DRY, smoothstep(0.55, 0.85, fbm(x * 0.07 + 9, z * 0.07 + 1, 3)) * 0.65);
  out.multiplyScalar(0.86 + 0.28 * fine);
  // bare earth and gravel round the house and along the path
  const dh = Math.max(Math.abs(x) - 8.4, 0) + Math.max(Math.abs(z) - 3.8, 0) * 0 + 0;
  const nearHouse =
    1 - smoothstep(0, 3.2, Math.hypot(Math.max(Math.abs(x - 0) - 7.9, 0), Math.max(Math.abs(z) - 3.8, 0)));
  void dh;
  const dPath = z > Z_SOUTH + BALCONY.depth ? Math.abs(x - pathX(z)) : 9;
  const path = (1 - smoothstep(0.5, 1.1, dPath + 0.25 * (fine - 0.5))) * smoothstep(Z_SOUTH, Z_SOUTH + 2, z);
  out.lerp(EARTH, nearHouse * 0.55);
  out.lerp(GRAVEL, Math.max(path, nearHouse * 0.35 * smoothstep(0.4, 0.8, fine)));
  // the road: gravel with a darker rut either side
  const rz = roadZ(x);
  const dr = Math.abs(z - rz);
  const road = 1 - smoothstep(ROAD_WIDTH / 2 - 0.3, ROAD_WIDTH / 2 + 0.5, dr);
  out.lerp(ROAD, road);
  // rock where it is steep
  out.lerp(ROCK, smoothstep(0.28, 0.5, steep + 0.12 * (fine - 0.5)) * 0.9);
  return out;
}

export function patchLand(mat: THREE.MeshStandardMaterial): void {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSnow = SNOW;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vLandN;\nvarying vec3 vLandP;')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvLandN = objectNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLandP = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying vec3 vLandN;\nvarying vec3 vLandP;\nuniform float uSnow;\nfloat sHash( vec2 p ) { return fract( sin( dot( p, vec2( 127.1, 311.7 ) ) ) * 43758.5453 ); }\nfloat sNoise( vec2 p ) { vec2 i = floor( p ); vec2 f = fract( p ); vec2 u = f * f * ( 3.0 - 2.0 * f ); return mix( mix( sHash( i ), sHash( i + vec2( 1.0, 0.0 ) ), u.x ), mix( sHash( i + vec2( 0.0, 1.0 ) ), sHash( i + vec2( 1.0, 1.0 ) ), u.x ), u.y ); }',
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `#include <color_fragment>
        {
          float up = smoothstep( 0.55, 0.92, normalize( vLandN ).y );
          float cover = uSnow * mix( 0.35, 1.0, up ) * smoothstep( 0.25, 0.6, 0.5 + 0.7 * ( sNoise( vLandP.xz * 0.35 ) - 0.5 ) + 0.5 * uSnow );
          vec3 snow = mix( vec3( 0.84, 0.86, 0.9 ), vec3( 0.95, 0.96, 0.97 ), sNoise( vLandP.xz * 0.12 ) ) * ( 0.96 + 0.05 * sNoise( vLandP.xz * 2.1 ) );
          diffuseColor.rgb = mix( diffuseColor.rgb, snow, clamp( cover, 0.0, 1.0 ) );
        }`,
      );
  };
  mat.customProgramCacheKey = () => 'bioclimatic-land';
}

export interface Terrain {
  /** The surface. */
  top: THREE.Mesh;
  /** The four sides of the block, with the strata on them, or null for a landscape. */
  skirts: THREE.Mesh | null;
  material: THREE.MeshStandardMaterial;
  /** Triangles. */
  triangles: number;
  /** The strata's material: the section's earth cap takes the same. */
  strata: THREE.MeshStandardMaterial | null;
}

/** The slope at (x, z): the steepness of the surface, 0 flat to 1 vertical (the gradient's size). */
export function steepAt(x: number, z: number, h = 0.6): number {
  const dx = (groundY(x + h, z) - groundY(x - h, z)) / (2 * h);
  const dz = (groundY(x, z + h) - groundY(x, z - h)) / (2 * h);
  return Math.min(1, Math.hypot(dx, dz));
}

export interface BlockOptions {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
  /** Underside of the block, m. */
  bottom: number;
  cell: number;
  strata: THREE.MeshStandardMaterial;
}

/** The depth coordinate the strata map takes: 1 at the surface, falling by 1 per 8 m of depth, held at 0 below. */
export const strataV = (depth: number): number => Math.max(0, 1 - depth / 8);

/** A block of land cut from the plateau: the surface on a grid, the sides as four strips with the strata, the underside left open (the paper takes the shadow). */
export function buildBlock(o: BlockOptions): Terrain {
  const nx = Math.round((o.x1 - o.x0) / o.cell);
  const nz = Math.round((o.z1 - o.z0) / o.cell);
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
  const col = new Float32Array((nx + 1) * (nz + 1) * 3);
  const c = new THREE.Color();
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const x = o.x0 + (i / nx) * (o.x1 - o.x0);
      const z = o.z0 + (j / nz) * (o.z1 - o.z0);
      const k = (j * (nx + 1) + i) * 3;
      pos[k] = x;
      pos[k + 1] = groundY(x, z);
      pos[k + 2] = z;
      landColor(x, z, steepAt(x, z), c);
      col[k] = c.r;
      col[k + 1] = c.g;
      col[k + 2] = c.b;
    }
  const idx: number[] = [];
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      const b = a + 1;
      const d = a + nx + 1;
      const e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, metalness: 0 });
  // the diorama's top is plain: the kit's grass detail crawls under a slow orbit, and a block seen from thirty metres does not need it
  patchLand(mat);
  const top = new THREE.Mesh(g, mat);
  top.name = 'land';
  top.receiveShadow = true;
  top.castShadow = false;

  // the sides: along each edge, the surface's own height above the underside, a strip per cell
  const sp: number[] = [];
  const su: number[] = [];
  const si: number[] = [];
  const edge = (pts: [number, number][], flip: boolean): void => {
    let acc = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x, z] = pts[i]!;
      if (i > 0) acc += Math.hypot(x - pts[i - 1]![0], z - pts[i - 1]![1]);
      const y = groundY(x, z);
      const base = sp.length / 3;
      sp.push(x, y, z, x, o.bottom, z);
      su.push(acc / 10, strataV(0), acc / 10, strataV(y - o.bottom));
      if (i > 0) {
        const p = base - 2;
        if (flip) si.push(p, p + 1, base, base, p + 1, base + 1);
        else si.push(p, base, p + 1, p + 1, base, base + 1);
      }
    }
  };
  const E = (n: number, f: (t: number) => [number, number]): [number, number][] =>
    Array.from({ length: n + 1 }, (_, i) => f(i / n));
  edge(
    E(nx, (t) => [o.x0 + t * (o.x1 - o.x0), o.z1]),
    false,
  ); // south
  edge(
    E(nx, (t) => [o.x0 + t * (o.x1 - o.x0), o.z0]),
    true,
  ); // north
  edge(
    E(nz, (t) => [o.x0, o.z0 + t * (o.z1 - o.z0)]),
    false,
  ); // west
  edge(
    E(nz, (t) => [o.x1, o.z0 + t * (o.z1 - o.z0)]),
    true,
  ); // east
  // the strips of one edge must not join the next: the index above joins within an edge only because each `edge` call restarts at i = 0
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  sg.setAttribute('uv', new THREE.Float32BufferAttribute(su, 2));
  sg.setIndex(si);
  sg.computeVertexNormals();
  const skirts = new THREE.Mesh(sg, o.strata);
  skirts.name = 'land-sides';
  skirts.receiveShadow = true;
  skirts.castShadow = true;
  return { top, skirts, material: mat, triangles: idx.length / 3 + si.length / 3, strata: o.strata };
}

/** A strip along z at plane x from the surface down to `bottom`: the section's earth. Faces +x. */
export function earthCap(x: number, z0: number, z1: number, bottom: number, step = 0.5): THREE.BufferGeometry {
  const n = Math.round((z1 - z0) / step);
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let i = 0; i <= n; i++) {
    const z = z0 + (i / n) * (z1 - z0);
    const y = groundY(x, z);
    pos.push(x, y, z, x, bottom, z);
    uv.push((z - z0) / 10, strataV(0), (z - z0) / 10, strataV(y - bottom));
    if (i > 0) {
      const p = (i - 1) * 2;
      idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export { STAIR_FOOT_Z, pathX, SITE };

// ------------------------------------------------------------------------------------------------ the landscape of `site`

const R = 6500;
const A = 0.012;
/** A graded grid: fine near the houses, coarse to the far hills. u in −1..1. */
export const gridCoord = (u: number): number => R * (A * u + (1 - A) * Math.sign(u) * Math.abs(u) ** 5);

export function buildLandscape(n = 190): THREE.Mesh {
  const pos = new Float32Array((n + 1) * (n + 1) * 3);
  const col = new Float32Array((n + 1) * (n + 1) * 3);
  const c = new THREE.Color();
  const steep = (x: number, z: number): number => {
    const h = 2;
    const dx = (landY(x + h, z) - landY(x - h, z)) / (2 * h);
    const dz = (landY(x, z + h) - landY(x, z - h)) / (2 * h);
    return Math.min(1, Math.hypot(dx, dz));
  };
  for (let j = 0; j <= n; j++)
    for (let i = 0; i <= n; i++) {
      // centred a little to the east, where the furnace is
      const x = gridCoord((i / n) * 2 - 1) + 60;
      const z = gridCoord((j / n) * 2 - 1) - 20;
      const k = (j * (n + 1) + i) * 3;
      pos[k] = x;
      pos[k + 1] = landY(x, z);
      pos[k + 2] = z;
      landColor(x, z, steep(x, z), c);
      // far away the plateau goes to forest: a dark green, a few grey screes
      const far = smoothstep(220, 1200, Math.hypot(x, z));
      c.lerp(new THREE.Color(0x3f4a2c), far * (0.55 + 0.3 * fbm(x * 0.004, z * 0.004, 3)));
      col[k] = c.r;
      col[k + 1] = c.g;
      col[k + 2] = c.b;
    }
  const idx: number[] = [];
  for (let j = 0; j < n; j++)
    for (let i = 0; i < n; i++) {
      const a = j * (n + 1) + i;
      const b = a + 1;
      const d = a + n + 1;
      const e = d + 1;
      idx.push(a, d, b, b, d, e);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 1, metalness: 0 });
  patchLand(mat);
  grassDetail(mat);
  const m = new THREE.Mesh(g, mat);
  m.name = 'land';
  m.receiveShadow = true;
  m.frustumCulled = false;
  return m;
}
