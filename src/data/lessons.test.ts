import { describe, expect, it } from 'vitest';
import { WORLD_IDS, type WorldId } from '../three/ids';
import { LESSONS } from './lessons';
import { PARTS } from './parts';
import { HouseSim } from '../sim/engine';
import { PRESET_IDS, SCENARIO_IDS } from '../sim/presets';
import { SCENARIO_TEXTS } from '../sim/texts';

// The seven lessons: the bar, the quiz, each tied to a scenario that exists and a part that stands in the world it opens, all twelve scenarios gone through, and what each lesson must say, including where the model does not retrieve a source.

const body = (id: string, lang: 'fr' | 'en') =>
  LESSONS.find((x) => x.id === id)!
    .body.map((b) => b[lang])
    .join(' ');

describe('the lessons', () => {
  it('meet the bar: seven lessons, fourteen questions, two each', () => {
    expect(LESSONS.length).toBe(7);
    expect(LESSONS.reduce((n, x) => n + (x.quiz?.length ?? 0), 0)).toBe(14);
    for (const x of LESSONS) expect(x.quiz?.length, x.id).toBe(2);
    expect(LESSONS.map((x) => x.id)).toEqual([
      'the-black-wall',
      'the-slow-wave',
      'christmas-eve',
      'low-sun-high-sun',
      'can-a-house-heat-itself',
      'the-night',
      'fresh-air-and-the-ground',
    ]);
  });

  it('write each formula in symbols only, so that it reads the same in both languages (the kit has one string for it)', () => {
    for (const x of LESSONS) {
      expect(x.formula, x.id).toBeDefined();
      // no word of four letters or more: a symbol, a subscript, a number
      expect(x.formula!, x.id).not.toMatch(/\p{L}{4,}/u);
    }
  });

  it('open each on a real scenario, in a real world, on a part that stands there', () => {
    const used = new Set<string>();
    for (const x of LESSONS) {
      expect(WORLD_IDS, x.id).toContain(x.focus.scene as WorldId);
      expect(SCENARIO_IDS as readonly string[], x.id).toContain(x.focus.scenario);
      expect(x.focus.preset === undefined || (PRESET_IDS as readonly string[]).includes(x.focus.preset), x.id).toBe(
        true,
      );
      expect(PARTS.find((p) => p.id === x.focus.part)?.scene, x.id).toBe(x.focus.scene);
      used.add(x.focus.scenario!);
    }
    expect(used.size).toBe(7);
  });

  it('go through the simulation’s twelve scenarios, each called by the name the panel gives it, in both languages', () => {
    const fr = LESSONS.flatMap((x) => x.body.map((b) => b.fr)).join(' ');
    const en = LESSONS.flatMap((x) => x.body.map((b) => b.en)).join(' ');
    expect(SCENARIO_IDS.length).toBe(12);
    for (const id of SCENARIO_IDS) {
      const [nameFr, nameEn] = SCENARIO_TEXTS[id].name;
      expect(fr, id).toContain(`« ${nameFr} »`);
      expect(en, id).toContain(`“${nameEn}”`);
    }
  });

  it('run: each scenario starts in the engine', () => {
    const sim = new HouseSim();
    for (const x of LESSONS) expect(() => sim.applyScenario(x.focus.scenario!), x.id).not.toThrow();
  });

  it('keep each paragraph to a few sentences, a title and a summary that say what the lesson holds', () => {
    for (const x of LESSONS) {
      expect(x.body.length, x.id).toBeGreaterThanOrEqual(3);
      expect(x.figures?.length ?? 0, x.id).toBeGreaterThanOrEqual(3);
      expect(x.formula, x.id).toBeDefined();
      for (const lang of ['fr', 'en'] as const) {
        expect(x.title[lang].length, x.id).toBeGreaterThan(8);
        expect(x.summary[lang].length, x.id).toBeGreaterThan(40);
        for (const b of x.body) {
          expect(b[lang].length, `${x.id}: ${b[lang].slice(0, 40)}`).toBeLessThan(900);
          expect(b[lang].length, `${x.id}: ${b[lang].slice(0, 40)}`).toBeGreaterThan(200);
        }
      }
    }
  });

  it('give three choices, a good answer in range and not always in the same place, and an explanation', () => {
    const answers: number[] = [];
    for (const x of LESSONS)
      for (const q of x.quiz!) {
        expect(q.choices.length, q.q.en).toBeGreaterThanOrEqual(3);
        expect(q.answer, q.q.en).toBeGreaterThanOrEqual(0);
        expect(q.answer, q.q.en).toBeLessThan(q.choices.length);
        expect(q.explain.en.length, q.q.en).toBeGreaterThan(60);
        expect(q.explain.fr.length, q.q.fr).toBeGreaterThan(60);
        answers.push(q.answer);
      }
    expect(new Set(answers).size).toBe(3);
  });

  it('the first: the plate’s two ways out, the third sheet brings less, Morse had no store', () => {
    const en = body('the-black-wall', 'en');
    expect(en).toMatch(/the third brings less than the second/);
    expect(en).toMatch(/does not close this gap/);
    expect(en).toMatch(/no store/);
    expect(en).toMatch(/zoologist/);
  });

  it('the second: the wave, too long and too short, the thickness decides the hour, the water is not simulated', () => {
    const en = body('the-slow-wave', 'en');
    expect(en).toMatch(/speed of 4\.03 cm\/h/);
    expect(en).toMatch(/14 to 16 hours/);
    expect(en).toMatch(/too long/);
    expect(en).toMatch(/too short/);
    expect(en).toMatch(/It decides the hour, not what is received/);
    expect(en).toMatch(/The model only knows dry concrete/);
    expect(en).toMatch(/The authors give two reasons/);
    expect(en).toMatch(/does not retrieve the gap/);
    expect(en).not.toMatch(/cast in place|poured/);
    expect(body('the-slow-wave', 'fr')).toMatch(/vitesse de 4,03 cm\/h/);
  });

  it('the third: 478 % is no efficiency, the model finds the phenomenon and not the figure', () => {
    const en = body('christmas-eve', 'en');
    const fr = body('christmas-eve', 'fr');
    expect(en).toMatch(/478\.30 %/);
    expect(fr).toMatch(/478,30 %/);
    expect(en).toMatch(/aberrant/);
    expect(en).toMatch(/the phenomenon is retrieved, the figure is not/);
    expect(en).toMatch(/yesterday’s sun, still in the concrete/);
    expect(en).toMatch(/recharges first/);
  });

  it('the fourth: January over June, from satellites, and where the model’s months are wrong', () => {
    const en = body('low-sun-high-sun', 'en');
    expect(en).toMatch(/1\.65 times† more in the depth of winter/);
    expect(en).toMatch(/from satellites, not from a sensor on this wall/);
    expect(en).toMatch(/too low/);
    expect(en).toMatch(/too high/);
    expect(en).toMatch(/does not trace the paper/);
    expect(en).toMatch(/cools it too far/);
  });

  it('the fifth says it plainly: who says what, the lines of the balance, what it takes to reach 61 %, no verdict', () => {
    const en = body('can-a-house-heat-itself', 'en');
    const fr = body('can-a-house-heat-itself', 'fr');
    expect(en).toMatch(/60 to 70 %/);
    expect(fr).toMatch(/60 à 70 %/);
    expect(en).toMatch(/75 to 90 %/);
    expect(en).toMatch(/Nobody says whether the windows count/);
    expect(en).toMatch(/two estimates/);
    expect(en).toMatch(/5 K warmer/);
    expect(en).toMatch(/may read cold in a valley/);
    expect(en).toMatch(/Neither the wall alone nor the model alone settles it/);
    expect(en).toMatch(/less than a hair dryer/);
  });

  it('the sixth: the night’s reverse flow disagrees with the curves, and the lab keeps it and says so', () => {
    const en = body('the-night', 'en');
    expect(en).toMatch(/The model disagrees with the curves/);
    expect(en).toMatch(/It keeps its result, and says so/);
    expect(en).toMatch(/more extreme than a real house/);
    expect(en).toMatch(/Less heat overall, but later\./);
    expect(en).not.toMatch(/your choice/);
  });

  it('the seventh: the loop brings no air, the pipe is a what-if, nothing measured on a house, the hygiene and the radon once', () => {
    const en = body('fresh-air-and-the-ground', 'en');
    expect(en).toMatch(/renews nothing/);
    expect(en).toMatch(/has reached us/);
    expect(en).toMatch(/could only transcribe roughly/);
    expect(en).toMatch(/radon zone 3, the highest of three/);
    expect(en).toMatch(/checked on Légifrance and Géorisques/);
    const all = LESSONS.flatMap((x) => x.body.map((b) => b.en)).join(' ');
    expect((all.match(/radon/gi) ?? []).length).toBe(2);
    expect((all.match(/zone 3/g) ?? []).length).toBe(1);
  });
});
