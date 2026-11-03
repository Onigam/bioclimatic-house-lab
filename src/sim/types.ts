import type { RecordId, SiteId, SkyMode } from './climate';
import type { WallMaterialId } from './machine';
import type { SeasonMode, VentMode } from './plant';

// The shared types of the simulation. The engine writes `HouseState` every frame; the 3D worlds, the strip and the panel only read it. SI inside (m, W, J), temperatures in °C; the air flow also in L/s,
// the unit every source of this lab speaks. All keys flat: a film sets them directly.

export type PresetId = 'prototype-1967' | 'building-1974' | 'wall-45' | 'insulated' | 'at-chauvency';

export type ScenarioId =
  | 'christmas-1974'
  | 'feb-1975'
  | 'april-1975'
  | 'june-1975'
  | 'too-thick-too-thin'
  | 'drying'
  | 'no-vents'
  | 'the-night'
  | 'one-glass'
  | 'insulate-first'
  | 'chauvency'
  | 'earth-tube';

export type AlarmKey = 'roomHot' | 'roomCold' | 'faceHot' | 'reverseFlow' | 'wrongSeason' | 'wallTakesHeat';

export type BuildId = '1967' | '1974';

/** Everything the visitor can edit live (all through `HouseSim.set`). Ranges are in presets.ts. */
export interface HouseParams {
  // ---- the kit's time controls
  slowMo: number;
  /** Simulated seconds per real second. */
  timeScale: number;
  running: boolean;
  /** Where the values come from; 'custom' as soon as the visitor edits something physical. */
  preset: PresetId | 'custom';

  // ---- the wall
  /** Which printed element and which printed house. */
  build: BuildId;
  /** m: the one slider that moves the 3D. */
  wallThickness: number;
  wallMaterial: WallMaterialId;
  glazingLayers: number;
  /** m. */
  gap: number;
  /** The ducts' section against the printed one, 0.25 to 1. */
  ductScale: number;
  vents: VentMode;
  /** m². */
  collectorArea: number;
  nightShutter: boolean;
  mode: SeasonMode;

  // ---- the house
  /** m² of glass. estimate */
  southWindows: number;
  /** W/m³·K. reported for the two houses */
  G: number;
  /** °C. reported 20 */
  setpoint: number;
  backup: boolean;
  /** The source's way of keeping its books: the room held at the setpoint, both ways. */
  holdRoom: boolean;
  /** W. estimate */
  gains: number;
  /** Whether G·V already holds the wall's and the windows' own loss. An assumption, both are tested. */
  gvHoldsWall: boolean;
  earthTube: boolean;

  // ---- the place and the clock
  site: SiteId;
  sky: SkyMode;
  record: RecordId;
  /** Day of the year, 1 to 365; solar hour, 0 to 24. They follow the clock; setting one moves it. */
  day: number;
  hour: number;
  /** Added to the air, K. */
  airOffset: number;
  /** m/s. estimate */
  wind: number;

  // ---- the estimates a curious visitor may move
  absorptance: number;
  lossK: number;
  innerFilm: 'source' | 'kit';
}

/** The state handed to the 3D scene, the strip and the panel every frame (read only). */
export interface HouseState {
  // ---- clock
  simTime: number;
  /** Day of the year (1 to 365), hour of the day (solar), and the month, 0 to 11. */
  dayOfYear: number;
  hour: number;
  month: number;

  // ---- the sky
  /** Sun on the wall's plane, W/m². */
  incidentWm2: number;
  /** Degrees above the horizon, and from the south towards the west. */
  sunAltitude: number;
  sunAzimuth: number;
  /** Incidence on the wall, degrees. */
  sunIncidence: number;
  /** What the glass refuses just now, 0 to 1. */
  glassRefuses: number;
  tOutside: number;
  /** Radiant temperature the outer glass sees, °C. */
  tSkyGround: number;

  // ---- the wall
  tOuterFace: number;
  tInnerFace: number;
  /** Cell centres from the outer face to the inner one, °C. Length changes with the thickness. */
  layers: Float64Array;
  /** Depth of each cell's centre from the outer face, m. */
  layerDepths: Float64Array;
  /** m: the wall now, for the 3D. */
  wallThickness: number;
  tGlassOuter: number;
  tGlassInner: number;
  /** The closed form's speed, cm/h, and lag through this thickness, h. derived */
  waveSpeedCmH: number;
  waveLagHours: number;
  /** Where the crest of the last clear day's wave stands now, m from the outer face, on the closed form's speed: NaN once it has left the wall. */
  crestDepth: number;

  // ---- the gap
  /** Air at the inlet, mean, at mid-height, and at the outlet, °C. */
  tGapIn: number;
  tGapMean: number;
  tGapMid: number;
  tGapOut: number;
  /** One element, L/s, signed: backward is negative. */
  flowLs: number;
  /** The whole wall, L/s. */
  flowTotalLs: number;
  /** +1 up, 0 still, −1 down. */
  flowDir: number;
  /** True speed of the air, m/s, signed: the 3D's dots. */
  gapSpeed: number;
  ductSpeed: number;
  /** The flap: 0 air back into the room (winter), 1 air out to the sky (summer). */
  flapOpen: number;

  // ---- the room, the three streams and what electricity adds, W
  tRoom: number;
  tSurfaces: number;
  qThermo: number;
  qRad: number;
  qConv: number;
  qWindows: number;
  qGains: number;
  qAux: number;
  /** What the summer position draws out of the room (positive: cooling). */
  qDraw: number;
  /** What the earth tube gives the fresh air. */
  qTube: number;
  /** Loss of the whole house through G·V at this moment. */
  qLoad: number;

  // ---- the day, as the source books it
  /** Yesterday's, 0 to any value (a wall with a memory has no daily efficiency: it can pass 100 %). */
  dayEfficiency: number;
  /** Today so far, kJ/m² of collector. */
  todayIncident: number;
  todayThermo: number;
  todayConduction: number;
  /** Yesterday's whole day, kJ/m² of collector. */
  lastIncident: number;
  lastThermo: number;
  lastRad: number;
  lastConv: number;

  // ---- the moments, for the film
  /** The hour the inner face last peaked, and how long after the outer face. */
  waveArrival: number;
  lagHours: number;
  /** Hour the flow last started and stopped. */
  flowStarted: number;
  flowStopped: number;
  reverseFlow: boolean;
  /** A recorded sequence has come to its end (the last day repeats). */
  recordEnded: boolean;
  /** The current recorded date, or an empty string. */
  recordDate: string;

  // ---- the season, once asked: a long run on demand, NaN before
  solarShareSeason: number;

  alarms: AlarmKey[];
}

/** Three days of samples, one per 15 simulated minutes, for the panel's charts. */
export interface Scope {
  t: number[];
  outer: number[];
  inner: number[];
  gapOut: number[];
  room: number[];
  air: number[];
  sun: number[];
  flow: number[];
  aux: number[];
}
