import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { HouseSim } from '../sim/engine';
import { AIR_VISUAL_CAP } from './collector/air';
import {
  BALCONY,
  CEILING,
  CEILING_T,
  CHIMNEY,
  CUT_X,
  EAVE,
  ELEMENT_1967,
  GROUND_NORTH,
  GROUND_SOUTH,
  LIVING_X0,
  LIVING_X1,
  PARTITION,
  SAMPLE_BAY,
  SITE,
  STAIR_STEPS,
  Y_EAVE,
  Y_RIDGE,
  Z_NORTH,
  Z_NORTH_IN,
  Z_SOUTH,
  bayX,
  elementLayout,
} from './dims';
import { roofUnder, stepTops, Z_RUN } from './house/shell';
import { createHouseScene } from './house/scene';
import { FIELD, groundY, landY } from './land/ground';
import { createRoomScene } from './room/scene';
import { createSiteScene } from './site/scene';
import { sunDirection } from './sun';
import { meshBox, stateWith, view } from './test-utils';
import { createWallScene } from './wall/scene';

// One machine, the same everywhere: the collector element and the house are the same functions in every world, and the shared parts sit within 3 mm of each other. Attached and resting: each body against its support,
// each driver against what it drives, measured on the meshes of the body.

const params = () => ({ setpoint: 20, gap: 0.12, glazingLayers: 2, earthTube: true, wind: 2 });
const wall = createWallScene({ params }) as ReturnType<typeof createWallScene> & { build: any };
const house = createHouseScene({ params }) as ReturnType<typeof createHouseScene> & any;
const room = createRoomScene({ params }) as ReturnType<typeof createRoomScene> & any;
const site = createSiteScene({ params }) as ReturnType<typeof createSiteScene> & any;
const frame = (mod: { update: (s: any, dt: number, v: any) => void; scene: THREE.Scene }, over = {}, v = {}) => {
  const s = stateWith(over);
  mod.update(s, 1 / 60, view(v));
  mod.update(s, 1 / 60, view(v));
  mod.scene.updateMatrixWorld(true);
  return s;
};
for (const m of [wall, house, room, site]) frame(m);

const named = (root: THREE.Object3D, name: string): THREE.Mesh => {
  let out: THREE.Mesh | null = null;
  root.traverse((o) => {
    if ((o as THREE.Mesh).isMesh && o.name === name) out = o as THREE.Mesh;
  });
  if (!out) throw new Error(`no mesh named ${name}`);
  return out;
};
/** A mesh's box in the frame of `root`, instances not counted: just its geometry, placed by the mesh's own transform inside its part. */
const geoBox = (m: THREE.Mesh, root: THREE.Object3D): THREE.Box3 => {
  m.geometry.computeBoundingBox();
  const b = m.geometry.boundingBox!.clone();
  root.updateWorldMatrix(true, false);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const rel = new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld);
  return b.applyMatrix4(rel);
};
const near = (a: THREE.Box3, b: THREE.Box3, tol: number, what: string) => {
  expect(a.min.distanceTo(b.min), `${what} min`).toBeLessThan(tol);
  expect(a.max.distanceTo(b.max), `${what} max`).toBeLessThan(tol);
};
const touches = (a: THREE.Box3, b: THREE.Box3, tol: number): boolean => a.clone().expandByScalar(tol).intersectsBox(b);

