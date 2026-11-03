import { airCp, airRho } from '@onigam/lab-kit/sim/thermal';
import { dayOfDate, pressureAt, SITES } from './climate';
import { HOUSE_TUBE, tubeTheta } from './earth-tube';
import {
  COLLECTOR_1967,
  COLLECTOR_1974,
  ductArea,
  ESTIMATE,
  FLOOR_DROP,
  HOUSE_1967,
  HOUSE_1974,
  ROOM_SETPOINT,
  WALL_MATERIALS,
  type CollectorSpec,
  type HouseSpec,
} from './machine';
import { buildGlazing, type Glazing } from './optics';
import { wallU, type PlantSpec } from './plant';
import type { BuildId, HouseParams, PresetId, ScenarioId } from './types';

// The starting points, the small scripted situations, and how a set of parameters becomes a machine.

export const PRESET_IDS: PresetId[] = ['prototype-1967', 'building-1974', 'wall-45', 'insulated', 'at-chauvency'];

export const SCENARIO_IDS: ScenarioId[] = [
  'christmas-1974',
  'feb-1975',
  'april-1975',
  'june-1975',
  'too-thick-too-thin',
  'drying',
  'no-vents',
  'the-night',
  'one-glass',
  'insulate-first',
  'chauvency',
  'earth-tube',
];

/** The clock opens at an hour simulated per real second: a day in 24 s. */
export const DEFAULT_TIME_SCALE = 3600;
/** The speeds of the strip. The wave moves 4 cm an hour: nothing is visible at real time but the dots in the gap. Five: more do not fit at 768 px. */
export const SPEEDS = [1, 60, 600, 3600, 86400];

/** The ranges of the sliders. G stops at 0.4: under that the wall and the windows alone would lose more than the whole house is said to. */
export const RANGES = {
  wallThickness: { min: 0.15, max: 0.8, step: 0.01 },
  glazingLayers: { min: 1, max: 3, step: 1 },
  gap: { min: 0.05, max: 0.2, step: 0.01 },
  ductScale: { min: 0.25, max: 1, step: 0.05 },
  collectorArea: { min: 10, max: 55, step: 1 },
  southWindows: { min: 0, max: 30, step: 0.1 },
  G: { min: 0.4, max: 2, step: 0.01 },
  setpoint: { min: 16, max: 22, step: 0.5 },
  gains: { min: 0, max: 1000, step: 50 },
  day: { min: 1, max: 365, step: 1 },
  hour: { min: 0, max: 24, step: 0.25 },
  airOffset: { min: -10, max: 10, step: 0.5 },
  wind: { min: 0, max: 10, step: 0.5 },
  absorptance: { min: 0.85, max: 0.98, step: 0.01 },
  lossK: { min: 1, max: 40, step: 0.5 },
} as const;

export type RangedKey = keyof typeof RANGES;

const BASE: HouseParams = {
  slowMo: 1,
  timeScale: DEFAULT_TIME_SCALE,
  running: true,
  preset: 'prototype-1967',
  build: '1967',
  wallThickness: COLLECTOR_1967.wallThickness,
  wallMaterial: 'concrete',
  glazingLayers: COLLECTOR_1967.glassLayers,
  gap: COLLECTOR_1967.gap,
  ductScale: 1,
  vents: 'open',
  collectorArea: HOUSE_1967.collectorArea,
  nightShutter: false,
  mode: 'winter',
  southWindows: ESTIMATE.windowArea,
  G: HOUSE_1967.G,
  setpoint: ROOM_SETPOINT,
  backup: true,
  holdRoom: false,
  gains: ESTIMATE.gains,
  gvHoldsWall: true,
  earthTube: false,
  site: 'odeillo',
  sky: 'series',
  record: 'christmas-1974',
  day: dayOfDate(0, 15),
  hour: 8,
  airOffset: 0,
  wind: ESTIMATE.wind,
  absorptance: ESTIMATE.absorptance,
  lossK: ESTIMATE.ductLossK,
  innerFilm: 'source',
};

export function presetParams(id: PresetId): HouseParams {
  const p: HouseParams = { ...BASE, preset: id };
  switch (id) {
    case 'prototype-1967':
      return p;
    case 'building-1974':
      return {
        ...p,
        build: '1974',
        wallThickness: COLLECTOR_1974.wallThickness,
        collectorArea: HOUSE_1974.collectorArea,
        G: HOUSE_1974.G,
      };
    case 'wall-45':
      // the inventors' own wish: 40 to 45 cm
      return { ...p, wallThickness: 0.45 };
    case 'insulated':
      // the 1974 envelope's figure on the 1967 house
      return { ...p, G: HOUSE_1974.G };
    case 'at-chauvency':
      return { ...p, site: 'chauvency' };
  }
}

