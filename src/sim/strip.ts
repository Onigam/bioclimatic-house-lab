import { ALARM_TEXTS, type Pair } from './texts';
import type { AlarmKey, HouseState } from './types';

// The bottom strip's values as plain data: no DOM. `src/lab.ts` or a panel turns them into the kit's `StripValue`. Every value here is the model's: `†`, said once in the panel's note.

export type Lang = 0 | 1;

export interface StripDatum {
  key: string;
  label: Pair;
  value: number;
  digits: number;
  unit: string;
  tag: '†';
}

const MONTHS: readonly (readonly [string, string])[] = [
  ['janvier', 'January'],
  ['février', 'February'],
  ['mars', 'March'],
  ['avril', 'April'],
  ['mai', 'May'],
  ['juin', 'June'],
  ['juillet', 'July'],
  ['août', 'August'],
  ['septembre', 'September'],
  ['octobre', 'October'],
  ['novembre', 'November'],
  ['décembre', 'December'],
];

const FIRST_OF_MONTH = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];

export function stripData(s: HouseState): StripDatum[] {
  return [
    {
      key: 'sun',
      label: ['Soleil sur le mur', 'Sun on the wall'],
      value: s.incidentWm2,
      digits: 0,
      unit: 'W/m²',
      tag: '†',
    },
    { key: 'outer', label: ['Face noire', 'Black face'], value: s.tOuterFace, digits: 0, unit: '°C', tag: '†' },
    { key: 'inner', label: ['Face intérieure', 'Inner face'], value: s.tInnerFace, digits: 1, unit: '°C', tag: '†' },
    { key: 'room', label: ['Pièce', 'Room'], value: s.tRoom, digits: 1, unit: '°C', tag: '†' },
    { key: 'flow', label: ['Courant d’air', 'Air flow'], value: s.flowLs, digits: 0, unit: 'L/s', tag: '†' },
    { key: 'aux', label: ['Électricité', 'Electricity'], value: s.qAux / 1000, digits: 1, unit: 'kW', tag: '†' },
  ];
}

/** The clock: solar hour and date, in one language. Three labs have written this one (`docs/kit-requests.md`). */
export function stripClock(s: HouseState, lang: Lang): { time: string; sub: string } {
  const hh = Math.floor(s.hour);
  const mm = Math.floor((s.hour - hh) * 60);
  const date = s.dayOfYear - FIRST_OF_MONTH[s.month]! + 1;
  const month = MONTHS[s.month]![lang];
  return {
    time: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`,
    sub: lang === 0 ? `${date} ${month}, heure solaire` : `${date} ${month}, solar time`,
  };
}

export function stripAlarms(s: HouseState, lang: Lang): { key: AlarmKey; label: string; severe: boolean }[] {
  return s.alarms.map((key) => ({ key, label: ALARM_TEXTS[key].text[lang], severe: ALARM_TEXTS[key].severe }));
}
