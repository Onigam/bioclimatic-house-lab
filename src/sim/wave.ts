import type { Material } from '@onigam/lab-kit/sim/thermal';

// The daily wave in a thick wall, by the textbook's closed form for a half-infinite solid driven by a sine at its face. The lab's backbone: with the source's own material data it finds
// the source's own measurements of speed and lag. The numerical wall is tested against this.

/** Angular frequency of a day, rad/s. */
export const DAY_OMEGA = (2 * Math.PI) / 86400;

/** Thermal diffusivity at a temperature, m²/s. */
export const diffusivity = (m: Material, T = 20): number => m.k(T) / (m.rho * m.c(T));

/** How deep the wave falls to 1/e, m. */
export const penetrationDepth = (m: Material, omega = DAY_OMEGA): number => Math.sqrt((2 * diffusivity(m)) / omega);

/** Speed of the wave's crest, m/s. */
export const waveSpeed = (m: Material, omega = DAY_OMEGA): number => Math.sqrt(2 * diffusivity(m) * omega);

/** Lag of the crest through a thickness, hours. */
export const waveLagHours = (L: number, m: Material, omega = DAY_OMEGA): number => L / waveSpeed(m, omega) / 3600;

/** The thickness for a lag, m: the question asked the other way round. */
export const thicknessForLag = (hours: number, m: Material, omega = DAY_OMEGA): number =>
  hours * 3600 * waveSpeed(m, omega);

/** What is left of the swing after a thickness, 0 to 1. */
export const waveDamping = (L: number, m: Material, omega = DAY_OMEGA): number =>
  Math.exp(-L / penetrationDepth(m, omega));

/**
 * The wave at a depth, as a closed form, for the 3D's slow view: temperature above the mean at depth `x`, time `t`, for a face swinging by `amplitude` and peaking at `tPeak`, s. The half-infinite
 * solution: T = a·exp(−x/δ)·cos(ω(t − tPeak) − x/δ).
 */
export function waveAt(x: number, t: number, amplitude: number, tPeak: number, m: Material, omega = DAY_OMEGA): number {
  const d = penetrationDepth(m, omega);
  return amplitude * Math.exp(-x / d) * Math.cos(omega * (t - tPeak) - x / d);
}

/** Mass of the store, kg. */
export const wallMass = (area: number, L: number, m: Material): number => area * L * m.rho;
/** Its capacity, J/K. */
export const wallCapacity = (area: number, L: number, m: Material, T = 20): number => wallMass(area, L, m) * m.c(T);

/**
 * The wave through a real slab, with a film on its far side: amplitude and phase of the far face against the near face, for a thickness `L`, a film `h` (W/m²·K) to a still room. The exact solution of
 * the periodic conduction equation; the half-infinite form above ignores the far side, which brings the crest a little earlier. Returns the far face's lag in hours and its amplitude ratio.
 */
export function slabResponse(
  L: number,
  m: Material,
  h: number,
  omega = DAY_OMEGA,
): { lagHours: number; damping: number } {
  const k = m.k(20);
  const d = penetrationDepth(m, omega);
  const a = L / d;
  // with γ = (1 + i)/δ: T(L)/T(0) = 1 / (cosh γL + (h/kγ) sinh γL), and h/kγ = b·(1 − i), b = hδ/2k
  const ch = { re: Math.cosh(a) * Math.cos(a), im: Math.sinh(a) * Math.sin(a) };
  const sh = { re: Math.sinh(a) * Math.cos(a), im: Math.cosh(a) * Math.sin(a) };
  const b = (h * d) / (2 * k);
  const re = ch.re + b * (sh.re + sh.im);
  const im = ch.im + b * (sh.im - sh.re);
  // the arc tangent folds at half a day: the phase of a long slab is near a, the wave's own
  const raw = Math.atan2(im, re);
  const phase = raw + 2 * Math.PI * Math.round((a - raw) / (2 * Math.PI));
  return { lagHours: phase / omega / 3600, damping: 1 / Math.hypot(re, im) };
}
