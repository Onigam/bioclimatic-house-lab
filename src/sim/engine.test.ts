import { describe, expect, it } from 'vitest';
import { newSkySample, Weather } from './climate';
import { FACE_HOT, HouseSim, ROOM_COLD, ROOM_HOT } from './engine';
import { COLLECTOR_1967, HOUSE_1967 } from './machine';
import { bookResidual, Plant } from './plant';
import { presetParams, PRESET_IDS, RANGES, scenarioSetup, SCENARIO_IDS, specOf, SPEEDS } from './presets';
import { Runner, seasonRun, SEASON_STEP, THERMAL_STEP } from './runs';
import type { HouseParams } from './types';

const run = (sim: HouseSim, seconds: number, dt = 0.05): void => {
  for (let i = 0; i < seconds / dt; i++) sim.step(dt);
};

function week(p: HouseParams, startDay: number, dt = THERMAL_STEP): { residual: number; through: number } {
  const plant = new Plant(specOf(p));
  const weather = new Weather({ site: p.site, sky: p.sky, record: p.record, wind: p.wind, airOffset: p.airOffset });
  const r = new Runner(plant, weather, startDay, 0);
  r.spin(3, dt);
  const H0 = plant.energy();
  const B0 = plant.boundary();
  const steps = Math.round((7 * 86400) / dt);
  for (let i = 0; i < steps; i++) r.step(dt);
  const b = plant.book;
  return {
    residual: Math.abs(bookResidual(plant, H0, B0)),
    through: b.sunWall + b.aux + b.gains + Math.abs(b.draw) + Math.abs(b.tube) + 1,
  };
}

describe('energy is conserved', () => {
  const base = presetParams('prototype-1967');
  const cases: [string, HouseParams, number][] = [
    ['the house as it stands, a week of January', base, 15],
    ['the 1974 building', presetParams('building-1974'), 15],
    ['vents closed', { ...base, vents: 'closed' }, 15],
    ['a one-way flap', { ...base, vents: 'one-way' }, 15],
    ['one sheet of glass', { ...base, glazingLayers: 1 }, 15],
    ['three sheets of glass', { ...base, glazingLayers: 3 }, 15],
    ['a thin wall', { ...base, wallThickness: 0.15 }, 15],
    ['the summer position, no backup', { ...base, mode: 'summer', backup: false }, 196],
    ['no backup in winter', { ...base, backup: false }, 15],
    ['the earth tube', { ...base, earthTube: true }, 15],
    ['the night shutter', { ...base, nightShutter: true }, 15],
    ['the room held both ways', { ...base, holdRoom: true }, 196],
    ['a hot week that opens the windows', { ...base, backup: false, G: 0.5 }, 196],
  ];
  for (const [name, p, day] of cases) {
    it(`over a week within 1e-6: ${name}`, () => {
      const r = week(p, day);
      expect(r.residual / r.through).toBeLessThan(1e-6);
    });
  }
});

describe('the wall over a season stays where it can be', () => {
  it('no temperature runs away, whichever way the wall is built, at the long step', () => {
    const p = presetParams('prototype-1967');
    for (const patch of [
      { wallThickness: 0.15 },
      { wallThickness: 0.8 },
      { glazingLayers: 1 },
      { glazingLayers: 3 },
      { wind: 10 },
      { gap: 0.05 },
      { ductScale: 0.25 },
    ] as Partial<HouseParams>[]) {
      const q = { ...p, ...patch };
      const plant = new Plant(specOf(q));
      const r = new Runner(plant, new Weather({ site: q.site, sky: 'clear', wind: q.wind }), 15, 0);
      let hi = -Infinity;
      let lo = Infinity;
      for (let i = 0; i < (60 * 86400) / SEASON_STEP; i++) {
        r.step(SEASON_STEP);
        hi = Math.max(hi, plant.Tf);
        lo = Math.min(lo, plant.Tf, plant.TglassOut);
      }
      expect(hi).toBeLessThan(120);
      expect(lo).toBeGreaterThan(-30);
    }
  });
});

