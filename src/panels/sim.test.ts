import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { setLang } from '@onigam/lab-kit/i18n';
import type { AppContext } from '@onigam/lab-kit/ui';
import { HouseSim } from '../sim/engine';
import { PRESET_IDS, RANGES, SCENARIO_IDS, SPEEDS } from '../sim/presets';
import { MODEL_NOTE, SHARE_CLAIMS } from '../sim/texts';
import { FACE_HOT, ROOM_COLD, ROOM_HOT } from '../sim/engine';
import type { AlarmKey } from '../sim/types';
import { mainReadouts, moreReadouts, niceCeil3, seasonKey, statusOf, wallProfile } from './model';
import { SimPanel } from './sim';
import { dateText, hourText, num, PANEL_STRINGS, st, STRIP_ALARMS, sx } from './strings';
import { STRIP_SPEEDS, stripAlarms, stripClock, stripValues } from './strip';
import { FakeElement, installFakeDom } from './test-dom';

// The panel rendered on a stand-in for the DOM: that it builds, that it offers every control the sheets and lessons name under the words they use, that a click does what it says, in both languages; and its words.

beforeAll(() => installFakeDom());
afterEach(() => setLang('fr'));

interface Fixture {
  sim: HouseSim;
  panel: SimPanel;
  root: FakeElement;
}

function open(lang: 'fr' | 'en' = 'fr', sim = new HouseSim()): Fixture {
  setLang(lang);
  const ctx = { sim, ui: { scene: 'house' }, gotoScene: () => undefined } as unknown as AppContext<HouseSim>;
  const panel = new SimPanel(ctx);
  panel.render();
  return { sim, panel, root: panel.el as unknown as FakeElement };
}

const button = (root: FakeElement, label: string): FakeElement => {
  const found = root.find('button').find((b) => b.textContent === label || b.attrs.get('aria-label') === label);
  if (!found) throw new Error(`no button « ${label} »`);
  return found;
};
/** The kit's slider, select and toggle wrap their input in a label with these words. */
const control = (root: FakeElement, words: string, tag = 'input'): FakeElement => {
  const found = root.find('label').find((l) => l.textContent.includes(words) && l.find(tag).length > 0);
  if (!found) throw new Error(`no control « ${words} »`);
  return found.find(tag)[0]!;
};
const run = (panel: SimPanel, sim: HouseSim, seconds: number): void => {
  for (let i = 0; i < seconds * 30; i++) {
    sim.step(1 / 30);
    panel.tick(1 / 30);
  }
};

