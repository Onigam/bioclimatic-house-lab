import { beforeAll, describe, expect, it } from 'vitest';
import { configureDrawings } from '@onigam/lab-kit/drawings';
import { setLang } from '@onigam/lab-kit/i18n';
import { PARTS } from '../data/parts';
import { SHEET_GROUPS, SHEETS } from './index';
import { FakeElement, installFakeDom, textBoxes, textExtent } from './test-dom';

// The A3 sheets of the "Plans" mode: the contract, a render in French and in English with no NaN and no text on text or off the sheet, the cartouche, the numbers read from dims.ts and the model's figures.

const LANGS = ['fr', 'en'] as const;
type Lang = (typeof LANGS)[number];
const rendered = new Map<string, FakeElement>();
const root = (d: { svg: SVGSVGElement }): FakeElement => d.svg as unknown as FakeElement;
const key = (id: string, lang: Lang): string => `${id}/${lang}`;
const textsOf = (id: string, lang: Lang): string[] => textBoxes(rendered.get(key(id, lang))!).map((t) => t.content);

beforeAll(() => {
  installFakeDom();
  configureDrawings({ date: '2026-11-11' });
  for (const lang of LANGS) {
    setLang(lang);
    for (const s of SHEETS) rendered.set(key(s.id, lang), root(s.render()));
  }
  setLang('fr');
});

describe('the contract', () => {
  it('numbers the sheets in order, each with a group, a world and existing parts of that world', () => {
    expect(SHEETS.map((s) => s.number)).toEqual(SHEETS.map((_, i) => `PL-H${String(i + 1).padStart(2, '0')}`));
    expect(new Set(SHEETS.map((s) => s.id)).size).toBe(SHEETS.length);
    for (const s of SHEETS) {
      expect(SHEET_GROUPS.map((g) => g.id) as string[], s.id).toContain(s.group);
      expect(s.parts?.length, s.id).toBeGreaterThan(0);
      for (const id of s.parts ?? []) expect(PARTS.find((p) => p.id === id)?.scene, `${s.id}: ${id}`).toBe(s.scene);
    }
  });
  it('lists the sheets in the order of their numbers: the kit shows them group by group, in the order the lab gives the groups', () => {
    const listed = SHEET_GROUPS.flatMap((g) => SHEETS.filter((s) => s.group === g.id).map((s) => s.number));
    expect(listed).toEqual([...SHEETS.map((s) => s.number)].sort());
  });
  it('describes each sheet in both languages, with what it shows and how to read it', () => {
    for (const s of SHEETS) {
      for (const lang of LANGS) {
        expect(s.title[lang].length, s.id).toBeGreaterThan(5);
        expect(s.description[lang].split(/(?<=[.!?])\s+/).length, s.id).toBeGreaterThanOrEqual(2);
      }
      expect(s.title.fr).not.toBe(s.title.en);
      const ratio = s.description.fr.length / s.description.en.length;
      expect(ratio, s.id).toBeGreaterThan(0.8);
      expect(ratio, s.id).toBeLessThan(1.3);
    }
  });
});

describe('the render', () => {
  it('prints no bad number, no placeholder, no research code', () => {
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of textsOf(s.id, lang)) {
          expect(t, s.id).not.toMatch(/NaN|undefined|Infinity|\{\w+\}|\[object/);
          expect(t, s.id).not.toMatch(/\b[KS]\d{1,2}\b/);
        }
  });
  it('says in every cartouche that a sheet is for understanding, in both languages, with its number', () => {
    for (const s of SHEETS) {
      expect(textsOf(s.id, 'fr').join(' '), s.id).toContain('Pour comprendre');
      expect(textsOf(s.id, 'en').join(' '), s.id).toContain('For understanding');
      expect(textsOf(s.id, 'en').join(' '), s.id).toContain(s.number);
    }
  });
  it('has its own French and English, not one language in both', () => {
    for (const s of SHEETS) expect(textsOf(s.id, 'fr').join(' ')).not.toBe(textsOf(s.id, 'en').join(' '));
  });
  it('keeps every text on the sheet', () => {
    const off: string[] = [];
    for (const s of SHEETS)
      for (const lang of LANGS)
        for (const t of textBoxes(rendered.get(key(s.id, lang))!)) {
          if (t.rotated) continue;
          const e = textExtent(t);
          if (e.x0 < 11 || e.x1 > 409 || e.y0 < 11 || e.y1 > 286)
            off.push(
              `${s.number} ${lang}: ${t.content} (${e.x0.toFixed(0)}, ${e.x1.toFixed(0)}, ${e.y0.toFixed(0)}, ${e.y1.toFixed(0)})`,
            );
        }
    expect(off.join('\n')).toBe('');
  });
  it('writes no text on another text', () => {
    const clashes: string[] = [];
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const boxes = textBoxes(rendered.get(key(s.id, lang))!).filter((t) => !t.rotated && t.content.trim());
        for (let i = 0; i < boxes.length; i++)
          for (let j = i + 1; j < boxes.length; j++) {
            const a = textExtent(boxes[i]!);
            const b = textExtent(boxes[j]!);
            const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
            const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
            if (w > 1 && h > 0.6) clashes.push(`${s.number} ${lang}: “${boxes[i]!.content}” / “${boxes[j]!.content}”`);
          }
      }
    expect(clashes.join('\n')).toBe('');
  });
  it('keeps out of the title block', () => {
    const inside: string[] = [];
    for (const s of SHEETS) {
      const fr = textBoxes(rendered.get(key(s.id, 'fr'))!);
      const outside = fr.filter((t) => {
        const e = textExtent(t);
        return e.x1 > 233 && e.y1 > 250;
      });
      if (outside.length > 13) inside.push(`${s.number}: ${outside.map((t) => t.content).join(' | ')}`);
    }
    expect(inside.join('\n')).toBe('');
  });
});

