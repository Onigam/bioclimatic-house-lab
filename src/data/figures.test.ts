import { describe, expect, it } from 'vitest';
import { MONTH_EFF_EYE, MONTH_EFF_MODEL } from '../drawings/model-tables';
import { SITES } from '../sim/climate';
import { tubeYear } from '../sim/earth-tube';
import { HouseSim } from '../sim/engine';
import {
  COLLECTOR_1967,
  ductArea,
  elementArea,
  elementCount,
  ESTIMATE,
  gapArea,
  HOUSE_1967,
  ODEILLO,
  WALL_MATERIALS,
} from '../sim/machine';
import { presetParams, SCENARIO_IDS } from '../sim/presets';
import { darkRun, nightRun, replay, seasonRun, shareLadder, totals } from '../sim/runs';
import { declination } from '../sim/solar';
import { SCENARIO_TEXTS } from '../sim/texts';
import {
  penetrationDepth,
  thicknessForLag,
  waveDamping,
  waveLagHours,
  waveSpeed,
  wallCapacity,
  wallMass,
} from '../sim/wave';
import { STAIR_STEPS } from '../three/dims';
import { FIG, type FigName } from './figures';
import { PARTS } from './parts';
import { numbersIn } from './texts';

// Each figure the texts print, against its source: the arithmetic of docs/research.md redone, the model run. A failure here means a sheet says something the model no longer does. The simulation's own tests hold the pins; these hold the words.
// A figure that the model finds and that is cheap to recompute is recomputed; the others are held to the lines of docs/physics.md that print them.