describe('what the panel offers', () => {
  it('opens on the 1967 house with its starting points, a chip per scenario, and no lesson', () => {
    const { root, sim } = open();
    const options = root.find('option');
    expect(options.slice(0, PRESET_IDS.length).map((o) => o.textContent)).toEqual(
      PRESET_IDS.map((id) => sx('preset', id)),
    );
    for (const id of SCENARIO_IDS) expect(button(root, sx('scenario', id))).toBeDefined();
    expect(sim.scenarioNow).toBeNull();
    expect(root.textContent).toContain(st('scenarioHint'));
  });

  it('has every control the sheets and lessons name, under the words they use, in both languages', () => {
    // « Fenêtres au sud », « Déperditions G », « le jour de l’année », « fermez les évents », « position d’été », « le thermostat », « de une à trois vitres », the thickness slider
    for (const lang of ['fr', 'en'] as const) {
      const { root } = open(lang);
      for (const key of ['dayLabel', 'hourLabel', 'modeLabel', 'ventsLabel'] as const) {
        expect(root.textContent, `${lang} ${key}`).toContain(st(key));
      }
      for (const key of [
        'southWindows',
        'G',
        'setpoint',
        'wallThickness',
        'glazingLayers',
        'gap',
        'airOffset',
        'wind',
      ]) {
        expect(root.textContent, `${lang} ${key}`).toContain(sx('param', key));
      }
    }
    setLang('fr');
    expect(sx('param', 'southWindows')).toBe('Fenêtres au sud');
    expect(sx('param', 'G')).toBe('Déperditions G');
  });

  it('says the marks and « this is a model » once, and never a code from the research', () => {
    const { root, sim, panel } = open('en');
    run(panel, sim, 1);
    expect(root.textContent.split(MODEL_NOTE[1]).length).toBe(2);
    for (const [fr, en] of Object.values(PANEL_STRINGS)) expect(fr + en).not.toMatch(/\bK\d+\b|\bS\d{1,2}\b|§/);
  });

  it('shows the live figures, each marked, every one finite once a day has gone by', () => {
    const { root, sim, panel } = open();
    run(panel, sim, 1);
    expect(root.find('.readout').length).toBe(mainReadouts(sim.state).length);
    for (const r of [...mainReadouts(sim.state), ...moreReadouts(sim.state)]) {
      // the followed lag is empty before a whole clear day: the panel writes a dash
      if (r.key !== 'moreLag') expect(Number.isFinite(r.value), r.key).toBe(true);
      expect(['', '†', '*']).toContain(r.mark);
    }
    expect(num(Number.NaN)).toBe('—');
  });

  it('says yesterday’s efficiency, with its word of caution, once a whole day has gone by', () => {
    const { root, sim, panel } = open('en');
    expect(root.textContent).not.toContain(st('liveEffNote'));
    sim.applyScenario('christmas-1974');
    run(panel, sim, 52);
    expect(root.textContent).toContain(st('liveEffNote'));
    expect(root.textContent).toContain(st('liveEff'));
  });

  it('draws five charts and the season’s button, who says what, and the places the model does not retrieve the source', () => {
    const { root } = open('en');
    expect(root.find('canvas').length).toBe(5);
    expect(button(root, st('seasonRun'))).toBeDefined();
    for (const c of SHARE_CLAIMS) expect(root.textContent).toContain(c.who[1]);
    for (const key of ['limitFlow', 'limitSplit', 'limitChristmas', 'limitShare'] as const)
      expect(root.textContent).toContain(st(key));
  });

  it('builds in both languages, every word in both', () => {
    for (const [key, [fr, en]] of Object.entries(PANEL_STRINGS)) {
      expect(fr.trim().length, key).toBeGreaterThan(0);
      expect(en.trim().length, key).toBeGreaterThan(0);
    }
    for (const lang of ['fr', 'en'] as const) {
      const { sim, panel } = open(lang);
      run(panel, sim, 0.5);
    }
  });
});

