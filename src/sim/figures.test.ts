import { airK, airMu, airPr, airRho, FILM_VERTICAL, stackDraft, tubeFlow } from '@onigam/lab-kit/sim/thermal';
import { beforeAll, describe, expect, it } from 'vitest';
import { clearDay, MONTH_DAYS, pressureAt, RECORDS, seeded, SITES, TABLE_II, TABLE_II_FEB, Weather } from './climate';
import {
  HOUSE_TUBE,
  MEASURED_TUBES,
  soilTemperature,
  tubeSpeed,
  tubeTheta,
  tubeYear,
  thetaFromMeasured,
} from './earth-tube';
import {
  COLLECTOR_1967,
  COLLECTOR_1974,
  ductArea,
  elementArea,
  elementCount,
  ESTIMATE,
  FLOOR_DROP,
  gapArea,
  HEATING_END_DAY,
  HEATING_START_DAY,
  HOUSE_1967,
  HOUSE_1974,
  KCAL,
  ODEILLO,
  ROOM_SETPOINT,
  sweptShare,
  THERMOSTAT_HEIGHT,
  WALL_MATERIALS,
} from './machine';
import { buildGlazing, readAngle } from './optics';
import { draftAt, sourceFilm, SOURCE_ROOM_EMITTANCE, slotFilm } from './plant';
import { presetParams } from './presets';
import {
  darkRun,
  flowPower,
  monthlyEfficiency,
  nightRun,
  periodicDay,
  replay,
  seasonRun,
  shareLadder,
  sourceParams,
  totals,
  type Ladder,
  type MonthlyEfficiency,
  type PeriodicDay,
  type ReplayResult,
} from './runs';
import { declination, noonIncidenceVertical } from './solar';
import {
  diffusivity,
  penetrationDepth,
  slabResponse,
  thicknessForLag,
  wallCapacity,
  wallMass,
  waveDamping,
  waveLagHours,
  waveSpeed,
} from './wave';

// One test per key figure of docs/research.md, with its K number in the name.
//   exact: arithmetic from the source, the model retrieves it.
//   compare: the test pins WHAT THE MODEL GIVES against the figure in the name. A pin is not a target: nothing in the model was moved towards these. When a pin moves, the tables of docs/physics.md move with it.
//   find: no target at all, the pin is the finding.
// The inputs were fixed before the first comparison; the one thing changed afterwards is the envelope's series with the room's film, a bug of the books (a dark house must need G·V·ΔT), see docs/physics.md §7.

const concrete = WALL_MATERIALS.concrete;

describe('K1 to K9: the houses, as printed', () => {
  it('K1 storeys, K2 rooms: 1 and 4; 2 and 6 for N°1 of 1974', () => {
    expect([HOUSE_1967.storeys, HOUSE_1967.rooms, HOUSE_1974.storeys, HOUSE_1974.rooms]).toEqual([1, 4, 2, 6]);
  });
  it('K3 living area, K4 volume: 76 m², 300 m³', () => {
    expect([HOUSE_1967.floorArea, HOUSE_1967.volume, HOUSE_1974.floorArea, HOUSE_1974.volume]).toEqual([
      76, 300, 210, 525,
    ]);
  });
  it('K5 mean K, K6 G: 1.34 and 1.63, 0.40 and 1.00', () => {
    expect([HOUSE_1967.K, HOUSE_1967.G, HOUSE_1974.K, HOUSE_1974.G]).toEqual([1.34, 1.63, 0.4, 1]);
  });
  it('K7 collector area: 48 m² and 55 m²', () => {
    expect([HOUSE_1967.collectorArea, HOUSE_1974.collectorArea]).toEqual([48, 55]);
  });
  it('K8 collector per m³: 0.16 and about 0.1, exact', () => {
    expect(HOUSE_1967.collectorArea / HOUSE_1967.volume).toBeCloseTo(HOUSE_1967.collectorPerVolume, 2);
    expect(HOUSE_1974.collectorArea / HOUSE_1974.volume).toBeCloseTo(HOUSE_1974.collectorPerVolume, 1);
  });
  it('K9 auxiliary heating: electric, modelled as an ideal thermostat at the setpoint', () => {
    const p = periodicDay(15, { sky: 'clear', southWindows: 0, gains: 0 });
    expect(p.roomMin).toBeCloseTo(ROOM_SETPOINT, 3);
    expect(p.aux).toBeGreaterThan(0);
  });
});

describe('K10 to K18: the element, as printed', () => {
  it('K10 wall: 0.60 m and 0.37 m', () => {
    expect([COLLECTOR_1967.wallThickness, COLLECTOR_1974.wallThickness]).toEqual([0.6, 0.37]);
  });
  it('K11 concrete: ρ 2,200, λ 1.75, 0.22 kcal/kg·K = 921 J/kg·K', () => {
    expect(concrete.rho).toBe(2200);
    expect(concrete.k(20)).toBe(1.75);
    expect(concrete.c(20)).toBeCloseTo(0.22 * KCAL, 6);
    expect(concrete.c(20)).toBeCloseTo(921, 0);
  });
  it('K12 absorptance is not printed: the estimate stays in the research’s 0.90 to 0.95', () => {
    expect(ESTIMATE.absorptance).toBeGreaterThanOrEqual(0.9);
    expect(ESTIMATE.absorptance).toBeLessThanOrEqual(0.95);
  });
  it('K13 glass: two sheets of 3 mm, 4 mm in 1974', () => {
    expect([COLLECTOR_1967.glassLayers, COLLECTOR_1967.glassThickness, COLLECTOR_1974.glassThickness]).toEqual([
      2, 0.003, 0.004,
    ]);
  });
  it('K14 wall to glazing: 0.12 m', () => {
    expect([COLLECTOR_1967.gap, COLLECTOR_1974.gap]).toEqual([0.12, 0.12]);
  });
  it('K15 element: 4.38 × 1.27 m and 2.50 × 1.55 m, 5.56 m² (derived)', () => {
    expect(elementArea(COLLECTOR_1967)).toBeCloseTo(5.56, 2);
    expect(elementArea(COLLECTOR_1974)).toBeCloseTo(3.875, 3);
  });
  it('K16 between the ducts: 3.50 m and 2.20 m', () => {
    expect([COLLECTOR_1967.ductSpan, COLLECTOR_1974.ductSpan]).toEqual([3.5, 2.2]);
  });
  it('K17 duct: 621.5 cm² and 798 cm², exact', () => {
    expect(ductArea(COLLECTOR_1967) * 1e4).toBeCloseTo(621.5, 1);
    expect(ductArea(COLLECTOR_1974) * 1e4).toBeCloseTo(798, 0);
  });
  it('K18 exchange area 4.50 and 3.25 m²: width × duct span gives 4.45 and 3.41 (compare)', () => {
    expect(COLLECTOR_1967.elementWidth * COLLECTOR_1967.ductSpan).toBeCloseTo(4.445, 3);
    expect(COLLECTOR_1974.elementWidth * COLLECTOR_1974.ductSpan).toBeCloseTo(3.41, 2);
    expect(COLLECTOR_1967.exchangeAreaReported).toBe(4.5);
    expect(COLLECTOR_1974.exchangeAreaReported).toBe(3.25);
    expect(sweptShare(COLLECTOR_1967)).toBeCloseTo(0.799, 3);
  });
});

