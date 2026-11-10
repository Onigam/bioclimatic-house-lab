import { describe, expect, it } from 'vitest';
import { HOUSE_1967, COLLECTOR_1967, COLLECTOR_1974 } from '../sim/machine';
import {
  BAY,
  BAYS,
  BAY_KINDS,
  CEILING,
  COLLECTOR_BAYS,
  CUT_X,
  DEPTH,
  ELEMENT_1967,
  ELEMENT_1974,
  LENGTH,
  ROOF_PITCH,
  ROOM,
  TUBE,
  X_EAST_IN,
  X_WEST_IN,
  Y_EAVE,
  Y_RIDGE,
  bayX,
  collectorGlassArea,
  elementGlassArea,
  elementLayout,
  elementSpecOf,
  interiorArea,
} from './dims';
import { HOUSE_TUBE } from '../sim/earth-tube';
import { tubeRoute } from './house/earthtube';
import { slopeY, groundY, landAtWalls } from './land/ground';
import { GROUND_NORTH, GROUND_SOUTH, Z_NORTH, Z_SOUTH } from './dims';

// The one source of the dimensions: what the simulation owns is read from `machine.ts`; the rest closes on it, and the drawing agrees with the model where they share a number.

describe('the dimensions', () => {
  it('reads the element from the simulation: 1967 and 1974 as printed', () => {
    expect(ELEMENT_1967.width).toBe(COLLECTOR_1967.elementWidth);
    expect(ELEMENT_1967.height).toBe(COLLECTOR_1967.elementHeight);
    expect(ELEMENT_1967.thickness).toBe(COLLECTOR_1967.wallThickness);
    expect(ELEMENT_1967.gap).toBe(COLLECTOR_1967.gap);
    expect(ELEMENT_1967.glass).toBe(COLLECTOR_1967.glassThickness);
    expect(ELEMENT_1967.layers).toBe(COLLECTOR_1967.glassLayers);
    expect(ELEMENT_1967.ductWidth).toBe(COLLECTOR_1967.ductWidth);
    expect(ELEMENT_1967.ductHeight).toBe(COLLECTOR_1967.ductHeight);
    expect(ELEMENT_1967.ductSpan).toBe(COLLECTOR_1967.ductSpan);
    expect(ELEMENT_1974.width).toBe(COLLECTOR_1974.elementWidth);
    expect(ELEMENT_1974.ductSpan).toBe(COLLECTOR_1974.ductSpan);
  });

  it('draws the duct as the section the model uses: 56.5 × 11 cm, 621.5 cm²', () => {
    expect(ELEMENT_1967.ductWidth * ELEMENT_1967.ductHeight * 1e4).toBeCloseTo(621.5, 0);
  });

  it('puts the ducts 3.50 m apart, in the element, with the margins the model has', () => {
    const L = elementLayout(ELEMENT_1967);
    expect(L.yDuctHigh - L.yDuctLow).toBeCloseTo(3.5, 9);
    // the pocket above and below: (4.38 − 3.50) / 2 about the duct's axis (physics §2)
    expect(L.yDuctLow - L.yBottom).toBeCloseTo((4.38 - 3.5) / 2, 9);
    expect(L.yTop - L.yDuctHigh).toBeCloseTo((4.38 - 3.5) / 2, 9);
    // the lower duct's underside is 0.10 m above the floor
    expect(L.ySillTop).toBeCloseTo(0.1, 9);
  });

  it('puts the black face 12 cm behind the last sheet and the room face a wall’s thickness behind it', () => {
    const L = elementLayout(ELEMENT_1967);
    expect(L.lastBack - L.face).toBeCloseTo(0.12, 9);
    expect(L.face - L.inner).toBeCloseTo(0.6, 9);
    expect(L.sheetFront.length).toBe(2);
    expect(L.sheetFront[0]! - L.sheetFront[1]!).toBeCloseTo(ELEMENT_1967.glass + ELEMENT_1967.spacing, 9);
  });

  it('follows the sliders: thickness moves the inner face and not the glass, sheets add a sheet', () => {
    const a = elementLayout(elementSpecOf({ wallThickness: 0.6, gap: 0.12, glazingLayers: 2 }));
    const b = elementLayout(elementSpecOf({ wallThickness: 0.37, gap: 0.12, glazingLayers: 2 }));
    expect(b.sheetFront).toEqual(a.sheetFront);
    expect(b.inner - a.inner).toBeCloseTo(0.23, 9);
    const c = elementLayout(elementSpecOf({ wallThickness: 0.6, gap: 0.12, glazingLayers: 3 }));
    expect(c.sheetFront.length).toBe(3);
    expect(c.face).toBeLessThan(a.face);
    const w = elementSpecOf({ wallThickness: 0.6, gap: 0.12, glazingLayers: 2, ductScale: 0.5 });
    expect(w.ductWidth).toBeCloseTo(ELEMENT_1967.ductWidth / 2, 9);
  });

  it('draws the reported 48 m² of collector, within its frames: 9 bays of net glass', () => {
    expect(COLLECTOR_BAYS.length).toBe(9);
    const area = collectorGlassArea();
    expect(Math.abs(area / HOUSE_1967.collectorArea - 1)).toBeLessThan(0.04);
    expect(elementGlassArea()).toBeLessThan(COLLECTOR_1967.elementHeight * COLLECTOR_1967.elementWidth);
    // the model's collector per volume, exact: 48 m² over 300 m³
    expect(HOUSE_1967.collectorArea / HOUSE_1967.volume).toBeCloseTo(HOUSE_1967.collectorPerVolume, 9);
  });

  it('is twelve bays of 1.27 m: 15.24 m, against the open data’s 15.0 ± 3', () => {
    expect(BAYS).toBe(12);
    expect(BAY_KINDS.length).toBe(BAYS);
    expect(LENGTH).toBeCloseTo(12 * 1.27, 9);
    expect(Math.abs(LENGTH - 15.0)).toBeLessThan(3);
    expect(DEPTH).toBe(6.6);
    expect(bayX(0)).toBeCloseTo(-LENGTH / 2 + BAY / 2, 9);
    expect(bayX(BAYS - 1)).toBeCloseTo(LENGTH / 2 - BAY / 2, 9);
    expect(BAY_KINDS.filter((k) => k === 'window').length).toBe(1);
    expect(BAY_KINDS.filter((k) => k === 'recess').length).toBe(2);
    // the section passes through the middle of the sample bay
    expect(CUT_X).toBeCloseTo(bayX(7), 9);
  });

  it('holds the volume and the floor of the house, from the drawing: 300 m³ and 76 m² within their rounding', () => {
    const interior = interiorArea();
    // the partitions take the rest: the inventors' 76 m² of living area is under the drawn 80 m² of interior
    expect(interior).toBeGreaterThan(HOUSE_1967.floorArea);
    expect(interior).toBeLessThan(HOUSE_1967.floorArea * 1.09);
    expect(CEILING * HOUSE_1967.floorArea).toBeCloseTo(HOUSE_1967.volume, 6);
    expect(interior * CEILING).toBeLessThan(HOUSE_1967.volume * 1.12);
    expect(interior * CEILING).toBeGreaterThan(HOUSE_1967.volume * 0.98);
  });

  it('pitches the roof at the open data’s 24°, the ridge about 1.45 m over the eaves', () => {
    expect((ROOF_PITCH * 180) / Math.PI).toBeCloseTo(24, 6);
    expect(Y_RIDGE - Y_EAVE).toBeGreaterThan(1.3);
    expect(Y_RIDGE - Y_EAVE).toBeLessThan(1.6);
  });

  it('puts the ground where the walls say: 2 m of fall across the footprint, flat across the house', () => {
    const w = landAtWalls();
    expect(w.north).toBeCloseTo(GROUND_NORTH, 6);
    expect(w.south).toBeCloseTo(GROUND_SOUTH, 6);
    // the low end of the open data's 2 to 3.5 m (research §3): 2.0 m, the same figure as docs/3d.md
    expect(GROUND_NORTH - GROUND_SOUTH).toBeCloseTo(2.0, 9);
    // and the eaves, from the south ground, stay inside the open data's 5.8 to 6.7 m
    expect(Y_EAVE - GROUND_SOUTH).toBeGreaterThan(5.8);
    expect(Y_EAVE - GROUND_SOUTH).toBeLessThan(6.7);
    for (const x of [-12, -7, 0, 7, 30, 50]) expect(groundY(x, 0)).toBeCloseTo(slopeY(0), 9);
    // monotone along the front: falls to the south, rises to the north
    for (let z = -30; z < 40; z += 2) expect(slopeY(z + 2)).toBeLessThan(slopeY(z));
    expect(Z_SOUTH).toBeGreaterThan(Z_NORTH);
  });

  it('places the north window and the fresh-air vent along the north wall, clear of the gables and of each other', () => {
    const a = ROOM.northWindow;
    const b = ROOM.freshVent;
    expect(a.x - a.w / 2).toBeGreaterThan(X_WEST_IN);
    expect(b.x + b.w / 2).toBeLessThan(X_EAST_IN);
    expect(b.x - b.w / 2).toBeGreaterThan(a.x + a.w / 2);
  });

  it('draws the earth tube at the model’s size: 50 m, Ø0.2 m, 2 m deep', () => {
    expect(TUBE.length).toBe(HOUSE_TUBE.length);
    expect(TUBE.diameter).toBe(HOUSE_TUBE.diameter);
    expect(TUBE.depth).toBe(HOUSE_TUBE.depth);
    const r = tubeRoute();
    let len = 0;
    for (let i = 1; i < r.length; i++) len += Math.hypot(r[i]!.x - r[i - 1]!.x, r[i]!.z - r[i - 1]!.z);
    expect(Math.abs(len / TUBE.length - 1)).toBeLessThan(0.05);
  });
});

describe('the source of dims.ts', () => {
  const src = import.meta.glob('./dims.ts', { query: '?raw', import: 'default', eager: true }) as Record<
    string,
    string
  >;
  const text = Object.values(src)[0]!;
  it('tags every constant that is a number or a table: reported, derived, estimate or assumption', () => {
    const lines = text.split('\n');
    const bad: string[] = [];
    lines.forEach((ln, i) => {
      const m = /^export const ([A-Z_a-z0-9]+)\b/.exec(ln);
      if (!m) return;
      // a function (an arrow, or a typed arrow) needs no tag: it computes from tagged numbers
      if (/=>\s*$|=\s*\(.*\)\s*(:\s*[\w<>\[\], ]+)?\s*=>/.test(ln) || /=\s*\(\)/.test(ln)) return;
      const around = lines.slice(Math.max(0, i - 7), i + 1).join('\n');
      if (!/reported|derived|estimate|assumption|from the model|from the sim|the simulation/i.test(around))
        bad.push(m[1]!);
    });
    expect(bad).toEqual([]);
  });
});