describe('one collector element, the same in every world (within 3 mm)', () => {
  /** Every mesh of the element's 14 parts, by name, in the element's frame, with the instrumented bay's x taken out. */
  function boxes(build: any, bayIndex: number | null): Map<string, THREE.Box3> {
    const out = new Map<string, THREE.Box3>();
    for (const [id, g] of Object.entries(build.groups) as [string, THREE.Group][]) {
      g.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const b = geoBox(m, build.root);
        // a single mesh stands at its bay's x: take it out so that the element is compared at x = 0
        if (!(m as THREE.InstancedMesh).isInstancedMesh && bayIndex !== null)
          b.translate(new THREE.Vector3(-build.bays[bayIndex], 0, 0));
        out.set(`${id}/${m.name}`, b);
      });
    }
    return out;
  }
  const w = boxes(wall.build, 0);
  const h = boxes(house.build.collector, house.build.collector.instrumented);
  const r = boxes(room.house.collector, room.house.collector.instrumented);
  const s = boxes(site.houses[0].collector, site.houses[0].collector.instrumented);
  it('has the same meshes in each', () => {
    expect([...h.keys()].sort()).toEqual([...w.keys()].sort());
    expect([...r.keys()].sort()).toEqual([...w.keys()].sort());
    expect([...s.keys()].sort()).toEqual([...w.keys()].sort());
    expect(w.size).toBeGreaterThan(25);
  });
  for (const [world, other] of [
    ['house', h],
    ['room', r],
    ['site', s],
  ] as const) {
    it(`puts every shared piece of the element within 3 mm: wall against ${world}`, () => {
      for (const [k, b] of w) near(b, other.get(k)!, 0.003, k);
    });
  }
  it('stands on every one of the nine bays in the house, one instance each', () => {
    const m = named(house.build.collector.groups['storage-wall'], 'wall') as THREE.InstancedMesh;
    expect(m.count).toBe(9);
    const x = new Set<number>();
    const mat = new THREE.Matrix4();
    for (let i = 0; i < m.count; i++) {
      m.getMatrixAt(i, mat);
      x.add(Math.round(mat.elements[12]! * 1000));
    }
    expect(x.size).toBe(9);
  });
});

describe('the house, the same in every world (within 3 mm)', () => {
  const EXTERIOR = [
    'south-facade',
    'entrance-recess',
    'entrance-balcony',
    'south-window',
    'east-gable',
    'west-gable',
    'north-wall',
    'north-window',
    'pitched-roof',
    'chimney',
    'foundation',
    'floor-slab',
  ] as const;
  // measured on the meshes whether or not the world shows them (the room hides the roof)
  const bx = (g: THREE.Object3D) => new THREE.Box3().setFromObject(g, true);
  for (const id of EXTERIOR) {
    it(`${id}: house, room and site draw it in the same place`, () => {
      const a = bx(house.build.groups[id]);
      expect(a.isEmpty(), id).toBe(false);
      near(a, bx(room.house.groups[id]), 0.003, `room ${id}`);
      near(a, bx(site.houses[0].groups[id]), 0.003, `site ${id}`);
    });
    it(`${id}: the twin is the prototype moved along the row`, () => {
      const a = bx(site.houses[0].groups[id]).translate(new THREE.Vector3(SITE.twinAt, 0, 0));
      near(a, bx(site.houses[1].groups[id]), 0.003, `twin ${id}`);
    });
  }
});

describe('the sliders move the 3D', () => {
  it('thickness: the inner face moves into the room, the glass stays where it is', () => {
    const before = elementLayout(wall.build.spec);
    const wm = named(wall.build.groups['storage-wall'], 'wall') as THREE.Mesh;
    wm.geometry.computeBoundingBox();
    const zSize0 = wm.geometry.boundingBox!.max.z - wm.geometry.boundingBox!.min.z;
    expect(zSize0).toBeCloseTo(0.6, 3);
    const outer0 = geoBox(named(wall.build.groups['outer-glazing'], 'outer-sheet'), wall.build.root);
    frame(wall, { wallThickness: 0.37 });
    const after = elementLayout(wall.build.spec);
    wm.geometry.computeBoundingBox();
    expect(wm.geometry.boundingBox!.max.z - wm.geometry.boundingBox!.min.z).toBeCloseTo(0.37, 3);
    expect(after.inner - before.inner).toBeCloseTo(0.23, 6);
    near(
      outer0,
      geoBox(named(wall.build.groups['outer-glazing'], 'outer-sheet'), wall.build.root),
      0.001,
      'outer glass',
    );
    frame(wall, { wallThickness: 0.6 });
  });
  it('the house follows: the foundation and the head band run to the new face', () => {
    frame(house, { wallThickness: 0.45 });
    const foot = named(house.build.groups.foundation, 'foundation-south');
    foot.geometry.computeBoundingBox();
    const L = elementLayout(house.build.spec);
    expect(foot.geometry.boundingBox!.min.z).toBeCloseTo(Z_SOUTH + L.inner, 3);
    frame(house, { wallThickness: 0.6 });
  });
  it('sheets: a third sheet appears in the glazing', () => {
    const sim = new HouseSim();
    sim.set({ glazingLayers: 3 });
    const mod = createWallScene({ params: () => ({ gap: 0.12, glazingLayers: 3 }) }) as ReturnType<
      typeof createWallScene
    > & { build: any };
    mod.update(stateWith({}, { glazingLayers: 3 }), 1 / 60, view());
    const mid = named(mod.build.groups['inner-glazing'], 'middle-sheet');
    expect(mid.visible).toBe(true);
    expect(mod.build.layout.sheetFront.length).toBe(3);
  });
});