describe('K19 to K21: the place and the method', () => {
  it('K19 at 1,550 m the source’s ρ = 1 kg/m³ is what the standard atmosphere gives at 20 °C; cₚ 1,007', () => {
    const p = pressureAt(ODEILLO.altitude);
    expect(p).toBeCloseTo(84038, -1);
    expect(airRho(20, p)).toBeCloseTo(ODEILLO.airRhoReported, 2);
    expect(ODEILLO.airCpReported).toBe(1007);
    expect(ODEILLO.latitude).toBeCloseTo(42.5, 1);
  });
  it('K20 heating period: 1 October to 20 May', () => {
    expect([HEATING_START_DAY, HEATING_END_DAY]).toEqual([274, 140]);
  });
  it('K21 rooms at 20 °C at 1.50 m, inlet air 17 °C in 1967, 18 °C in 1974', () => {
    expect([ROOM_SETPOINT, THERMOSTAT_HEIGHT, COLLECTOR_1967.inletAir, COLLECTOR_1974.inletAir, FLOOR_DROP]).toEqual([
      20, 1.5, 17, 18, 3,
    ]);
  });
});

describe('the hand checks: K71 to K74, K83 to K87', () => {
  it('K71 the wave, exact: α 8.64×10⁻⁷, 4.03 cm/h, δ 0.154 m', () => {
    expect(diffusivity(concrete) * 1e7).toBeCloseTo(8.64, 2);
    expect(waveSpeed(concrete) * 3600 * 100).toBeCloseTo(4.03, 1);
    expect(penetrationDepth(concrete)).toBeCloseTo(0.154, 3);
  });
  it('K71, K23 lag through 0.60 m: 14.9 h, 2.0 %, against 14–16 h measured', () => {
    expect(waveLagHours(0.6, concrete)).toBeCloseTo(14.9, 1);
    expect(waveDamping(0.6, concrete) * 100).toBeCloseTo(2.0, 1);
  });
  it('K71, K23 lag through 0.37 m: 9.2 h, 9.1 %, against 9–10 h measured', () => {
    expect(waveLagHours(0.37, concrete)).toBeCloseTo(9.2, 1);
    expect(waveDamping(0.37, concrete) * 100).toBeCloseTo(9.1, 1);
  });
  it('K71 lag through 0.45 m: 11.2 h, 5.4 %', () => {
    expect(waveLagHours(0.45, concrete)).toBeCloseTo(11.2, 1);
    expect(waveDamping(0.45, concrete) * 100).toBeCloseTo(5.4, 1);
  });
  it('K20 FIND the wanted lag of about 12 h asks for 48 cm by the closed form, 51 cm by the crest in the wall; the inventors say 40–45 cm, which is 12 h at 3.7 cm/h', () => {
    expect(thicknessForLag(12, concrete)).toBeCloseTo(0.484, 3);
    expect(periodicDay(15, { holdRoom: true, wallThickness: 0.51 }).lagCrest).toBeCloseTo(12, 0);
    expect(3.7 * 12).toBeCloseTo(44.4, 1);
  });
  it('K24 3.7–4 cm/h in classical masonry: the concrete retrieves it; the brick and stone estimates lie around it', () => {
    expect(waveSpeed(concrete) * 360000).toBeCloseTo(4.03, 1);
    expect(waveSpeed(WALL_MATERIALS.brick) * 360000).toBeCloseTo(3.17, 1);
    expect(waveSpeed(WALL_MATERIALS.stone) * 360000).toBeCloseTo(5.01, 1);
    expect(waveSpeed(WALL_MATERIALS.adobe) * 360000).toBeCloseTo(2.73, 1);
  });
  it('K71 a real slab with a film on its far side: the far face comes about 1 h earlier than the half-infinite form', () => {
    const r60 = slabResponse(0.6, concrete, 7.6);
    expect(r60.lagHours).toBeCloseTo(13.95, 1);
    expect(r60.damping * 100).toBeCloseTo(2.96, 1);
    const r37 = slabResponse(0.37, concrete, 7.6);
    expect(r37.lagHours).toBeCloseTo(8.26, 1);
  });
  it('K72 the mass: 28.8 m³, 63.4 t, 58.4 MJ/K, 16.2 kWh/K, 1.32 t/m²; 44.8 t for 1974 N°1', () => {
    expect(wallMass(48, 0.6, concrete) / 1000).toBeCloseTo(63.36, 2);
    expect(wallCapacity(48, 0.6, concrete) / 1e6).toBeCloseTo(58.4, 1);
    expect(wallCapacity(48, 0.6, concrete) / 3.6e6).toBeCloseTo(16.2, 1);
    expect(wallMass(1, 0.6, concrete) / 1000).toBeCloseTo(1.32, 2);
    expect(wallMass(55, 0.37, concrete) / 1000).toBeCloseTo(44.8, 1);
  });
  it('K73 ducts against the gap: 41 % and 43 %', () => {
    expect((ductArea(COLLECTOR_1967) / gapArea(COLLECTOR_1967)) * 100).toBeCloseTo(40.8, 1);
    expect((ductArea(COLLECTOR_1974) / gapArea(COLLECTOR_1974)) * 100).toBeCloseTo(42.9, 1);
  });
  it('K74 speeds at 20 L/s: 13 cm/s in the gap, 32 cm/s in the duct', () => {
    expect((0.02 / gapArea(COLLECTOR_1967)) * 100).toBeCloseTo(13.1, 1);
    expect((0.02 / ductArea(COLLECTOR_1967)) * 100).toBeCloseTo(32.2, 1);
  });
  it('K75 thermocirculation check: 20 L/s, 43 − 17 K over 5.56 m²: 94 W/m²; over 7 h, 2,370 kJ/m² against 2,172', () => {
    const w = flowPower(20, 43, 17) / elementArea(COLLECTOR_1967);
    expect(w).toBeCloseTo(94.1, 1);
    expect((w * 7 * 3600) / 1000).toBeCloseTo(2373, -1);
  });
  it('K83 collectors on the façade: 10.96 m of wall, 8.63 elements', () => {
    expect(48 / 4.38).toBeCloseTo(10.96, 2);
    expect(elementCount(COLLECTOR_1967, HOUSE_1967)).toBeCloseTo(8.63, 2);
  });
  it('K84 mean height: 3.95 m', () => {
    expect(HOUSE_1967.volume / HOUSE_1967.floorArea).toBeCloseTo(3.95, 2);
  });
  it('K79 G and K do not reconcile in 1974: G·V/K is 365 m² in 1967, 1,312 m² in 1974', () => {
    expect((HOUSE_1967.G * HOUSE_1967.volume) / HOUSE_1967.K).toBeCloseTo(364.9, 1);
    expect((HOUSE_1974.G * HOUSE_1974.volume) / HOUSE_1974.K).toBeCloseTo(1312.5, 1);
  });
  it('K81 the anemometer’s ceiling, 60 cm/s: 20 L/s reads 46–64 cm/s at the centre of the duct for k 0.7 to 0.5', () => {
    const mean = (0.02 / ductArea(COLLECTOR_1967)) * 100;
    expect(mean / 0.7).toBeCloseTo(46, 0);
    expect(mean / 0.5).toBeCloseTo(64.4, 0);
  });
});

