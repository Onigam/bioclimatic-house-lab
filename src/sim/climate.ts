import { ESTIMATE, ODEILLO } from './machine';
import {
  clearSkyPlane,
  cosIncidence,
  sunAltitude,
  sunAzimuth,
  sunTerms,
  type Horizon,
  type PlaneIrradiance,
  type SunTerms,
} from './solar';

// The weather. Four towns from PVGIS, and the days the inventors recorded in 1974–75. Nothing here reads a clock or an unseeded random: the same inputs give the same weather. Each day has a shape
// (the clear-sky model of the day) and a total (a record's, or the month's from PVGIS): the shape is scaled and shared between beam and diffuse so that the day comes out at its total.

export type SiteId = 'odeillo' | 'chauvency' | 'darmstadt' | 'perpignan';
export const SITE_IDS: SiteId[] = ['odeillo', 'chauvency', 'darmstadt', 'perpignan'];

export interface Site {
  id: SiteId;
  /** Degrees north. */
  latitude: number;
  /** m. */
  altitude: number;
  /** PVGIS 5.3, SARAH3 and ERA5, 2005–2023, on a south-facing vertical plane, then the horizontal: kWh/m² per month. */
  vertical: readonly number[];
  horizontal: readonly number[];
  /** ERA5, °C. */
  air: readonly number[];
  horizon?: Horizon;
}

export const MONTH_DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const FIRST_OF_MONTH = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

/** The month of a day of the year, 0 to 11. */
export function monthOf(day: number): number {
  const d = ((Math.floor(day) - 1 + 365) % 365) + 1;
  for (let m = 11; m >= 0; m--) if (d >= FIRST_OF_MONTH[m]!) return m;
  return 0;
}

/** Day of the year of a calendar date. */
export const dayOfDate = (month: number, date: number): number => FIRST_OF_MONTH[month]! + date - 1;

export const SITES: Record<SiteId, Site> = {
  // the research's table; the latitude is the source's, rounded, and nothing here says more than « Odeillo ». Horizon from the same query, coarse.
  odeillo: {
    id: 'odeillo',
    latitude: ODEILLO.latitude,
    altitude: ODEILLO.altitude,
    vertical: [129.6, 128.8, 125.6, 95.7, 84.3, 78.7, 91.9, 105.5, 115.9, 133.6, 117.7, 126.9],
    horizontal: [64.9, 88.0, 128.3, 145.5, 172.1, 186.9, 209.9, 183.0, 138.2, 106.3, 68.3, 58.5],
    air: [-1.2, -0.7, 1.8, 4.9, 8.8, 13.0, 15.7, 15.0, 11.5, 8.2, 2.4, 0.1],
    horizon: [
      [-90, 5.7],
      [-45, 5.7],
      [0, 2.7],
      [45, 1.1],
      [90, 3.1],
    ],
  },
  // my query of 2026-11-03, the village's own coordinates rounded: the town of the source's 35–45 %
  chauvency: {
    id: 'chauvency',
    latitude: 49.53,
    altitude: 249,
    vertical: [32.5, 59.4, 94.1, 102.9, 91.6, 88.7, 94.4, 98.1, 103.9, 77.8, 37.4, 19.2],
    horizontal: [23.5, 42.8, 88.3, 134.9, 158.8, 174.3, 175.7, 145.9, 109.2, 61.4, 27.6, 17.3],
    air: [2.4, 3.0, 5.9, 9.7, 13.3, 17.2, 18.8, 18.1, 15.1, 11.2, 6.3, 3.4],
  },
  // the town of the comparison house
  darmstadt: {
    id: 'darmstadt',
    latitude: 49.87,
    altitude: 152,
    vertical: [45.9, 66.1, 96.2, 103.6, 93.2, 88.6, 93.1, 98.4, 103.7, 82.1, 48.6, 38.9],
    horizontal: [25.3, 44.2, 88.3, 134.0, 160.3, 174.1, 172.0, 144.5, 107.6, 62.1, 29.9, 20.3],
    air: [2.0, 2.6, 5.7, 10.1, 14.2, 18.3, 20.1, 19.2, 15.5, 11.0, 6.0, 3.1],
  },
  // the same latitude at sea level, a stand-in for « what if this wall were lower down »
  perpignan: {
    id: 'perpignan',
    latitude: 42.7,
    altitude: 48,
    vertical: [121.6, 124.0, 124.1, 106.3, 91.4, 83.7, 94.1, 110.8, 122.2, 125.3, 115.5, 117.5],
    horizontal: [61.8, 84.1, 125.2, 158.2, 188.5, 204.0, 216.7, 189.5, 142.2, 100.9, 65.7, 54.9],
    air: [7.9, 8.8, 11.4, 14.5, 18.1, 22.7, 25.2, 24.5, 21.1, 17.1, 11.9, 8.7],
  },
};