describe('attached and resting', () => {
  const frameBox = geoBox(
    named(house.build.collector.groups['steel-frame'], 'frame'),
    house.build.collector.root,
  ).translate(new THREE.Vector3(0, 0, Z_SOUTH));
  it('the foundation’s south wall carries the frame: its top is the frame’s foot, its face the front', () => {
    const f = geoBox(named(house.build.groups.foundation, 'foundation-south'), house.build.root);
    expect(Math.abs(f.max.y - frameBox.min.y)).toBeLessThan(0.003);
    expect(Math.abs(f.max.z - Z_SOUTH)).toBeLessThan(0.003);
    // and its foot is under the ground at the front
    expect(f.min.y).toBeLessThan(GROUND_SOUTH);
  });
  it('the head band carries the roof: the rafters’ feet stand on it', () => {
    const band = geoBox(named(house.build.groups['south-facade'], 'head-band'), house.build.root);
    expect(Math.abs(band.max.y - Y_EAVE)).toBeLessThan(0.003);
    expect(Math.abs(band.min.y - elementLayout(ELEMENT_1967).yTop)).toBeLessThan(0.003);
    // the rafters' underside is the line through the head band's top at the front face and goes on to the tail of the eave
    const rafters = named(house.build.groups['pitched-roof'], 'rafters');
    const p = rafters.geometry.attributes.position as THREE.BufferAttribute;
    let tail = Infinity;
    for (let i = 0; i < p.count; i++) if (p.getZ(i) > Z_SOUTH) tail = Math.min(tail, p.getY(i));
    expect(Math.abs(tail - roofUnder(Z_SOUTH + EAVE))).toBeLessThan(0.003);
    expect(Math.abs(roofUnder(Z_SOUTH) - Y_EAVE)).toBeLessThan(1e-9);
  });
  it('the chimney stands on the ceiling and clears the ridge', () => {
    const stack = geoBox(named(house.build.groups.chimney, 'stack'), house.build.root);
    expect(Math.abs(stack.min.y - (CEILING + CEILING_T))).toBeLessThan(0.003);
    // `CHIMNEY.above` is measured from the ridge line to the stack's top (dims.ts), which is what the drawing's elevation reads too
    expect(Math.abs(stack.max.y - (Y_RIDGE + CHIMNEY.above))).toBeLessThan(0.003);
    expect(Math.abs(stack.min.x - (CHIMNEY.x - CHIMNEY.w / 2))).toBeLessThan(0.003);
  });
  it('the north wall stands on the ground at its foot, the south ground is where the dims say', () => {
    expect(groundY(0, Z_NORTH)).toBeCloseTo(GROUND_NORTH, 6);
    const nw = geoBox(named(house.build.groups['north-wall'], 'north-wall'), house.build.root);
    expect(Math.abs(nw.min.y - GROUND_NORTH)).toBeLessThan(0.003);
  });
  it('the gables’ foundation steps follow the ground within 5 cm', () => {
    for (const s of stepTops()) expect(Math.abs(s.top - groundY(0, (s.z0 + s.z1) / 2))).toBeLessThan(0.051);
    expect(stepTops().at(-1)!.z1).toBeCloseTo(Z_RUN, 9);
  });
  it('the balcony’s stair comes down to the ground, its last tread within a riser of it', () => {
    const st = house.build.stair as { x: number; z: number; y: number }[];
    expect(st.length).toBeGreaterThan(8);
    expect(st[0]!.y).toBeCloseTo(-BALCONY.rise, 6);
    const last = st.at(-1)!;
    const g = groundY(last.x, last.z);
    expect(last.y - g).toBeGreaterThan(-0.02);
    expect(last.y - g).toBeLessThan(BALCONY.rise + 0.12);
    // the stringers go under the ground at the foot
    const cheeks = named(house.build.groups['entrance-balcony'], 'stair-cheeks');
    expect(meshBox(cheeks).min.y).toBeLessThan(g);
  });
  it('the stair has STAIR_STEPS treads, and that is the count the ground gives: the last stands within a rise of the land, one more would go under it', () => {
    const st = house.build.stair as { x: number; z: number; y: number }[];
    expect(st.length).toBe(STAIR_STEPS);
    const sxm = st[0]!.x;
    // the rule the number was derived by: tread k (from 1) is the last one when the next would be lower than the land under it (with 2 cm of play)
    let y = 0;
    let z = st[0]!.z - BALCONY.tread / 2;
    let n = 0;
    while (n < 60) {
      if (y - BALCONY.rise <= groundY(sxm, z + BALCONY.tread / 2) + 0.02) break;
      y -= BALCONY.rise;
      z += BALCONY.tread;
      n++;
    }
    expect(n).toBe(STAIR_STEPS);
    // the last tread is a few centimetres above the land, never more than a rise
    const last = st.at(-1)!;
    expect(last.y - groundY(last.x, last.z)).toBeGreaterThan(0);
    expect(last.y - groundY(last.x, last.z)).toBeLessThan(BALCONY.rise);
  });
  it('the downpipes end at the ground, on a splash block', () => {
    for (const d of house.build.downpipes as THREE.Vector3[]) {
      const g = groundY(d.x, d.z);
      expect(d.y - g).toBeGreaterThan(-0.05);
      expect(d.y - g).toBeLessThan(0.3);
    }
  });
  it('the yard stands on the ground: each thing’s lowest point against the land at its foot', () => {
    for (const it of site.yard.grounded as { object: THREE.Object3D; x: number; z: number }[]) {
      it.object.updateWorldMatrix(true, true);
      const b = meshBox(it.object);
      expect(b.isEmpty(), it.object.name).toBe(false);
      const g = groundY(it.x, it.z);
      expect(b.min.y - g, it.object.name).toBeGreaterThan(-0.5);
      expect(b.min.y - g, it.object.name).toBeLessThan(0.15);
    }
  });
  it('the trees stand on the ground at their own x and z', () => {
    for (const p of [
      ...(site.trees() as { x: number; y: number; z: number }[]),
      ...(house.trees() as { x: number; y: number; z: number }[]),
    ]) {
      expect(Math.abs(p.y - landY(p.x, p.z))).toBeLessThan(0.005);
    }
  });
  it('the heliostats stand on their terraces and never put the panel in the ground, at any sun', () => {
    const hs = site.heliostats as {
      base: { x: number; y: number; z: number }[];
      update(a: number, z: number): void;
      panels: THREE.InstancedMesh;
      pivot: number;
    };
    expect(hs.base.length).toBe(SITE.heliostat.count);
    for (const b of hs.base) expect(Math.abs(b.y - landY(b.x, b.z))).toBeLessThan(0.005);
    const m = new THREE.Matrix4();
    const corner = new THREE.Vector3();
    let low = Infinity;
    for (const alt of [3, 10, 25, 45, 70])
      for (const az of [-110, -60, 0, 60, 110]) {
        hs.update(alt, az);
        hs.base.forEach((b, i) => {
          hs.panels.getMatrixAt(i, m);
          for (const [x, y] of [
            [-3, -3.75],
            [3, -3.75],
            [-3, 3.75],
            [3, 3.75],
          ] as const) {
            corner.set(x, y, 0).applyMatrix4(m);
            low = Math.min(low, corner.y - b.y);
          }
        });
      }
    expect(low).toBeGreaterThan(0.4);
    hs.update(35, 0);
  });
  it('turns each heliostat so that the sun’s beam goes to the furnace’s mirror (within 0.5°)', () => {
    const hs = site.heliostats as {
      base: { x: number; y: number; z: number }[];
      update(a: number, z: number): void;
      panels: THREE.InstancedMesh;
      pivot: number;
    };
    const target = site.furnace.mirrorCentre as THREE.Vector3;
    for (const [alt, az] of [
      [24, 0],
      [45, -50],
      [60, 30],
    ] as const) {
      hs.update(alt, az);
      const s = sunDirection(alt, az);
      const m = new THREE.Matrix4();
      for (const i of [0, 20, 40, 62]) {
        hs.panels.getMatrixAt(i, m);
        const n = new THREE.Vector3(0, 0, 1).transformDirection(m);
        const r = s.clone().multiplyScalar(-1).reflect(n).multiplyScalar(-1);
        // `reflect` mirrors the incoming ray about the normal: the outgoing ray is the sun's ray reversed, reflected
        const b = hs.base[i]!;
        const to = new THREE.Vector3(target.x - b.x, target.y - (b.y + hs.pivot + 0.45), target.z - b.z).normalize();
        const out = s.clone().negate().reflect(n);
        void r;
        expect((Math.acos(Math.min(1, out.dot(to))) * 180) / Math.PI).toBeLessThan(0.5);
      }
    }
    hs.update(35, 0);
  });
  it('the furnace and the 1974 building stand on flat shelves', () => {
    const [FX, FZ] = SITE.furnaceAt;
    const [MX, MZ] = SITE.monumentAt;
    const y0 = landY(FX, FZ);
    for (const [dx, dz] of [
      [-27, -17],
      [27, -17],
      [-27, 17],
      [27, 17],
    ])
      expect(Math.abs(landY(FX + dx, FZ + dz) - y0)).toBeLessThan(0.3);
    const m0 = landY(MX, MZ);
    for (const [dx, dz] of [
      [-18.5, -7],
      [18.5, -7],
      [-18.5, 7],
      [18.5, 7],
    ])
      expect(Math.abs(landY(MX + dx, MZ + dz) - m0)).toBeLessThan(0.3);
    // the field's terraces are flat across and step down to the south
    const levels = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => landY(FIELD.x0 + 40, SITE.field.z0 + k * SITE.field.dz));
    for (let i = 1; i < levels.length; i++) expect(levels[i]!).toBeLessThan(levels[i - 1]! + 0.01);
  });
});