const docs = import.meta.glob('../../docs/physics.md', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const PHYSICS = Object.values(docs)[0] ?? '';
const simTests = import.meta.glob('../sim/figures.test.ts', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const SIM_TEST = Object.values(simTests)[0] ?? '';

const close = (name: FigName, value: number, tol?: number): void => {
  const f = FIG[name];
  const t = tol ?? 0.5 * 10 ** -f.d + 1e-9;
  expect(Math.abs(f.v - value), `${name}: ${f.v} against ${value}`).toBeLessThanOrEqual(t);
};
const inDoc = (...pieces: string[]): void => {
  for (const p of pieces) expect(PHYSICS, p).toContain(p);
};

const concrete = WALL_MATERIALS.concrete;
const p67 = presetParams('prototype-1967');

describe('arithmetic on reported figures (derived)', () => {
  it('the element and its air', () => {
    close('elemArea', elementArea(COLLECTOR_1967));
    close('elemCount', elementCount(COLLECTOR_1967, HOUSE_1967));
    close('exchangeCalc', COLLECTOR_1967.elementWidth * COLLECTOR_1967.ductSpan, 0.006);
    close('gapSection', gapArea(COLLECTOR_1967) * 1e4, 0.5);
    close('ductsOverGap', (100 * ductArea(COLLECTOR_1967)) / gapArea(COLLECTOR_1967));
    close('gapSpeed', (0.02 / gapArea(COLLECTOR_1967)) * 100);
    close('ductSpeed', (0.02 / ductArea(COLLECTOR_1967)) * 100);
    const [lo, hi] = numbersIn(FIG.centreRange.t![0], 'fr');
    expect(Math.abs(lo! - (0.02 / ductArea(COLLECTOR_1967) / 0.7) * 100)).toBeLessThan(1);
    expect(Math.abs(hi! - (0.02 / ductArea(COLLECTOR_1967) / 0.5) * 100)).toBeLessThan(1);
    close('elemWatts', 0.02 * 1 * 1007 * 26, 5);
    close('frontKw', (0.02 * 1007 * 26 * elementCount(COLLECTOR_1967, HOUSE_1967)) / 1000, 0.06);
    close('frontFlow', elementCount(COLLECTOR_1967, HOUSE_1967) * 20 * 3.6, 2);
    close('summerRecorded', (elementCount(COLLECTOR_1967, HOUSE_1967) * 20 * 3.6) / HOUSE_1967.volume, 0.5);
  });
  it('the mass and the wave', () => {
    close('massT', wallMass(48, 0.6, concrete) / 1000);
    close('capMj', wallCapacity(48, 0.6, concrete) / 1e6);
    close('capKwh', wallCapacity(48, 0.6, concrete) / 3.6e6);
    close('tPerM2', wallMass(48, 0.6, concrete) / 48 / 1000, 0.005);
    close('waveSpeed', waveSpeed(concrete) * 360000, 0.005);
    close('waveDepth', penetrationDepth(concrete) * 100);
    close('lag60', waveLagHours(0.6, concrete), 0.05);
    close('lag37', waveLagHours(0.37, concrete), 0.05);
    close('lag45', waveLagHours(0.45, concrete), 0.05);
    close('damp60', waveDamping(0.6, concrete) * 100);
    close('damp45', waveDamping(0.45, concrete) * 100);
    close('thick12', thicknessForLag(12, concrete) * 100);
    close('ringRatio', (100 * ESTIMATE.roomMass) / wallCapacity(48, 0.6, concrete));
  });
  it('the house, the sun and the year', () => {
    close('gv', HOUSE_1967.G * HOUSE_1967.volume);
    close('envelope', (HOUSE_1967.G * HOUSE_1967.volume) / HOUSE_1967.K);
    close('boxM2', 2 * (15 * 6.6 + 15 * 4 + 6.6 * 4), 10);
    close('meanHeight', HOUSE_1967.volume / HOUSE_1967.floorArea);
    close('pitch', (Math.atan(1.45 / 3.3) * 180) / Math.PI);
    close('janJun', SITES.odeillo.vertical[0]! / SITES.odeillo.vertical[5]!, 0.005);
    close('roofRatio', SITES.odeillo.horizontal[5]! / SITES.odeillo.horizontal[0]!, 0.05);
    close('decRoof', SITES.odeillo.vertical[11]! / SITES.odeillo.horizontal[11]!, 0.005);
    const incidence = (day: number) => 90 - (ODEILLO.latitude - declination(day));
    close('sunDec', incidence(355), 0.5);
    close('sunJun', incidence(172), 0.5);
    close('helioArea', 2835 / 63);
    close('streamSource', ((3968 + 1741) * 1000) / 86400, 0.5);
    close('handConduction', (1.75 / 0.6) * (37 - 26.5), 0.5);
    close('directGainK', (38 * 5) / 9);
    close('ventsK', (26 * 5) / 9);
    close('noVentsK', (9 * 5) / 9);
    close('hairDryer', 7.4 * 156, 1);
  });
  it('the dims.ts figures are read, never typed', () => {
    // the 3D's own sizes come through dims.ts: a figure of this file that is a size has the status of an estimate
    for (const name of [
      'bays',
      'facadeLen',
      'glassNet',
      'wallT',
      'ridge',
      'groundFall',
      'slab',
      'rafter',
      'heaterBox',
      'tubeLength',
    ] as FigName[])
      expect(FIG[name].s, name).toBe('estimate');
    close('glassNet', 47.1, 0.1);
    close('interior', 81, 1);
  });
});

describe('the model: the season’s share, line by line (docs/physics.md §5)', () => {
  const season = (patch: Record<string, unknown> = {}, opt = {}) => seasonRun({ ...p67, ...patch }, opt);
  it('the ladder and the lines of the balance', () => {
    const l = shareLadder(p67);
    close('shareWall', l.wallOnly.share);
    close('shareWindows', l.wallAndWindows.share, 0.06);
    close('shareAll', l.all.share, 0.06);
    close('shareWallAir', l.all.wallAirShare);
    close('shareWallConduction', l.all.wallConductionShare);
    close('shareWindowLine', l.all.windowShare);
    close('sharePeople', l.all.gainsShare);
    close('shareElectricity', l.all.auxShare);
    close(
      'linesSum',
      l.all.wallAirShare + l.all.wallConductionShare + l.all.windowShare + l.all.gainsShare + l.all.auxShare,
      0.6,
    );
    close('seasonLoadKwh', l.all.load, 60);
    close('seasonElecKwh', l.all.aux, 60);
    expect(Math.abs(l.all.efficiency - 26)).toBeLessThan(1);
  });
  it('the sensitivity rows the sheets quote', () => {
    close('share5K', season({}, { airOffset: 5 }).share);
    close('share18', season({ setpoint: 18 }).share, 0.06);
    close('share1974', season({ G: 1.0 }).share, 0.06);
    close('share06', season({ G: 0.6 }).share, 0.6);
    close('win0', season({ southWindows: 0 }).share, 0.06);
    close('win30', season({ southWindows: 30 }).share, 0.06);
    close('peopleLow', season({ gains: 0 }).share, 0.06);
    close('peopleHigh', season({ gains: 1000 }).share, 0.06);
    close('nightScreenShare', season({ nightShutter: true }).share, 0.6);
    close('chauvency', season({ site: 'chauvency' }).share, 0.6);
    close('gvRest', season({ gvHoldsWall: false }).share, 0.6);
    close('flapPoint', season({ vents: 'one-way' }).share - shareLadder(p67).all.share, 0.3);
  });
});

describe('the model: the nights, the days and the pipe', () => {
  it('the night', () => {
    const n = nightRun();
    close('reverseFlow', -n.flowMin);
    close('reverseHours', n.backwardHours, 0.1);
    close('reverseKwh', -n.nightQt, 0.06);
  });
  it('the wall that carries the house after clear days', () => {
    const d = darkRun();
    close('dark1', d.byDay[0]!);
    close('dark2', d.byDay[1]!);
    close('darkLoad', d.loadPerDay);
    expect(d.byDay[2]!).toBeLessThan(0);
  });
  it('the days of the record', () => {
    const dec = replay('dec-jan-1975');
    const t = totals(dec.days.slice(1));
    close('eff20', t.eff);
    close('thermoShare', t.thermo, 0.6);
    const c = replay('christmas-1974');
    close('christmasModel', c.days[2]!.eff);
    close('christmasKj', c.days[2]!.sum, 1);
    close('dec29Model', dec.days.slice(1)[6]!.eff);
    const slow = totals(replay('dec-jan-1975', { lossK: 30 }).days.slice(1));
    close('thermoShareK30', slow.thermo, 0.6);
    const b74 = { build: '1974' as const, wallThickness: 0.37, collectorArea: 55, G: 1 };
    close('dry74', totals(replay('dec-jan-1975', b74).days.slice(1)).eff, 0.5);
  });
  it('the earth tube', () => {
    const o = tubeYear('odeillo');
    close('tubeJanOut', o.outJan);
    close('tubeJanIn', o.airJan);
    close('tubeJulOut', o.outJul);
    close('tubeJulIn', o.airJul);
    close('tubeKwh', o.heatingKWh, 1);
    close('tubeLoad', o.loadKWh, 200);
    expect(o.coolingKWh).toBe(0);
    const p = tubeYear('sealevel');
    close('tubeSeaHeat', p.heatingKWh, 1);
    close('tubeSeaCool', p.coolingKWh, 1);
    close('tubeSeaLoad', p.loadKWh, 300);
    close('tubeFlow', 0.5 * HOUSE_1967.volume);
  });
});

describe('the rest is held to the lines of docs/physics.md and to the scenarios’ own words', () => {
  it('prints in docs/physics.md the model figures that no cheap run recomputes', () => {
    expect(PHYSICS.length).toBeGreaterThan(5000);
    inDoc(
      '0.75 in December, 0.50 in June',
      '33 K, 44 K',
      '34–41 L/s',
      '25 L/s, 45 °C',
      '50 L/s to 19 L/s',
      '46.6 to 48.1 %',
      '± 0.25 K',
      '± 2.1 K',
      '± 10 K',
      '+0.3 to +5.4 K',
      '21–24 °C',
      '17.6 °C',
      '898 W/m²',
      '8 % of the plate at noon in June, 1 % in December',
      'carry 15 points of the 47',
      '2.2 to 3.3 volumes an hour',
      '66–70 °C',
      '13–19 °C',
      '8–18 °C',
      '9 points against 18',
      '5 to 11 points high',
      '−12 L/s for 5 h',
    );
    expect(SIM_TEST).toContain('outer face ± 17 K');
    // the year's gaps, from the two rows of §4.5 (held to the document by drawings.test.ts): the winter months are 6 to 12 points low,
    // November to February, but 8 to 12 only in December and January, so the texts say « December and January »
    const low = (month: number): number => MONTH_EFF_EYE[month]! - MONTH_EFF_MODEL[month]!;
    expect([10, 11, 0, 1].map(low)).toEqual([7, 8, 12, 6]);
    const decJan = [low(11), low(0)];
    expect(FIG.winterLowPts.t).toEqual([
      `${Math.min(...decJan)} à ${Math.max(...decJan)} points en décembre et janvier`,
      `${Math.min(...decJan)} to ${Math.max(...decJan)} points in December and January`,
    ]);
    // the summer's, July to September: 5 to 11 points high
    const high = [6, 7, 8].map((month) => MONTH_EFF_MODEL[month]! - MONTH_EFF_EYE[month]!);
    expect(FIG.summerHighPts.t).toEqual([
      `${Math.min(...high)} à ${Math.max(...high)} points`,
      `${Math.min(...high)} to ${Math.max(...high)} points`,
    ]);
    expect(SIM_TEST).toMatch(/shrinks by under 3 %/);
    expect(FIG.surfacesT.v).toBe(18);
    close('flowHalfDuct', 25, 0.5);
    close('glassDec', 0.75);
    close('glassJun', 0.5);
    close('plateAbove', 33);
    close('plateAboveLow', 44);
    close('shareMoves', 0.7);
  });
  it('words the scenarios the same way', () => {
    const t = (id: (typeof SCENARIO_IDS)[number]) => SCENARIO_TEXTS[id].lesson[0];
    expect(t('too-thick-too-thin')).toMatch(/4 h du matin/);
    expect(t('too-thick-too-thin')).toMatch(/22 h/);
    expect(t('too-thick-too-thin')).toMatch(/minuit/);
    expect(t('feb-1975')).toMatch(/80 %/);
    expect(t('april-1975')).toMatch(/44 °C/);
    expect(t('april-1975')).toMatch(/27 %/);
    expect(t('one-glass')).toMatch(/16 %.*32 %.*37 %/);
    expect(t('insulate-first')).toMatch(/74 %/);
    expect(t('insulate-first')).toMatch(/94 %/);
    expect(t('chauvency')).toMatch(/32 %/);
    expect(t('no-vents')).toMatch(/2 K.*21 h/);
    expect(t('no-vents')).toMatch(/6 K.*15 h/);
  });
  it('and starts every scenario the lessons name', () => {
    const sim = new HouseSim();
    for (const id of SCENARIO_IDS) expect(() => sim.applyScenario(id), id).not.toThrow();
  });
});

describe('the balcony’s stair', () => {
  it('has one count, dims.ts’s: the figure, the part sheet in both languages, and nothing like « about fifteen »', () => {
    expect(FIG.stairSteps.v).toBe(STAIR_STEPS);
    const sheet = PARTS.find((p) => p.id === 'entrance-balcony')!;
    expect(sheet.description.fr).toContain(`${STAIR_STEPS} marches*`);
    expect(sheet.description.en).toContain(`${STAIR_STEPS} steps*`);
    expect(`${sheet.description.fr} ${sheet.description.en}`).not.toMatch(/quinzaine|about fifteen/i);
    expect(sheet.specs.some((x) => x.label.en === 'Stair, number of steps')).toBe(true);
  });
});