describe('what the controls do', () => {
  it('a scenario chip starts it and says its lesson, and the lesson stays while the visitor tries things', () => {
    const { root, sim } = open('en');
    button(root, sx('scenario', 'the-night')).click();
    expect(sim.scenarioNow).toBe('the-night');
    expect(root.textContent).toContain(sx('lesson', 'the-night'));
    const sheets = control(root, sx('param', 'glazingLayers'));
    sheets.value = '3';
    sheets.dispatch('input', { target: sheets });
    expect(sim.params.glazingLayers).toBe(3);
    expect(root.textContent).toContain(sx('lesson', 'the-night'));
  });

  it('a starting point takes the lesson away', () => {
    const { root, sim } = open('en');
    button(root, sx('scenario', 'the-night')).click();
    const select = root.find('select')[0]!;
    select.value = 'building-1974';
    select.dispatch('change', { target: select });
    expect(sim.params.preset).toBe('building-1974');
    expect(sim.params.wallThickness).toBeCloseTo(0.37, 9);
    expect(sim.scenarioNow).toBeNull();
    expect(root.textContent).not.toContain(sx('lesson', 'the-night'));
  });

  it('follows a scenario started from outside, as a lesson does', () => {
    const { root, sim, panel } = open('en');
    sim.applyScenario('christmas-1974');
    run(panel, sim, 0.5);
    expect(root.textContent).toContain(sx('lesson', 'christmas-1974'));
  });

  it('moves the 3D’s sliders through the simulation, clamped to their range', () => {
    const { root, sim } = open('fr');
    const t = control(root, sx('param', 'wallThickness'));
    t.value = '0.45';
    t.dispatch('input', { target: t });
    expect(sim.params.wallThickness).toBeCloseTo(0.45, 9);
    const day = control(root, st('dayLabel'));
    day.value = '172';
    day.dispatch('input', { target: day });
    expect(sim.state.dayOfYear).toBe(172);
    expect(sim.params.preset).toBe('custom');
  });

  it('the selects and switches reach the model: the flap, the vents, the night screens, the earth tube', () => {
    const { root, sim } = open('en');
    const flap = control(root, st('modeLabel'), 'select');
    flap.value = 'summer';
    flap.dispatch('change', { target: flap });
    expect(sim.params.mode).toBe('summer');
    const vents = control(root, st('ventsLabel'), 'select');
    vents.value = 'closed';
    vents.dispatch('change', { target: vents });
    expect(sim.params.vents).toBe('closed');
    for (const [label, key] of [
      [st('nightLabel'), 'nightShutter'],
      [st('earthTubeLabel'), 'earthTube'],
    ] as const) {
      const box = control(root, label);
      box.checked = true;
      box.dispatch('change', { target: box });
      expect(sim.params[key], key).toBe(true);
    }
  });

  it('shows the record’s choice only with a recorded sky, and the 3D’s note away from Odeillo', () => {
    const { root, sim, panel } = open('en');
    expect(root.textContent).not.toContain(st('siteHint'));
    expect(root.textContent).not.toContain(st('recordLabel'));
    sim.set({ site: 'chauvency', sky: 'recorded' });
    // the controls follow the model, and a set from outside redraws the extras on the next set from the panel
    const sky = control(root, st('skyLabel'), 'select');
    sky.value = 'recorded';
    sky.dispatch('change', { target: sky });
    run(panel, sim, 0.5);
    expect(root.textContent).toContain(st('siteHint'));
    expect(root.textContent).toContain(st('recordLabel'));
  });

  it('runs the season on the visitor’s settings and says when they have changed', async () => {
    const { root, sim } = open('en');
    sim.ladder();
    button(root, st('seasonRun')).click();
    await new Promise((r) => setTimeout(r, 400));
    const text = root.textContent;
    expect(text).toContain(st('rungWall'));
    expect(text).toContain(st('claimsOurs'));
    const share = sim.ladder().all.share;
    expect(text).toContain(`${num(share, 1)}\u00a0%\u00a0†`);
    // the physics' own figures: 32, 42.5, 47 % (docs/physics.md §5)
    expect(sim.ladder().wallOnly.share).toBeGreaterThan(30);
    expect(sim.ladder().wallOnly.share).toBeLessThan(34);
    expect(share).toBeGreaterThan(46);
    expect(share).toBeLessThan(48.5);
    const g = control(root, sx('param', 'G'));
    g.value = '1.2';
    g.dispatch('input', { target: g });
    expect(root.textContent).toContain(st('seasonStale'));
  });

  it('the clock’s sliders follow the clock', () => {
    const { root, sim, panel } = open('en');
    const hour = control(root, st('hourLabel'));
    const before = Number(hour.value);
    run(panel, sim, 2);
    expect(Number(hour.value)).not.toBe(before);
    // the controls follow five times a second: at an hour a second, the slider is at most a fifth of an hour behind
    expect(Math.abs(Number(hour.value) - sim.params.hour)).toBeLessThan(0.25);
  });
});