/** The printed tables of a build. */
export const buildOf = (b: BuildId): { collector: CollectorSpec; house: HouseSpec } =>
  b === '1974' ? { collector: COLLECTOR_1974, house: HOUSE_1974 } : { collector: COLLECTOR_1967, house: HOUSE_1967 };

const glazingCache = new Map<string, Glazing>();
function glazingOf(sheets: number, L: number, alpha: number): Glazing {
  const key = `${sheets}:${L}:${alpha}`;
  let g = glazingCache.get(key);
  if (!g) {
    g = buildGlazing(sheets, ESTIMATE.glassExtinction * L, alpha, ESTIMATE.glassIndex);
    glazingCache.set(key, g);
  }
  return g;
}

/**
 * The parameters as a machine. The one choice worth a word is what G·V stands for. Nobody defines it; the mean K fits an envelope of the whole box, so that it is read as the whole house: when `gvHoldsWall`
 * is true (the default), what the network's links for the collector and the windows lose is taken out of it, at their reference size. Otherwise G·V is the rest of the house, and they lose on top.
 */
export function specOf(p: HouseParams): PlantSpec {
  const { collector, house } = buildOf(p.build);
  const material = WALL_MATERIALS[p.wallMaterial];
  const volume = house.volume;
  const pressure = pressureAt(SITES[p.site].altitude);
  const rhoCp = airRho(15, pressure) * airCp(15);
  const airG = (rhoCp * volume * ESTIMATE.airChange) / 3600;
  const windowG = ESTIMATE.windowU * p.southWindows;
  const total = p.G * volume;
  let rest = total;
  if (p.gvHoldsWall) {
    const refWall =
      wallU(collector.wallThickness, WALL_MATERIALS.concrete.k(20), collector.glassLayers) * house.collectorArea;
    const refWin = ESTIMATE.windowU * ESTIMATE.windowArea;
    rest = total - refWall - refWin;
    // what the slider takes from the wall or the windows is a plain wall of the house's mean K
    rest += house.K * Math.max(0, house.collectorArea - p.collectorArea);
    rest += house.K * Math.max(0, ESTIMATE.windowArea - p.southWindows);
  }
  const roomSurfaceG = ESTIMATE.roomSurface * ESTIMATE.roomSurfaceFilm * (volume / HOUSE_1967.volume);
  // G·V runs from the room's air to the outside, its film included: the network's air-to-mass link is in series with the envelope's, and takes its part out of it
  const throughWalls = Math.max(0.05 * total, rest - airG);
  const envelopeG = 1 / (1 / throughWalls - 1 / roomSurfaceG);
  const freshFlow = ESTIMATE.airChange * volume;
  const tube = p.earthTube ? tubeTheta({ ...HOUSE_TUBE, flow: freshFlow }, 10, pressure) : 0;
  return {
    material,
    thickness: p.wallThickness,
    area: p.collectorArea,
    elementHeight: collector.elementHeight,
    elementWidth: collector.elementWidth,
    gap: p.gap,
    ductSpan: collector.ductSpan,
    ductArea: ductArea(collector) * p.ductScale,
    ductDiameter:
      (2 * collector.ductWidth * collector.ductHeight * p.ductScale) /
      (collector.ductWidth + collector.ductHeight * p.ductScale),
    glazing: glazingOf(p.glazingLayers, collector.glassThickness, p.absorptance),
    glassThickness: collector.glassThickness,
    glassSpacing: ESTIMATE.glassSpacing,
    plateEmittance: ESTIMATE.plateEmittance,
    glassEmittance: ESTIMATE.glassEmittance,
    lossK: p.lossK,
    envelopeG,
    airG,
    windowG,
    windowGlazing: glazingOf(2, 0.003, 1),
    windowArea: p.southWindows * ESTIMATE.windowGlassShare,
    gains: p.gains,
    roomMass: ESTIMATE.roomMass * (volume / HOUSE_1967.volume),
    roomAirCapacity: rhoCp * volume + ESTIMATE.roomAirExtra,
    roomSurfaceG,
    floorDrop: FLOOR_DROP,
    innerFilm: p.innerFilm,
    shutterR: p.nightShutter ? ESTIMATE.shutterR : 0,
    setpoint: p.setpoint,
    backup: p.backup,
    holdRoom: p.holdRoom,
    heaterMax: ESTIMATE.heaterMax,
    ventLimit: ESTIMATE.ventLimit,
    ventOpenG: ESTIMATE.ventOpenG,
    vents: p.vents,
    mode: p.mode,
    tubeTheta: tube,
    freshC: (freshFlow * rhoCp) / 3600,
    pressure,
  };
}

