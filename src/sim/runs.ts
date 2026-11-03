import {
  monthOf,
  newSkySample,
  RECORDS,
  Weather,
  type RecordedDay,
  type RecordId,
  type WeatherOptions,
} from './climate';
import { HOUSE_TUBE, soilTemperature } from './earth-tube';
import { HEATING_END_DAY, HEATING_START_DAY } from './machine';
import { bookResidual, newBook, Plant, type EnergyBook, type PlantSpec } from './plant';
import { buildOf, presetParams, specOf } from './presets';
import type { HouseParams } from './types';

// Long runs: plain functions the tests, the docs' tables and the panel all use. The same `Plant` and the same `Weather` as the live engine.

/** kWh in joules. */
export const KWH = 3.6e6;
/** The fixed step of the live engine and of the shorter runs, s. */
export const THERMAL_STEP = 60;
/** The step of the long runs, s. Halving it moves a season's share by under 0.2 of a point (tested). */
export const SEASON_STEP = 120;

/** Time, weather and machine together. `start` is a record's first day (0) or a day of the year. */
export class Runner {
  readonly sky = newSkySample();
  /** Seconds since `start` at 0 h. */
  t = 0;
  dayIndex: number;
  hour = 0;

  constructor(
    readonly plant: Plant,
    readonly weather: Weather,
    readonly start: number,
    startHour = 0,
  ) {
    this.t = startHour * 3600;
    this.dayIndex = start;
    this.refresh();
  }

  /** Read the clock again after it was moved by hand. */
  refresh(): void {
    this.hour = (this.t % 86400) / 3600;
    this.dayIndex = this.start + Math.floor(this.t / 86400);
    this.weather.setDay(this.dayIndex);
    if (this.plant.spec.tubeTheta > 0) {
      this.plant.soilT = soilTemperature(
        this.weather.site,
        this.weather.dayOfYear(this.dayIndex),
        HOUSE_TUBE.depth,
        HOUSE_TUBE.soil,
      );
    }
  }

  /** One step: the sky at its middle. */
  step(dt: number): void {
    const dayNow = Math.floor(this.t / 86400);
    this.weather.sample(((this.t + dt / 2) % 86400) / 3600, this.sky);
    this.plant.step(this.sky, dt);
    this.t += dt;
    if (Math.floor(this.t / 86400) !== dayNow) this.refresh();
    else this.hour = (this.t % 86400) / 3600;
  }

  /** Run before the start, so that the wall has its history. A record repeats its first day; other skies run the days that come before. The clock comes back to where it was; the book is reset. */
  spin(days: number, dt: number = SEASON_STEP): void {
    const t0 = this.t;
    if (days <= 0) return;
    const record = this.weather.record;
    const steps = Math.round((days * 86400) / dt);
    // start at the same hour, `days` earlier
    if (record) {
      this.weather.setDay(this.dayIndex);
      for (let i = 0; i < steps; i++) {
        const h = ((t0 + i * dt + dt / 2) % 86400) / 3600;
        this.weather.sample(h, this.sky);
        this.plant.step(this.sky, dt);
      }
    } else {
      for (let i = 0; i < steps; i++) {
        const tt = t0 - (days * 86400 - i * dt);
        this.weather.setDay(this.start + Math.floor(tt / 86400));
        this.weather.sample(((((tt + dt / 2) % 86400) + 86400) % 86400) / 3600, this.sky);
        this.plant.step(this.sky, dt);
      }
    }
    this.t = t0;
    this.refresh();
    Object.assign(this.plant.book, newBook());
  }
}

/** A machine from parameters, and the weather that goes with them. `extra` overrides the options of the sky. */
export function makeRunner(
  p: HouseParams,
  startIndex: number,
  startHour = 0,
  extra: Partial<WeatherOptions> = {},
  tweak?: (s: PlantSpec) => void,
): Runner {
  const spec = specOf(p);
  tweak?.(spec);
  const weather = new Weather({
    site: p.site,
    sky: p.sky,
    record: p.record,
    airOffset: p.airOffset,
    wind: p.wind,
    ...extra,
  });
  return new Runner(new Plant(spec), weather, startIndex, startHour);
}