/** Air pressure at an altitude, Pa: the standard atmosphere. 84 kPa at 1,550 m, which with the source's ρ = 1 kg/m³ at 20 °C agree. */
export const pressureAt = (altitude: number): number => 101325 * Math.pow(1 - 2.25577e-5 * altitude, 5.25588);

/** A small seeded generator (mulberry32): the same series on any machine. The kit's `rng` lives with three.js, which the physics must not import (`docs/kit-requests.md`, item 3). */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------- the recorded days

export interface RecordedDay {
  /** Readable date. */
  date: string;
  day: number;
  /** On the wall, MJ/m². */
  incident: number;
  /** Mean of the outside air, °C. */
  air: number;
  /** The source's balance for the day, kJ/m² of collector, when the table gives it. */
  qt?: number;
  qr?: number;
  qc?: number;
  /** ΣQ and efficiency, as printed. */
  sum?: number;
  eff?: number;
  /** A row whose printed sum or percentage does not follow from its parts. */
  slip?: string;
  /** Whether the air is read off a curve by eye, not in a table. */
  airByEye?: boolean;
}

const row = (
  month: number,
  date: number,
  incident: number,
  air: number,
  qt: number,
  qr: number,
  qc: number,
  sum: number,
  eff: number,
  slip?: string,
): RecordedDay => ({
  date: `${date}/${month + 1}`,
  day: dayOfDate(month, date),
  incident: incident / 1000,
  air,
  qt,
  qr,
  qc,
  sum,
  eff,
  slip,
});

/**
 * The inventors' Table II, the 1967 collectors, kJ/m². All 25 rows as printed, read on the page's image. The three slips are theirs: their parts are kept as printed. 22 December is not in the table:
 * its energy is on the figure (20.30 MJ/m²), its air by eye.
 */
export const TABLE_II: RecordedDay[] = [
  { date: '22/12', day: 356, incident: 20.3, air: 4.5, airByEye: true },
  row(11, 23, 21630, 3, 2172, 3968, 1741, 7881, 36.43),
  row(11, 24, 1134, 2, 0, 3829, 1595, 5424, 478.3),
  row(11, 25, 20034, 6, 2468, 2719, 1142, 6329, 31.59),
  row(11, 26, 17588, 6, 1895, 2864, 1249, 6008, 34.16),
  row(11, 27, 4704, 6.5, 429, 2625, 1082, 4136, 87.91),
  row(11, 28, 4904, 7.5, 323, 1547, 353, 2223, 45.32),
  row(11, 29, 20129, 9, 2082, 1277, 441, 3800, 18.88),
  row(11, 30, 19971, 2, 1745, 2499, 877, 5121, 25.64),
  row(11, 31, 21798, 3, 2089, 3052, 1082, 6223, 28.55),
  row(0, 1, 21788, 5.5, 2237, 3064, 1366, 6667, 30.6),
  row(0, 2, 20664, 7.5, 2411, 3184, 1475, 7070, 34.22),
  row(0, 3, 21767, 6.5, 2510, 3432, 1467, 7409, 34.04),
  row(0, 4, 20286, 3, 2554, 3692, 1643, 7789, 38.39, 'sum printed 7,789 and 38.39 %; the parts give 7,889'),
  row(0, 5, 20412, 7, 2555, 3383, 1604, 7542, 36.95),
  row(0, 6, 19436, 9, 2741, 3539, 1715, 7995, 41.13),
  row(0, 7, 23907, 8, 2963, 3625, 1830, 8418, 35.21),
  row(0, 8, 20874, 7, 2285, 3988, 1906, 8179, 39.18),
  row(0, 9, 23310, 8, 2720, 4018, 2068, 8007, 37.78, 'sum printed 8,007; the parts and the 37.78 % give 8,806'),
  row(0, 10, 20370, 4.5, 2670, 4098, 1933, 8701, 42.71),
  row(0, 11, 21798, 3, 2709, 4070, 1771, 8550, 39.22),
];

