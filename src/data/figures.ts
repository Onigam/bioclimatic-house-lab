// The figures the texts of src/data write by {placeholder}: the French and English spellings of a number can never drift apart, and each one carries its mark by construction, so that a computed or an estimated number
// cannot be written without it.
//
// What the marks mean to the visitor (the same as the simulation's MODEL_NOTE, src/sim/texts.ts, and the sheets' legend, `marksLegend` in src/drawings/draw.ts):
//   no mark    REPORTED: stated by a source of docs/research.md (the inventors' paper, a patent, a service's data). Written in the text itself, and checked against the list of data.test.ts.
//   †          COMPUTED: arithmetic on reported figures (research: derived), or a result of this lab's model (src/sim). The sentence says which when it matters.
//   *          ESTIMATE: the sources are silent, a choice of this lab (research §2.11, the tags of src/three/dims.ts, an assumption of how to run).
// A size the 3D draws is read from src/three/dims.ts here, never typed. The model's results and the derived figures are typed, and `figures.test.ts` recomputes them from src/sim and from the arithmetic of docs/research.md, so that a change of
// either cannot go unnoticed. Nothing here is tuned to anything.
import { HOUSE_TUBE } from '../sim/earth-tube';
import { ESTIMATE } from '../sim/machine';
import {
  AIR_PROBE_FRACTIONS,
  BALCONY,
  BAYS,
  CEILING_T,
  CHIMNEY,
  COLLECTOR_BAYS,
  DEPTH,
  DUCT_ABOVE_FLOOR,
  ELEMENT_1967,
  EAVE,
  FOOTING,
  FRAME,
  GABLE_STEPS,
  GROUND_NORTH,
  GROUND_SOUTH,
  HEAD_BAND,
  LENGTH,
  LIVING_X0,
  LIVING_X1,
  PARTITION,
  RECESS,
  ROOF,
  ROOM,
  SITE,
  SLAB,
  THERMOCOUPLE_DEPTHS,
  TUBE,
  TUBE_FALL,
  WALL,
  WINDOW,
  Y_EAVE,
  Y_RIDGE,
  collectorGlassArea,
  elementLayout,
  interiorArea,
} from '../three/dims';
import { nEn, nFr } from './units';

export type FigStatus = 'derived' | 'model' | 'assumption' | 'estimate';

export interface Fig {
  /** The value, in the unit shown. */
  v: number;
  /** Decimals shown. */
  d: number;
  s: FigStatus;
  /** Unit with its leading space when it takes one: a string, or [fr, en] when the languages differ. */
  u?: string | readonly [string, string];
  /** A value that is no plain number: a range, a size, a list of depths, in words. */
  t?: readonly [string, string];
}

/** † for what is computed (arithmetic on reported figures, or the model), * for what is estimated or assumed. The one place that decides it. */
export const markOf = (s: FigStatus): string => (s === 'derived' || s === 'model' ? '†' : '*');

const pct: readonly [string, string] = [' %', ' %'];
const times: readonly [string, string] = [' fois', ' times'];
const points: readonly [string, string] = [' points', ' points'];
const renew: readonly [string, string] = [' renouvellements par heure', ' air changes an hour'];
const steps: readonly [string, string] = [' gradins', ' steps'];

const d = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'derived', u });
const m = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'model', u });
const e = (v: number, digits: number, u?: Fig['u']): Fig => ({ v, d: digits, s: 'estimate', u });
const words = (s: FigStatus, fr: string, en: string, v = 0): Fig => ({ v, d: 0, s, t: [fr, en] });

const trim = (s: string, sep: string): string =>
  s.includes(sep) ? s.replace(/0+$/, '').replace(new RegExp(`\\${sep}$`), '') : s;
/** A size read from dims.ts, in metres, written in both languages: `size(0.9, 0.5, 0.1)` is « 0,9 × 0,5 × 0,1 m ». An estimate by construction. */
const size = (...values: number[]): Fig =>
  words(
    'estimate',
    `${values.map((x) => trim(nFr(x, 3), ',')).join(' × ')} m`,
    `${values.map((x) => trim(nEn(x, 3), '.')).join(' × ')} m`,
  );