// ------------------------------------------------------------------ the wave's crest

/**
 * The crest of the day's wave, followed inside the wall. For a day from noon to noon: when each cell peaks, against when the outer face peaked, and a straight line through the middle of the wall. This reads
 * the wave itself: at the inner face, a swing of a few tenths of a kelvin is in the hands of the room as much as of the wave, so that the face's own peak says little at 60 cm. The cells near the two faces are left out.
 */
export class CrestTracker {
  private readonly cellMax: Float64Array;
  private readonly cellAt: Float64Array;
  private outerMax = -Infinity;
  private outerMin = Infinity;
  private outerAt = 0;
  private windowStart = NaN;
  /** Hours from the outer face's peak to the crest reaching the inner side, and the crest's speed, cm/h. NaN until a day has been clear enough. */
  lagHours = NaN;
  speedCmH = NaN;
  /** Hour of the arrival, 0 to 24. */
  arrivalHour = NaN;
  /** When the outer face last peaked, s, once it has clearly passed; NaN on a dull day or before the peak. */
  peakAt = NaN;

  constructor(
    private readonly depths: ArrayLike<number>,
    private readonly thickness: number,
  ) {
    this.cellMax = new Float64Array(depths.length).fill(-Infinity);
    this.cellAt = new Float64Array(depths.length);
  }

  /** Read one step, with the time in seconds. */
  update(t: number, p: Plant): void {
    if (Number.isNaN(this.windowStart)) {
      // a window is noon to noon, so the outer face's peak falls early in it and the crest stays inside it
      if (((t % 86400) + 86400) % 86400 >= 43200) this.open(t - (t % 86400) + 43200);
      else return;
    }
    if (t - this.windowStart >= 86400) {
      this.close();
      this.open(this.windowStart + 86400);
    }
    if (p.Tf > this.outerMax) {
      this.outerMax = p.Tf;
      this.outerAt = t;
    }
    if (p.Tf < this.outerMin) this.outerMin = p.Tf;
    // the peak has passed, and it stood well above the wall behind it
    if (this.outerMax > p.Tf + 1 && this.outerMax > p.Tb + 10) this.peakAt = this.outerAt;
    const T = p.net.T;
    for (let i = 0; i < this.cellMax.length; i++) {
      if (T[i]! > this.cellMax[i]!) {
        this.cellMax[i] = T[i]!;
        this.cellAt[i] = t;
      }
    }
  }

  private open(start: number): void {
    this.windowStart = start;
    this.cellMax.fill(-Infinity);
    this.outerMax = -Infinity;
    this.outerMin = Infinity;
    this.peakAt = NaN;
  }

  private close(): void {
    // a dull day has no crest to follow
    if (this.outerMax - this.outerMin < 8) return;
    let n = 0;
    let sx = 0;
    let sy = 0;
    let sxx = 0;
    let sxy = 0;
    for (let i = 0; i < this.cellMax.length; i++) {
      const x = this.depths[i]!;
      if (x < 0.2 * this.thickness || x > 0.8 * this.thickness) continue;
      const y = (this.cellAt[i]! - this.outerAt) / 3600;
      if (y <= 0) continue;
      n++;
      sx += x;
      sy += y;
      sxx += x * x;
      sxy += x * y;
    }
    if (n < 3) return;
    const slope = (n * sxy - sx * sy) / (n * sxx - sx * sx);
    if (!(slope > 0)) return;
    const intercept = (sy - slope * sx) / n;
    const lag = intercept + slope * this.thickness;
    // a day whose wall is drifting gives a line with no meaning
    const speed = 100 / slope;
    if (speed < 1 || speed > 12) return;
    this.speedCmH = speed;
    this.lagHours = lag;
    this.arrivalHour = (((this.outerAt / 3600 + lag) % 24) + 24) % 24;
  }
}