/** The same table, February. Not continuous with the above. 16 Feb. prints 19,871, its 32.18 % agrees with the 19,971 of Table III. */
export const TABLE_II_FEB: RecordedDay[] = [
  row(1, 14, 17210, 0, 1737, 2964, 921, 5622, 32.66),
  row(1, 15, 19856, 0, 2105, 3378, 1156, 6639, 33.44),
  row(1, 16, 19871, 0.5, 1911, 3388, 1128, 6427, 32.18, 'incident printed 19,871; 32.18 % agrees with 19,971'),
  row(1, 17, 25148, 3, 2871, 3725, 1677, 8273, 32.9),
  row(1, 18, 23657, 8.5, 2832, 3579, 1786, 8197, 34.65),
];

const eyed = (month: number, date: number, incident: number, air: number): RecordedDay => ({
  date: `${date}/${month + 1}`,
  day: dayOfDate(month, date),
  incident,
  air,
  airByEye: true,
});

export type RecordId = 'christmas-1974' | 'dec-jan-1975' | 'feb-1975' | 'april-1975' | 'june-1975';

/** The four days of each recording. The energies are printed on the figures; the air is a daily mean by eye on the same curve. */
export const RECORDS: Record<RecordId, readonly RecordedDay[]> = {
  'christmas-1974': TABLE_II.slice(0, 4),
  'dec-jan-1975': TABLE_II,
  'feb-1975': [eyed(1, 20, 22.38, 4), eyed(1, 21, 16.87, 2), eyed(1, 22, 5.09, 0.5), eyed(1, 23, 17.81, 0)],
  'april-1975': [eyed(3, 27, 16.1, 9), eyed(3, 28, 15.82, 9), eyed(3, 29, 16.26, 8.5), eyed(3, 30, 9.68, 6)],
  'june-1975': [eyed(5, 22, 7.56, 12), eyed(5, 23, 9.83, 13), eyed(5, 24, 10.21, 13.5), eyed(5, 25, 10.2, 14.5)],
};

// ---------------------------------------------------------------------- the clear day

/** A clear day on the wall, MJ/m². Integrated once per site and day, then kept. */
const clearCache = new Map<string, { total: number; beam: number; diffuse: number; horizontal: number }>();

export function clearDay(
  site: Site,
  day: number,
  albedo: number = ESTIMATE.albedo,
): { total: number; beam: number; diffuse: number; horizontal: number } {
  const key = `${site.id}:${Math.round(day)}:${albedo}`;
  const hit = clearCache.get(key);
  if (hit) return hit;
  const t = sunTerms(site.latitude, day, 90);
  let beam = 0;
  let diffuse = 0;
  let horizontal = 0;
  const ir: PlaneIrradiance = { beam: 0, diffuse: 0, cosTheta: 0, horizontal: 0 };
  const STEPS = 144;
  for (let i = 0; i < STEPS; i++) {
    clearSkyPlane(t, ((i + 0.5) * 24) / STEPS, albedo, site.altitude / 1000, site.horizon, ir);
    beam += ir.beam;
    diffuse += ir.diffuse;
    horizontal += ir.horizontal;
  }
  const dt = 86400 / STEPS;
  const r = {
    total: ((beam + diffuse) * dt) / 1e6,
    beam: (beam * dt) / 1e6,
    diffuse: (diffuse * dt) / 1e6,
    horizontal: (horizontal * dt) / 1e6,
  };
  clearCache.set(key, r);
  return r;
}

// ---------------------------------------------------------------------- the weather of the running sim

export type SkyMode = 'clear' | 'mean' | 'series' | 'recorded';

