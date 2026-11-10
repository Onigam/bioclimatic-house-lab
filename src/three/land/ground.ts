import { SITE, DEPTH, GROUND_NORTH, GROUND_SOUTH, Z_NORTH, Z_SOUTH } from '../dims';
import { smoothstep } from '../common';
import { fbm } from '../textures';

// The ground of the plateau, in the house frame (y = 0 is the floor's top). One function for every world: the diorama of `house` and the landscape of `site` stand on the same land, so the house rests on it
// the same way everywhere. A granite slope that falls to the south: along the house about 2 m in 6.6 m (`dims.ts`), easing out to the meadow and the road, rising to the north. Flat across the house (the stepped foundations
// carry the fall), a gentle roll and a few outcrops away from it. composed, never mapped.

/** Knots of the profile along z (south positive): [z, y]. The house's two walls are at z = ∓DEPTH/2. */
const KNOTS: readonly (readonly [number, number])[] = [
  [-420, 58],
  [-210, 31],
  [-90, 15.5],
  [-42, 6.4],
  [-22, 2.5],
  [-10, 0.7],
  [-5, 0.05],
  [Z_NORTH, GROUND_NORTH],
  [Z_SOUTH, GROUND_SOUTH],
  [6.2, -2.55],
  [13, -3.15],
  [26, -4.1],
  [60, -6.3],
  [150, -9.6],
  [420, -15],
];

/** Monotone cubic interpolation (Fritsch and Carlson): no wiggle between the knots. */
const SLOPES: number[] = (() => {
  const n = KNOTS.length;
  const d: number[] = [];
  for (let i = 0; i < n - 1; i++) d.push((KNOTS[i + 1]![1] - KNOTS[i]![1]) / (KNOTS[i + 1]![0] - KNOTS[i]![0]));
  const m: number[] = [d[0]!];
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1]! * d[i]! <= 0 ? 0 : (d[i - 1]! + d[i]!) / 2);
  m.push(d[n - 2]!);
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
      continue;
    }
    const a = m[i]! / d[i]!;
    const b = m[i + 1]! / d[i]!;
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i]!;
      m[i + 1] = t * b * d[i]!;
    }
  }
  return m;
})();

/** The slope's height at z, m (house frame). */
export function slopeY(z: number): number {
  const n = KNOTS.length;
  if (z <= KNOTS[0]![0]) return KNOTS[0]![1] + SLOPES[0]! * (z - KNOTS[0]![0]);
  if (z >= KNOTS[n - 1]![0]) return KNOTS[n - 1]![1] + SLOPES[n - 1]! * (z - KNOTS[n - 1]![0]);
  let i = 0;
  while (z > KNOTS[i + 1]![0]) i++;
  const [z0, y0] = KNOTS[i]!;
  const [z1, y1] = KNOTS[i + 1]!;
  const h = z1 - z0;
  const t = (z - z0) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * y0 +
    (t3 - 2 * t2 + t) * h * SLOPES[i]! +
    (-2 * t3 + 3 * t2) * y1 +
    (t3 - t2) * h * SLOPES[i + 1]!
  );
}

/** Distance from the house's yard, a rectangle round the house, m: the ground is the bare profile inside it. */
const YARD = { x0: -14, x1: SITE.twinAt + 14, z0: -8, z1: 15 };
const rectDist = (x: number, z: number): number =>
  Math.hypot(Math.max(YARD.x0 - x, 0, x - YARD.x1), Math.max(YARD.z0 - z, 0, z - YARD.z1));

/**
 * The land at (x, z), m. The bare profile in the yard; a low roll and fine grain beyond it, growing with the distance, and a rise of the meadow toward the furnace's side at the east, which the road follows. Deterministic.
 */