/** Depth of each cell's centre, m. */
export const cellDepths = (p: Plant): Float64Array => {
  const d = new Float64Array(p.cells);
  const dx = p.spec.thickness / p.cells;
  for (let i = 0; i < p.cells; i++) d[i] = (i + 0.5) * dx;
  return d;
};

// ------------------------------------------------------------------ a day's log

export interface DayLog {
  date: string;
  /** Per m² of collector, kJ. */
  incident: number;
  qt: number;
  qr: number;
  qc: number;
  sum: number;
  /** % */
  eff: number;
  /** Thermocirculation's share of the total, %. */
  thermoShare: number;
  air: number;
  outerMax: number;
  outerMin: number;
  innerMax: number;
  innerMin: number;
  gapOutMax: number;
  flowMax: number;
  flowMin: number;
  /** Mean of the other surfaces, °C: the source's T_ref. */
  surfaces: number;
  /** The plate above the air, at the flow's peak, K. */
  plateOverMid: number;
  plateOverBottom: number;
  /** Hour of the outer face's peak and hours of real flow (over 1 L/s). */
  outerPeakHour: number;
  /** Hours from the sun's last watt to the flow falling under a tenth of its day's peak, and under 1 L/s. */
  flowAfterSun: number;
  flowAfterSunSmall: number;
  /** The night's most negative flow is in `flowMin`; hours it ran backward by more than 1 L/s. */
  backwardHours: number;
  /** The electricity of the day, kWh, and the load G·V·ΔT, kWh. */
  aux: number;
  /** Room's air: minimum and maximum, °C. */
  roomMin: number;
  roomMax: number;
}

/** One day of a run, from midnight to midnight. The runner must stand at midnight. */
export function runDay(r: Runner, date = '', dt: number = THERMAL_STEP): DayLog {
  const p = r.plant;
  const before: EnergyBook = { ...p.book };
  const A = p.spec.area;
  const steps = Math.round(86400 / dt);
  let air = 0;
  let surf = 0;
  let outerMax = -Infinity;
  let outerMin = Infinity;
  let innerMax = -Infinity;
  let innerMin = Infinity;
  let gapOutMax = -Infinity;
  let flowMax = -Infinity;
  let flowMin = Infinity;
  let plateOverMid = 0;
  let plateOverBottom = 0;
  let outerPeakHour = 0;
  let lastSun = 0;
  let backward = 0;
  let roomMin = Infinity;
  let roomMax = -Infinity;
  const flows = new Float64Array(steps);
  for (let i = 0; i < steps; i++) {
    r.step(dt);
    const hour = ((i + 1) * dt) / 3600;
    if (r.sky.beam + r.sky.diffuse > 1) lastSun = hour;
    air += r.sky.air;
    surf += p.Tmass;
    if (p.Tf > outerMax) {
      outerMax = p.Tf;
      outerPeakHour = hour;
    }
    if (p.Tf < outerMin) outerMin = p.Tf;
    if (p.Tb > innerMax) innerMax = p.Tb;
    if (p.Tb < innerMin) innerMin = p.Tb;
    if (p.Tout > gapOutMax) gapOutMax = p.Tout;
    const f = p.flowLs;
    flows[i] = f;
    if (f > flowMax) {
      flowMax = f;
      plateOverMid = p.Tf - p.Tmid;
      plateOverBottom = p.Tf - p.Tin;
    }
    if (f < flowMin) flowMin = f;
    if (f < -1) backward += dt / 3600;
    if (p.Tair < roomMin) roomMin = p.Tair;
    if (p.Tair > roomMax) roomMax = p.Tair;
  }
  // how long the flow carries on after the last of the sun
  let after = 0;
  let afterSmall = 0;
  for (let i = Math.floor((lastSun * 3600) / dt); i < steps; i++) {
    if (flows[i]! > 0.1 * flowMax) after = ((i + 1) * dt) / 3600 - lastSun;
    if (flows[i]! > 1) afterSmall = ((i + 1) * dt) / 3600 - lastSun;
  }
  const b = p.book;
  const incident = (b.sunWall - before.sunWall) / A / 1000;
  const qt = (b.qt - before.qt) / A / 1000;
  const qr = (b.qr - before.qr) / A / 1000;
  const qc = (b.qc - before.qc) / A / 1000;
  const sum = qt + qr + qc;
  return {
    date,
    incident,
    qt,
    qr,
    qc,
    sum,
    eff: incident > 0 ? (100 * sum) / incident : 0,
    thermoShare: sum !== 0 ? (100 * qt) / sum : 0,
    air: air / steps,
    outerMax,
    outerMin,
    innerMax,
    innerMin,
    gapOutMax,
    flowMax,
    flowMin,
    surfaces: surf / steps,
    plateOverMid,
    plateOverBottom,
    outerPeakHour,
    flowAfterSun: after,
    flowAfterSunSmall: afterSmall,
    backwardHours: backward,
    aux: (b.aux - before.aux) / KWH,
    roomMin,
    roomMax,
  };
}