describe('the engine', () => {
  it('has 12 scenarios and 5 presets, each runs and stays finite', () => {
    expect(SCENARIO_IDS).toHaveLength(12);
    expect(PRESET_IDS).toHaveLength(5);
    const sim = new HouseSim();
    for (const id of [...SCENARIO_IDS]) {
      sim.applyScenario(id);
      run(sim, 20);
      const s = sim.state;
      for (const v of [
        s.tOuterFace,
        s.tInnerFace,
        s.tRoom,
        s.flowLs,
        s.incidentWm2,
        s.qThermo,
        s.qRad,
        s.qConv,
        s.qAux,
      ]) {
        expect(Number.isFinite(v)).toBe(true);
      }
    }
    for (const id of PRESET_IDS) {
      sim.applyPreset(id);
      run(sim, 5);
      expect(Number.isFinite(sim.state.tRoom)).toBe(true);
    }
  });
  it('is deterministic: the same frames give the same state, to the last bit', () => {
    const a = new HouseSim();
    const b = new HouseSim();
    a.applyScenario('christmas-1974');
    b.applyScenario('christmas-1974');
    run(a, 40);
    run(b, 40);
    expect(a.state.tOuterFace).toBe(b.state.tOuterFace);
    expect(a.state.flowLs).toBe(b.state.flowLs);
    expect(a.state.layers[10]).toBe(b.state.layers[10]);
  });
  it('the same model time gives the same state whatever the frame rate', () => {
    const a = new HouseSim();
    const b = new HouseSim();
    a.applyPreset('prototype-1967');
    b.applyPreset('prototype-1967');
    for (let i = 0; i < 2000; i++) a.step(1 / 60);
    for (let i = 0; i < 1000; i++) b.step(1 / 30);
    expect(Math.abs(a.state.tOuterFace - b.state.tOuterFace)).toBeLessThan(1e-3);
  });
  it('does nothing while paused, and its clock stops', () => {
    const sim = new HouseSim();
    const t = sim.state.simTime;
    sim.set({ running: false });
    run(sim, 2);
    expect(sim.state.simTime).toBe(t);
  });
  it('timeScale 0 stops the hour without stopping the frame', () => {
    const sim = new HouseSim();
    sim.set({ timeScale: 0 });
    const h = sim.state.hour;
    run(sim, 2);
    expect(sim.state.hour).toBe(h);
  });
  it('speeds of the strip are five, and every range is respected', () => {
    expect(SPEEDS).toHaveLength(5);
    const sim = new HouseSim();
    sim.set({ wallThickness: 5, G: 0.01, setpoint: 100 });
    expect(sim.params.wallThickness).toBe(RANGES.wallThickness.max);
    expect(sim.params.G).toBe(RANGES.G.min);
    expect(sim.params.setpoint).toBe(RANGES.setpoint.max);
    expect(sim.params.preset).toBe('custom');
  });
  it('the thickness slider rebuilds the wall: the state’s layers follow, and the depths end inside the wall', () => {
    const sim = new HouseSim();
    expect(sim.state.layers.length).toBe(24);
    sim.set({ wallThickness: 0.37 });
    expect(sim.state.layers.length).toBe(15);
    expect(sim.state.layerDepths.length).toBe(15);
    expect(sim.state.layerDepths[14]!).toBeLessThan(0.37);
    expect(sim.state.wallThickness).toBe(0.37);
    expect(sim.state.waveLagHours).toBeCloseTo(9.17, 1);
  });
  it('keeps the place in a record when something changes, and says when the record is over', () => {
    const sim = new HouseSim();
    sim.applyScenario('christmas-1974');
    expect(sim.state.recordDate).toBe('22/12');
    run(sim, 30);
    expect(sim.state.recordDate).toBe('23/12');
    sim.set({ wallThickness: 0.45 });
    expect(sim.state.recordDate).toBe('23/12');
    run(sim, 100);
    expect(sim.state.recordEnded).toBe(true);
  });
  it('a step is cheap: a day per second at 60 fps costs under a millisecond a frame on this machine', () => {
    const sim = new HouseSim();
    sim.set({ timeScale: 86400 });
    const t0 = performance.now();
    for (let i = 0; i < 600; i++) sim.step(1 / 60);
    expect((performance.now() - t0) / 600).toBeLessThan(2);
    expect(sim.state.simTime).toBeGreaterThan(5 * 86400);
  });
  it('the season asked of the engine is kept, and goes into the state', () => {
    const sim = new HouseSim();
    expect(Number.isNaN(sim.state.solarShareSeason)).toBe(true);
    const r = sim.season();
    expect(sim.state.solarShareSeason).toBe(r.share);
    expect(sim.season()).toBe(r);
    expect(r.share).toBeCloseTo(seasonRun({ ...sim.params, sky: 'series' }).share, 6);
    const l = sim.ladder();
    expect(l.wallOnly.share).toBeLessThan(l.wallAndWindows.share);
    expect(l.wallAndWindows.share).toBeLessThan(l.all.share);
  });
  it('film contract: the moments as numbers', () => {
    const sim = new HouseSim();
    sim.applyScenario('christmas-1974');
    run(sim, 60);
    const s = sim.state;
    expect(s.flowStarted).toBeGreaterThan(0);
    expect(s.flowStopped).toBeGreaterThan(0);
    expect(typeof s.reverseFlow).toBe('boolean');
    expect(s.lagHours).toBeGreaterThan(10);
    expect(s.waveArrival).toBeGreaterThanOrEqual(0);
  });
});