export function groundY(x: number, z: number): number {
  const base = slopeY(z);
  const d = rectDist(x, z);
  if (d <= 0) return base;
  const w = smoothstep(0, 18, d);
  const far = smoothstep(40, 400, d);
  const roll =
    (fbm(x * 0.012 + 3.1, z * 0.012 - 1.7, 3) - 0.5) * 2.4 + (fbm(x * 0.05 + 9, z * 0.05 + 2, 2) - 0.5) * 0.5;
  const swell = (fbm(x * 0.0026 + 11, z * 0.0026 + 5, 4) - 0.5) * 60 * far;
  return base + w * roll + swell;
}

// ---- the pads of the setting: the solar furnace's shelf, the field of heliostats on its eight terraces, the 1974 building's shelf. Flat to the millimetre where a building stands; blended into the land beyond.
const [FX, FZ] = SITE.furnaceAt;
const PAD_FURNACE = { x0: FX - 52, x1: FX + 52, z0: FZ - 36, z1: FZ + 26, margin: 16 };
export const FIELD = {
  x0: FX - 62,
  x1: FX + 62,
  z0: SITE.field.z0 - SITE.field.dz * 0.5,
  z1: SITE.field.z0 - SITE.field.dz * 0.5 + SITE.field.dz * SITE.heliostat.terraces,
};
const PAD_MONUMENT = {
  x0: SITE.monumentAt[0] - 24,
  x1: SITE.monumentAt[0] + 24,
  z0: SITE.monumentAt[1] - 14,
  z1: SITE.monumentAt[1] + 12,
  margin: 14,
};

/** The level of terrace k of the heliostat field: the slope's height at its middle. */
export const terraceLevel = (k: number): number => slopeY(SITE.field.z0 + k * SITE.field.dz);

/** The land at (x, z) with the pads and terraces laid in. */
export function landY(x: number, z: number): number {
  let h = groundY(x, z);
  const pad = (p: { x0: number; x1: number; z0: number; z1: number; margin: number }, level: number): void => {
    const d = Math.hypot(Math.max(p.x0 - x, 0, x - p.x1), Math.max(p.z0 - z, 0, z - p.z1));
    if (d >= p.margin) return;
    const w = 1 - smoothstep(0, p.margin, d);
    h += (level - h) * w;
  };
  pad(PAD_FURNACE, slopeY(FZ) + 0.0);
  pad(PAD_MONUMENT, slopeY(SITE.monumentAt[1]) + 0.0);
  // the terraces: flat bands, joined by short risers
  const edge =
    1 - smoothstep(0, 10, Math.hypot(Math.max(FIELD.x0 - x, 0, x - FIELD.x1), Math.max(FIELD.z0 - z, 0, z - FIELD.z1)));
  if (edge > 0) {
    const t = (z - FIELD.z0) / SITE.field.dz;
    const k = Math.min(SITE.heliostat.terraces - 1, Math.max(0, Math.floor(t)));
    const f = Math.min(1, Math.max(0, t - k));
    const a = terraceLevel(k);
    const b = terraceLevel(Math.min(SITE.heliostat.terraces, k + 1));
    const level = a + (b - a) * smoothstep(0.86, 1.0, f);
    h += (level - h) * edge;
  }
  return h;
}

/** The slope's fall across the house, m: from the north wall's foot to the south front's. derived */
export const FALL_ACROSS_HOUSE = GROUND_NORTH - GROUND_SOUTH;

/** True when the land reaches the heights `dims.ts` says at the walls. */
export const landAtWalls = (): { north: number; south: number; depth: number } => ({
  north: groundY(0, Z_NORTH),
  south: groundY(0, Z_SOUTH),
  depth: DEPTH,
});

/** The road: a gravel lane that runs east-west south of the house, a little downhill, with a bend. The centre line z(x). estimate: composed. */
export const roadZ = (x: number): number => 31 + 3.2 * Math.sin(x * 0.018 + 0.6) + 0.004 * x;
export const ROAD_WIDTH = 4.2;

/** Where the plateau's heights stop being the bare profile: the twin house stands in the same yard row, 38 m to the east. */
export const TWIN_X = SITE.twinAt;