// ------------------------------------------------------------------ the recordings

/** The 1967 house as the source books it: rooms held at 20 °C both ways, its own record, no change in anything else. */
export const sourceParams = (patch: Partial<HouseParams> = {}): HouseParams => ({
  ...presetParams('prototype-1967'),
  holdRoom: true,
  ...patch,
});

export interface ReplayResult {
  days: DayLog[];
  record: readonly RecordedDay[];
}

/** Live a record again. Its first day is repeated before the start: nothing is known of the days before. */
export function replay(id: RecordId, patch: Partial<HouseParams> = {}, spinDays = 14): ReplayResult {
  const p = sourceParams({ sky: 'recorded', record: id, ...patch });
  const r = makeRunner(p, 0, 0);
  r.spin(spinDays);
  const record = RECORDS[id];
  const days = record.map((d) => runDay(r, d.date));
  return { days, record };
}

/** The mean of several days of a replay, with the source's own mean over the same days. */
export function totals(days: readonly DayLog[]): {
  incident: number;
  qt: number;
  qr: number;
  qc: number;
  sum: number;
  eff: number;
  thermo: number;
} {
  const t = { incident: 0, qt: 0, qr: 0, qc: 0, sum: 0, eff: 0, thermo: 0 };
  for (const d of days) {
    t.incident += d.incident;
    t.qt += d.qt;
    t.qr += d.qr;
    t.qc += d.qc;
    t.sum += d.sum;
  }
  t.eff = (100 * t.sum) / t.incident;
  t.thermo = (100 * t.qt) / t.sum;
  return t;
}

// ------------------------------------------------------------------ a periodic clear day

export interface PeriodicDay extends DayLog {
  /** Lag of the inner face behind the outer, by the two peaks, hours, and by the day's fundamental. */
  lagByPeak: number;
  lagByPhase: number;
  /** Half swing of the inner face, of the outer, K. */
  innerSwing: number;
  outerSwing: number;
  /** Mean of the room, swing and peak hour, when it floats. */
  roomMean: number;
  roomSwing: number;
  roomPeakHour: number;
  /** Mean of the inner face, °C. */
  innerMean: number;
  /** The crest followed inside the wall: its lag, h, and its speed, cm/h. */
  lagCrest: number;
  crestSpeed: number;
  /** Hours after the sun's last watt when the flow falls under half of its peak, a tenth of it, and to zero. Round the clock: the flow of the next dawn is not counted. */
  flowTailHalf: number;
  flowTailTenth: number;
  flowTailZero: number;
  /** The hour of the day's first and last sun on the wall. */
  sunFirst: number;
  sunLast: number;
  /** Peak of the sun on the wall, W/m². */
  sunPeak: number;
}

