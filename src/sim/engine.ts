import type { LabSim } from '@onigam/lab-kit/ui';
import { monthOf, Weather, type WeatherOptions } from './climate';
import { WALL_MATERIALS } from './machine';
import { DIFFUSE_ANGLE, readAngle } from './optics';
import { Plant } from './plant';
import { presetParams, RANGES, scenarioSetup, specOf, type RangedKey, type ScheduledEvent } from './presets';
import {
  CrestTracker,
  cellDepths,
  Runner,
  seasonRun,
  shareLadder,
  THERMAL_STEP,
  totalGV,
  type Ladder,
  type SeasonResult,
} from './runs';
import { waveLagHours, waveSpeed } from './wave';
import type { HouseParams, HouseState, PresetId, ScenarioId, Scope } from './types';

// HouseSim: the whole house as the kit's `LabSim`. The heat and the hour move on `dt × timeScale` at a fixed internal step of a minute, so that the same inputs give the same state whatever the frame rate.
// The wave crawls at 4 cm an hour: it wants hours of model per second of film; the dots in the gap want true speed. Deterministic: the series of days is seeded and nothing reads a clock.

/** Longest real step taken at once, s. */
const DT_MAX = 0.25;
/** Most thermal steps in one frame: a day per second at 60 fps takes 24. Past this the clock falls behind, the same way on any machine. */
const MAX_STEPS = 720;
/** One sample per 15 simulated minutes, three days of them. */
const SCOPE_EVERY = 900;
const SCOPE_LENGTH = 288;
/** The notices' thresholds, °C. Estimates: a room too hot or too cold for most people, a paint and its sealants in danger. */
export const ROOM_HOT = 27;
export const ROOM_COLD = 14;
export const FACE_HOT = 70;
/** A flow that counts as started, and as backward, L/s. */
const FLOW_ON = 1;

const TIME_KEYS: (keyof HouseParams)[] = ['slowMo', 'timeScale', 'running'];
const CLOCK_KEYS: (keyof HouseParams)[] = ['day', 'hour'];
/** What goes straight into the running machine: no link changes, no history to rebuild. */
const LIVE_KEYS: (keyof HouseParams)[] = [
  'vents',
  'mode',
  'setpoint',
  'backup',
  'holdRoom',
  'gains',
  'nightShutter',
  'earthTube',
  'lossK',
  'innerFilm',
];

const newState = (): HouseState => ({
  simTime: 0,
  dayOfYear: 15,
  hour: 0,
  month: 0,
  incidentWm2: 0,
  sunAltitude: 0,
  sunAzimuth: 0,
  sunIncidence: 0,
  glassRefuses: 0,
  tOutside: 0,
  tSkyGround: 0,
  tOuterFace: 25,
  tInnerFace: 25,
  layers: new Float64Array(0),
  layerDepths: new Float64Array(0),
  wallThickness: 0.6,
  tGlassOuter: 10,
  tGlassInner: 15,
  waveSpeedCmH: 0,
  waveLagHours: 0,
  crestDepth: NaN,
  tGapIn: 17,
  tGapMean: 20,
  tGapMid: 20,
  tGapOut: 20,
  flowLs: 0,
  flowTotalLs: 0,
  flowDir: 0,
  gapSpeed: 0,
  ductSpeed: 0,
  flapOpen: 0,
  tRoom: 20,
  tSurfaces: 18,
  qThermo: 0,
  qRad: 0,
  qConv: 0,
  qWindows: 0,
  qGains: 0,
  qAux: 0,
  qDraw: 0,
  qTube: 0,
  qLoad: 0,
  dayEfficiency: NaN,
  todayIncident: 0,
  todayThermo: 0,
  todayConduction: 0,
  lastIncident: 0,
  lastThermo: 0,
  lastRad: 0,
  lastConv: 0,
  waveArrival: NaN,
  lagHours: NaN,
  flowStarted: NaN,
  flowStopped: NaN,
  reverseFlow: false,
  recordEnded: false,
  recordDate: '',
  solarShareSeason: NaN,
  alarms: [],
});

/** The record's or the day's starting point: a record starts at its first day. */
const startIndex = (p: HouseParams): number => (p.sky === 'recorded' ? 0 : p.day);