export interface SkySample {
  /** On the plane, W/m². */
  beam: number;
  diffuse: number;
  /** Cosine of the beam's incidence. */
  cosTheta: number;
  /** Degrees above the horizon, and from the south towards the west. */
  sunAlt: number;
  sunAz: number;
  /** °C. */
  air: number;
  /** 1 under a clear sky, 0 under cloud: for the night sky. */
  clear: number;
  /** m/s. */
  wind: number;
}

export const newSkySample = (): SkySample => ({
  beam: 0,
  diffuse: 0,
  cosTheta: 0,
  sunAlt: 0,
  sunAz: 0,
  air: 0,
  clear: 0,
  wind: ESTIMATE.wind,
});

export interface WeatherOptions {
  site: SiteId;
  sky: SkyMode;
  record?: RecordId;
  seed?: number;
  /** Added to the air, K. */
  airOffset?: number;
  wind?: number;
  albedo?: number;
  /** Multiplies the sun: 0 for a run with no sun at all. */
  sunScale?: number;
  /** Every day is this day of the year, for a periodic run. */
  frozenDay?: number;
  /** Mean air of every day, °C, in place of the site's. */
  airMean?: number;
}

/** What a day of cloud gives, against its clear-sky total, on average (S1's dull days: about 5 to 25 %). An estimate; the month's total still holds. */
const OVERCAST = 0.15;
/** Lag-one correlation of clear and cloudy days. An estimate: weather comes in runs. */
const PERSISTENCE = 0.3;
const SERIES_SEED = 1967;

/** Share a day's total between the clear shape's beam and diffuse, for a day at k of its clear total. Under a quarter of clear: no beam at all. */
function shareDay(k: number, E: { total: number; beam: number; diffuse: number }, out: DayFactors): void {
  if (k >= 1) {
    out.beam = k;
    out.diffuse = k;
    out.clear = 1;
    return;
  }
  const cl = Math.max(0, Math.min(1, (k - 0.25) / 0.75));
  out.beam = cl;
  out.diffuse = E.diffuse > 0 ? Math.max(0, (k * E.total - cl * E.beam) / E.diffuse) : 0;
  out.clear = cl;
}

interface DayFactors {
  beam: number;
  diffuse: number;
  clear: number;
}

export class Weather {
  readonly site: Site;
  private terms!: SunTerms;
  private dayNow = -1e9;
  private airMean = 0;
  private factors: DayFactors = { beam: 1, diffuse: 1, clear: 1 };
  private series: Uint8Array | null = null;
  private seriesScale = new Float64Array(12).fill(1);
  private ir: PlaneIrradiance = { beam: 0, diffuse: 0, cosTheta: 0, horizontal: 0 };
  private readonly altKm: number;
  private readonly albedo: number;
  /** Multiplies the sun, for a run where it goes out half-way. */
  sunScale: number;
  private readonly air: number;
  readonly pressure: number;
  /** The record in use, when the sky is recorded. */
  readonly record: readonly RecordedDay[] | null;

  constructor(readonly options: WeatherOptions) {
    this.site = SITES[options.site];
    this.altKm = this.site.altitude / 1000;
    this.albedo = options.albedo ?? ESTIMATE.albedo;
    this.sunScale = options.sunScale ?? 1;
    this.air = options.airOffset ?? 0;
    this.pressure = pressureAt(this.site.altitude);
    this.record = options.sky === 'recorded' ? RECORDS[options.record ?? 'christmas-1974'] : null;
    if (options.sky === 'series') this.buildSeries(options.seed ?? SERIES_SEED);
  }

  /**
   * A year of days, clear or cloudy, seeded. In each month the share of clear days comes from the month's total against the clear day's; a two-state chain keeps the runs of weather; then every day of the
   * month is scaled by one factor so that the month comes out exactly at PVGIS.
   */
  private buildSeries(seed: number): void {
    const rnd = seeded(seed);
    const s = new Uint8Array(366);
    let prev = 1;
    for (let d = 1; d <= 365; d++) {
      const m = monthOf(d);
      const c = clearDay(this.site, d, this.albedo).total;
      const target = (this.site.vertical[m]! * 3.6) / MONTH_DAYS[m]!;
      const p = Math.max(0, Math.min(1, (target - OVERCAST * c) / (c - OVERCAST * c)));
      const pClear = p + PERSISTENCE * (prev - p);
      prev = rnd() < pClear ? 1 : 0;
      s[d] = prev;
    }
    // the factor that closes the month
    const got = new Float64Array(12);
    for (let d = 1; d <= 365; d++) {
      const m = monthOf(d);
      got[m] = got[m]! + (s[d] ? 1 : OVERCAST) * clearDay(this.site, d, this.albedo).total;
    }
    for (let m = 0; m < 12; m++) this.seriesScale[m] = (this.site.vertical[m]! * 3.6) / got[m]!;
    this.series = s;
  }