describe('K31: the daily balance, row by row (the rows are read off the page)', () => {
  const rows = [...TABLE_II.slice(1), ...TABLE_II_FEB];
  it('holds the 25 rows of the table', () => {
    expect(rows).toHaveLength(25);
  });
  const slips = new Set(['4/1', '9/1', '16/2']);
  for (const r of rows.filter((x) => !slips.has(x.date))) {
    it(`K31 ${r.date}: the parts make ΣQ, the ΣQ makes ${r.eff} %`, () => {
      expect(r.qt! + r.qr! + r.qc!).toBeCloseTo(r.sum!, -1);
      expect((100 * r.sum!) / (r.incident * 1000)).toBeCloseTo(r.eff!, 1);
    });
  }
  it('K31 Christmas Eve: 5,424 out, 1,134 in, 478.30 %, exact', () => {
    const r = TABLE_II[2]!;
    expect(r.date).toBe('24/12');
    expect(r.sum).toBe(5424);
    expect(r.incident * 1000).toBeCloseTo(1134, 6);
    expect(5424 / 1134).toBeCloseTo(4.783, 3);
  });
  it('K31 the three slips of the table are what the research says', () => {
    const jan4 = rows.find((r) => r.date === '4/1')!;
    expect(jan4.qt! + jan4.qr! + jan4.qc!).toBe(7889);
    expect(jan4.sum).toBe(7789);
    const jan9 = rows.find((r) => r.date === '9/1')!;
    expect(jan9.qt! + jan9.qr! + jan9.qc!).toBe(8806);
    expect((100 * 8806) / 23310).toBeCloseTo(jan9.eff!, 1);
    const feb16 = rows.find((r) => r.date === '16/2')!;
    expect((100 * feb16.sum!) / 19971).toBeCloseTo(feb16.eff!, 1);
  });
  it('K31 over the 25 days: 472 MJ/m² in, 169 out, 35.7 %, thermocirculation 31 %, mean air 5.0 °C', () => {
    const inc = rows.reduce((a, r) => a + r.incident, 0);
    const out =
      rows.reduce((a, r) => a + r.sum! + (r.date === '9/1' ? 8806 - 8007 : 0) + (r.date === '4/1' ? 100 : 0), 0) / 1000;
    const qt = rows.reduce((a, r) => a + r.qt!, 0) / 1000;
    expect(inc).toBeCloseTo(472.3, 0);
    expect(out).toBeCloseTo(169.1, 0);
    expect((100 * out) / inc).toBeCloseTo(35.8, 0);
    expect((100 * qt) / out).toBeCloseTo(31, 0);
    expect(rows.reduce((a, r) => a + r.air, 0) / 25).toBeCloseTo(5.04, 1);
  });
});

describe('K34, K55 to K57: the sun', () => {
  it('K34 the noon sun at 42.5°: 24.1° from the wall’s normal in December, 70.9° in June, exact', () => {
    expect(noonIncidenceVertical(ODEILLO.latitude, 355)).toBeCloseTo(24.05, 1);
    expect(noonIncidenceVertical(ODEILLO.latitude, 172)).toBeCloseTo(70.95, 1);
  });
  it('K34 above 55° after 15 April: 56.9° on that day, and declination of the solstice 23.45°', () => {
    expect(noonIncidenceVertical(ODEILLO.latitude, 105)).toBeCloseTo(56.9, 0);
    expect(declination(172)).toBeCloseTo(23.45, 1);
  });
  it('K55 the year on the wall and on the roof: 1,334 and 1,550 kWh/m², as queried', () => {
    const s = SITES.odeillo;
    expect(s.vertical.reduce((a, b) => a + b)).toBeCloseTo(1334.2, 0);
    expect(s.horizontal.reduce((a, b) => a + b)).toBeCloseTo(1549.9, 0);
    expect(s.air.reduce((a, b, i) => a + b * MONTH_DAYS[i]!, 0) / 365).toBeCloseTo(6.65, 1);
  });
  it('K56 January against June on the wall: 129.6 / 78.7 = 1.65, exact', () => {
    const s = SITES.odeillo;
    expect(s.vertical[0]! / s.vertical[5]!).toBeCloseTo(1.647, 3);
  });
  it('K56 December, wall against roof: 126.9 / 58.5 = 2.17, exact; the wall’s best month is October', () => {
    const s = SITES.odeillo;
    expect(s.vertical[11]! / s.horizontal[11]!).toBeCloseTo(2.169, 3);
    expect(Math.max(...s.vertical)).toBe(s.vertical[9]);
  });
  it('K56, K37 the model’s own clear days: January over June 1.76, December’s 20.3 MJ/m² against 20.30 recorded on the 22nd', () => {
    const o = SITES.odeillo;
    expect(clearDay(o, 15).total / clearDay(o, 172).total).toBeCloseTo(1.77, 1);
    expect(clearDay(o, 356).total).toBeCloseTo(20.33, 1);
    expect(clearDay(o, 172).total).toBeCloseTo(11.91, 1);
  });
  it('K57 the horizon: a beam stops under it, and the clear day shrinks by under 3 %', () => {
    const o = SITES.odeillo;
    const none = clearDay({ ...o, id: 'perpignan', horizon: undefined }, 15);
    expect(clearDay(o, 15).total / none.total).toBeGreaterThan(0.97);
    expect(clearDay(o, 15).total / none.total).toBeLessThan(1);
  });
  it('K58 the series closes each month on PVGIS exactly, and every day is scaled, clear or not', () => {
    const w = new Weather({ site: 'odeillo', sky: 'series' });
    let total = 0;
    const s = { beam: 0, diffuse: 0, cosTheta: 0, sunAlt: 0, sunAz: 0, air: 0, clear: 0, wind: 2 };
    for (let d = 1; d <= 31; d++) {
      w.setDay(d);
      for (let i = 0; i < 288; i++) {
        w.sample((i + 0.5) / 12, s);
        total += (s.beam + s.diffuse) * 300;
      }
    }
    expect(total / 3.6e6).toBeCloseTo(SITES.odeillo.vertical[0]!, 0);
  });
  it('K58 the series: 61 % of the January days clear; a seeded year, the same each time', () => {
    const w = new Weather({ site: 'odeillo', sky: 'series' });
    let clear = 0;
    for (let d = 1; d <= 31; d++) if (w.isClear(d)) clear++;
    expect(clear / 31).toBeCloseTo(0.613, 2);
    const again = new Weather({ site: 'odeillo', sky: 'series' });
    for (let d = 1; d <= 365; d++) expect(again.isClear(d)).toBe(w.isClear(d));
  });
  it('K34 and the glass: at noon in December the two sheets pass 0.75, at noon in June 0.50', () => {
    const g = buildGlazing(2, ESTIMATE.glassExtinction * 0.003, ESTIMATE.absorptance, ESTIMATE.glassIndex);
    expect(readAngle(g.tau, 24)).toBeCloseTo(0.747, 2);
    expect(readAngle(g.tau, 71)).toBeCloseTo(0.499, 2);
  });
});

const docs = import.meta.glob('../../docs/physics.md', { query: '?raw', import: 'default', eager: true }) as Record<
  string,
  string
>;
const DOC = docs['../../docs/physics.md'] ?? '';

describe('docs/physics.md says what the model finds', () => {
  it('the ladder and the sensitivity’s first line', () => {
    const l = shareLadder(presetParams('prototype-1967'));
    const m = DOC.match(
      /\*\*As it stands\*\* *\| \*\*([\d.]+)\*\* *\| \*\*([\d.]+)\*\* *\| \*\*([\d.]+)\*\* *\| \*\*([\d.]+)\*\*/,
    );
    expect(m, 'the sensitivity table').not.toBeNull();
    expect(Number(m![1])).toBeCloseTo(l.wallOnly.share, 1);
    expect(Number(m![2])).toBeCloseTo(l.wallAndWindows.share, 0);
    expect(Number(m![3])).toBeCloseTo(l.all.share, 1);
    expect(Number(m![4])).toBeCloseTo(l.allAgainstDark, 1);
  });
  it('the 20 days’ last row', () => {
    const t = totals(replay('dec-jan-1975').days.slice(1));
    const m = DOC.match(
      /\| Mean +\| 18,325 +\| 2,078 +\| ([\d,]+) +\| 3,224 +\| ([\d,]+) +\| 1,417 +\| ([\d,]+) +\| 6,719 +\| ([\d,]+) +\| 36\.7 +\| ([\d.]+)/,
    );
    expect(m, 'the mean row').not.toBeNull();
    const n = (i: number): number => Number(m![i]!.replace(',', ''));
    expect(n(1)).toBeCloseTo(t.qt / 20, -1);
    expect(n(2)).toBeCloseTo(t.qr / 20, -1);
    expect(n(3)).toBeCloseTo(t.qc / 20, -1);
    expect(n(4)).toBeCloseTo(t.sum / 20, -1);
    expect(n(5)).toBeCloseTo(t.eff, 0);
  });
});