/** The same clear day until nothing changes. */
export function periodicDay(
  day: number,
  patch: Partial<HouseParams> = {},
  options: Partial<WeatherOptions> = {},
  spinDays = 21,
  dt: number = THERMAL_STEP,
): PeriodicDay {
  const p = { ...presetParams('prototype-1967'), sky: 'clear' as const, ...patch };
  const r = makeRunner(p, day, 0, { frozenDay: day, ...options });
  r.spin(spinDays, dt);
  const steps = Math.round(86400 / dt);
  const outer = new Float64Array(steps);
  const inner = new Float64Array(steps);
  const room = new Float64Array(steps);
  const flow = new Float64Array(steps);
  const depths = cellDepths(r.plant);
  const crest = new CrestTracker(depths, p.wallThickness);
  // a day and a half of a followed crest
  for (let i = 0; i < steps * 2; i++) {
    r.step(dt);
    crest.update(r.t, r.plant);
  }
  let sunFirst = -1;
  let sunLast = 0;
  let sunPeak = 0;
  let peakO = -Infinity;
  let peakI = -Infinity;
  let tO = 0;
  let tI = 0;
  let peakR = -Infinity;
  let tR = 0;
  // the second day of two, keep the inner face's peak after the outer's
  const log = runDayFor(r, dt, (i, pl) => {
    outer[i] = pl.Tf;
    inner[i] = pl.Tb;
    room[i] = pl.Tair;
    flow[i] = pl.flowLs;
    const sun = r.sky.beam + r.sky.diffuse;
    if (sun > 1) {
      if (sunFirst < 0) sunFirst = (i * dt) / 3600;
      sunLast = (i * dt) / 3600;
    }
    if (sun > sunPeak) sunPeak = sun;
  });
  let flowPeak = 0;
  for (let i = 0; i < steps; i++) if (flow[i]! > flowPeak) flowPeak = flow[i]!;
  // walk on from the last of the sun, round the clock
  const start = Math.round((sunLast * 3600) / dt);
  let tailHalf = 0;
  let tailTenth = 0;
  let tailZero = 0;
  const STEPS_NIGHT = Math.round(((sunFirst + 24 - sunLast) * 3600) / dt);
  let stillHalf = true;
  let stillTenth = true;
  let stillOn = true;
  for (let i = 0; i < STEPS_NIGHT; i++) {
    const f = flow[(start + i) % steps]!;
    const h = (i * dt) / 3600;
    if (stillHalf && f > 0.5 * flowPeak) tailHalf = h;
    else stillHalf = false;
    if (stillTenth && f > 0.1 * flowPeak) tailTenth = h;
    else stillTenth = false;
    if (stillOn && f > 0) tailZero = h;
    else stillOn = false;
  }
  for (let i = 0; i < steps; i++) {
    if (outer[i]! > peakO) {
      peakO = outer[i]!;
      tO = i;
    }
    if (room[i]! > peakR) {
      peakR = room[i]!;
      tR = i;
    }
  }
  for (let i = 0; i < steps; i++) {
    const j = (tO + i) % steps;
    if (inner[j]! > peakI) {
      peakI = inner[j]!;
      tI = i;
    }
  }
  const stats = (a: Float64Array): { mean: number; swing: number; phase: number } => {
    let m = 0;
    let lo = Infinity;
    let hi = -Infinity;
    let c = 0;
    let s = 0;
    for (let i = 0; i < steps; i++) {
      const v = a[i]!;
      m += v;
      if (v < lo) lo = v;
      if (v > hi) hi = v;
      const w = (2 * Math.PI * i) / steps;
      c += v * Math.cos(w);
      s += v * Math.sin(w);
    }
    return { mean: m / steps, swing: (hi - lo) / 2, phase: Math.atan2(s, c) };
  };
  const so = stats(outer);
  const si = stats(inner);
  const sr = stats(room);
  let dPhase = si.phase - so.phase;
  while (dPhase < 0) dPhase += 2 * Math.PI;
  return {
    ...log,
    lagByPeak: (tI * dt) / 3600,
    lagByPhase: (dPhase / (2 * Math.PI)) * 24,
    innerSwing: si.swing,
    outerSwing: so.swing,
    roomMean: sr.mean,
    roomSwing: sr.swing,
    roomPeakHour: (tR * dt) / 3600,
    innerMean: si.mean,
    lagCrest: crest.lagHours,
    crestSpeed: crest.speedCmH,
    flowTailHalf: tailHalf,
    flowTailTenth: tailTenth,
    flowTailZero: tailZero,
    sunFirst,
    sunLast,
    sunPeak,
  };
}