  /** The day's clear-or-cloudy flag in a series (1 clear), for the tests. */
  isClear(day: number): boolean {
    return !this.series || this.series[((Math.floor(day) - 1 + 365) % 365) + 1] === 1;
  }

  /** Move to a day. `index` counts days from the start of a record, or is a day of the year otherwise. Cheap when the day has not changed. */
  setDay(index: number): void {
    if (index === this.dayNow) return;
    this.dayNow = index;
    const { site, record } = this;
    const opt = this.options;
    if (record) {
      const r = record[Math.max(0, Math.min(record.length - 1, index))]!;
      this.terms = sunTerms(site.latitude, r.day, 90);
      this.airMean = r.air;
      const E = clearDay(site, r.day, this.albedo);
      shareDay(r.incident / E.total, E, this.factors);
    } else {
      const day = opt.frozenDay ?? ((index - 1 + 3650) % 365) + 1;
      this.terms = sunTerms(site.latitude, day, 90);
      this.airMean = opt.airMean ?? monthlyAir(site, day);
      const E = clearDay(site, day, this.albedo);
      const m = monthOf(day);
      if (opt.sky === 'clear') {
        this.factors.beam = 1;
        this.factors.diffuse = 1;
        this.factors.clear = 1;
      } else if (opt.sky === 'mean') {
        shareDay((site.vertical[m]! * 3.6) / MONTH_DAYS[m]! / E.total, E, this.factors);
      } else {
        const k = (this.series![day] ? 1 : OVERCAST) * this.seriesScale[m]!;
        shareDay(k, E, this.factors);
      }
    }
  }

  /** The sky at a solar hour of the present day. No allocation. */
  sample(hour: number, out: SkySample): SkySample {
    const t = this.terms;
    const f = this.factors;
    const ir = clearSkyPlane(t, hour, this.albedo, this.altKm, this.site.horizon, this.ir);
    out.beam = ir.beam * f.beam * this.sunScale;
    out.diffuse = ir.diffuse * f.diffuse * this.sunScale;
    out.cosTheta = ir.cosTheta > 0 ? ir.cosTheta : cosIncidence(t, hour);
    out.sunAlt = sunAltitude(t, hour);
    out.sunAz = sunAzimuth(t, hour);
    const swing = ESTIMATE.airSwingOvercast + (ESTIMATE.airSwingClear - ESTIMATE.airSwingOvercast) * f.clear;
    // the air peaks in mid-afternoon, an estimate by eye on the recordings
    out.air = this.airMean + this.air + swing * Math.cos((2 * Math.PI * (hour - 15)) / 24);
    out.clear = f.clear;
    out.wind = this.options.wind ?? ESTIMATE.wind;
    return out;
  }

  /** The present day's date of the year. */
  dayOfYear(index: number): number {
    if (this.record) return this.record[Math.max(0, Math.min(this.record.length - 1, index))]!.day;
    return this.options.frozenDay ?? ((index - 1 + 3650) % 365) + 1;
  }
}

/** The month's air, straight between mid-months, °C. */
export function monthlyAir(site: Site, day: number): number {
  const d = day - 1;
  const m = monthOf(day);
  const mid = FIRST_OF_MONTH[m]! - 1 + MONTH_DAYS[m]! / 2;
  const other = d < mid ? (m + 11) % 12 : (m + 1) % 12;
  const span = (MONTH_DAYS[m]! + MONTH_DAYS[other]!) / 2;
  return site.air[m]! + ((site.air[other]! - site.air[m]!) * Math.abs(d - mid)) / span;
}
