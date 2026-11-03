import { describe, expect, it } from 'vitest';
import { SITE_IDS } from './climate';
import { tubeYear } from './earth-tube';
import { HouseSim } from './engine';
import { presetParams, PRESET_IDS, scenarioSetup, SCENARIO_IDS } from './presets';
import { nightRun, periodicDay, replay, seasonRun, totals } from './runs';
import { stripAlarms, stripClock, stripData } from './strip';
import {
  ALARM_TEXTS,
  MATERIAL_TEXTS,
  MODE_TEXTS,
  MODEL_NOTE,
  PARAM_TEXTS,
  PRESET_TEXTS,
  SCENARIO_TEXTS,
  SHARE_CLAIMS,
  SITE_TEXTS,
  SKY_TEXTS,
  VENT_TEXTS,
  type Pair,
} from './texts';

// The words of the scenarios, read and held against the model. A pin is not a target: when the model moves, the words and docs/physics.md move with it. The words round to what a sentence needs.

const allPairs = (): Pair[] => [
  MODEL_NOTE,
  ...Object.values(ALARM_TEXTS).map((a) => a.text),
  ...Object.values(PRESET_TEXTS),
  ...Object.values(SCENARIO_TEXTS).flatMap((s) => [s.name, s.lesson]),
  ...Object.values(VENT_TEXTS),
  ...Object.values(MODE_TEXTS),
  ...Object.values(MATERIAL_TEXTS),
  ...Object.values(SITE_TEXTS),
  ...Object.values(SKY_TEXTS),
  ...Object.values(PARAM_TEXTS).map((p) => p!.label),
  ...SHARE_CLAIMS.flatMap((c) => [c.who, c.value]),
];

const read = (text: string, re: RegExp): number[] => {
  const m = text.match(re);
  expect(m, `${re} in « ${text} »`).not.toBeNull();
  return m!.slice(1).map((n) => Number(n.replace('−', '-').replace(/\s/g, '').replace(',', '.')));
};

// Every file of the physics, this one left out because it holds the patterns.
const sources = import.meta.glob(
  ['./*.ts', '!./texts.test.ts', '../../docs/physics.md', '../../docs/kit-requests.md'],
  {
    query: '?raw',
    import: 'default',
    eager: true,
  },
) as Record<string, string>;

describe('the prototypes’ position stays in the private cache', () => {
  it('reads the physics and its documents', () => {
    expect(Object.keys(sources).length).toBeGreaterThan(10);
    expect(Object.keys(sources).some((k) => k.endsWith('physics.md'))).toBe(true);
  });
  for (const [file, text] of Object.entries(sources)) {
    it(`${file} says no more than « Odeillo »`, () => {
      // the PVGIS and map queries' coordinates, the street of the monument, the outline's identifiers
      expect(text).not.toMatch(/42[.,]49\d?/);
      expect(text).not.toMatch(/\b2[.,]03\d?\b/);
      expect(text).not.toMatch(/Cami-del-Sol|Cami del Sol/);
      expect(text).not.toMatch(/BATIMENT\d+/i);
    });
  }
});

describe('the texts', () => {
  it('every text has both languages, and neither is empty', () => {
    for (const [fr, en] of allPairs()) {
      expect(fr.trim().length).toBeGreaterThan(0);
      expect(en.trim().length).toBeGreaterThan(0);
    }
  });
  it('no research reference reaches a visitor', () => {
    for (const [fr, en] of allPairs()) {
      for (const t of [fr, en]) {
        expect(t).not.toMatch(/\bK\d{1,3}[a-d]?\b/);
        expect(t).not.toMatch(/\bS\d{1,2}\b/);
        expect(t).not.toMatch(/\bV\d\b/);
      }
    }
  });
  it('nothing says where the prototypes stand beyond the town', () => {
    for (const [fr, en] of allPairs()) {
      for (const t of [fr, en]) {
        expect(t).not.toMatch(/Cami|rue |lat(?:itude)?\.? *\d|\d{1,2}\.\d{3,} *°/i);
      }
    }
    for (const id of SITE_IDS) expect(SITE_TEXTS[id][0]).not.toMatch(/\d\.\d/);
  });
  it('« this is a model » is said once, in the note: not in each scenario', () => {
    for (const s of Object.values(SCENARIO_TEXTS)) {
      for (const t of s.lesson)
        expect(t).not.toMatch(/ceci est un modèle|this is a model|un modèle simple|a simple model/i);
    }
  });
  it('every alarm, scenario and preset has its words, and every scenario its setup', () => {
    for (const id of SCENARIO_IDS) {
      expect(SCENARIO_TEXTS[id]).toBeDefined();
      expect(scenarioSetup(id).params.preset).toBe('custom');
    }
    for (const id of PRESET_IDS) expect(PRESET_TEXTS[id]).toBeDefined();
    expect(Object.keys(ALARM_TEXTS)).toHaveLength(6);
  });
  it('every figure of the model in a scenario’s words carries its tag', () => {
    // a figure the sentence presents as the model's: « environ N † »
    for (const s of Object.values(SCENARIO_TEXTS)) {
      for (const t of s.lesson) {
        for (const m of t.matchAll(/(?:environ|about) \d[\d ,.]*(?: ?(?:%|K|°C|h|L\/s|volumes|points?|kWh))/g)) {
          const after = t.slice(m.index! + m[0].length, m.index! + m[0].length + 12);
          expect(after, `« ${m[0]} » in « ${t} »`).toMatch(/^[^.]{0,12}[†*]/);
        }
      }
    }
  });
});