export class HouseSim implements LabSim {
  readonly params: HouseParams;
  readonly state: HouseState;
  readonly scope: Scope = { t: [], outer: [], inner: [], gapOut: [], room: [], air: [], sun: [], flow: [], aux: [] };
  private runner!: Runner;
  private crest!: CrestTracker;
  private listeners = new Set<() => void>();
  private events: ScheduledEvent[] = [];
  private fired = new Set<number>();
  private scriptTime = 0;
  private lastKind: 'preset' | 'scenario' = 'preset';
  private lastId: PresetId | ScenarioId = 'prototype-1967';
  private pending = 0;
  private sinceScope = 0;
  private belowOn = true;
  private dayMark = 0;
  /** The day the machine started on is not a whole day: its balance means nothing. */
  private wholeDay = false;
  private bookAtMidnight = { sunWall: 0, qt: 0, qr: 0, qc: 0 };
  private cache = new Map<string, unknown>();

  constructor() {
    this.params = presetParams('prototype-1967');
    this.state = newState();
    this.load(presetParams('prototype-1967'), 14);
  }

  // ------------------------------------------------------------------ the LabSim contract

  onChange(fn: () => void): void {
    this.listeners.add(fn);
  }

  private emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  /** Change parameters (clamped to their range). Anything but the time controls turns the preset into 'custom'. */
  set(patch: Partial<HouseParams>): void {
    const p = this.params as unknown as Record<string, unknown>;
    let structural = false;
    let live = false;
    let clock = false;
    let time = false;
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) continue;
      const k = key as keyof HouseParams;
      if (key in RANGES) {
        const r = RANGES[key as RangedKey];
        p[key] = Math.min(r.max, Math.max(r.min, Number(value)));
      } else if (key === 'slowMo' || key === 'timeScale') {
        p[key] = Math.max(0, Number(value));
      } else {
        p[key] = value;
      }
      if (TIME_KEYS.includes(k)) time = true;
      else if (CLOCK_KEYS.includes(k)) clock = true;
      else if (LIVE_KEYS.includes(k)) live = true;
      else if (k !== 'preset') structural = true;
    }
    if ((structural || live || clock) && patch.preset === undefined) this.params.preset = 'custom';
    if (structural) this.rebuild();
    else if (live) {
      Object.assign(this.runner.plant.spec, specOf(this.params));
      this.runner.refresh();
    }
    if (clock) this.moveClock(patch);
    if (structural || live || clock || time) this.refreshState();
    this.emit();
  }

  applyPreset(id: string): void {
    this.lastKind = 'preset';
    this.lastId = id as PresetId;
    this.load(presetParams(id as PresetId), 14);
  }

  applyScenario(id: string): void {
    this.lastKind = 'scenario';
    this.lastId = id as ScenarioId;
    const s = scenarioSetup(id as ScenarioId);
    this.load(s.params, s.spinUp, s.events);
  }

  /** The scenario the machine was last started from, or null when it was started from a starting point. Read-only, for the panel: a lesson can start one from outside. */
  get scenarioNow(): ScenarioId | null {
    return this.lastKind === 'scenario' ? (this.lastId as ScenarioId) : null;
  }

  /** Start again from the last preset or scenario. */
  reset(): void {
    if (this.lastKind === 'preset') this.applyPreset(this.lastId);
    else this.applyScenario(this.lastId);
  }

  private weatherOptions(): WeatherOptions {
    const p = this.params;
    return { site: p.site, sky: p.sky, record: p.record, airOffset: p.airOffset, wind: p.wind };
  }

  private load(next: HouseParams, spinUp: number, events: ScheduledEvent[] = []): void {
    const keep = { slowMo: this.params.slowMo, running: this.params.running };
    Object.assign(this.params, next, keep);
    this.events = events;
    this.fired.clear();
    this.scriptTime = 0;
    this.pending = 0;
    this.sinceScope = 0;
    for (const k of Object.keys(this.scope) as (keyof Scope)[]) this.scope[k].length = 0;
    const s = this.state;
    s.simTime = 0;
    s.flowStarted = NaN;
    s.flowStopped = NaN;
    s.dayEfficiency = NaN;
    s.solarShareSeason = NaN;
    this.makeMachine(spinUp, this.params.hour);
    this.refreshState();
    this.emit();
  }

  /** A new machine and its weather, at the clock's present hour, with its history. `t` puts a record's clock back on the day it had reached. */
  private makeMachine(spinUp: number, hour: number, t?: number): void {
    const p = this.params;
    const old = this.runner?.plant;
    const plant = new Plant(
      specOf(p),
      old ? old.net.T.subarray(0, old.cells) : undefined,
      old ? { Tair: old.Tair, Tmass: old.Tmass, glass: old.TglassIn } : undefined,
    );
    const weather = new Weather(this.weatherOptions());
    const start = startIndex(p);
    this.runner = new Runner(plant, weather, start, hour);
    if (t !== undefined) {
      this.runner.t = t;
      this.runner.refresh();
    }
    this.runner.spin(spinUp);
    const depths = cellDepths(plant);
    this.crest = new CrestTracker(depths, p.wallThickness);
    const s = this.state;
    s.layerDepths = depths;
    s.layers = new Float64Array(plant.cells);
    s.wallThickness = p.wallThickness;
    const m = WALL_MATERIALS[p.wallMaterial];
    s.waveSpeedCmH = waveSpeed(m) * 3600 * 100;
    s.waveLagHours = waveLagHours(p.wallThickness, m);
    this.bookAtMidnight = { sunWall: 0, qt: 0, qr: 0, qc: 0 };
    this.dayMark = Math.floor(this.runner.t / 86400);
    this.wholeDay = false;
    this.belowOn = plant.flowLs < FLOW_ON;
  }

  /** A change the wall has to live through: the same place in the calendar, with history. The profile carries over and two weeks settle it. */
  private rebuild(): void {
    const r = this.runner;
    this.makeMachine(14, r.hour, this.params.sky === 'recorded' ? r.t : undefined);
  }

  private moveClock(patch: Partial<HouseParams>): void {
    const r = this.runner;
    if (patch.hour !== undefined) {
      r.t = Math.floor(r.t / 86400) * 86400 + this.params.hour * 3600;
      r.hour = this.params.hour;
    }
    if (patch.day !== undefined) {
      if (this.params.sky === 'recorded') this.params.sky = 'mean';
      // a jump in the calendar needs its own days behind it
      this.makeMachine(14, this.runner.hour);
    }
  }

  // ------------------------------------------------------------------ the frame

  step(dt: number): void {
    if (!this.params.running) return;
    const real = Math.min(dt, DT_MAX);
    this.scriptTime += real;
    for (let i = 0; i < this.events.length; i++) {
      if (!this.fired.has(i) && this.scriptTime >= this.events[i]!.at) {
        this.fired.add(i);
        this.set(this.events[i]!.patch);
      }
    }
    this.pending += real * this.params.timeScale;
    let n = 0;
    while (this.pending >= THERMAL_STEP && n < MAX_STEPS) {
      this.thermal();
      this.pending -= THERMAL_STEP;
      n++;
    }
    if (this.pending >= THERMAL_STEP) this.pending = 0;
    this.refreshState();
  }

  private thermal(): void {
    const r = this.runner;
    r.step(THERMAL_STEP);
    const s = this.state;
    s.simTime += THERMAL_STEP;
    const p = r.plant;
    this.crest.update(r.t, p);
    // the flow's moments
    const f = p.flowLs;
    if (this.belowOn && f >= FLOW_ON) {
      s.flowStarted = r.hour;
      this.belowOn = false;
    } else if (!this.belowOn && f < FLOW_ON) {
      s.flowStopped = r.hour;
      this.belowOn = true;
    }
    // the day's balance, as the source books it
    const day = Math.floor(r.t / 86400);
    if (day !== this.dayMark) {
      this.dayMark = day;
      const b = p.book;
      const m = this.bookAtMidnight;
      const A = p.spec.area;
      s.lastIncident = (b.sunWall - m.sunWall) / A / 1000;
      s.lastThermo = (b.qt - m.qt) / A / 1000;
      s.lastRad = (b.qr - m.qr) / A / 1000;
      s.lastConv = (b.qc - m.qc) / A / 1000;
      s.dayEfficiency =
        this.wholeDay && s.lastIncident > 0 ? (100 * (s.lastThermo + s.lastRad + s.lastConv)) / s.lastIncident : NaN;
      this.wholeDay = true;
      m.sunWall = b.sunWall;
      m.qt = b.qt;
      m.qr = b.qr;
      m.qc = b.qc;
    }
    this.sinceScope += THERMAL_STEP;
    if (this.sinceScope >= SCOPE_EVERY) {
      this.sinceScope = 0;
      this.pushScope();
    }
  }

  private pushScope(): void {
    const c = this.scope;
    const r = this.runner;
    const p = r.plant;
    c.t.push(this.state.simTime / 3600);
    c.outer.push(p.Tf);
    c.inner.push(p.Tb);
    c.gapOut.push(p.Tout);
    c.room.push(p.Tair);
    c.air.push(r.sky.air);
    c.sun.push(r.sky.beam + r.sky.diffuse);
    c.flow.push(p.flowLs);
    c.aux.push(p.Paux);
    if (c.t.length > SCOPE_LENGTH) for (const k of Object.keys(c) as (keyof Scope)[]) c[k].shift();
  }

  private refreshState(): void {
    const s = this.state;
    const r = this.runner;
    const p = r.plant;
    const sky = r.sky;
    const w = this.params;
    const doy = r.weather.dayOfYear(r.dayIndex);
    s.dayOfYear = doy;
    s.hour = r.hour;
    s.month = monthOf(doy);
    w.day = doy;
    w.hour = r.hour;
    s.incidentWm2 = sky.beam + sky.diffuse;
    s.sunAltitude = sky.sunAlt;
    s.sunAzimuth = sky.sunAz;
    const theta = (Math.acos(Math.max(0, Math.min(1, sky.cosTheta))) * 180) / Math.PI;
    s.sunIncidence = theta;
    const sun = s.incidentWm2;
    const g = p.spec.glazing;
    s.glassRefuses =
      sun > 1 ? 1 - (sky.beam * readAngle(g.tau, theta) + sky.diffuse * readAngle(g.tau, DIFFUSE_ANGLE)) / sun : 0;
    s.tOutside = sky.air;
    s.tSkyGround = p.Tenv;
    s.tOuterFace = p.Tf;
    s.tInnerFace = p.Tb;
    for (let i = 0; i < p.cells; i++) s.layers[i] = p.net.T[i]!;
    s.tGlassOuter = p.TglassOut;
    s.tGlassInner = p.TglassIn;
    s.tGapIn = p.Tin;
    s.tGapMean = p.Tbar;
    s.tGapMid = p.Tmid;
    s.tGapOut = p.Tout;
    const f = p.flowLs;
    s.flowLs = f;
    s.flowTotalLs = f * p.elements;
    s.flowDir = f > FLOW_ON ? 1 : f < -FLOW_ON ? -1 : 0;
    s.gapSpeed = f / 1000 / p.gapA;
    s.ductSpeed = f / 1000 / p.spec.ductArea;
    s.flapOpen = w.mode === 'summer' ? 1 : 0;
    s.tRoom = p.Tair;
    s.tSurfaces = p.Tmass;
    s.qThermo = p.PqT;
    s.qRad = p.PqR;
    s.qConv = p.PqC;
    s.qWindows = p.Pwindows;
    s.qGains = p.spec.gains;
    s.qAux = p.Paux;
    s.qDraw = p.Pdraw;
    s.qTube = p.spec.tubeTheta > 0 ? p.spec.freshC * p.spec.tubeTheta * (p.soilT - sky.air) : 0;
    s.qLoad = totalGV(w) * (p.Tair - sky.air);
    const b = p.book;
    const m = this.bookAtMidnight;
    const A = p.spec.area;
    s.todayIncident = (b.sunWall - m.sunWall) / A / 1000;
    s.todayThermo = (b.qt - m.qt) / A / 1000;
    s.todayConduction = (b.qr + b.qc - m.qr - m.qc) / A / 1000;
    s.waveArrival = this.crest.arrivalHour;
    s.lagHours = this.crest.lagHours;
    const reach = (((r.t - this.crest.peakAt) / 3600) * s.waveSpeedCmH) / 100;
    s.crestDepth = reach >= 0 && reach <= p.spec.thickness ? reach : NaN;
    s.reverseFlow = f < -FLOW_ON;
    const record = r.weather.record;
    s.recordEnded = !!record && r.dayIndex >= record.length;
    s.recordDate = record ? record[Math.min(record.length - 1, Math.max(0, r.dayIndex))]!.date : '';
    const a = s.alarms;
    a.length = 0;
    if (p.Tair > ROOM_HOT) a.push('roomHot');
    if (p.Tair < ROOM_COLD) a.push('roomCold');
    if (p.Tf > FACE_HOT) a.push('faceHot');
    if (s.reverseFlow) a.push('reverseFlow');
    if (w.mode === 'winter' && s.month >= 4 && s.month <= 8 && p.Tair > p.spec.ventLimit && w.vents !== 'closed') {
      a.push('wrongSeason');
    }
    if (p.Tb < p.Tair - 1) a.push('wallTakesHeat');
  }

  // ------------------------------------------------------------------ the long runs, on demand and kept

  private cached<T>(key: string, make: () => T): T {
    const full = `${key}:${JSON.stringify({ ...this.params, slowMo: 0, timeScale: 0, running: 0, day: 0, hour: 0, preset: 0 })}`;
    const hit = this.cache.get(full);
    if (hit) return hit as T;
    const v = make();
    this.cache.set(full, v);
    return v;
  }

  /** The heating period, 1 October to 20 May, on these parameters. A long run, about half a second: for a button, not a frame. */
  season(): SeasonResult {
    const res = this.cached('season', () => seasonRun({ ...this.params, sky: 'series' }));
    this.state.solarShareSeason = res.share;
    return res;
  }

  /** The same season four times: in the dark, the wall alone, the wall and the windows, and the people. Who brings how much. */
  ladder(): Ladder {
    return this.cached('ladder', () => shareLadder({ ...this.params, sky: 'series' }));
  }
}