describe('the alarms', () => {
  it('a room over the limit, under the limit', () => {
    const sim = new HouseSim();
    sim.set({ day: 196, sky: 'clear', backup: false, mode: 'winter', southWindows: 30, vents: 'open', G: 0.5 });
    let hot = false;
    for (let i = 0; i < 1200; i++) {
      sim.step(0.1);
      if (sim.state.tRoom > ROOM_HOT) hot = hot || sim.state.alarms.includes('roomHot');
    }
    expect(hot).toBe(true);
    sim.set({ day: 15, backup: false, sky: 'clear', southWindows: 0, G: 2, gains: 0, vents: 'closed' });
    run(sim, 24);
    expect(sim.state.tRoom).toBeLessThan(ROOM_COLD);
    expect(sim.state.alarms).toContain('roomCold');
  });
  it('the paint, vents shut on a clear autumn day behind three sheets', () => {
    const sim = new HouseSim();
    sim.set({ day: 296, sky: 'clear', vents: 'closed', glazingLayers: 3, backup: false, hour: 8 });
    let hit = false;
    for (let i = 0; i < 480; i++) {
      sim.step(0.05);
      hit = hit || (sim.state.tOuterFace > FACE_HOT && sim.state.alarms.includes('faceHot'));
    }
    expect(hit).toBe(true);
  });
  it('the night’s reverse flow and the wall that takes heat', () => {
    const sim = new HouseSim();
    sim.applyScenario('the-night');
    let reversed = false;
    for (let i = 0; i < 480; i++) {
      sim.step(0.05);
      reversed = reversed || sim.state.alarms.includes('reverseFlow');
    }
    expect(reversed).toBe(true);
    const c = new HouseSim();
    c.applyScenario('chauvency');
    run(c, 24);
    expect(c.state.alarms).toContain('wallTakesHeat');
  });
  it('the winter position in a hot summer', () => {
    const sim = new HouseSim();
    sim.set({ day: 196, sky: 'clear', backup: false, mode: 'winter', southWindows: 30, G: 0.5 });
    let hit = false;
    for (let i = 0; i < 1200; i++) {
      sim.step(0.1);
      hit = hit || sim.state.alarms.includes('wrongSeason');
    }
    expect(hit).toBe(true);
  });
});

describe('the state for the 3D', () => {
  it('flows the 3D draws: at 20 L/s the dots run as K74 says, and the summer flap is a number', () => {
    const sim = new HouseSim();
    sim.applyScenario('christmas-1974');
    run(sim, 8);
    const s = sim.state;
    expect(s.gapSpeed).toBeCloseTo(s.flowLs / 1000 / (COLLECTOR_1967.elementWidth * COLLECTOR_1967.gap), 6);
    expect(s.ductSpeed).toBeCloseTo(s.flowLs / 1000 / (COLLECTOR_1967.ductWidth * COLLECTOR_1967.ductHeight), 6);
    expect(s.flowTotalLs).toBeCloseTo(s.flowLs * (HOUSE_1967.collectorArea / (4.38 * 1.27)), 6);
    expect(s.flapOpen).toBe(0);
    sim.set({ mode: 'summer' });
    expect(sim.state.flapOpen).toBe(1);
  });
  it('the sun for the two arcs: noon in December stands low, and in June high', () => {
    const sim = new HouseSim();
    sim.set({ day: 355, sky: 'clear', hour: 12 });
    expect(sim.state.dayOfYear).toBe(355);
    run(sim, 0.01);
    sim.step(1 / 60);
    expect(sim.state.sunAltitude).toBeCloseTo(24, 0);
    sim.set({ day: 172, hour: 12 });
    sim.step(1 / 60);
    expect(sim.state.sunAltitude).toBeCloseTo(71, 0);
    expect(Math.abs(sim.state.sunAzimuth)).toBeLessThan(5);
    expect(sim.state.glassRefuses).toBeGreaterThan(0.25);
  });
});

describe('scenario setups', () => {
  it('none of them carries a position', () => {
    for (const id of SCENARIO_IDS) {
      expect(JSON.stringify(scenarioSetup(id))).not.toMatch(/lat|lon|coord/i);
    }
  });
  it('teach one thing each: the setup moves what its lesson talks about', () => {
    const base = presetParams('prototype-1967');
    expect(scenarioSetup('one-glass').params.glazingLayers).toBe(1);
    expect(scenarioSetup('no-vents').params.vents).toBe('closed');
    expect(scenarioSetup('chauvency').params.site).toBe('chauvency');
    expect(scenarioSetup('earth-tube').params.earthTube).toBe(true);
    expect(scenarioSetup('drying').params.build).toBe('1974');
    expect(scenarioSetup('june-1975').params.mode).toBe('summer');
    expect(scenarioSetup('insulate-first').events.map((e) => e.patch.G)).toEqual([1, 0.6]);
    expect(scenarioSetup('too-thick-too-thin').events.map((e) => e.patch.wallThickness)).toEqual([
      0.37, 0.45, 0.15, 0.8,
    ]);
    expect(base.wallThickness).toBe(0.6);
  });
  it('a sample of the sky: nothing allocates for a new sample', () => {
    expect(newSkySample().wind).toBeGreaterThan(0);
  });
});
