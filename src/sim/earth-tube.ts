import { airCp, airK, airMu, airPr, airRho, tubeFlow, tubePressureDrop } from '@onigam/lab-kit/sim/thermal';
import { monthlyAir, pressureAt, SITES, type Site, type SiteId } from './climate';
import { HOUSE_1967 } from './machine';

// The what-if. No such pipe was ever measured at this house, nor, as far as the research found, on a house at altitude. A pipe buried in a soil at its yearly wave. Three measured office systems serve as
// a check of the pipe's formula, then the house's own fresh air goes through a pipe of the size an architect describes. Only a positive flow goes to the kit's `tubeFlow`, and a pipe has no reverse flow here.

/** A soil, usual values, none measured here. */
export interface Soil {
  /** W/m·K. */
  k: number;
  /** m²/s. */
  alpha: number;
}

/** Moist ground, an estimate: usual tables give k from 1 to 2, α from 0.5 to 1 × 10⁻⁶. */
export const SOIL_MOIST: Soil = { k: 1.5, alpha: 0.7e-6 };
/** Dry and rocky, or dry gravel: estimates for the two dry systems of the comparison. */
export const SOIL_DRY: Soil = { k: 1.0, alpha: 0.5e-6 };

/** The year's angular frequency, rad/s. */
const YEAR_OMEGA = (2 * Math.PI) / (365 * 86400);

export interface TubeSpec {
  /** One pipe: length, inner diameter, depth of its axis, m. */
  length: number;
  diameter: number;
  depth: number;
  /** Parallel pipes. */
  count: number;
  /** Total flow, m³/h. */
  flow: number;
  soil: Soil;
}

/**
 * Share of the gap to the soil the air recovers, 0 to 1: 1 − exp(−UA/ṁc), where the pipe's film and a buried line in a half space are in series. The steady ln(2z/r)/2πk stands for a soil that has
 * settled, which is the fair one for a yearly mean. The source for the comparison calls this ratio Θ. A pipe always runs forward, so only a positive flow goes to `tubeFlow`.
 */
export function tubeTheta(t: TubeSpec, T = 10, pressure = 101325): number {
  const rho = airRho(T, pressure);
  const m = ((t.flow / t.count) * rho) / 3600;
  const flow = tubeFlow(m, t.diameter, { rho, mu: airMu(T), k: airK(T), Pr: airPr(T) });
  const r = t.diameter / 2;
  const Rsoil = Math.log((2 * t.depth) / r) / (2 * Math.PI * t.soil.k);
  const Rfilm = 1 / (flow.h * Math.PI * t.diameter);
  const UA = t.length / (Rsoil + Rfilm);
  return 1 - Math.exp(-UA / (m * airCp(T)));
}

/** The same share from a measured overall coefficient: 1 − exp(−h·A/ṁc), W/m²·K. */
export function thetaFromMeasured(t: TubeSpec, h: number, T = 10, pressure = 101325): number {
  const rho = airRho(T, pressure);
  const area = t.count * Math.PI * t.diameter * t.length;
  return 1 - Math.exp(-(h * area) / ((t.flow / 3600) * rho * airCp(T)));
}

/** The pipe's speed, m/s. */
export function tubeSpeed(t: TubeSpec): number {
  return t.flow / t.count / 3600 / ((Math.PI * t.diameter * t.diameter) / 4);
}

/** Friction of one pipe, Pa. */
export function tubeFriction(t: TubeSpec, T = 10, pressure = 101325): number {
  const rho = airRho(T, pressure);
  const m = ((t.flow / t.count) * rho) / 3600;
  const flow = tubeFlow(m, t.diameter, { rho, mu: airMu(T), k: airK(T), Pr: airPr(T) });
  return tubePressureDrop(flow, t.length, t.diameter, rho);
}

/** The soil's yearly wave at a depth, °C: the textbook's form, on the site's yearly air, with the mean of the air as its mean. Snow, shade and water are not in it. */
export function soilTemperature(site: Site, day: number, depth: number, soil: Soil = SOIL_MOIST): number {
  let sum = 0;
  let hot = -Infinity;
  let cold = Infinity;
  let peak = 0;
  for (let d = 1; d <= 365; d += 5) {
    const a = monthlyAir(site, d);
    sum += a;
    if (a > hot) {
      hot = a;
      peak = d;
    }
    if (a < cold) cold = a;
  }
  const mean = sum / 73;
  const amp = (hot - cold) / 2;
  const delta = Math.sqrt((2 * soil.alpha) / YEAR_OMEGA);
  return mean + amp * Math.exp(-depth / delta) * Math.cos(YEAR_OMEGA * (day - peak) * 86400 - depth / delta);
}

