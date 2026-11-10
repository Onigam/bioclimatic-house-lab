import type { AlarmKey, HouseState, Scope } from '../sim/types';
import { ALARM_TEXTS } from '../sim/texts';
import type { PanelKey } from './strings';

// What the panel shows, as plain functions of the state: a test checks the numbers and the status line without a browser. Every figure here is the model's (†), the clock's and the sliders' excepted.

export type Mark = '' | '†' | '*';

export interface Readout {
  key: PanelKey;
  value: number;
  digits: number;
  unit: string;
  mark: Mark;
}

const r = (key: PanelKey, value: number, digits: number, unit: string, mark: Mark = '†'): Readout => ({
  key,
  value,
  digits,
  unit,
  mark,
});

/** The few live figures that stay in sight. */
export function mainReadouts(s: HouseState): Readout[] {
  return [
    r('liveSun', s.incidentWm2, 0, 'W/m²'),
    r('liveOuter', s.tOuterFace, 0, '°C'),
    r('liveInner', s.tInnerFace, 1, '°C'),
    r('liveGapOut', s.tGapOut, 0, '°C'),
    r('liveFlow', s.flowLs, 0, 'L/s'),
    r('liveRoom', s.tRoom, 1, '°C'),
    r('liveAir', s.tOutside, 1, '°C'),
    r('liveElec', s.qAux / 1000, 1, 'kW'),
    r('liveEff', s.dayEfficiency, 0, '%'),
  ];
}

/** The rest, folded. */
export function moreReadouts(s: HouseState): Readout[] {
  return [
    r('moreSunAlt', s.sunAltitude, 0, '°'),
    r('moreIncidence', s.sunIncidence, 0, '°'),
    r('moreRefused', s.glassRefuses * 100, 0, '%'),
    r('moreGlassOut', s.tGlassOuter, 1, '°C'),
    r('moreGlassIn', s.tGlassInner, 1, '°C'),
    r('moreGapIn', s.tGapIn, 1, '°C'),
    r('moreSurfaces', s.tSurfaces, 1, '°C'),
    r('moreWaveSpeed', s.waveSpeedCmH, 2, 'cm/h'),
    r('moreWaveLag', s.waveLagHours, 1, 'h'),
    r('moreLag', s.lagHours, 1, 'h'),
    r('moreThermo', s.qThermo, 0, 'W'),
    r('moreRad', s.qRad, 0, 'W'),
    r('moreConv', s.qConv, 0, 'W'),
    r('moreWindows', s.qWindows, 0, 'W'),
    r('moreGains', s.qGains, 0, 'W', '*'),
    r('moreDraw', s.qDraw, 0, 'W'),
    r('moreTube', s.qTube, 0, 'W'),
    r('moreLoad', s.qLoad, 0, 'W'),
    r('moreToday', s.todayIncident, 0, 'kJ/m²'),
    r('moreTodayAir', s.todayThermo, 0, 'kJ/m²'),
    r('moreTodayConduction', s.todayConduction, 0, 'kJ/m²'),
  ];
}

export type Tone = 'note' | 'warn';

/** What the status line says: the alarms first, the severe ones as warnings, or else one sentence on the current. */
export function statusOf(s: HouseState): { alarms: { key: AlarmKey; severe: boolean }[] } | { key: PanelKey } {
  if (s.alarms.length > 0) return { alarms: s.alarms.map((key) => ({ key, severe: ALARM_TEXTS[key].severe })) };
  if (s.flowDir > 0) return { key: s.flapOpen > 0 ? 'statusSummer' : 'statusUp' };
  return { key: 'statusQuiet' };
}

/** A round top for a chart: three intervals, each a round number. */
export function niceCeil3(v: number): number {
  if (!(v > 0)) return 3;
  const p = Math.pow(10, Math.floor(Math.log10(v / 3)));
  for (const f of [1, 2, 2.5, 5, 10]) if (v <= 3 * f * p) return 3 * f * p;
  return 30 * p;
}

/** The wall through its thickness, for the chart: the black face, the cells, the room face; metres from the outer face and °C. */
export function wallProfile(s: HouseState): { xs: number[]; ys: number[] } {
  const xs = [0];
  const ys = [s.tOuterFace];
  for (let i = 0; i < s.layers.length; i++) {
    xs.push(s.layerDepths[i]!);
    ys.push(s.layers[i]!);
  }
  xs.push(s.wallThickness);
  ys.push(s.tInnerFace);
  return { xs, ys };
}

/** The scope's three days in days, for the time charts' axis. */
export const scopeDays = (sc: Scope): number[] => sc.t.map((h) => h / 24);

/** A key that changes when something the season depends on changes: the clock, the speed and the starting point do not count. */
export function seasonKey(params: object): string {
  const skip = new Set(['slowMo', 'timeScale', 'running', 'preset', 'day', 'hour']);
  return JSON.stringify(Object.entries(params).filter(([k]) => !skip.has(k)));
}
