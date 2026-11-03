// What sheets of glass do to the sun, as a function of the angle. Fresnel's two polarisations, the usual sum over reflections between N sheets, and the glass's own absorption (Duffie and Beckman's
// formulas, from memory, no table of the source's glass exists). The tables are built once per glazing, so a read is an interpolation. At a steep sun the glass refuses: that is half of why this wall
// works less in June.

const RAD = Math.PI / 180;
const STEP = 2;
const N_POINTS = 90 / STEP + 1;

/** The transmittance of N sheets by reflection alone, averaged on the two polarisations, at an incidence in degrees. */
export function reflectionTransmittance(thetaDeg: number, sheets: number, index: number): number {
  if (sheets <= 0) return 1;
  if (thetaDeg >= 89.999) return 0;
  const t1 = Math.max(thetaDeg, 1e-3) * RAD;
  const t2 = Math.asin(Math.sin(t1) / index);
  const perp = Math.sin(t2 - t1) ** 2 / Math.sin(t2 + t1) ** 2;
  const para = Math.tan(t2 - t1) ** 2 / Math.tan(t2 + t1) ** 2;
  const one = (r: number): number => (1 - r) / (1 + (2 * sheets - 1) * r);
  return 0.5 * (one(perp) + one(para));
}

/** What the absorption of one sheet lets pass, at an incidence in degrees. */
export function absorptionTransmittance(thetaDeg: number, KL: number, index: number): number {
  if (thetaDeg >= 89.999) return Math.exp(-KL / Math.sqrt(1 - 1 / (index * index)));
  const c2 = Math.cos(Math.asin(Math.sin(thetaDeg * RAD) / index));
  return Math.exp(-KL / c2);
}

export interface Glazing {
  sheets: number;
  /** Transmittance by angle. */
  tau: Float64Array;
  /** Transmittance × absorptance of the plate behind it, with the plate's reflection going back from the glass. */
  tauAlpha: Float64Array;
  /** Share of the incident sun each sheet absorbs, by angle: one row per sheet, the outer one first. */
  absorbed: Float64Array[];
}

/**
 * Build the tables of a glazing of `sheets` sheets, each of optical thickness `KL`, in front of a plate of absorptance `alpha`. The sheets' absorption is the usual first-order split; what is neither
 * absorbed nor passed goes back out.
 */
export function buildGlazing(sheets: number, KL: number, alpha: number, index: number): Glazing {
  const tau = new Float64Array(N_POINTS);
  const tauAlpha = new Float64Array(N_POINTS);
  const absorbed = Array.from({ length: sheets }, () => new Float64Array(N_POINTS));
  // the plate's reflected part comes back from the glass as diffuse: its reflectance is read at 60°
  const rhoD = 1 - reflectionTransmittance(60, sheets, index);
  const bounce = alpha / (1 - (1 - alpha) * rhoD);
  for (let i = 0; i < N_POINTS; i++) {
    const th = i * STEP;
    const ta = absorptionTransmittance(th, KL, index);
    const t = reflectionTransmittance(th, sheets, index) * Math.pow(ta, sheets);
    tau[i] = t;
    tauAlpha[i] = t * bounce;
    for (let j = 0; j < sheets; j++) {
      absorbed[j]![i] = reflectionTransmittance(th, j + 1, index) * Math.pow(ta, j) * (1 - ta);
    }
  }
  return { sheets, tau, tauAlpha, absorbed };
}

/** Read a table at an angle, degrees. */
export function readAngle(table: Float64Array, thetaDeg: number): number {
  if (thetaDeg <= 0) return table[0]!;
  if (thetaDeg >= 90) return table[N_POINTS - 1]!;
  const x = thetaDeg / STEP;
  const i = Math.floor(x);
  return table[i]! + (table[i + 1]! - table[i]!) * (x - i);
}

/**
 * The incidence that stands for all of the sky's and the ground's diffuse light on a vertical plane, degrees: Brandemuehl and Beckman's fits at a tilt of 90°, from memory, give 59.3° and 59.7°. One
 * value for both.
 */
export const DIFFUSE_ANGLE = 59.5;