describe('what drives what is attached to it', () => {
  const inst = wall.build.groups;
  const wbox = (part: string, name: string) => geoBox(named(inst[part], name), wall.build.root);
  const L = () => elementLayout(wall.build.spec);
  it('the junction box carries the thermocouples’ bundle, and the anemometer’s cable ends on it', () => {
    const box = wbox('wall-thermocouples', 'junction-box');
    expect(touches(wbox('wall-thermocouples', 'bundle'), box, 0.006)).toBe(true);
    expect(touches(wbox('hot-wire-anemometer', 'anemometer-cable'), box, 0.006)).toBe(true);
  });
  it('the leads run from each bead through the concrete to the room face', () => {
    const beads = wbox('wall-thermocouples', 'beads');
    const leads = wbox('wall-thermocouples', 'leads');
    const l = L();
    expect(beads.min.z).toBeGreaterThan(l.inner);
    expect(beads.max.z).toBeLessThan(l.face);
    expect(Math.abs(leads.min.z - l.inner)).toBeLessThan(0.003);
    expect(touches(beads, leads, 0.002)).toBe(true);
    // in the section plane
    expect(Math.abs(beads.min.x + beads.max.x)).toBeLessThan(0.002);
  });
  it('the air probes hang from the head beam in the middle of the gap', () => {
    const p = wbox('air-thermocouples', 'air-probes');
    const l = L();
    // the gap lies between the black face and the last sheet: z runs negative into the house
    expect(p.min.z).toBeGreaterThan(l.face);
    expect(p.max.z).toBeLessThan(l.lastBack);
    expect(Math.abs(p.max.y - l.yHeadBottom)).toBeLessThan(0.003);
  });
  it('the anemometer’s tip is in the middle of the upper duct’s tunnel, its grip in the room', () => {
    const p = wbox('hot-wire-anemometer', 'anemometer-probe');
    const l = L();
    expect(p.min.z).toBeGreaterThan(l.inner - 0.25);
    expect(p.max.z).toBeCloseTo((l.face + l.inner) / 2, 3);
    expect(Math.abs((p.min.y + p.max.y) / 2 - l.yDuctHigh)).toBeLessThan(0.002);
  });
  it('the duct sleeves run from the black face to the room face, in the notches of the wall', () => {
    const l = L();
    for (const [part, name, y] of [
      ['lower-duct', 'lower-sleeve', l.yDuctLow],
      ['upper-duct', 'upper-sleeve', l.yDuctHigh],
    ] as const) {
      const b = wbox(part, name);
      expect(Math.abs(b.min.z - l.inner)).toBeLessThan(0.003);
      expect(b.max.z).toBeLessThan(l.face + 0.01);
      expect(Math.abs((b.min.y + b.max.y) / 2 - y)).toBeLessThan(0.03);
    }
  });
  it('the flap’s cord reaches the crank and its eye, shut or open', () => {
    const cord = named(inst['summer-flap'], 'cord');
    const crank = named(inst['summer-flap'], 'crank');
    const fit = named(inst['summer-flap'], 'cord-fittings');
    for (const open of [0, 1]) {
      wall.build.setFlap(open);
      wall.scene.updateMatrixWorld(true);
      const cb = meshBox(cord);
      expect(touches(cb, meshBox(crank), 0.02), `crank at ${open}`).toBe(true);
      expect(touches(cb, meshBox(fit), 0.02), `eye at ${open}`).toBe(true);
    }
    wall.build.setFlap(0);
  });
  it('the flap closes the pocket in winter and the duct in summer', () => {
    const plate = named(inst['summer-flap'], 'flap-plate') as THREE.InstancedMesh;
    const m = new THREE.Matrix4();
    const size = (open: number): THREE.Vector3 => {
      wall.build.setFlap(open);
      plate.getMatrixAt(0, m);
      plate.geometry.computeBoundingBox();
      return plate.geometry.boundingBox!.clone().applyMatrix4(m).getSize(new THREE.Vector3());
    };
    const winter = size(0);
    const summer = size(1);
    expect(winter.y).toBeLessThan(0.02);
    expect(winter.z).toBeGreaterThan(0.08);
    expect(summer.y).toBeGreaterThan(0.08);
    expect(summer.z).toBeLessThan(0.02);
    wall.build.setFlap(0);
  });
  it('the living room’s cables end where they say: the box, the recorder, the panel', () => {
    const liv = room.living;
    const box = room.house.collector.groups['wall-thermocouples'] as THREE.Group;
    const jb = meshBox(named(box, 'junction-box'));
    const probeCable = meshBox(liv.parts['room-air-probe']);
    expect(touches(probeCable, jb, 0.01)).toBe(true);
    const rec = meshBox(liv.parts['chart-recorder']);
    expect(touches(rec, jb, 0.02)).toBe(true);
    // the heater’s supply goes up to the panel, the thermostat’s wire to it
    const panel = meshBox(liv.parts['electric-panel']);
    expect(touches(meshBox(liv.parts['electric-heater']), panel, 0.02)).toBe(true);
    expect(touches(meshBox(liv.parts['thermostat']), panel, 0.45)).toBe(true);
    // the thermostat is at 1.50 m, as reported
    const t = meshBox(liv.parts['thermostat']);
    expect(Math.abs((t.min.y + t.max.y) / 2 - 1.5)).toBeLessThan(0.06);
    // the streams leave and enter the grilles
    const upper = meshBox(room.house.collector.groups['upper-duct']);
    const lower = meshBox(room.house.collector.groups['lower-duct']);
    expect(touches(meshBox(liv.parts['warm-air-jet']), upper, 0.05)).toBe(true);
    expect(touches(meshBox(liv.parts['floor-return']), lower, 0.05)).toBe(true);
  });
  it('the furniture stands on the floor and not in the wall’s ducts, and what hangs hangs on its wall', () => {
    const liv = room.living;
    liv.furniture.updateWorldMatrix(true, true);
    for (const o of liv.mounts.floor.children as THREE.Object3D[]) {
      const b = meshBox(o);
      expect(Math.abs(b.min.y), o.name).toBeLessThan(0.02);
    }
    const arm = meshBox(liv.parts.armchair);
    expect(Math.abs(arm.min.y)).toBeLessThan(0.02);
    // what hangs is against its wall's room face, within 3 cm: a picture on the north wall, a coat on the west cross wall, a picture on the east one, the curtains at the south wall's inner face
    const zIn = Z_SOUTH + elementLayout(ELEMENT_1967).inner;
    const faces: [string, (b: THREE.Box3) => number][] = [
      ['north', (b) => b.min.z - Z_NORTH_IN],
      ['west', (b) => b.min.x - (LIVING_X0 + PARTITION.t)],
      ['east', (b) => LIVING_X1 - PARTITION.t - b.max.x],
      ['south', (b) => zIn - b.max.z],
    ];
    for (const [side, gap] of faces) {
      const group = liv.mounts[side] as THREE.Group;
      expect(group.children.length, side).toBeGreaterThan(0);
      for (const o of group.children) expect(Math.abs(gap(meshBox(o))), `${side} ${o.name}`).toBeLessThan(0.03);
    }
  });
});