/** `runDay` with a look at each step. */
function runDayFor(r: Runner, dt: number, look: (i: number, p: Plant) => void): DayLog {
  const original = r.plant.step.bind(r.plant);
  let i = 0;
  r.plant.step = (sky, step): void => {
    original(sky, step);
    look(i++, r.plant);
  };
  const log = runDay(r, '', dt);
  r.plant.step = original;
  return log;
}

// ------------------------------------------------------------------ the season: the question of the share

export interface SeasonResult {
  /** kWh over the heating period, whole house. */
  sunWall: number;
  sunWindows: number;
  gains: number;
  aux: number;
  /** Wall by air, wall by conduction. */
  wallAir: number;
  wallConduction: number;
  vented: number;
  /** G·V·(setpoint − air) wherever positive, over the same hours. */
  load: number;
  /** 1 − aux/load: the share of the load that electricity did not pay for, %. */
  share: number;
  /** The four lines as shares of the load, %. */
  wallAirShare: number;
  wallConductionShare: number;
  windowShare: number;
  gainsShare: number;
  auxShare: number;
  /** The collector's efficiency over the period, %. */
  efficiency: number;
  /** Mean of the outside air, °C. */
  airMean: number;
  /** Hours above the window's limit, with windows open. */
  hoursOverLimit: number;
  /** Energy closure, J (zero to rounding). */
  residual: number;
}

export interface SeasonOptions {
  dt?: number;
  /** Run the sun at this scale: 0 is the same house in the dark. */
  sunScale?: number;
  /** Replace the sky. */
  sky?: HouseParams['sky'];
  seed?: number;
  airOffset?: number;
  /** The windows' glass lets no sun in; their loss stays. The wall alone, on the ladder. */
  noWindowSun?: boolean;
}

