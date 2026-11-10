import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import { PANEL_STRINGS } from './strings';
import { installFakeDom } from './test-dom';

// The panel's words: French and English written together, same detail, no placeholder left, no research code, no promise of safety, and no number in a text that does not come from docs/research.md, docs/physics.md or src/data/figures.ts.

beforeAll(() => installFakeDom()); // setLang writes the language on the document element
afterEach(() => setLang('fr'));

const entries = Object.entries(PANEL_STRINGS);
/** The numbers of a text, decimal commas read as points and thousands' separators dropped: « 0,8 » and « 0.8 », « 5 424 » and « 5,424 » give the same list. */
const numbers = (s: string): string[] =>
  (
    s
      .replace(/(\d) (\d{3})(?!\d)/g, '$1$2')
      .replace(/(\d),(\d{3})(?!\d)/g, '$1$2')
      .replace(/(\d),(\d)/g, '$1.$2')
      .match(/\d+(\.\d+)?/g) ?? []
  ).sort();

/**
 * Every number a panel word may contain, and where it comes from:
 * 1, 20: the heating season, 1 October to 20 May (research §2.3). 3, 24, 60: days of a chart, a day of the clock, the 1967 wall's 60 cm.
 * 3600, 86400: the strip's speeds. 5: the air 5 K warmer, a row of docs/physics.md §5. 20: the recorded flow, L/s (research K37). 30, 35: the paper's air share. 478: Christmas Eve's figure of Table II.
 * 4.03: the closed form's wave speed, `FIG.waveSpeed`. 34, 41, 51, 367, 47.1, 24, 61, 32: model results, written through `lf` with their mark.
 */
const ALLOWED = new Set([
  '1',
  '20',
  '3',
  '24',
  '60',
  '3600',
  '86400',
  '5',
  '30',
  '35',
  '478',
  '4.03',
  '34',
  '41',
  '51',
  '367',
  '47',
  '24',
  '61',
  '32',
]);

describe('the panel’s words', () => {
  it('there are words to check', () => {
    expect(entries.length).toBeGreaterThan(150);
  });

  it('never show a research code (K12, S3…) or an internal word', () => {
    for (const [key, [fr, en]] of entries) {
      for (const text of [fr, en]) {
        expect(text, key).not.toMatch(/\b[KS]\d{1,2}\b/);
        expect(text, key).not.toMatch(/\bid\b|\bworld\b|\bpreset id\b|\bundefined\b|\{\w+\}/i);
      }
    }
  });

  it('exist in both languages, non-empty, with no placeholder', () => {
    for (const [key, [fr, en]] of entries) {
      expect(fr.trim().length, `${key} fr`).toBeGreaterThan(0);
      expect(en.trim().length, `${key} en`).toBeGreaterThan(0);
      for (const text of [fr, en]) expect(text, key).not.toMatch(/TODO|FIXME|lorem|xxx|\[\[|\{\{/i);
    }
  });

  it('carry the same numbers in French and in English', () => {
    // the physics' texts (`lesson:…`) write an hour as the clock reads it in each language (22 h, 10 at night): src/sim/texts.test.ts reads them
    for (const [key, [fr, en]] of entries.filter(([k]) => !k.includes(':')))
      expect(numbers(fr), key).toEqual(numbers(en));
  });

  it('have the same level of detail', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr.length < 40 && en.length < 40) continue;
      expect(fr.length / en.length, key).toBeGreaterThan(0.6);
      expect(fr.length / en.length, key).toBeLessThan(1.7);
    }
  });

  it('are only the same in both languages for a unit, a name or a single word', () => {
    for (const [key, [fr, en]] of entries) {
      if (fr === en) expect(fr.split(/\s+/).length, `${key}: ${fr}`).toBeLessThanOrEqual(2);
    }
  });

  it('hold no number but those listed, from the research, the physics or the figures', () => {
    for (const [key, [, en]] of entries) {
      // the scenarios' lessons and the alarm and site names have their own tests (src/sim/texts.test.ts)
      if (/^(lesson|scenario|alarm|preset|site|param|record|mode|vents|material|sky):/.test(key)) continue;
      const text = en.replace(
        /\bA3\b|\b3D\b|\bERA5\b|\bPVGIS\b|\bG·V\b|\b1967\b|\b1974\b|\b1975\b|\b1950\b|\bII\b/g,
        '',
      );
      for (const n of numbers(text)) expect(ALLOWED.has(n), `${key}: ${n} in « ${en} »`).toBe(true);
    }
  });

  it('promise no safety and give no recipe', () => {
    const banned =
      /\b(safe|safely|harmless|no risk|no danger|you should|you must)\b|sans (danger|risque)|\bsûr\b|\bsûre\b|il faut|vous devez/i;
    // the words that come from src/sim/texts.ts (`alarm:…`, `lesson:…`) are the physics' and have their own test
    for (const [key, [fr, en]] of entries.filter(([k]) => !k.includes(':'))) {
      expect(fr, key).not.toMatch(banned);
      expect(en, key).not.toMatch(banned);
    }
  });
});