describe('the sun and the air are the model’s', () => {
  const lightOf = (mod: { scene: THREE.Scene }): THREE.DirectionalLight => {
    let l: THREE.DirectionalLight | null = null;
    mod.scene.traverse((o) => {
      if ((o as THREE.DirectionalLight).isDirectionalLight && !l) l = o as THREE.DirectionalLight;
    });
    return l!;
  };
  it('the key light is the state’s sun, and its angle to the south front is the model’s noon incidence', () => {
    const s = frame(wall, {}, {});
    void s;
    const st = stateWith({}, { day: 355 }, 12);
    wall.update(st, 1 / 60, view());
    const l = lightOf(wall);
    const dir = l.position.clone().sub(l.target.position).normalize();
    const want = sunDirection(st.sunAltitude, st.sunAzimuth);
    expect(dir.distanceTo(want)).toBeLessThan(1e-6);
    const incidence = (Math.acos(dir.dot(new THREE.Vector3(0, 0, 1))) * 180) / Math.PI;
    expect(Math.abs(incidence - st.sunIncidence)).toBeLessThan(0.6);
    // 24° in December, 71° in June (K34)
    expect(st.sunIncidence).toBeGreaterThan(23);
    expect(st.sunIncidence).toBeLessThan(25.5);
    const june = stateWith({}, { day: 172 }, 12);
    expect(june.sunIncidence).toBeGreaterThan(69.5);
  });
  it('the moon replaces the sun at night, and the sun is gone', () => {
    const st = stateWith({}, { day: 355 }, 1);
    wall.update(st, 1 / 60, view());
    const l = lightOf(wall);
    expect(l.intensity).toBeLessThan(1);
  });
  it('the air’s dots go at the model’s speed, capped, and turn round with the flow', () => {
    const flow = wall.flow;
    const base = stateWith({ flowDir: 1, gapSpeed: 0.2, ductSpeed: 0.4, flapOpen: 0, flowLs: 20 });
    flow.update(base, 1 / 60, 1, true);
    expect(flow.drawn.gap).toBeCloseTo(0.2, 6);
    expect(flow.drawn.duct).toBeCloseTo(0.4, 6);
    flow.update({ ...base, gapSpeed: 5, ductSpeed: 9 }, 1 / 60, 1, true);
    expect(flow.drawn.gap).toBeCloseTo(AIR_VISUAL_CAP, 6);
    expect(flow.drawn.duct).toBeCloseTo(AIR_VISUAL_CAP, 6);
    // the gap's column: forward they climb, reversed they fall
    const lay = elementLayout(wall.build.spec);
    const pos = flow.points.geometry.attributes.position as THREE.BufferAttribute;
    const inGap = (i: number) =>
      Math.abs(pos.getZ(i) - (lay.lastBack + lay.face) / 2) < 0.07 &&
      pos.getY(i) > lay.yDuctLow + 0.2 &&
      pos.getY(i) < lay.yDuctHigh - 0.2;
    const ys = () => Array.from({ length: pos.count }, (_, i) => (inGap(i) ? pos.getY(i) : NaN));
    flow.update(base, 0, 1, true);
    const y0 = ys();
    flow.update(base, 0.3, 1, true);
    const y1 = ys();
    let up = 0;
    let n = 0;
    for (let i = 0; i < y0.length; i++)
      if (Number.isFinite(y0[i]!) && Number.isFinite(y1[i]!)) {
        up += y1[i]! - y0[i]!;
        n++;
      }
    expect(n).toBeGreaterThan(3);
    expect(up / n).toBeGreaterThan(0.03);
    flow.update({ ...base, flowDir: -1, gapSpeed: -0.2, ductSpeed: -0.4 }, 0.6, 1, true);
    const y2 = ys();
    let down = 0;
    let m = 0;
    for (let i = 0; i < y1.length; i++)
      if (Number.isFinite(y1[i]!) && Number.isFinite(y2[i]!)) {
        down += y2[i]! - y1[i]!;
        m++;
      }
    expect(m).toBeGreaterThan(0);
    expect(down / m).toBeLessThan(-0.03);
  });
  it('the section is on in the house with its tool, off without, and removes the east half', () => {
    frame(house, {}, { cutaway: true });
    expect(house.clip.isOn).toBe(true);
    expect(house.clip.removed(new THREE.Vector3(CUT_X + 1, 1, 0))).toBe(true);
    expect(house.clip.removed(new THREE.Vector3(CUT_X - 1, 1, 0))).toBe(false);
    frame(house, {}, { cutaway: false });
    expect(house.clip.isOn).toBe(false);
    expect(SAMPLE_BAY).toBe(7);
    void bayX;
  });
});