/** The pipe of the lab's what-if: an architect's illustration (25 to 50 m at 1.5 to 2 m), the house's own fresh air at half a volume an hour. All of it an estimate. */
export const HOUSE_TUBE: TubeSpec = {
  length: 50,
  diameter: 0.2,
  depth: 2,
  count: 1,
  flow: 0.5 * HOUSE_1967.volume,
  soil: SOIL_MOIST,
};

/**
 * The three measured office systems. Dimensions, flow and ratio as printed. Hamm's pipes are two sizes: the diameter here is the one its printed specific area gives, derived. The soils are the words of the
 * source, turned into numbers by me: an estimate.
 */
export const MEASURED_TUBES: {
  id: string;
  spec: TubeSpec;
  thetaReported: number;
  speedReported: number;
  /** The overall coefficient, W/m²·K, fitted to the year by the source. */
  hReported: number;
}[] = [
  {
    id: 'DB Netz, Hamm',
    spec: { length: 87, diameter: 0.232, depth: 3, count: 26, flow: 10300, soil: SOIL_DRY },
    thetaReported: 0.944,
    speedReported: 2.2,
    hReported: 5.5,
  },
  {
    id: 'Fraunhofer ISE, Freiburg',
    spec: { length: 95, diameter: 0.25, depth: 2, count: 7, flow: 7000, soil: SOIL_DRY },
    thetaReported: 0.766,
    speedReported: 5.6,
    hReported: 5.0,
  },
  {
    id: 'Lamparter, Weilheim',
    spec: { length: 90, diameter: 0.35, depth: 2.3, count: 2, flow: 1100, soil: { k: 2, alpha: 0.8e-6 } },
    thetaReported: 0.804,
    speedReported: 1.6,
    hReported: 3.2,
  },
];

export interface TubeYear {
  theta: number;
  /** Mean of the pipe's outlet and of the outside air, January and July, °C. */
  outJan: number;
  airJan: number;
  outJul: number;
  airJul: number;
  /** What the air gains over the heating period (when the air is under the setpoint and the soil above the air), kWh. */
  heatingKWh: number;
  /** What it loses when the air is above 22 °C and the soil is below it, kWh: the only cooling the tube is asked for. */
  coolingKWh: number;
  /** The same year's load of the house through G·V and the setpoint, kWh. */
  loadKWh: number;
  /** Friction of the pipe at this flow, Pa, and a fan at half efficiency over a year, kWh. */
  frictionPa: number;
  fanKWh: number;
}

/** A year of the pipe, in closed form, hour by hour on the site's mean days. */
export function tubeYear(
  id: SiteId,
  t: TubeSpec = HOUSE_TUBE,
  GV = HOUSE_1967.G * HOUSE_1967.volume,
  setpoint = 20,
): TubeYear {
  const site = SITES[id];
  const p = pressureAt(site.altitude);
  const theta = tubeTheta(t, 10, p);
  const c = (t.flow * airRho(10, p) * airCp(10)) / 3600;
  let heating = 0;
  let cooling = 0;
  let load = 0;
  let outJan = 0;
  let airJan = 0;
  let outJul = 0;
  let airJul = 0;
  for (let d = 1; d <= 365; d++) {
    const soil = soilTemperature(site, d, t.depth, t.soil);
    const mean = monthlyAir(site, d);
    for (let h = 0; h < 24; h++) {
      const air = mean + 4 * Math.cos((2 * Math.PI * (h - 15)) / 24);
      const gain = c * theta * (soil - air);
      if (air < setpoint) {
        if (gain > 0) heating += gain;
        load += GV * (setpoint - air);
      } else if (air > 22 && gain < 0) cooling -= gain;
      const out = air + theta * (soil - air);
      if (d <= 31) {
        outJan += out;
        airJan += air;
      }
      if (d >= 182 && d <= 212) {
        outJul += out;
        airJul += air;
      }
    }
  }
  const fric = tubeFriction(t, 10, p);
  const fanW = (fric * t.flow) / 3600 / 0.5;
  return {
    theta,
    outJan: outJan / (31 * 24),
    airJan: airJan / (31 * 24),
    outJul: outJul / (31 * 24),
    airJul: airJul / (31 * 24),
    heatingKWh: heating / 1000,
    coolingKWh: cooling / 1000,
    loadKWh: load / 1000,
    frictionPa: fric,
    fanKWh: (fanW * 8760) / 1000,
  };
}