describe('the kit’s two questions', () => {
  it('K80 stackDraft reads the air at sea level: a fifth high at 1,550 m. draftAt takes the pressure', () => {
    const p = pressureAt(1550);
    const ratio = stackDraft(3.5, 35, 20) / draftAt(3.5, 35, 20, p);
    expect(ratio).toBeCloseTo(1.206, 3);
    // the research's 1.1 to 2.2 Pa for a column at 30–40 °C against 20 °C
    expect(draftAt(3.5, 30, 20, p)).toBeCloseTo(1.13, 1);
    expect(draftAt(3.5, 40, 20, p)).toBeCloseTo(2.19, 1);
  });
  it('tubeFlow on 0.6.0 reads a negative flow as laminar: the lab passes only the flow’s size, so a reversal and its forward flow have the same film', () => {
    const T = 20;
    const gas = { rho: airRho(T, 84000), mu: airMu(T), k: airK(T), Pr: airPr(T) };
    const forward = tubeFlow(0.05, 0.24, gas);
    const asThisLabCalls = tubeFlow(Math.abs(-0.05), 0.24, gas);
    expect(asThisLabCalls.Re).toBe(forward.Re);
    expect(asThisLabCalls.h).toBe(forward.h);
    // what the published kit does with the sign: no more than a guard, its answer will change with the fix
    expect(tubeFlow(-0.05, 0.24, gas).Re).toBeLessThanOrEqual(forward.Re);
  });
});

describe('the recordings: what the model finds (compare, no tuning)', () => {
  let dec: ReplayResult;
  let christmas: ReplayResult;
  let feb: ReplayResult;
  let april: ReplayResult;
  let june: ReplayResult;
  let juneSummer: ReplayResult;
  let d74: ReplayResult;
  let c74: ReplayResult;
  beforeAll(() => {
    dec = replay('dec-jan-1975');
    christmas = replay('christmas-1974');
    feb = replay('feb-1975');
    april = replay('april-1975');
    june = replay('june-1975');
    juneSummer = replay('june-1975', { mode: 'summer', holdRoom: false, backup: false });
    const b74 = { build: '1974' as const, wallThickness: 0.37, collectorArea: 55, G: 1 };
    d74 = replay('dec-jan-1975', b74);
    c74 = replay('christmas-1974', b74);
  });

  it('K31 the incident of each recorded day is what the table says: the weather is an input', () => {
    for (let i = 1; i < dec.days.length; i++) {
      expect(dec.days[i]!.incident / (TABLE_II[i]!.incident * 1000)).toBeCloseTo(1, 1);
    }
  });
  it('K31 Christmas Eve: model 367 % against the source’s 478 %. Same shape: far over 100 %, on the same sun', () => {
    expect(christmas.days[2]!.eff).toBeCloseTo(367, -1);
    expect(christmas.days[2]!.sum).toBeCloseTo(4180, -2);
  });
  it('K31 a clear day after cloud: 29 December, 18.9 % measured, 19.2 % in the model, 3,856 against 3,800 kJ/m²', () => {
    const d = dec.days.find((x) => x.date === '29/12')!;
    expect(d.eff).toBeCloseTo(19.2, 0);
    expect(d.sum).toBeCloseTo(3860, -2);
  });
  it('K31, K25 over 23 December to 11 January: the total is right, 35.0 % against 36.7 % over the same days', () => {
    const t = totals(dec.days.slice(1));
    expect(t.eff).toBeCloseTo(35.0, 0);
    const src = TABLE_II.slice(1);
    const sum = src.reduce((a, r) => a + r.qt! + r.qr! + r.qc!, 0);
    const inc = src.reduce((a, r) => a + r.incident * 1000, 0);
    expect((100 * sum) / inc).toBeCloseTo(36.7, 0);
  });
  it('K25 the clear days of the record: efficiency 19 to 40 % in the model, 19 to 43 % in the table, where the source sums up 32–40 %', () => {
    const clear = dec.days.slice(1).filter((d) => d.incident > 15000);
    const effs = clear.map((d) => d.eff);
    expect(Math.min(...effs)).toBeCloseTo(19.2, 0);
    expect(Math.max(...effs)).toBeCloseTo(40.1, 0);
  });
  it('K26 NOT RETRIEVED: thermocirculation’s share 51 % in the model, 30–35 % measured. The model’s flow is twice the source’s', () => {
    expect(totals(dec.days.slice(1)).thermo).toBeCloseTo(50.7, 0);
    const src = TABLE_II.slice(1);
    expect((100 * src.reduce((a, r) => a + r.qt!, 0)) / src.reduce((a, r) => a + r.qt! + r.qr! + r.qc!, 0)).toBeCloseTo(
      31,
      0,
    );
  });
  it('K37 NOT RETRIEVED, K80: the flow, 34 to 41 L/s at its peak in the model against about 20 recorded: 1.7 to 2 times', () => {
    const peaks = dec.days
      .slice(1)
      .filter((d) => d.incident > 15000)
      .map((d) => d.flowMax);
    expect(Math.max(...peaks)).toBeCloseTo(40.9, 0);
    expect(Math.min(...peaks)).toBeCloseTo(33.9, 0);
  });
  it('K37 the outer face: 61 °C on the 23rd in the model, 63–66 °C by eye; down to 25.5 °C by morning, 21–24 °C by eye', () => {
    expect(christmas.days[1]!.outerMax).toBeCloseTo(60.7, 0);
    expect(christmas.days[1]!.outerMin).toBeCloseTo(25.5, 0);
  });
  it('K37 NOT RETRIEVED: the inner face, 21 to 24 °C over the four days in the model, 25–28 °C by eye: about 2 K low. Nearly flat, as seen', () => {
    const d = christmas.days[1]!;
    expect(d.innerMin).toBeCloseTo(23.6, 0);
    expect(d.innerMax).toBeCloseTo(24.2, 0);
    expect(d.innerMax - d.innerMin).toBeLessThan(1);
  });
  it('K37 the air out: 35.6 °C on the 23rd against 40–43 °C by eye: more flow, cooler air', () => {
    expect(christmas.days[1]!.gapOutMax).toBeCloseTo(35.6, 0);
  });
  it('K37 peak hour of the sun: 898 W/m² for a clear mid-January day by the clear-sky formula, about 950 recorded', () => {
    const p = periodicDay(15, { holdRoom: true });
    expect(p.sunPeak).toBeCloseTo(898, -1);
  });
  it('K28 RETRIEVED plate above the gap’s air on the 23rd: 33 K at mid-height, 44 K at the inlet, against 30–35 K and 40–45 K', () => {
    const d = christmas.days[1]!;
    expect(d.plateOverMid).toBeGreaterThan(30);
    expect(d.plateOverMid).toBeLessThan(36);
    expect(d.plateOverBottom).toBeCloseTo(43.7, 0);
  });
  it('K29 inner face against the room, −3 to +9 K measured: +0.3 to +5.4 K in the model on this record', () => {
    const lows = dec.days.map((d) => d.innerMin - 20);
    const highs = dec.days.map((d) => d.innerMax - 20);
    expect(Math.min(...lows)).toBeCloseTo(0.3, 0);
    expect(Math.max(...highs)).toBeCloseTo(5.4, 0);
  });
  it('K37 hand check on the source’s own conduction: their Qr + Qc is about twice what λ allows between their faces', () => {
    // by eye on Fig. 3, the 23rd: outer mean about 37 °C, inner about 26.5 °C. Steady conduction through λ/L:
    const hand = (1.75 / 0.6) * (37 - 26.5);
    expect(hand).toBeCloseTo(30.6, 1);
    // their stream, W/m²
    const theirs = ((TABLE_II[1]!.qr! + TABLE_II[1]!.qc!) * 1000) / 86400;
    expect(theirs).toBeCloseTo(66.1, 1);
    // the model's stream closes on its own conduction
    expect(((christmas.days[1]!.qr + christmas.days[1]!.qc) * 1000) / 86400).toBeCloseTo(41.6, 0);
  });
  it('K38d Feb. 1975, Fig. 5: 22.38, 16.87, 5.09, 17.81 MJ/m²: efficiency 35, 40, 82, 22 %, face 59, 50, 30, 47 °C, against about 63, 61, 30, 52 °C by eye', () => {
    expect(feb.days.map((d) => Math.round(d.eff))).toEqual([35, 40, 82, 22]);
    expect(feb.days.map((d) => Math.round(d.outerMax))).toEqual([59, 50, 30, 47]);
  });
  it('K38b April 1975: face 44 °C (40–45 by eye), inner 22–23 °C (20–24), air out 29.5 °C (about 33 by eye on the 1967 figure); flow 28 L/s against about 20', () => {
    const d = april.days[0]!;
    expect(d.outerMax).toBeCloseTo(44.2, 0);
    expect(d.innerMin).toBeCloseTo(22.4, 0);
    expect(d.gapOutMax).toBeCloseTo(29.5, 0);
    expect(d.flowMax).toBeCloseTo(28.6, 0);
  });
  it('K38c June 1975, winter position, room held: face 29–33 °C (32–38 by eye), air out 24–26 °C (up to 30), flow 14–20 L/s (about 20). The flow agrees here, and not in December', () => {
    const f = june.days.map((d) => d.flowMax);
    expect(Math.min(...f)).toBeCloseTo(14.4, 0);
    expect(Math.max(...f)).toBeCloseTo(19.9, 0);
    expect(Math.max(...june.days.map((d) => d.outerMax))).toBeCloseTo(33.2, 0);
  });
  it('K81 a clue to the plateau: the source’s curves stay at 20 L/s from December to June; the model’s flow doubles between them', () => {
    const ratio = Math.max(...dec.days.map((d) => d.flowMax)) / Math.max(...june.days.map((d) => d.flowMax));
    expect(ratio).toBeCloseTo(2, 0);
  });
  it('K82 the summer draw, about 2 volumes an hour on the recorded flow: 2.2 to 3.3 volumes in the model’s summer position', () => {
    const volumes = (ls: number): number => (ls * elementCount(COLLECTOR_1967, HOUSE_1967) * 3.6) / HOUSE_1967.volume;
    expect(volumes(20)).toBeCloseTo(2.07, 1);
    const flows = juneSummer.days.map((d) => d.flowMax);
    expect(volumes(Math.max(...flows))).toBeCloseTo(3.32, 0);
    expect(juneSummer.days[3]!.flowMin).toBeGreaterThan(15);
  });
  it('K38a the 1974 wall: inner face swings 23.5–27.5 °C in the model (21–28 by eye); outer 57 °C (62–64); flow 34 L/s (19)', () => {
    const d = c74.days[1]!;
    expect(d.innerMin).toBeCloseTo(23.5, 0);
    expect(d.innerMax).toBeCloseTo(27.5, 0);
    expect(d.outerMax).toBeCloseTo(56.8, 0);
    expect(d.flowMax).toBeCloseTo(33.6, 0);
  });
  it('K25, K33 the dry 1974 wall in the model: 36.4 %, one point ABOVE 1967’s 35.0 %, where it measured 8–10 points below. The gap is left to the water: not modelled', () => {
    const e74 = totals(d74.days.slice(1)).eff;
    const e67 = totals(dec.days.slice(1)).eff;
    expect(e74).toBeCloseTo(36.4, 0);
    expect(e74 - e67).toBeCloseTo(1.4, 0);
  });
  it('K26 the 1974 wall’s thermocirculation: 46 % in the model, 35–40 % reported', () => {
    expect(totals(d74.days.slice(1)).thermo).toBeCloseTo(46, 0);
  });
  it('K31 Christmas Eve in 1974: 268 % in the model, 144.46 % in Table III', () => {
    expect(c74.days[2]!.eff).toBeCloseTo(268, -1);
  });
  it('K76 the wall alone on the days of the table: 6,420 kJ/m²/day in the model, 6,720 by the table: 51 % of the load in both', () => {
    const t = totals(dec.days.slice(1));
    const n = 20;
    const air = TABLE_II.slice(1).reduce((a, r) => a + r.air, 0) / n;
    const load = (489 * (20 - air) * 24 * 3600) / 1000 / 48; // kJ per m² of collector and day
    expect(t.sum / n).toBeCloseTo(6422, -2);
    expect(t.sum / n / load).toBeCloseTo(0.51, 1);
  });
});