// ---- what the sheets print: read from dims.ts, from the simulation, from the pinned tables that docs/physics.md holds

import { nEn, nFr } from '../data/units';
import { BAY, BALCONY, DEPTH, ELEMENT_1967, LENGTH, ROOM, Y_RIDGE } from '../three/dims';
import { ductArea } from '../sim/machine';
import { COLLECTOR_1967 } from '../sim/machine';
import { DAYS_MODEL, FLOW_VS_K, LADDER, MONTH_EFF_EYE, MONTH_EFF_MODEL, SENSITIVITY } from './model-tables';

const docs = import.meta.glob('../../docs/physics.md', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const PHYSICS = Object.values(docs)[0] ?? '';
const n = (v: number, lang: Lang, d = 0): string => (lang === 'fr' ? nFr(v, d) : nEn(v, d));
/** As the sheets' `mL` prints a length: at most the given decimals, no trailing zero. */
const trimmed = (v: number, lang: Lang, d = 2): string => n(v, lang, d).replace(/[,.]?0+$/, '');
const cells = (line: string): string[] => line.split('|').map((c) => c.replace(/\*/g, '').trim());
const rowStarting = (start: RegExp): string[] => {
  const line = PHYSICS.split('\n').find((x) => start.test(x.replace(/\*/g, '')));
  expect(line, String(start)).toBeDefined();
  return cells(line!);
};

describe('the numbers are read, not typed', () => {
  it('PL-H01 prints the 3D’s lengths with their star, and the paper’s without', () => {
    for (const lang of LANGS) {
      const t = textsOf('general-arrangement', lang);
      expect(t, 'length').toContain(`${trimmed(LENGTH, lang)} m*`);
      expect(t, 'depth').toContain(`${trimmed(DEPTH, lang, 1)} m*`);
      expect(t, 'bay').toContain(`${trimmed(BAY, lang)} m`);
      expect(t.join(' '), 'ridge').toContain(`${trimmed(Y_RIDGE, lang, 1)} m*`);
      expect(t.join(' '), 'balcony').toContain(`${trimmed(BALCONY.depth, lang, 1)} m*`);
    }
  });
  it('PL-H02 prints the paper’s wall, gap and span, the thermostat, and the noon sun with its dagger', () => {
    for (const lang of LANGS) {
      const t = textsOf('section-winter-summer', lang);
      expect(t).toContain(`${trimmed(ELEMENT_1967.thickness, lang)} m`);
      expect(t).toContain(`${trimmed(ELEMENT_1967.gap, lang)} m`);
      expect(t).toContain(`${trimmed(ELEMENT_1967.ductSpan, lang)} m`);
      expect(t.join(' ')).toContain(`${trimmed(ROOM.thermostat, lang)} m`);
      expect(t.join(' ')).toMatch(/24 ?°†/);
      expect(t.join(' ')).toMatch(/71 ?°†/);
    }
  });
  it('PL-H04 prints the element’s official dimensions and the duct’s section from the simulation', () => {
    for (const lang of LANGS) {
      const t = textsOf('collector-element', lang).join(' ');
      expect(t).toContain(`${trimmed(ELEMENT_1967.height, lang)} m`);
      expect(t).toContain(`${trimmed(ELEMENT_1967.ductWidth, lang, 3)} m`);
      expect(t).toContain(n(Math.round(ductArea(COLLECTOR_1967) * 1e4 * 10) / 10, lang, 1));
    }
  });
  it('PL-H03 prints the data service’s figures and the arithmetic’s daggers', () => {
    for (const lang of LANGS) {
      const t = textsOf('sun-and-seasons', lang).join(' ');
      expect(t).toContain(n(129.6, lang, 1));
      expect(t).toContain(n(78.7, lang, 1));
      expect(t).toMatch(/1[,.]65 (fois|times)†/);
    }
  });
});

describe('the model’s results are the ones of docs/physics.md', () => {
  it('the efficiency of the months, by eye and by the model (§4.5)', () => {
    const eye = rowStarting(/^\| S1, by eye, 1974–75/)
      .slice(2, 14)
      .map(Number);
    const model = rowStarting(/^\| Model, PVGIS series/)
      .slice(2, 14)
      .map(Number);
    expect([...MONTH_EFF_EYE]).toEqual(eye);
    expect([...MONTH_EFF_MODEL]).toEqual(model);
  });
  it('the days of December against the table (§4.2): the sum and the efficiency the model gives', () => {
    for (const day of DAYS_MODEL) {
      const c = rowStarting(new RegExp(`^\\| ${day.date} `));
      expect(Number(c[10]!.replace(',', '')), day.date).toBe(day.sum);
      expect(Number(c[12]!.replace(',', '')), day.date).toBeCloseTo(day.eff, 1);
    }
  });
  it('the ladder and its lines (§5)', () => {
    const c = rowStarting(/^\| As it stands/);
    expect(Number(c[2])).toBeCloseTo(LADDER.wall, 1);
    expect(Number(c[3])).toBeCloseTo(LADDER.windows, 0);
    expect(Number(c[4])).toBeCloseTo(LADDER.all, 1);
    expect(PHYSICS).toMatch(/wall by air 10 %, wall by conduction 14 %, windows 19 %, people 6 %, electricity 53 %/);
    const l = LADDER.lines;
    expect(Math.round(l.wallAir)).toBe(10);
    expect(Math.round(l.wallConduction)).toBe(14);
    expect(Math.round(l.windows)).toBe(19);
    expect(Math.round(l.people)).toBe(6);
    expect(Math.round(l.electricity)).toBe(53);
  });
  it('what moves the share (§5): the last rung of each row', () => {
    for (const r of SENSITIVITY) {
      const c = rowStarting(new RegExp(`^\\| ${r.line.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
      expect(Number(c[4]!.split(';')[0]), r.key).toBeCloseTo(r.share, 1);
    }
  });
  it('the flow against the loop’s losses (§4.3)', () => {
    for (const r of FLOW_VS_K) {
      const c = rowStarting(new RegExp(`^\\| ${r.k}(, the model)? +\\|`));
      expect(Number(c[2]), `K ${r.k}`).toBeCloseTo(r.flow, 1);
      expect(Number(c[3]), `K ${r.k}`).toBeCloseTo(r.airOut, 1);
    }
  });
});

describe('the sheets say what they find, and promise nothing', () => {
  it('PL-H05 says the model does not retrieve the flow, PL-H07 that it finds the phenomenon and not the figure', () => {
    expect(SHEETS.find((s) => s.id === 'ducts-and-air')!.description.en).toMatch(
      /does not retrieve this figure, and says so/,
    );
    expect(SHEETS.find((s) => s.id === 'christmas-1974')!.description.en).toMatch(
      /finds the phenomenon, not the figure/,
    );
    expect(SHEETS.find((s) => s.id === 'heat-budget')!.description.en).toMatch(/says so, and does not settle it/);
  });
  it('prints no promise of safety, and no « educational reconstruction » (said once, in the Sources)', () => {
    const promise = /\b(safe|safely|harmless|risk-free|no risk|guarantee)\b|sans (danger|risque)|\bsûr\b|garanti/i;
    for (const s of SHEETS)
      for (const lang of LANGS) {
        const t = `${textsOf(s.id, lang).join(' ')} ${s.description[lang]}`;
        expect(t, s.id).not.toMatch(promise);
        expect(t, s.id).not.toMatch(/reconstitution pédagogique|educational reconstruction/i);
      }
  });
  it('has eight sheets, the standard’s, in the research’s order', () => {
    expect(SHEETS.map((s) => s.id)).toEqual([
      'general-arrangement',
      'section-winter-summer',
      'sun-and-seasons',
      'collector-element',
      'ducts-and-air',
      'heat-wave',
      'christmas-1974',
      'heat-budget',
    ]);
  });
});