/** A change scheduled in a scenario, at a time in real seconds. */
export interface ScheduledEvent {
  at: number;
  patch: Partial<HouseParams>;
}

export interface ScenarioSetup {
  params: HouseParams;
  /** Days run before the start, so that the wall has its history. */
  spinUp: number;
  events: ScheduledEvent[];
}

export function scenarioSetup(id: ScenarioId): ScenarioSetup {
  const base = presetParams('prototype-1967');
  const make = (patch: Partial<HouseParams>, more: Partial<ScenarioSetup> = {}): ScenarioSetup => ({
    params: { ...base, ...patch, preset: 'custom' },
    spinUp: 14,
    events: [],
    ...more,
  });
  // the recordings are lived as the source books them: rooms held at the thermostat's 20 °C
  const recorded = (record: HouseParams['record'], patch: Partial<HouseParams> = {}): Partial<HouseParams> => ({
    sky: 'recorded',
    record,
    hour: 8,
    holdRoom: true,
    ...patch,
  });
  switch (id) {
    case 'christmas-1974':
      return make(recorded('christmas-1974'));
    case 'feb-1975':
      return make(recorded('feb-1975'));
    case 'april-1975':
      return make(recorded('april-1975'));
    case 'june-1975':
      // the house in its summer position: the same wall draws air out
      return make(recorded('june-1975', { mode: 'summer', holdRoom: false, backup: false }));
    case 'too-thick-too-thin':
      // the same clear days of January, the wall changes: each change takes the wall to its own steady days, a real spin
      return make(
        { sky: 'clear', day: dayOfDate(0, 15), hour: 6, wallThickness: 0.6 },
        {
          // two days each: the second shows the arrival of a whole wave
          events: [
            { at: 48, patch: { wallThickness: 0.37 } },
            { at: 96, patch: { wallThickness: 0.45 } },
            { at: 144, patch: { wallThickness: 0.15 } },
            { at: 192, patch: { wallThickness: 0.8 } },
          ],
        },
      );
    case 'drying':
      // the 1974 wall as if dry: what the model finds beside what was measured. The wetness itself is not modelled.
      return make({
        ...presetParams('building-1974'),
        ...recorded('christmas-1974'),
      });
    case 'no-vents':
      // a sunny February with no backup, a wall of 16 inches and no window or people as in the test rooms, the vents shut; three days later they open
      return make(
        {
          sky: 'clear',
          day: dayOfDate(1, 15),
          hour: 6,
          wallThickness: 0.406,
          southWindows: 0,
          gains: 0,
          backup: false,
          vents: 'closed',
        },
        { events: [{ at: 72, patch: { vents: 'open' } }] },
      );
    case 'the-night':
      // a clear evening, no flap; the second night a one-way flap
      return make(
        { sky: 'clear', day: dayOfDate(11, 21), hour: 16, vents: 'open' },
        {
          events: [{ at: 24, patch: { vents: 'one-way' } }],
        },
      );
    case 'one-glass':
      // the wall behind one sheet, then behind three, two clear days each
      return make(
        { sky: 'clear', day: dayOfDate(0, 15), hour: 6, glazingLayers: 1 },
        { events: [{ at: 48, patch: { glazingLayers: 3 } }] },
      );
    case 'insulate-first':
      // the same wall on a better and better envelope: the share climbs with no more sun
      return make(
        { sky: 'mean', day: dayOfDate(0, 15), hour: 6 },
        {
          events: [
            { at: 24, patch: { G: HOUSE_1974.G } },
            { at: 48, patch: { G: 0.6 } },
          ],
        },
      );
    case 'chauvency':
      return make({ site: 'chauvency', sky: 'series', day: dayOfDate(0, 15), hour: 6 });
    case 'earth-tube':
      // the what-if: January at Odeillo, then July, then the same at sea level
      return make(
        { earthTube: true, sky: 'mean', day: dayOfDate(0, 15), hour: 6 },
        {
          events: [
            { at: 24, patch: { day: dayOfDate(6, 15), mode: 'summer' } },
            { at: 48, patch: { site: 'perpignan', day: dayOfDate(0, 15), mode: 'winter' } },
            { at: 72, patch: { day: dayOfDate(6, 15), mode: 'summer' } },
          ],
        },
      );
  }
}