/** The heating period the source names, 1 October to 20 May, with a month of run-in. Every model figure of a share comes through here. */
export function seasonRun(params: HouseParams, opt: SeasonOptions = {}): SeasonResult {
  const dt = opt.dt ?? SEASON_STEP;
  const p: HouseParams = { ...params, sky: opt.sky ?? (params.sky === 'recorded' ? 'series' : params.sky) };
  const r = makeRunner(
    p,
    HEATING_START_DAY,
    0,
    { seed: opt.seed, sunScale: opt.sunScale, airOffset: p.airOffset + (opt.airOffset ?? 0) },
    opt.noWindowSun
      ? (s) => {
          s.windowArea = 0;
        }
      : undefined,
  );
  r.spin(30, dt);
  const pl = r.plant;
  const days = 365 - HEATING_START_DAY + 1 + HEATING_END_DAY;
  const steps = Math.round((days * 86400) / dt);
  const GV = totalGV(p);
  let load = 0;
  let airSum = 0;
  let over = 0;
  const enth0 = pl.energy();
  const bound0 = pl.boundary();
  for (let i = 0; i < steps; i++) {
    r.step(dt);
    const d = p.setpoint - r.sky.air;
    if (d > 0) load += GV * d * dt;
    airSum += r.sky.air;
    if (pl.Tair > p.setpoint + 6) over += dt / 3600;
  }
  const b = pl.book;
  const L = load / KWH;
  const share = (x: number): number => (100 * x) / L;
  const res: SeasonResult = {
    sunWall: b.sunWall / KWH,
    sunWindows: b.sunWindows / KWH,
    gains: b.gains / KWH,
    aux: b.aux / KWH,
    wallAir: b.qt / KWH,
    wallConduction: (b.qr + b.qc) / KWH,
    vented: b.vented / KWH,
    load: L,
    share: 100 * (1 - b.aux / KWH / L),
    wallAirShare: share(b.qt / KWH),
    wallConductionShare: share((b.qr + b.qc) / KWH),
    windowShare: share(b.sunWindows / KWH),
    gainsShare: share(b.gains / KWH),
    auxShare: share(b.aux / KWH),
    efficiency: (100 * (b.qt + b.qr + b.qc)) / b.sunWall,
    airMean: airSum / steps,
    hoursOverLimit: over,
    residual: bookResidual(pl, enth0, bound0),
  };
  return res;
}

/** The whole house's G·V, W/K: what its load is reckoned on. */
export function totalGV(p: HouseParams): number {
  return p.G * buildOf(p.build).house.volume;
}

export interface Ladder {
  noSun: SeasonResult;
  wallOnly: SeasonResult;
  wallAndWindows: SeasonResult;
  all: SeasonResult;
  /** Against the same house in the dark, rather than against G·V·ΔT, %. */
  allAgainstDark: number;
}

/**
 * The same house with one more source of heat at each rung, in the order of the question: the dark house, the wall alone, the wall and the south windows, the wall and the windows and the people. Each share is
 * measured by what is left for electricity, so that what the house could not use counts for nothing.
 */
export function shareLadder(p: HouseParams, opt: SeasonOptions = {}): Ladder {
  // no sun at all and no people: the house in the dark, keeping its windows' and wall's loss
  const noSun = seasonRun({ ...p, gains: 0 }, { ...opt, sunScale: 0 });
  // with no windows' sun: the windows' glass is off the books (their loss stays when G·V holds them): the wall alone
  const wallOnly = seasonRun({ ...p, gains: 0 }, { ...opt, noWindowSun: true });
  const wallAndWindows = seasonRun({ ...p, gains: 0 }, opt);
  const all = seasonRun(p, opt);
  return { noSun, wallOnly, wallAndWindows, all, allAgainstDark: 100 * (1 - all.aux / noSun.aux) };
}

// ------------------------------------------------------------------ S1's monthly curve

export interface MonthlyEfficiency {
  /** Per month, %. */
  eff: number[];
  /** Incident on the wall, kWh/m². */
  incident: number[];
  /** Thermocirculation's share, %. */
  thermo: number[];
}

/** A year as the source books it: the room held at 20 °C, whichever way that means, one curve of (Qt + Qr + Qc)/incident. */
export function monthlyEfficiency(patch: Partial<HouseParams> = {}, dt: number = SEASON_STEP): MonthlyEfficiency {
  const p = sourceParams({ sky: 'series', ...patch });
  const r = makeRunner(p, 1, 0);
  r.spin(30, dt);
  const inc = new Float64Array(12);
  const del = new Float64Array(12);
  const thm = new Float64Array(12);
  const steps = Math.round((365 * 86400) / dt);
  const pl = r.plant;
  let prev = { ...pl.book };
  for (let i = 0; i < steps; i++) {
    const m = monthOf(r.weather.dayOfYear(r.dayIndex));
    r.step(dt);
    const b = pl.book;
    inc[m] = inc[m]! + b.sunWall - prev.sunWall;
    del[m] = del[m]! + b.qt - prev.qt + b.qr - prev.qr + b.qc - prev.qc;
    thm[m] = thm[m]! + b.qt - prev.qt;
    prev = { ...b };
  }
  const eff: number[] = [];
  const incident: number[] = [];
  const thermo: number[] = [];
  for (let m = 0; m < 12; m++) {
    eff.push((100 * del[m]!) / inc[m]!);
    incident.push(inc[m]! / p.collectorArea / KWH);
    thermo.push((100 * thm[m]!) / del[m]!);
  }
  return { eff, incident, thermo };
}