describe('what the model puts on the panel', () => {
  it('says the alarms first, the current otherwise', () => {
    const { sim } = open();
    sim.set({ vents: 'closed', mode: 'winter', day: 195, hour: 14, sky: 'clear' });
    for (let i = 0; i < 400; i++) sim.step(0.25);
    const status = statusOf(sim.state);
    if ('alarms' in status) expect(status.alarms.every((a: { key: AlarmKey }) => typeof a.key === 'string')).toBe(true);
    else expect(['statusUp', 'statusSummer', 'statusQuiet']).toContain(status.key);
    const quiet = new HouseSim();
    quiet.set({ running: false });
    quiet.state.alarms.length = 0;
    (quiet.state as { flowDir: number }).flowDir = 0;
    expect(statusOf(quiet.state)).toEqual({ key: 'statusQuiet' });
    (quiet.state as { flowDir: number }).flowDir = 1;
    expect(statusOf(quiet.state)).toEqual({ key: 'statusUp' });
  });

  it('draws the wall from the black face to the room face, whatever its thickness', () => {
    const sim = new HouseSim();
    for (const cm of [60, 37, 15]) {
      sim.set({ wallThickness: cm / 100 });
      const p = wallProfile(sim.state);
      expect(p.xs.length).toBe(sim.state.layers.length + 2);
      expect(p.xs[0]).toBe(0);
      expect(p.xs.at(-1)).toBeCloseTo(cm / 100, 9);
      expect(p.ys[0]).toBe(sim.state.tOuterFace);
      expect(p.ys.at(-1)).toBe(sim.state.tInnerFace);
      for (let i = 1; i < p.xs.length; i++) expect(p.xs[i]!).toBeGreaterThanOrEqual(p.xs[i - 1]!);
    }
  });

  it('rounds a chart’s top to a round number, and keys the season by what it depends on', () => {
    expect(niceCeil3(0)).toBe(3);
    expect(niceCeil3(7)).toBeGreaterThanOrEqual(7);
    expect(niceCeil3(940)).toBe(1500);
    const a = new HouseSim();
    const b = new HouseSim();
    b.set({ hour: 3, timeScale: 60 });
    expect(seasonKey(a.params)).toBe(seasonKey(b.params));
    b.set({ G: 1.2 });
    expect(seasonKey(a.params)).not.toBe(seasonKey(b.params));
  });

  it('writes a date and an hour in the language of the moment', () => {
    setLang('fr');
    expect(dateText(15)).toBe('15 janv.');
    expect(dateText(355)).toBe('21 déc.');
    setLang('en');
    expect(dateText(172)).toBe('21 Jun');
    expect(hourText(8.25)).toBe('08:15');
    expect(hourText(24)).toBe('00:00');
  });
});

describe('the bottom strip', () => {
  it('says each alarm in a pill-sized phrase, with the thresholds of the engine, and the whole sentence stays in the panel', () => {
    for (const [key, [fr, en]] of Object.entries(STRIP_ALARMS)) {
      expect(fr.length, key).toBeLessThanOrEqual(22);
      expect(en.length, key).toBeLessThanOrEqual(22);
    }
    expect(STRIP_ALARMS.roomHot[1]).toContain(String(ROOM_HOT));
    expect(STRIP_ALARMS.roomCold[1]).toContain(String(ROOM_COLD));
    expect(STRIP_ALARMS.faceHot[1]).toContain(String(FACE_HOT));
    expect(Object.keys(STRIP_ALARMS).sort()).toEqual([
      'faceHot',
      'reverseFlow',
      'roomCold',
      'roomHot',
      'wallTakesHeat',
      'wrongSeason',
    ]);
  });

  it('shows the model’s six figures, each marked †, and the clock in both languages', () => {
    const sim = new HouseSim();
    setLang('en');
    const values = stripValues(sim);
    expect(values).toHaveLength(6);
    for (const v of values) {
      expect(v.unit.endsWith('†'), v.label).toBe(true);
      expect(v.label.length).toBeGreaterThan(2);
    }
    expect(stripClock(sim).sub).toBe('15 Jan, solar time');
    setLang('fr');
    expect(stripClock(sim).sub).toBe('15 janv., h solaire');
    expect(stripValues(sim)[0]!.label).toBe('Soleil sur le mur');
  });

  it('offers the speeds of the model, the opening one among them', () => {
    expect(STRIP_SPEEDS).toEqual(SPEEDS);
    expect(STRIP_SPEEDS).toContain(3600);
    const sim = new HouseSim();
    sim.set({ vents: 'closed', mode: 'winter', day: 195, hour: 14, sky: 'clear', G: RANGES.G.min });
    for (let i = 0; i < 480; i++) sim.step(0.25);
    for (const lang of ['fr', 'en'] as const) {
      setLang(lang);
      for (const a of stripAlarms(sim)) expect(a.label.length).toBeGreaterThan(10);
    }
  });
});