describe('the wave in the model', () => {
  let p60: PeriodicDay;
  let p37: PeriodicDay;
  let p60dry: PeriodicDay;
  beforeAll(() => {
    p60 = periodicDay(15, { holdRoom: true });
    p37 = periodicDay(15, { holdRoom: true, wallThickness: 0.37 });
    p60dry = periodicDay(15, { holdRoom: true, southWindows: 0, gains: 0 });
  });
  it('K23 RETRIEVED at 60 cm, the crest followed inside the wall: 14.5 h against 14–16 h', () => {
    expect(p60.lagCrest).toBeCloseTo(14.5, 0);
    expect(p60.lagCrest).toBeGreaterThan(14);
    expect(p60.lagCrest).toBeLessThan(16);
  });
  it('K23 ALMOST at 37 cm: 8.1 h against 9–10 h, an hour short: the far face’s film pulls it early', () => {
    expect(p37.lagCrest).toBeCloseTo(8.14, 0);
  });
  it('K24 the crest’s speed in the numerical wall: 3.6 to 4.4 cm/h against 3.7–4', () => {
    expect(p60.crestSpeed).toBeCloseTo(3.85, 0);
    expect(p37.crestSpeed).toBeCloseTo(4.4, 0);
  });
  it('K23 at the inner face itself: a swing of a few tenths at 60 cm: the room’s own day takes over. 12.3 h with no windows, 6 h with them', () => {
    expect(p60dry.lagByPhase).toBeCloseTo(12.3, 0);
    expect(p60.lagByPhase).toBeCloseTo(6.1, 0);
    expect(p60.innerSwing).toBeLessThan(0.5);
  });
  it('K37 the damping: outer face ± 17 K, inner ± 0.25 K at 60 cm, ± 2.1 K at 37 cm, against ± 22 K, ± 0.45 K, ± 2 K as seen', () => {
    expect(p60.outerSwing).toBeCloseTo(16.9, 0);
    expect(p60.innerSwing).toBeCloseTo(0.25, 1);
    expect(p37.innerSwing).toBeCloseTo(2.1, 0);
  });
  it('K27 the flow goes on: under half its peak 3 h after the last sun, as « two to three hours »; zero after about 10 h, as Fig. 3’s dashed curve', () => {
    expect(p60.flowTailHalf).toBeCloseTo(3.1, 0);
    expect(p60.flowTailZero).toBeCloseTo(10, 0);
  });
  it('K20 the clear day’s sun on the wall: 9 h, about 10 h reported', () => {
    expect(p60.sunLast - p60.sunFirst).toBeCloseTo(9.1, 0);
  });
});

