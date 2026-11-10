import { describe, expect, it } from 'vitest';
import { LAB_CUE_NAMES, planCue, runCue } from './cues';
import { HouseSim } from './sim/engine';
import { PRESET_IDS, RANGES, SCENARIO_IDS } from './sim/presets';

// The lab's cues of the spoken guide (src/cues.ts): each one does what its script line says, idempotently, and an unknown or out-of-range one does nothing.

/** A good argument for each name, for the test of the list. */
const SAMPLE: Record<(typeof LAB_CUE_NAMES)[number], string | undefined> = {
  scenario: 'the-night',
  preset: 'building-1974',
  day: '355',
  hour: '12',
  speed: '3600',
  pause: undefined,
  play: undefined,
  thickness: '45',
  sheets: '1',
  flap: 'summer',
  vents: 'closed',
  setpoint: '18',
  earthtube: 'on',
  reset: undefined,
};

describe('the cues of the spoken guide', () => {
  it('knows every name it lists, and nothing else', () => {
    for (const name of LAB_CUE_NAMES) expect(planCue(name, SAMPLE[name]), name).not.toBeNull();
    expect(planCue('flywheel', '1')).toBeNull();
    expect(planCue('', undefined)).toBeNull();
  });

  it('runs every scenario and every starting point by its id', () => {
    for (const id of SCENARIO_IDS) {
      const sim = new HouseSim();
      expect(runCue(sim, 'scenario', id)).toBe(true);
      expect(sim.scenarioNow).toBe(id);
    }
    for (const id of PRESET_IDS) {
      const sim = new HouseSim();
      sim.applyScenario('the-night');
      expect(runCue(sim, 'preset', id)).toBe(true);
      expect(sim.params.preset).toBe(id);
      expect(sim.scenarioNow).toBeNull();
    }
    expect(runCue(new HouseSim(), 'scenario', 'no-such-scenario')).toBe(false);
    expect(runCue(new HouseSim(), 'preset', 'no-such-preset')).toBe(false);
  });

  it('moves the clock, the wall and the house as the script line says', () => {
    const sim = new HouseSim();
    runCue(sim, 'day', '355');
    runCue(sim, 'hour', '12');
    expect(sim.params.day).toBe(355);
    expect(sim.state.dayOfYear).toBe(355);
    expect(sim.state.hour).toBeCloseTo(12, 6);
    runCue(sim, 'thickness', '45');
    expect(sim.params.wallThickness).toBeCloseTo(0.45, 9);
    runCue(sim, 'sheets', '1');
    expect(sim.params.glazingLayers).toBe(1);
    runCue(sim, 'flap', 'summer');
    expect(sim.params.mode).toBe('summer');
    runCue(sim, 'vents', 'one-way');
    expect(sim.params.vents).toBe('one-way');
    runCue(sim, 'setpoint', '18');
    expect(sim.params.setpoint).toBe(18);
    runCue(sim, 'earthtube', 'on');
    expect(sim.params.earthTube).toBe(true);
    runCue(sim, 'earthtube', 'off');
    expect(sim.params.earthTube).toBe(false);
  });

  it('starts, stops and speeds the clock', () => {
    const sim = new HouseSim();
    runCue(sim, 'pause');
    expect(sim.params.running).toBe(false);
    runCue(sim, 'speed', '86400');
    expect(sim.params.timeScale).toBe(86400);
    expect(sim.params.running).toBe(true);
    runCue(sim, 'pause');
    runCue(sim, 'play');
    expect(sim.params.running).toBe(true);
  });

  it('starts again from the last scenario', () => {
    const sim = new HouseSim();
    runCue(sim, 'scenario', 'the-night');
    runCue(sim, 'flap', 'summer');
    runCue(sim, 'reset');
    expect(sim.scenarioNow).toBe('the-night');
    expect(sim.params.mode).toBe('winter');
  });

  it('refuses what is out of range or not a word of the model, and changes nothing', () => {
    const sim = new HouseSim();
    const before = JSON.stringify(sim.params);
    for (const [name, arg] of [
      ['day', '0'],
      ['day', '366'],
      ['day', 'noon'],
      ['hour', '25'],
      ['speed', '0'],
      ['speed', '1e9'],
      ['thickness', '5'],
      ['thickness', '200'],
      ['sheets', '4'],
      ['setpoint', '30'],
      ['flap', 'autumn'],
      ['vents', 'ajar'],
      ['earthtube', 'maybe'],
      ['day', undefined],
      ['hour', ''],
    ] as const) {
      expect(runCue(sim, name, arg), `${name}:${arg}`).toBe(false);
    }
    expect(JSON.stringify(sim.params)).toBe(before);
  });

  it('is idempotent: the kit replays the last cue of each name after a seek', () => {
    const a = new HouseSim();
    const b = new HouseSim();
    runCue(a, 'scenario', 'one-glass');
    runCue(b, 'scenario', 'one-glass');
    runCue(b, 'scenario', 'one-glass');
    expect(JSON.stringify(a.params)).toBe(JSON.stringify(b.params));
    runCue(a, 'sheets', '3');
    runCue(a, 'sheets', '3');
    expect(a.params.glazingLayers).toBe(3);
  });

  it('keeps its bounds with the sliders', () => {
    expect(RANGES.day.max).toBe(365);
    expect(RANGES.hour.max).toBe(24);
  });
});