describe('the strip', () => {
  const sim = new HouseSim();
  it('gives its six values, tagged as the model’s', () => {
    const d = stripData(sim.state);
    expect(d.map((x) => x.key)).toEqual(['sun', 'outer', 'inner', 'room', 'flow', 'aux']);
    expect(d.every((x) => x.tag === '†' && Number.isFinite(x.value))).toBe(true);
  });
  it('gives the clock in solar time in both languages', () => {
    sim.set({ day: 15, hour: 8.5 });
    expect(stripClock(sim.state, 0).time).toBe('08:30');
    expect(stripClock(sim.state, 0).sub).toBe('15 janvier, heure solaire');
    expect(stripClock(sim.state, 1).sub).toBe('15 January, solar time');
  });
  it('gives the alarms in the visitor’s language', () => {
    sim.state.alarms.push('reverseFlow');
    expect(stripAlarms(sim.state, 1)[0]!.label).toContain('backward');
    expect(stripAlarms(sim.state, 0)[0]!.label).toContain('s’inverse');
    sim.state.alarms.length = 0;
  });
});

describe('what the scenarios say, as the model finds it', () => {
  const [lessonFr, lessonEn] = [
    (id: keyof typeof SCENARIO_TEXTS) => SCENARIO_TEXTS[id].lesson[0],
    (id: keyof typeof SCENARIO_TEXTS) => SCENARIO_TEXTS[id].lesson[1],
  ];

  it('« Noël 1974 »: the 1,134 kJ, the 5,424 kJ, the 478 % are the table’s; the model’s 370 % is the model’s', () => {
    const r = replay('christmas-1974');
    const [fr] = read(lessonFr('christmas-1974'), /environ (\d+) % †/);
    expect(Math.abs(r.days[2]!.eff - fr!)).toBeLessThan(5);
    expect(lessonEn('christmas-1974')).toContain('1,134');
    expect(lessonFr('christmas-1974')).toContain('5 424');
  });
  it('« Février 1975 »: about 80 % on the dull day, hardly over 20 % the next', () => {
    const r = replay('feb-1975');
    expect(Math.abs(r.days[2]!.eff - 80)).toBeLessThan(3);
    expect(r.days[3]!.eff).toBeGreaterThan(20);
    expect(r.days[3]!.eff).toBeLessThan(23);
  });
  it('« Avril 1975 »: 44 °C on the face, about 27 % over the four days', () => {
    const r = replay('april-1975');
    const eff = totals(r.days).eff;
    expect(Math.abs(eff - 27)).toBeLessThan(1);
    expect(Math.abs(r.days[0]!.outerMax - 44)).toBeLessThan(1);
  });
  it('« Juin 1975 »: the sun at over 70°, and about 3 volumes an hour', () => {
    const r = replay('june-1975', { mode: 'summer', holdRoom: false, backup: false });
    const volumes = (((r.days[2]!.flowMax + r.days[2]!.flowMin) / 2) * (48 / (4.38 * 1.27)) * 3.6) / 300;
    expect(Math.abs(volumes - 3)).toBeLessThan(0.5);
    expect(lessonEn('june-1975')).toContain('70°');
    expect(r.days[2]!.roomMin).toBeLessThan(16);
  });
  it('« Trop épais, trop fin »: the crest near 4 h, 22 h and midnight; the season 47 to 48 %', () => {
    const arrival = (t: number): number => {
      const p = periodicDay(15, { wallThickness: t, holdRoom: true });
      return (p.outerPeakHour + p.lagCrest) % 24;
    };
    expect(Math.abs(arrival(0.6) - 4)).toBeLessThan(1);
    expect(Math.abs(arrival(0.37) - 22)).toBeLessThan(1);
    const midnight = arrival(0.45);
    expect(Math.min(midnight, 24 - midnight)).toBeLessThan(1);
    for (const t of [0.15, 0.3, 0.37, 0.45, 0.6]) {
      const s = seasonRun({ ...presetParams('prototype-1967'), wallThickness: t }).share;
      expect(s).toBeGreaterThanOrEqual(46.8);
      expect(s).toBeLessThanOrEqual(48.4);
    }
  });
  it('« Le béton qui sèche »: about 36 % and 35 %', () => {
    const a = totals(
      replay('dec-jan-1975', { build: '1974', wallThickness: 0.37, collectorArea: 55, G: 1 }).days.slice(1),
    ).eff;
    const b = totals(replay('dec-jan-1975').days.slice(1)).eff;
    expect(Math.abs(a - 36)).toBeLessThan(1);
    expect(Math.abs(b - 35)).toBeLessThan(1);
  });
  it('« Sans ouvertures »: about 2 K near 21 h shut, over 6 K near 15 h open; the Los Alamos figures converted', () => {
    const room = { backup: false, wallThickness: 0.406, southWindows: 0, gains: 0 };
    const shut = periodicDay(46, { ...room, vents: 'closed' });
    const open = periodicDay(46, { ...room, vents: 'open' });
    expect(Math.abs(2 * shut.roomSwing - 2)).toBeLessThan(0.5);
    expect(Math.abs(shut.roomPeakHour - 21)).toBeLessThan(0.7);
    expect(2 * open.roomSwing).toBeGreaterThan(6);
    expect(Math.abs(open.roomPeakHour - 15)).toBeLessThan(0.7);
    expect((9 * 5) / 9).toBeCloseTo(5, 6);
    expect((26 * 5) / 9).toBeCloseTo(14.4, 1);
    expect(lessonFr('no-vents')).toContain('5 K à 22 h');
    expect(lessonEn('no-vents')).toContain('14 K at 4 p.m.');
  });
  it('« La nuit »: about 12 L/s backward, under half a kilowatt-hour', () => {
    const n = nightRun();
    expect(Math.abs(n.flowMin + 12)).toBeLessThan(1);
    expect(-n.nightQt).toBeLessThan(0.5);
    expect(lessonEn('the-night')).toContain('12 L/s †');
  });
  it('« Une vitre, trois vitres »: 16, 32 and 37 %, and the third sheet brings less than the second', () => {
    const e = [1, 2, 3].map((n) => periodicDay(15, { glazingLayers: n, holdRoom: true }).eff);
    expect(Math.abs(e[0]! - 16)).toBeLessThan(1);
    expect(Math.abs(e[1]! - 32)).toBeLessThan(1);
    expect(Math.abs(e[2]! - 37)).toBeLessThan(1);
    expect(e[2]! - e[1]!).toBeLessThan(e[1]! - e[0]!);
  });
  it('« Isoler d’abord »: 47, 74 and 94 %, and a window has to open', () => {
    const p = presetParams('prototype-1967');
    const a = seasonRun(p);
    const b = seasonRun({ ...p, G: 1 });
    const c = seasonRun({ ...p, G: 0.6 });
    expect(Math.abs(a.share - 47)).toBeLessThan(1);
    expect(Math.abs(b.share - 74)).toBeLessThan(1);
    expect(Math.abs(c.share - 94)).toBeLessThan(1);
    expect(c.vented).toBeGreaterThan(a.vented * 10);
  });
  it('« Sous les nuages de la Meuse »: a quarter of the sun of January, about 32 %', () => {
    expect(32.5 / 129.6).toBeCloseTo(0.25, 2);
    expect(Math.abs(seasonRun(presetParams('at-chauvency')).share - 32)).toBeLessThan(1);
  });
  it('« Et si : un puits canadien »: 3 °C from −1 °C, 10 °C from 15 °C; about a point', () => {
    const y = tubeYear('odeillo');
    expect(Math.abs(y.outJan - 3)).toBeLessThan(0.7);
    expect(Math.abs(y.airJan + 1)).toBeLessThan(0.5);
    expect(Math.abs(y.outJul - 10)).toBeLessThan(0.7);
    expect(Math.abs(y.airJul - 15)).toBeLessThan(0.5);
    const p = presetParams('prototype-1967');
    expect(Math.abs(seasonRun({ ...p, earthTube: true }).share - seasonRun(p).share - 1)).toBeLessThan(0.5);
    const low = tubeYear('perpignan');
    expect(low.coolingKWh).toBeGreaterThan(0);
    expect(y.coolingKWh).toBe(0);
    expect(low.heatingKWh / low.loadKWh).toBeGreaterThan(y.heatingKWh / y.loadKWh);
  });
});