// ------------------------------------------------------------------ the wall's thickness

export interface ThicknessRow {
  thickness: number;
  /** Closed form, h. */
  closedLag: number;
  lagByPeak: number;
  lagByPhase: number;
  /** Hour the inner face peaks on clear days, solar time. */
  arrivalHour: number;
  innerSwing: number;
  innerMean: number;
  /** % of incident, on a periodic clear January day. */
  eff: number;
  /** Over the whole heating period. */
  share: number;
}

// ------------------------------------------------------------------ with no sun

export interface DarkRun {
  /** The wall's gift each day after the sun goes, kWh. */
  byDay: number[];
  /** Days until the wall's gift falls under a tenth of the house's load. */
  daysToTenth: number;
  /** The first day's load, kWh. */
  loadPerDay: number;
}

/** A run of clear January days, then the sun goes out for good: how long the wall carries the house. */
export function darkRun(patch: Partial<HouseParams> = {}, maxDays = 12): DarkRun {
  const p = { ...presetParams('prototype-1967'), sky: 'clear' as const, ...patch };
  const r = makeRunner(p, 15, 0, { frozenDay: 15 });
  r.spin(21, THERMAL_STEP);
  r.weather.sunScale = 0;
  const pl = r.plant;
  const GV = totalGV(p);
  const byDay: number[] = [];
  let loadPerDay = 0;
  let daysToTenth = maxDays;
  for (let d = 0; d < maxDays; d++) {
    const before = { ...pl.book };
    let load = 0;
    const steps = Math.round(86400 / THERMAL_STEP);
    for (let i = 0; i < steps; i++) {
      r.step(THERMAL_STEP);
      load += Math.max(0, GV * (p.setpoint - r.sky.air)) * THERMAL_STEP;
    }
    const give = (pl.book.qt + pl.book.qr + pl.book.qc - before.qt - before.qr - before.qc) / KWH;
    byDay.push(give);
    loadPerDay = load / KWH;
    if (daysToTenth === maxDays && give < 0.1 * loadPerDay) daysToTenth = d;
  }
  return { byDay, daysToTenth, loadPerDay };
}

// ------------------------------------------------------------------ reverse flow at night

/** Cold air under a clear winter night: the flow's lowest value, how long it runs backward, and the heat it costs per night, kWh. */
export function nightRun(patch: Partial<HouseParams> = {}): {
  flowMin: number;
  backwardHours: number;
  nightQt: number;
  thermoShare: number;
  aux: number;
} {
  const p = { ...presetParams('prototype-1967'), sky: 'clear' as const, ...patch };
  const r = makeRunner(p, 355, 0, { frozenDay: 355 });
  r.spin(21, THERMAL_STEP);
  let back = 0;
  const log = runDayFor(r, THERMAL_STEP, (_, pl) => {
    if (pl.PqT < 0) back += pl.PqT * THERMAL_STEP;
  });
  return {
    flowMin: log.flowMin,
    backwardHours: log.backwardHours,
    nightQt: back / KWH,
    thermoShare: log.thermoShare,
    aux: log.aux,
  };
}

/** What a flow carries, W: K75's hand check. */
export const flowPower = (ls: number, Tout: number, Tin: number, rho = 1, cp = 1007): number =>
  (ls / 1000) * rho * cp * (Tout - Tin);