/** A list of lengths in millimetres, read from dims.ts. */
const mmList = (xs: readonly number[]): Fig =>
  words(
    'estimate',
    `${xs.map((x) => nFr(x * 1000, 0)).join(', ')} mm`,
    `${xs.map((x) => nEn(x * 1000, 0)).join(', ')} mm`,
  );

const lay = elementLayout(ELEMENT_1967);

export const FIG = {
  // ---- the 3D's own sizes, read from src/three/dims.ts (estimates unless the comment there says otherwise)
  bays: e(BAYS, 0),
  facadeLen: e(LENGTH, 2, ' m'),
  depth: e(DEPTH, 1, ' m'),
  collectorBays: e(COLLECTOR_BAYS.length, 0),
  glassNet: e(collectorGlassArea(), 1, ' m²'),
  wallT: e(WALL, 2, ' m'),
  ridge: e(Y_RIDGE, 1, ' m'),
  yEave: e(Y_EAVE, 1, ' m'),
  groundFall: e(GROUND_NORTH - GROUND_SOUTH, 1, ' m'),
  footing: e(FOOTING, 1, ' m'),
  gableSteps: e(GABLE_STEPS, 0, steps),
  slab: e(SLAB, 2, ' m'),
  ceilingT: e(CEILING_T, 2, ' m'),
  interior: e(interiorArea(), 0, ' m²'),
  rafter: e(ROOF.rafter, 2, ' m'),
  cover: e(ROOF.cover, 2, ' m'),
  roofIns: e(ROOF.insulation, 2, ' m'),
  eave: e(EAVE, 2, ' m'),
  partT: e(PARTITION.t, 1, ' m'),
  partDoor: size(PARTITION.door, PARTITION.doorH),
  livingW: e(LIVING_X1 - LIVING_X0, 2, ' m'),
  chimneyBox: size(CHIMNEY.w, CHIMNEY.d),
  doorBox: size(RECESS.door, RECESS.doorH),
  windowBox: size(WINDOW.w, WINDOW.head - WINDOW.sill),
  windowSill: e(WINDOW.sill, 2, ' m'),
  northBox: size(ROOM.northWindow.w, ROOM.northWindow.head - ROOM.northWindow.sill),
  northSill: e(ROOM.northWindow.sill, 1, ' m'),
  northHead: e(ROOM.northWindow.head, 1, ' m'),
  balconyDepth: e(BALCONY.depth, 1, ' m'),
  balconyWidth: e(BALCONY.width, 1, ' m'),
  balconyRail: e(BALCONY.rail, 1, ' m'),
  stairWidth: e(BALCONY.stairW, 1, ' m'),
  riser: e(BALCONY.rise, 2, ' m'),
  tread: e(BALCONY.tread, 2, ' m'),
  headBand: size(HEAD_BAND.h, HEAD_BAND.d),
  heaterBox: size(ROOM.heater.w, ROOM.heater.h, ROOM.heater.d),
  panelBox: size(ROOM.panel.w, ROOM.panel.h, ROOM.panel.d),
  recorderBox: size(ROOM.recorder.w, ROOM.recorder.h, ROOM.recorder.d),
  freshBox: size(ROOM.freshVent.w, ROOM.freshVent.h),
  freshHeight: e(ROOM.freshVent.y, 2, ' m'),
  ductAbove: e(DUCT_ABOVE_FLOOR, 2, ' m'),
  ductHigh: e(lay.yDuctHigh, 1, ' m'),
  frameFace: e(FRAME.face * 1000, 0, ' mm'),
  frameProud: e(FRAME.proud * 1000, 0, ' mm'),
  framePanes: e(FRAME.panes, 0),
  frameGasket: e(FRAME.gasket * 1000, 0, ' mm'),
  thermoCount: e(THERMOCOUPLE_DEPTHS.length, 0),
  thermoFirst: e(THERMOCOUPLE_DEPTHS[0]! * 1000, 0, ' mm'),
  thermoLast: e(THERMOCOUPLE_DEPTHS[THERMOCOUPLE_DEPTHS.length - 1]! * 1000, 0, ' mm'),
  thermoDepths: mmList(THERMOCOUPLE_DEPTHS),
  airFractions: words(
    'estimate',
    `${AIR_PROBE_FRACTIONS.map((x) => nFr(x * 100, 0)).join(', ')} %`,
    `${AIR_PROBE_FRACTIONS.map((x) => nEn(x * 100, 0)).join(', ')}%`,
  ),
  twinAt: e(SITE.twinAt, 0, ' m'),
  helioBox: size(SITE.heliostat.w, SITE.heliostat.h),
  terraces: e(SITE.heliostat.terraces, 0),
  tubeLength: e(TUBE.length, 0, ' m'),
  tubeDia: e(TUBE.diameter * 1000, 0, ' mm'),
  tubeDepth: e(TUBE.depth, 0, ' m'),
  tubeFlow: e(HOUSE_TUBE.flow, 0, ' m³/h'),
  tubeFall: e(TUBE_FALL * 100, 1, pct),

  // ---- the estimates of the model (src/sim/machine.ts ESTIMATE)
  windowsM2: e(ESTIMATE.windowArea, 1, ' m²'),
  windowU: e(ESTIMATE.windowU, 0, ' W/m²·K'),
  singleU: e(5, 0, ' W/m²·K'),
  nightScreen: e(ESTIMATE.shutterR, 0, ' m²·K/W'),
  gains: e(ESTIMATE.gains, 0, ' W'),
  roomMass: e(ESTIMATE.roomMass / 1e6, 0, ' MJ/K'),
  wind: e(ESTIMATE.wind, 0, ' m/s'),
  absorptance: e(ESTIMATE.absorptance, 2),
  absorptanceRange: words('estimate', 'entre 0,90 et 0,95', 'between 0.90 and 0.95'),
  lossK: e(ESTIMATE.ductLossK, 0),
  lossKRange: words('estimate', 'de 3 à 5', 'from 3 to 5'),
  heaterMax: e(ESTIMATE.heaterMax / 1000, 0, ' kW'),
  airChange: e(ESTIMATE.airChange, 1, renew),
  glassSpacing: e(ESTIMATE.glassSpacing * 1000, 0, ' mm'),
  glassEmissivity: e(ESTIMATE.glassEmittance, 2),
  glassIndex: e(ESTIMATE.glassIndex, 3),
  paintAlarm: e(70, 0, ' °C'),
  albedo: e(ESTIMATE.albedo, 1),

  // ---- arithmetic on reported figures (derived), recomputed by figures.test.ts
  elemArea: d(5.56, 2, ' m²'), // 4.38 × 1.27
  elemCount: d(8.63, 2), // 48 / 5.56
  gapSection: d(1524, 0, ' cm²'), // 127 × 12 cm
  ductsOverGap: d(41, 0, pct), // 621.5 / 1,524
  gapSpeed: d(13, 0, ' cm/s'), // 20 L/s over 1,524 cm²
  ductSpeed: d(32, 0, ' cm/s'), // 20 L/s over 621.5 cm²
  massT: d(63.4, 1, ' t'), // 48 m² × 0.60 m × 2,200 kg/m³
  capMj: d(58.4, 1, ' MJ/K'),
  capKwh: d(16.2, 1, ' kWh/K'),
  tPerM2: d(1.32, 2, ' t/m²'),
  waveSpeed: d(4.03, 2, ' cm/h'), // √(2αω), α = λ/ρc
  lag60: d(14.9, 1, ' h'),
  lag37: d(9.2, 1, ' h'),
  lag45: d(11.2, 1, ' h'),
  damp60: d(2, 0, pct),
  damp45: d(5, 0, pct),
  thick12: d(48, 0, ' cm'), // the thickness for a lag of 12 h, by the closed form
  sunDec: d(24, 0, '°'), // 90° − (latitude − declination), at noon on 21 December
  sunJun: d(71, 0, '°'),
  janJun: d(1.65, 2, times), // 129.6 / 78.7
  roofRatio: d(2.9, 1, times), // 186.9 / 64.9
  gv: d(489, 0, ' W/K'), // 1.63 W/m³·K × 300 m³
  envelope: d(365, 0, ' m²'), // G·V / K = 489 / 1.34
  boxM2: d(380, 0, ' m²'), // the skin of a 15 × 6.6 × 4 m box
  meanHeight: d(3.95, 2, ' m'), // 300 m³ / 76 m²
  pitch: d(24, 0, '°'), // atan(1.45 / 3.3), rough
  elemWatts: d(520, 0, ' W'), // 20 L/s × 1 kg/m³ × 1,007 J/kg·K × 26 K
  frontKw: d(4.5, 1, ' kW'), // 520 W × 8.63 elements
  frontFlow: d(620, 0, ' m³'), // 8.63 × 20 L/s × 3,600 s
  summerRecorded: d(2, 0, renew), // 620 m³/h against 300 m³
  ringRatio: d(34, 0, pct), // 20 MJ/K over 58.4 MJ/K
  helioArea: d(45, 0, ' m²'), // 2,835 m² / 63
  streamSource: d(66, 0, ' W/m²'), // (3,968 + 1,741) kJ/m² over 86,400 s
  handConduction: d(31, 0, ' W/m²'), // 1.75 / 0.60 × (37 − 26.5) K, by eye
  surfacesSource: d(17.6, 1, ' °C'),
  directGainK: d(21, 0, ' K'), // 38 °F
  ventsK: d(14, 0, ' K'), // 26 °F
  noVentsK: d(5, 0, ' K'), // 9 °F
  exchangeCalc: d(4.45, 2, ' m²'), // 1.27 × 3.50
  centreRange: words('estimate', '46 à 64 cm/s', '46 to 64 cm/s'), // 20 L/s over 621.5 cm², the centre speed at 0.7 to 0.5 of the mean

  // ---- the model (docs/physics.md), recomputed by figures.test.ts or held to docs/physics.md
  shareWall: m(32, 0, pct),
  shareWindows: m(42.5, 1, pct),
  shareAll: m(47.1, 0, pct),
  shareWallAir: m(10, 0, pct),
  shareWallConduction: m(14, 0, pct),
  shareWindowLine: m(19, 0, pct),
  sharePeople: m(6, 0, pct),
  shareElectricity: m(53, 0, pct),
  share5K: m(61, 0, pct),
  share18: m(52.6, 0, pct),
  share1974: m(74.2, 0, pct),
  share06: m(94, 0, pct),
  gvRest: m(24, 0, pct),
  win0: m(42.1, 0, pct),
  win30: m(45.6, 0, pct),
  nightScreenShare: m(54, 0, pct),
  peopleLow: m(42.5, 1, pct),
  peopleHigh: m(51.6, 1, pct),
  windowCarry: m(15, 0, points),
  seasonLoadKwh: m(46700, 0, ' kWh'),
  seasonElecKwh: m(24700, 0, ' kWh'),
  thermoShare: m(51, 0, pct),
  thermoShareK30: m(43, 0, pct),
  eff20: m(35, 0, pct),
  dry74: m(36, 0, pct),
  flowRange: words('model', '34 à 41 L/s', '34 to 41 L/s'),
  flowHalfDuct: m(25, 0, ' L/s'),
  plateAbove: m(33, 0, ' K'),
  plateAboveLow: m(44, 0, ' K'),
  airOutModel: m(36, 0, ' °C'),
  reverseFlow: m(12, 0, ' L/s'),
  reverseHours: m(5, 0, ' h'),
  reverseKwh: m(0.4, 1, ' kWh'),
  flapPoint: m(1, 0, ' point'),
  shareMoves: m(0.7, 1, ' point'),
  summerRange: words('model', '2,2 à 3,3 renouvellements par heure', '2.2 to 3.3 air changes an hour'),
  swing60: m(0.25, 2, ' K'),
  swingOuter: m(17, 0, ' K'),
  glassDec: m(0.75, 2),
  glassJun: m(0.5, 2),
  oneGlass: m(16, 0, pct),
  twoGlass: m(32, 0, pct),
  threeGlass: m(37, 0, pct),
  thickRange: words('model', 'entre 46,6 et 48,1 %', 'between 46.6 and 48.1 %'),
  shadeJune: m(8, 0, pct),
  shadeDec: m(1, 0, pct),
  absorbMove: m(1, 0, ' point'),
  innerModel: words('model', '21 à 24 °C', '21 to 24 °C'),
  surfacesT: m(18, 0, ' °C'),
  peakModel: m(898, 0, ' W/m²'),
  horizonLoss: m(3, 0, pct),
  tubeJanIn: m(-1, 0, ' °C'),
  tubeJanOut: m(3, 0, ' °C'),
  tubeJulIn: m(15, 0, ' °C'),
  tubeJulOut: m(10, 0, ' °C'),
  tubeKwh: m(625, 0, ' kWh'),
  tubeLoad: m(57000, 0, ' kWh'),
  tubePoint: m(1, 0, ' point'),
  tubePerpHeat: m(731, 0, ' kWh'),
  tubePerpCool: m(484, 0, ' kWh'),
  innerGap: words('model', '+0,3 à +5,4 K', '+0.3 to +5.4 K'),
  flowHigh50: m(50, 0, ' L/s'),
  flowLow19: m(19, 0, ' L/s'),
  paintHotRange: words('model', '66 à 70 °C', '66 to 70 °C'),
  linesSum: m(102, 0, pct),
  febDull: m(80, 0, pct),
  febNext: m(20, 0, pct),
  christmasKj: m(4179, 0, ' kJ/m²'),
  christmasModel: m(367, 0, pct),
  monthFall: m(9, 0, ' points'),
  arrival60: words('model', '4 h du matin', '4 in the morning'),
  arrival37: words('model', '22 h', '10 at night'),
  arrival45: words('model', 'minuit', 'midnight'),
  swing37: m(2.1, 1, ' K'),
  crest60: m(14.5, 1, ' h'),
  crest37: m(8.1, 1, ' h'),
  damp37: d(9, 0, pct),
  swing15: m(10, 0, ' K'),
  dark1: m(45, 0, ' kWh'),
  dark2: m(10, 0, ' kWh'),
  darkLoad: m(248, 0, ' kWh'),
  ventsShut: words('model', '2 K, avec un maximum vers 21 h', '2 K, peaking around 9 at night'),
  ventsOpen: words('model', 'plus de 6 K, avec un maximum vers 15 h', 'over 6 K, peaking around 3 in the afternoon'),
  chauvency: m(32, 0, pct),
  hairDryer: d(1154, 0, ' W'), // 7.4 W/m² × 156 m²
  waveDepth: d(15, 0, ' cm'), // δ = √(2α/ω) = 0.154 m
  decRoof: d(2.17, 2, times), // 126.9 / 58.5
  dec29Model: m(19, 0, pct),
  april44: m(44, 0, ' °C'),
  april27: m(27, 0, pct),
  juneRoomRange: words('model', '13 à 19 °C, avec un air de 8 à 18 °C', '13 to 19 °C, with the air at 8 to 18 °C'),
  winterLowPts: words('model', '8 à 12 points', '8 to 12 points'),
  summerHighPts: words('model', '5 à 11 points', '5 to 11 points'),
  tubePerpLoad: m(22000, 0, ' kWh'),
} as const;

export type FigName = keyof typeof FIG;