describe('the numerical wall against the closed form', () => {
  it('K71 the grid retrieves the closed form within 5 %, on a sine at its face and a far face at a film', async () => {
    const { buildGrid, createNetwork, stepNetwork, uniformEdges, setNodeTemperature } =
      await import('@onigam/lab-kit/sim/thermal');
    const L = 0.6;
    const n = 24;
    const grid = buildGrid({ geometry: 'xy', xEdges: uniformEdges(L, n), yEdges: [0, 1], material: concrete, T: 20 });
    const nodes = [...grid.nodes, { T: 20, fixed: true }, { T: 20, fixed: true }];
    const faceA = grid.faces('xMin')[0]!;
    const faceB = grid.faces('xMax')[0]!;
    const links = [
      ...grid.links,
      { a: nodes.length - 2, b: faceA.node, shapeB: faceA.shape },
      { a: faceB.node, b: nodes.length - 1, G: 7.6, shapeA: faceB.shape },
    ];
    const net = createNetwork(nodes, links);
    const dt = 60;
    const omega = (2 * Math.PI) / 86400;
    let t = 0;
    for (let i = 0; i < 40 * 1440; i++) {
      setNodeTemperature(net, nodes.length - 2, 20 + 20 * Math.sin(omega * t));
      stepNetwork(net, dt);
      t += dt;
    }
    // the last day's fundamental at the far face
    let c = 0;
    let s = 0;
    for (let i = 0; i < 1440; i++) {
      setNodeTemperature(net, nodes.length - 2, 20 + 20 * Math.sin(omega * t));
      stepNetwork(net, dt);
      t += dt;
      const Tface = net.T[faceB.node]! - 20;
      c += Tface * Math.cos(omega * t);
      s += Tface * Math.sin(omega * t);
    }
    const lag = ((Math.atan2(-c, s) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const hours = lag / omega / 3600;
    // the last cell's centre stands 1.25 cm before the face: about 0.3 h early. The closed form is at the far face itself.
    const exact = slabResponse(L, concrete, 7.6);
    expect(Math.abs(hours - exact.lagHours) / exact.lagHours).toBeLessThan(0.05);
  });
});

describe('the sources’ own films: K35, K36', () => {
  it('K35 S1’s film: 1.42·ΔT^¼ and 1.77·ΔT^⅓ in W/m²·K, averaged: 2.72 at 6 K; the kit’s FILM_VERTICAL gives 2.38', () => {
    expect(sourceFilm(1)).toBeCloseTo((1.419 + 1.768) / 2, 2);
    expect(sourceFilm(6)).toBeCloseTo(2.72, 1);
    expect(FILM_VERTICAL * Math.cbrt(6)).toBeCloseTo(2.38, 2);
  });
  it('K36 S1’s radiation: 17.95×10⁻⁸ kJ/h·m²·K⁴ is ε_eff = 0.88, emittance 0.94 on all surfaces', () => {
    expect(SOURCE_ROOM_EMITTANCE).toBeCloseTo(0.879, 3);
    expect(1 / (2 / 0.94 - 1)).toBeCloseTo(0.887, 3);
  });
  it('K36 the model’s other surfaces average 18 °C on the record; the source’s Qr and T_w imply about 17.6 °C', () => {
    const r = replay('christmas-1974');
    expect(r.days[1]!.surfaces).toBeCloseTo(17.7, 0);
  });
  it('the closed slot of ElSherbiny, between the two sheets at 25 mm: about 1.5 W/m²·K', () => {
    expect(slotFilm(25, 10, 0.025, pressureAt(1550), 4.38)).toBeCloseTo(1.5, 0);
  });
});

describe('K39, K40, K32: the efficiency over the year (compare)', () => {
  let m: MonthlyEfficiency;
  beforeAll(() => {
    m = monthlyEfficiency();
  });
  // the source's curve, by eye: Jan, Feb, ... Dec
  const K39 = [37, 35, 31, 26, 22, 15, 17, 24, 27, 33, 36, 36];
  it('K39 the model’s months: winter 25 to 29 against 35 to 37: low; spring 18 to 24 against 22 to 31: near; summer 20 to 29 against 15 to 24: high', () => {
    expect(m.eff.map((x) => Math.round(x))).toEqual([25, 29, 24, 20, 18, 20, 28, 29, 32, 34, 29, 28]);
    expect(K39).toHaveLength(12);
  });
  it('K39 the fall from winter to May-June is there in both, of 9 points in the model’s months against 18 by eye', () => {
    const winter = (m.eff[10]! + m.eff[11]! + m.eff[0]! + m.eff[1]!) / 4;
    const late = (m.eff[4]! + m.eff[5]!) / 2;
    expect(winter - late).toBeCloseTo(8.5, 0);
  });
  it('K40 a clear day in each band: 32 % in January (near 35), 25 % in April (near 24), 22 % in June (near 17); and 37 % in October', () => {
    expect(periodicDay(15, { holdRoom: true }).eff).toBeCloseTo(31.6, 0);
    expect(periodicDay(105, { holdRoom: true }).eff).toBeCloseTo(24.8, 0);
    expect(periodicDay(166, { holdRoom: true }).eff).toBeCloseTo(22.2, 0);
    expect(periodicDay(288, { holdRoom: true }).eff).toBeCloseTo(37, 0);
  });
  it('K32 NOT RETRIEVED: 7.4 points per 10 K of air on a steady clear day, 2 % per 10 K reported; on the source’s own clear rows both slopes vanish in the scatter', () => {
    const cold = periodicDay(15, { holdRoom: true }, { airMean: 0 }).eff;
    const warm = periodicDay(15, { holdRoom: true }, { airMean: 10 }).eff;
    expect(warm - cold).toBeCloseTo(7.4, 0);
    // on the record: the source's rows and the model's, the clear days of the table
    const r = replay('dec-jan-1975');
    const rows = r.days
      .map((d, i) => ({ air: TABLE_II[i]!.air, model: d.eff, source: TABLE_II[i]!.eff ?? 0, inc: d.incident }))
      .filter((x, i) => i > 0 && x.inc > 15000);
    const slope = (key: 'model' | 'source'): number => {
      const n = rows.length;
      const sx = rows.reduce((a, b) => a + b.air, 0);
      const sy = rows.reduce((a, b) => a + b[key], 0);
      const sxx = rows.reduce((a, b) => a + b.air * b.air, 0);
      const sxy = rows.reduce((a, b) => a + b.air * b[key], 0);
      return (10 * (n * sxy - sx * sy)) / (n * sxx - sx * sx);
    };
    expect(Math.abs(slope('model'))).toBeLessThan(2.5);
    expect(Math.abs(slope('source'))).toBeLessThan(2.5);
  });
});

describe('K22, K41 to K45, K76 to K78: the solar share. FIND: nothing to tune it to', () => {
  let ladder: Ladder;
  beforeAll(() => {
    ladder = shareLadder(presetParams('prototype-1967'));
  });
  it('K22 the books: the dark house, vents shut and no people, needs 98 % of G·V·ΔT: so that load is what the network really has', () => {
    const shut = seasonRun({ ...presetParams('prototype-1967'), gains: 0, vents: 'closed' }, { sunScale: 0 });
    expect(shut.aux / shut.load).toBeCloseTo(0.977, 1);
    expect(shut.load).toBeCloseTo(46670, -2);
  });
  it('K77 FIND the wall alone over a season: 32 %. The research’s rough balance: 31–36 %', () => {
    expect(ladder.wallOnly.share).toBeCloseTo(32, 0);
  });
  it('K78 FIND with the south windows: 42 to 43 %', () => {
    expect(ladder.wallAndWindows.share).toBeCloseTo(42.5, 0);
  });
  it('K22 FIND with the windows and the people: 47 %. The inventors say 60–70 %, a 1978 model about 40 %, a colleague 75–90 %', () => {
    expect(ladder.all.share).toBeCloseTo(47.1, 0);
    // against the same house in the dark: the wall loses less by day, and the loop in the dark takes heat
    expect(ladder.allAgainstDark).toBeCloseTo(50.3, 0);
  });
  it('K22, the lines of that season: wall by air 10, by conduction 14, windows 19, people 6, electricity 53 % of G·V·ΔT', () => {
    const a = ladder.all;
    expect(a.wallAirShare).toBeCloseTo(9.8, 0);
    expect(a.wallConductionShare).toBeCloseTo(14.4, 0);
    expect(a.windowShare).toBeCloseTo(18.9, 0);
    expect(a.gainsShare).toBeCloseTo(6, 0);
    expect(a.auxShare).toBeCloseTo(52.9, 0);
    expect(a.efficiency).toBeCloseTo(26, 0);
  });
  it('energy closes over the season: the book’s residual is nothing beside what passes', () => {
    const a = ladder.all;
    expect(Math.abs(a.residual) / (a.sunWall * 3.6e6)).toBeLessThan(1e-6);
  });
  it('K58 FIND what the air does: 3 K warmer 54.9 %, 5 K warmer 61.1 %: the ERA5 grid’s cold reading matters more than the windows', () => {
    const p = presetParams('prototype-1967');
    expect(seasonRun(p, { airOffset: 3 }).share).toBeCloseTo(54.9, 0);
    expect(seasonRun(p, { airOffset: 5 }).share).toBeCloseTo(61.1, 0);
  });
  it('K22 what the inventors’ 60–70 % takes: air 5 K warmer 61.1 %; 3 K warmer in a room at 18 °C 61.6 %; 3 K warmer with night screens 62.1 %; 5 K warmer at 18 °C 68.9 %', () => {
    const p = presetParams('prototype-1967');
    expect(seasonRun(p, { airOffset: 5 }).share).toBeCloseTo(61.1, 0);
    expect(seasonRun({ ...p, setpoint: 18 }, { airOffset: 3 }).share).toBeCloseTo(61.6, 0);
    expect(seasonRun({ ...p, nightShutter: true }, { airOffset: 3 }).share).toBeCloseTo(62.1, 0);
    expect(seasonRun({ ...p, setpoint: 18 }, { airOffset: 5 }).share).toBeCloseTo(68.9, 0);
  });
  it('K22 Chauvency FIND: the same house under cloud: 32 %, reported 35–45 % for their house there', () => {
    expect(seasonRun({ ...presetParams('at-chauvency') }).share).toBeCloseTo(31.7, 0);
  });
  it('K41 no method behind 75–90 %: what it takes in the model: the 1974 envelope and more, not the 1967 house', () => {
    expect(seasonRun({ ...presetParams('insulated') }).share).toBeCloseTo(74.2, 0);
  });
  it('K42 about 40 % by a 1978 model: within the model’s own ladder, with the windows counted', () => {
    expect(ladder.wallAndWindows.share).toBeGreaterThan(40);
    expect(ladder.wallOnly.share).toBeLessThan(40);
  });
  it('K44 Kelbaugh, 72 % at a cooler room: 17 to 20 °C rather than 20 °C. In this house a setpoint of 18 °C gives 52.6 %', () => {
    expect(seasonRun({ ...presetParams('prototype-1967'), setpoint: 18 }).share).toBeCloseTo(52.6, 0);
  });
  it('K45 thickness: Balcomb’s model finds 68 % at 1 ft against a little over 70 % for an isothermal wall. Here the share hardly moves: 46.6 to 48.1 % from 15 to 80 cm, top at about 30 cm', () => {
    const p = presetParams('prototype-1967');
    const at = (t: number): number => seasonRun({ ...p, wallThickness: t }).share;
    expect(at(0.8)).toBeCloseTo(46.6, 0);
    expect(at(0.3)).toBeCloseTo(48.1, 0);
    expect(at(0.15)).toBeCloseTo(47.4, 0);
  });
  it('the time step does not write the share: 60 s and 120 s agree within 0.2 of a point', () => {
    const p = presetParams('prototype-1967');
    expect(Math.abs(seasonRun(p, { dt: 60 }).share - seasonRun(p, { dt: 120 }).share)).toBeLessThan(0.2);
  });
  it('the seed of the series moves the share by about half a point', () => {
    const p = presetParams('prototype-1967');
    const s = [1, 2, 3, 4, 5].map((seed) => seasonRun(p, { seed }).share);
    expect(Math.max(...s) - Math.min(...s)).toBeLessThan(1);
    expect(seeded(1)()).toBe(seeded(1)());
  });
  it('K79 what G·V means: read as the rest of the house, wall and windows losing on top, the share falls to 24 %, 41 % against that dark house', () => {
    const l = shareLadder({ ...presetParams('prototype-1967'), gvHoldsWall: false });
    expect(l.all.share).toBeCloseTo(23.7, 0);
    expect(l.allAgainstDark).toBeCloseTo(40.7, 0);
  });
  it('K80 what the loss factor does: at 30 the flow is the recorded 20 L/s and the air out 48 °C, too hot; the season moves by under a point. The factor it asks is not in any handbook', () => {
    const a = seasonRun({ ...presetParams('prototype-1967'), lossK: 30 });
    expect(Math.abs(a.share - ladder.all.share)).toBeLessThan(1);
    const r = replay('dec-jan-1975', { lossK: 30 });
    expect(Math.max(...r.days.map((d) => d.flowMax))).toBeCloseTo(20.7, 0);
    expect(Math.max(...r.days.map((d) => d.gapOutMax))).toBeCloseTo(48.2, 0);
    expect(totals(r.days.slice(1)).thermo).toBeCloseTo(43.2, 0);
  });
});

describe('K46 to K48: the vents and the night', () => {
  const room = { backup: false, wallThickness: 0.406, southWindows: 0, gains: 0 };
  it('K46 with vents, a 16 in. wall, no window: full swing 6.5 K, peak 15 h. Test room: 26 °F (14 K), 4 p.m. The model’s room is much bigger for its wall', () => {
    const p = periodicDay(46, { ...room, vents: 'open' });
    expect(2 * p.roomSwing).toBeCloseTo(6.5, 0);
    expect(p.roomPeakHour).toBeCloseTo(15.2, 0);
  });
  it('K46 without vents: swing 2.2 K, peak 20.7 h. Test room: 9 °F (5 K), 10 p.m. The same ratio of about three, and the peak goes as late', () => {
    const p = periodicDay(46, { ...room, vents: 'closed' });
    expect(2 * p.roomSwing).toBeCloseTo(2.2, 0);
    expect(p.roomPeakHour).toBeCloseTo(20.7, 0);
    const o = periodicDay(46, { ...room, vents: 'open' });
    expect(o.roomSwing / p.roomSwing).toBeCloseTo(2.9, 0);
  });
  it('K48 FIND reverse flow: on a clear December night the model runs backward at −12 L/s for 5 h. S1’s curves show none. It costs 0.4 kWh a night here', () => {
    const n = nightRun();
    expect(n.flowMin).toBeCloseTo(-12.2, 0);
    expect(n.backwardHours).toBeCloseTo(5, 0);
    expect(n.nightQt).toBeCloseTo(-0.37, 1);
  });
  it('K47 a thinner wall: −16.5 L/s for 7 h, 1.4 kWh a night. A one-way flap stops it', () => {
    const n = nightRun({ wallThickness: 0.37 });
    expect(n.flowMin).toBeCloseTo(-16.5, 0);
    expect(n.nightQt).toBeCloseTo(-1.38, 0);
    expect(nightRun({ vents: 'one-way' }).flowMin).toBe(0);
  });
  it('K47 Kelbaugh’s one-half: the ducts are 41 % of the gap’s section. Half that section: 25 L/s, 33.3 %; a quarter: 14 L/s, 31.0 %, against 41 L/s, 35.0 % as built', () => {
    const half = replay('dec-jan-1975', { ductScale: 0.5 });
    expect(Math.max(...half.days.map((d) => d.flowMax))).toBeCloseTo(25, 0);
    expect(totals(half.days.slice(1)).eff).toBeCloseTo(33.3, 0);
    const quarter = replay('dec-jan-1975', { ductScale: 0.25 });
    expect(Math.max(...quarter.days.map((d) => d.flowMax))).toBeCloseTo(14.3, 0);
    expect(totals(quarter.days.slice(1)).eff).toBeCloseTo(31, 0);
  });
  it('FIND with the vents shut, a clear October day: the black face reaches 70 °C', () => {
    expect(periodicDay(296, { vents: 'closed', backup: false }).outerMax).toBeCloseTo(69.7, 0);
  });
});

describe('FIND: how long the wall carries a house with no sun', () => {
  it('the sun goes out after clear days: the wall gives 45 kWh, then 10; by the third day it takes from the room', () => {
    const d = darkRun();
    expect(d.byDay[0]).toBeCloseTo(45.4, 0);
    expect(d.byDay[1]).toBeCloseTo(9.7, 0);
    expect(d.byDay[2]).toBeLessThan(0);
    expect(d.loadPerDay).toBeCloseTo(248, -1);
    expect(d.daysToTenth).toBe(1);
  });
});

describe('K49 to K54, K88 to K91: the earth tube, a what-if', () => {
  it('K49–K54 dimensions: speeds 2.6, 5.7, 1.6 m/s, against 2.2, 5.6, 1.6 m/s', () => {
    expect(MEASURED_TUBES.map((t) => tubeSpeed(t.spec))).toEqual([
      expect.closeTo(2.6, 1),
      expect.closeTo(5.66, 1),
      expect.closeTo(1.59, 1),
    ]);
  });
  it('K54 NOT RETRIEVED: Θ by a steady soil, 0.56, 0.36, 0.69, against 0.944, 0.766, 0.804. Too pessimistic for pipes run part of the time; from the source’s own fitted coefficient: 0.92, 0.66, 0.81', () => {
    expect(MEASURED_TUBES.map((t) => tubeTheta(t.spec))).toEqual([
      expect.closeTo(0.56, 1),
      expect.closeTo(0.36, 1),
      expect.closeTo(0.69, 1),
    ]);
    expect(MEASURED_TUBES.map((t) => thetaFromMeasured(t.spec, t.hReported))).toEqual([
      expect.closeTo(0.92, 1),
      expect.closeTo(0.66, 1),
      expect.closeTo(0.81, 1),
    ]);
  });
  it('K88 the soil at Odeillo: its mean is the air’s 6.6 °C, about 7 °C as the research estimated', () => {
    let m = 0;
    for (let d = 1; d <= 365; d++) m += soilTemperature(SITES.odeillo, d, 2) / 365;
    expect(m).toBeCloseTo(6.6, 0);
  });
  it('K90 FIND the house’s pipe at Odeillo: January −1 → 3 °C, July 15 → 10 °C; 625 kWh a year of a 57,000 kWh load', () => {
    const y = tubeYear('odeillo');
    expect(y.airJan).toBeCloseTo(-1, 0);
    expect(y.outJan).toBeCloseTo(3, 0);
    expect(y.outJul).toBeCloseTo(10.4, 0);
    expect(y.heatingKWh).toBeCloseTo(625, -1);
    expect(y.loadKWh).toBeCloseTo(57125, -2);
    expect(y.coolingKWh).toBe(0);
    expect(HOUSE_TUBE.flow).toBe(150);
  });
  it('K90 at sea level, Perpignan: January 8 → 12 °C, July 25 → 20 °C, 731 kWh of heat, 484 kWh of cooling', () => {
    const y = tubeYear('perpignan');
    expect(y.outJan).toBeCloseTo(12, 0);
    expect(y.outJul).toBeCloseTo(20.1, 0);
    expect(y.heatingKWh).toBeCloseTo(731, -1);
    expect(y.coolingKWh).toBeCloseTo(484, -1);
  });
  it('FIND the tube in the house: 1 point of share at Odeillo', () => {
    const p = presetParams('prototype-1967');
    const on = seasonRun({ ...p, earthTube: true }).share;
    const off = seasonRun(p).share;
    expect(on - off).toBeCloseTo(1, 0);
  });
});

describe('K85 to K87, K44: the arithmetic of the research', () => {
  it('K85 the interior from the outline: about 80 m² before partitions, against 76 m²', () => {
    expect((15 - 2 * 0.3) * (6.6 - 0.6 - 0.12 - 0.05 - 0.3)).toBeCloseTo(79.6, 1);
  });
  it('K86 the roof’s pitch: about 24°', () => {
    expect((Math.atan(1.45 / 3.3) * 180) / Math.PI).toBeCloseTo(23.7, 1);
  });
  it('K87 Morse to Trombe: 86 years to 1967, 90 to the patent’s priority', () => {
    expect([1967 - 1881, 1971 - 1881]).toEqual([86, 90]);
  });
  it('K44 Kelbaugh’s 72 %: 338 against 1,221 ccf, exact', () => {
    expect(100 * (1 - 338 / 1221)).toBeCloseTo(72.3, 1);
  });
  it('K49–K54 specific areas of the three pipes: 0.16, 0.075, 0.18 m²/(m³/h), from the dimensions used', () => {
    const area = (t: (typeof MEASURED_TUBES)[number]): number =>
      (t.spec.count * Math.PI * t.spec.diameter * t.spec.length) / t.spec.flow;
    expect(area(MEASURED_TUBES[0]!)).toBeCloseTo(0.16, 2);
    expect(area(MEASURED_TUBES[1]!)).toBeCloseTo(0.075, 2);
    expect(area(MEASURED_TUBES[2]!)).toBeCloseTo(0.18, 2);
  });
  it('K54 Θ from the source’s own NTU (2.59, 1.57, 1.74): 0.925, 0.792, 0.824 against the printed 0.944, 0.766, 0.804', () => {
    expect(1 - Math.exp(-2.59)).toBeCloseTo(0.925, 3);
    expect(1 - Math.exp(-1.57)).toBeCloseTo(0.792, 3);
    expect(1 - Math.exp(-1.74)).toBeCloseTo(0.824, 3);
  });
});

describe('K80 what would reconcile the flow with the source’s error bars', () => {
  it('a loss factor of 16, four times the handbook’s, or ducts of half the printed section: 25–26 L/s and 45 °C, against 20 L/s ± 28 % and 40–43 °C', () => {
    const k16 = replay('dec-jan-1975', { lossK: 16 });
    expect(Math.max(...k16.days.map((d) => d.flowMax))).toBeCloseTo(25.9, 0);
    expect(Math.max(...k16.days.map((d) => d.gapOutMax))).toBeCloseTo(44.6, 0);
    expect(20 * 1.28).toBeCloseTo(25.6, 1);
    const half = replay('dec-jan-1975', { ductScale: 0.5 });
    expect(Math.max(...half.days.map((d) => d.flowMax))).toBeCloseTo(25, 0);
    expect(Math.max(...half.days.map((d) => d.gapOutMax))).toBeCloseTo(45.1, 0);
  });
});

describe('the comparators: K62 to K70 stand outside the model', () => {
  it('K66 the peak of the other road: 7.4 W/m² × 156 m² = 1,154 W', () => {
    expect(7.4 * 156).toBeCloseTo(1154.4, 1);
  });
  it('K72, K4 the house’s own peak by G·V: 489 W/K at −10 °C is 14.7 kW', () => {
    expect(HOUSE_1967.G * HOUSE_1967.volume).toBeCloseTo(489, 0);
    expect(489 * 30).toBeCloseTo(14670, 0);
  });
});

describe('the records used by the scenarios', () => {
  it('K37, K38 every record has its printed energies', () => {
    expect(RECORDS['christmas-1974'].map((d) => d.incident)).toEqual([20.3, 21.63, 1.134, 20.034]);
    expect(RECORDS['feb-1975'].map((d) => d.incident)).toEqual([22.38, 16.87, 5.09, 17.81]);
    expect(RECORDS['april-1975'].map((d) => d.incident)).toEqual([16.1, 15.82, 16.26, 9.68]);
    expect(RECORDS['june-1975'].map((d) => d.incident)).toEqual([7.56, 9.83, 10.21, 10.2]);
  });
  it('K19 the source’s conditions are those of `sourceParams`', () => {
    const p = sourceParams();
    expect(p.holdRoom).toBe(true);
    expect(p.setpoint).toBe(20);
  });
});
