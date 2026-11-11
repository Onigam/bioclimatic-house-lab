import * as THREE from 'three';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GHOST } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { HouseState } from '../sim/types';
import {
  CEILING,
  CEILING_T,
  CUT_X,
  ELEMENT_1974,
  LIVING_X0,
  LIVING_X1,
  TUBE,
  TUBE_PIT,
  TUBE_PLAN,
  X_EAST,
  Z_NORTH,
  elementLayout,
  elementSpecOf,
} from './dims';
import { HOUSE_PARTS, ROOM_PARTS, WALL_PARTS, WHAT_IF_PARTS } from './ids';
import { partView, labelBoxes, homeCamera } from './framing';
import { groundY } from './land/ground';
import { createHouseScene } from './house/scene';
import { tubeRoute } from './house/earthtube';
import { createRoomScene } from './room/scene';
import { createSiteScene } from './site/scene';
import { isolateOne, meshBox, stateWith, view } from './test-utils';
import { createWallScene } from './wall/scene';
import { WORLD } from './index';

// What the reviewer of 2026-11-11 found, held so that it stays found: nothing that is not a part hangs in the void when a part is isolated or exploded (D6), what hangs on a wall goes with the wall in the room (D3), the
// earth tube is a buried pipe that is drawn with the depth test, on a bed, in a window of the ground (D2, D16), the plateau's pivot is the selected part (D4), a selected part is readable (D7, D20), the opening is the
// overview and the house fills a phone's width (D8), the 1974 preset has no block over the glass (D9).

const HOUSE_PARAMS = (tube: boolean) => () => ({ setpoint: 20, gap: 0.12, glazingLayers: 2, earthTube: tube, wind: 2 });
const house = createHouseScene({ params: HOUSE_PARAMS(true) });
const houseOff = createHouseScene({ params: HOUSE_PARAMS(false) });
const room = createRoomScene({ params: () => ({ setpoint: 20, gap: 0.12, glazingLayers: 2 }) });
const wall = createWallScene({ params: () => ({ gap: 0.12, glazingLayers: 2 }) });
const wall74 = createWallScene({ params: () => ({ build: '1974', gap: ELEMENT_1974.gap, glazingLayers: 2 }) });
const site = createSiteScene({ params: () => ({ gap: 0.12, glazingLayers: 2 }) });

const go = (mod: SceneModule<HouseState>, over: Partial<HouseState> = {}, v = {}, frames = 3): void => {
  const s = stateWith(over);
  for (let i = 0; i < frames; i++) mod.update(s, 1 / 60, view({ time: 1 + i * 0.3, ...v }));
  mod.scene.updateMatrixWorld(true);
};

type H = SceneModule<HouseState> & {
  build: { root: THREE.Object3D; groups: Record<string, THREE.Object3D>; pieces: Record<string, THREE.Mesh> };
  tube: ReturnType<typeof import('./house/earthtube').buildEarthTube>;
  yard: { balcony: THREE.Object3D; group: THREE.Object3D };
  living: ReturnType<typeof import('./room/living').buildLiving>;
  scenery(): THREE.Object3D[];
};
const H = house as unknown as H;

/** Objects the house world shows that are neither a part's nor the land's: the ones that must follow a part. */
function props(mod: H): { name: string; object: THREE.Object3D }[] {
  const out: { name: string; object: THREE.Object3D }[] = [];
  const m = mod.living.mounts;
  for (const k of Object.keys(m) as (keyof typeof m)[]) out.push({ name: `furniture-${k}`, object: m[k] });
  out.push({ name: 'balcony things', object: mod.yard.balcony });
  for (const id of ROOM_PARTS) out.push({ name: `room part ${id}`, object: mod.living.parts[id] });
  for (const n of ['ceiling', 'floor-tile', 'floor-oak', 'skirting-north'] as const)
    out.push({ name: n, object: mod.build.pieces[n]! });
  return out;
}

const shown = (o: THREE.Object3D): boolean => {
  for (let p: THREE.Object3D | null = o; p; p = p.parent) if (!p.visible) return false;
  return true;
};

describe('D6: what is not a part follows the part that carries it', () => {
  it('shows no prop when its carrier is isolated away, in any part’s isolate (house)', () => {
    go(house);
    const reg = house.registry;
    const bad: string[] = [];
    for (const id of HOUSE_PARTS) {
      isolateOne(reg, id, 'hidden');
      go(house, {}, {}, 2);
      for (const p of props(H)) {
        // a prop with a mesh of its own can only be asked if it has one drawn
        let meshes = 0;
        p.object.traverse((o) => ((o as THREE.Mesh).isMesh ? meshes++ : 0));
        if (meshes === 0) continue;
        // the room's parts have no groups in this world's registry, so what shows is what the follower let show
        if (shown(p.object)) bad.push(`${p.name} stands in the void with only ${id} drawn`);
      }
    }
    // only the carriers' own props may show with their carrier: the floor slab shows the furniture, and nothing else of them
    expect(
      bad.filter(
        (b) => !/floor-slab|north-wall|interior-partitions|collector-element|roof-insulation|entrance-balcony/.test(b),
      ),
    ).toEqual([]);
    reg.setAllDisplay('solid');
    go(house);
  });

  it('shows each prop only with its own carrier', () => {
    const reg = house.registry;
    const want: [string, string][] = [
      ['furniture-floor', 'floor-slab'],
      ['furniture-north', 'north-wall'],
      ['furniture-west', 'interior-partitions'],
      ['furniture-east', 'interior-partitions'],
      ['furniture-south', 'collector-element'],
      ['balcony things', 'entrance-balcony'],
      ['room part electric-heater', 'north-wall'],
      ['room part armchair', 'floor-slab'],
      ['room part warm-air-jet', 'collector-element'],
      ['ceiling', 'roof-insulation'],
      ['floor-tile', 'floor-slab'],
    ];
    const list = props(H);
    for (const [name, carrier] of want) {
      const p = list.find((x) => x.name === name)!;
      // with the carrier alone: shown; with another part alone: not
      isolateOne(reg, carrier, 'hidden');
      go(house, {}, {}, 2);
      expect(shown(p.object), `${name} with ${carrier}`).toBe(true);
      const other = HOUSE_PARTS.find((x) => x !== carrier && x !== 'chimney')!;
      isolateOne(reg, other, 'hidden');
      go(house, {}, {}, 2);
      expect(shown(p.object), `${name} with ${other} alone`).toBe(false);
    }
    reg.setAllDisplay('solid');
    go(house);
  });

  it('leaves a ghosted carrier’s props in place (an X-ray looks through the shell at what stands inside)', () => {
    const reg = house.registry;
    isolateOne(reg, 'foundation', 'ghost');
    go(house, {}, {}, 2);
    expect(shown(H.living.mounts.floor)).toBe(true);
    reg.setAllDisplay('solid');
    go(house);
  });

  it('moves the props with their carrier in the explode: on the floor when it goes down, on the wall when it goes out', () => {
    const reg = house.registry;
    go(house);
    reg.setAllFactors(1);
    go(house, {}, {}, 2);
    const slab = reg.get('floor-slab')!;
    const floorProp = H.living.mounts.floor;
    expect(floorProp.position.distanceTo(slab.explode)).toBeLessThan(1e-9);
    const nwall = reg.get('north-wall')!;
    expect(H.living.parts['electric-heater'].position.distanceTo(nwall.explode)).toBeLessThan(1e-9);
    // and it all comes back
    reg.setAllFactors(0);
    go(house, {}, {}, 2);
    expect(floorProp.position.length()).toBeLessThan(1e-9);
    expect(H.living.parts['electric-heater'].position.length()).toBeLessThan(1e-9);
  });

  it('shows no coat when the wall it hangs on is not drawn, in the wall world', () => {
    go(wall);
    const reg = wall.registry;
    let lived: THREE.Object3D | undefined;
    wall.scene.traverse((o) => {
      if (o.name === 'lived-in') lived = o;
    });
    expect(lived).toBeDefined();
    const coatObj = (lived as THREE.Object3D).children.find((c) => c.name === 'coat')!;
    for (const id of WALL_PARTS) {
      isolateOne(reg, id, 'hidden');
      go(wall, {}, {}, 2);
      expect(shown(coatObj), `coat with ${id} alone`).toBe(id === 'storage-wall');
    }
    reg.setAllDisplay('solid');
    go(wall);
    expect(shown(coatObj)).toBe(true);
  });

  it('hides the thermocouples’ beads and leads with their part (they stayed, with their part isolated away)', () => {
    go(wall);
    const reg = wall.registry;
    const cut = (wall as unknown as { build: { cutOnly: THREE.Object3D[] } }).build.cutOnly;
    expect(cut.length).toBeGreaterThan(0);
    isolateOne(reg, 'summer-flap', 'hidden');
    go(wall, {}, {}, 2);
    for (const o of cut) expect(o.visible, o.name).toBe(false);
    reg.setAllDisplay('solid');
    go(wall, {}, {}, 2);
    for (const o of cut) expect(o.visible, o.name).toBe(true);
  });
});

describe('D3: in the room, what hangs on a wall goes with it when the camera is outside', () => {
  const cameraAt = (x: number, y: number, z: number): THREE.PerspectiveCamera => {
    const c = new THREE.PerspectiveCamera();
    c.position.set(x, y, z);
    return c;
  };
  const render = (c: THREE.Camera): void => {
    // the world's walls fade over a fifth of a second: a few frames of its own clock
    for (let i = 0; i < 12; i++) {
      room.update(stateWith(), 0.05, view({ time: 10 + i * 0.05 }));
      room.scene.onBeforeRender(null as never, room.scene, c, null as never, null as never, null as never);
    }
  };
  const part = (id: string): THREE.Object3D => room.registry.get(id)!.object;

  it('shows the heater, the panel, the thermostat and the vent from inside, and not from beyond the north wall', () => {
    go(room);
    render(cameraAt(-3.4, 4.6, 6));
    for (const id of ['electric-heater', 'electric-panel', 'thermostat', 'fresh-air-vent'])
      expect(shown(part(id)), id).toBe(true);
    render(cameraAt(0, 3, Z_NORTH - 6));
    for (const id of ['electric-heater', 'electric-panel', 'thermostat', 'fresh-air-vent'])
      expect(shown(part(id)), id).toBe(false);
    render(cameraAt(-3.4, 4.6, 6));
    for (const id of ['electric-heater', 'electric-panel', 'thermostat', 'fresh-air-vent'])
      expect(shown(part(id)), id).toBe(true);
  });

  it('takes the north window, the skirting, the picture, the doors and the coat away with their walls, and what stands on the floor stays', () => {
    const R = room as unknown as {
      living: ReturnType<typeof import('./room/living').buildLiving>;
      house: { groups: Record<string, THREE.Object3D>; pieces: Record<string, THREE.Mesh> };
    };
    render(cameraAt(0, 3, Z_NORTH - 6));
    expect(shown(R.house.groups['north-window']!)).toBe(false);
    expect(shown(R.house.pieces['skirting-north']!)).toBe(false);
    expect(shown(R.living.mounts.north)).toBe(false);
    expect(shown(R.living.mounts.floor), 'furniture on the floor').toBe(true);
    render(cameraAt(LIVING_X0 - 6, 3, 0));
    expect(shown(R.house.pieces['door-west']!)).toBe(false);
    expect(shown(R.living.mounts.west)).toBe(false);
    expect(shown(R.house.pieces['door-east']!)).toBe(true);
    render(cameraAt(LIVING_X1 + 6, 3, 0));
    expect(shown(R.house.pieces['door-east']!)).toBe(false);
    expect(shown(R.living.mounts.east)).toBe(false);
    expect(shown(R.living.mounts.west)).toBe(true);
    render(cameraAt(-3.4, 4.6, 6));
    expect(shown(R.house.groups['north-window']!)).toBe(true);
    expect(shown(R.living.mounts.east)).toBe(true);
  });

  it('follows the floor with the furniture: with the floor isolated away the furniture is gone, with another part alone it is gone too', () => {
    const reg = room.registry;
    isolateOne(reg, 'electric-heater', 'hidden');
    go(room, {}, {}, 2);
    const R = room as unknown as { living: ReturnType<typeof import('./room/living').buildLiving> };
    expect(shown(R.living.mounts.floor)).toBe(false);
    isolateOne(reg, 'room-floor', 'hidden');
    go(room, {}, {}, 2);
    expect(shown(R.living.mounts.floor)).toBe(true);
    reg.setAllFactors(1);
    go(room, {}, {}, 2);
    expect(R.living.mounts.floor.position.distanceTo(reg.get('room-floor')!.explode)).toBeLessThan(1e-9);
    reg.setAllFactors(0);
    reg.setAllDisplay('solid');
    go(room, {}, {}, 2);
  });
});

describe('D2, D16: the earth tube is a buried pipe in a window of the ground', () => {
  const tubeMeshes = (mod: H): THREE.Mesh[] => {
    const out: THREE.Mesh[] = [];
    for (const id of WHAT_IF_PARTS)
      mod.registry.get(id)!.object.traverse((o) => ((o as THREE.Mesh).isMesh ? out.push(o as THREE.Mesh) : 0));
    return out;
  };

  it('draws every surface of the three parts, and the pit, with the depth test on, never in front of the glass', () => {
    go(house);
    const bad: string[] = [];
    for (const m of [...tubeMeshes(H), ...H.tube.pit.children] as THREE.Mesh[]) {
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      for (const mat of mats) if (!mat.depthTest) bad.push(m.name || m.parent?.name || 'mesh');
    }
    expect(bad).toEqual([]);
  });

  it('is there with the scenario off, with a size, a framing box and a place, and is flagged a what-if', () => {
    go(houseOff);
    const reg = houseOff.registry;
    for (const id of WHAT_IF_PARTS) {
      const e = reg.get(id)!;
      expect(e.object.visible, id).toBe(true);
      expect(e.object.scale.x, id).toBe(1);
      const b = reg.bounds(id);
      const s = b.getSize(new THREE.Vector3());
      expect(Math.min(s.x, s.y, s.z), `${id} size`).toBeGreaterThan(0.1);
      expect(e.frame, `${id} frame`).toBeDefined();
      const f = reg.frameBounds(id);
      expect(f.isEmpty(), id).toBe(false);
      // the frame is on the part: it holds the centre of the part’s box
      expect(f.containsPoint(b.getCenter(new THREE.Vector3())), `${id} frame holds its part`).toBe(true);
      e.object.traverse((o) => {
        const m = o as THREE.Mesh;
        if (!m.isMesh) return;
        const mat = m.material as THREE.Material;
        if (mat.userData?.noShare) expect(mat.userData.whatIf, id).toBe(true);
      });
    }
    const t = (houseOff as unknown as H).tube;
    go(houseOff);
    const pale = (t as unknown as { pipe: THREE.Group }).pipe.children[0] as THREE.Mesh;
    const offOpacity = (pale.material as THREE.Material).opacity;
    go(house);
    const onOpacity = ((H.tube.pipe.children[0] as THREE.Mesh).material as THREE.Material).opacity;
    expect(onOpacity).toBeGreaterThan(offOpacity);
  });

  it('is the model’s tube: 50 m of Ø0.2 m, 2 m under the ground at the intake, all in the half of the house the section keeps', () => {
    const r = tubeRoute();
    let len = 0;
    for (let i = 1; i < r.length; i++) len += Math.hypot(r[i]!.x - r[i - 1]!.x, r[i]!.z - r[i - 1]!.z);
    expect(Math.abs(H.tube.length / TUBE.length - 1)).toBeLessThan(0.06);
    expect(len).toBeGreaterThan(0.94 * TUBE.length);
    const first = H.tube.route[0]!;
    expect(groundY(first.x, first.z) - first.y).toBeCloseTo(TUBE.depth, 6);
    // the pipe is a tube of Ø0.2 m: the sheet’s figure is the model’s
    const pipeBox = meshBox(H.tube.pipe);
    expect(pipeBox.max.x).toBeLessThan(1.9); // CUT_X = 1.905: the east half is taken away with the section on, and the tube is wholly west of it
    expect(pipeBox.min.z).toBeGreaterThan(TUBE_PIT.z0);
    // every run is under the ground by about 2 m and falls to the house (the bends drop, the fall is TUBE_FALL)
    let prev = Infinity;
    for (const run of H.tube.runs) {
      expect(groundY(0, run.z) - run.y).toBeGreaterThan(1.8);
      expect(groundY(0, run.z) - run.y).toBeLessThan(2.6);
      expect(run.y).toBeLessThan(prev);
      prev = run.y;
    }
    expect(H.tube.runs.length).toBe(TUBE_PLAN.runs);
  });

  it('lies on its bed: each run rests on the step cut for it, within a centimetre or two', () => {
    go(house);
    const R = TUBE.diameter / 2;
    const floor = H.tube.pit.children.find((c) => c.name === 'pit-floor') as THREE.Mesh;
    const fb = meshBox(floor);
    // the floor's steps, one per run, each at the pipe's underside less the pipe's sink
    const levels = new Set<number>();
    const pos = floor.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) levels.add(Math.round(pos.getY(i) * 1000) / 1000);
    for (const run of H.tube.runs) {
      const under = run.y - R;
      const near = [...levels].some((y) => Math.abs(y - under) < 0.02);
      expect(near, `bed under run at z=${run.z}`).toBe(true);
    }
    expect(fb.min.x).toBeCloseTo(H.tube.hole.x0, 3);
    expect(fb.max.x).toBeCloseTo(H.tube.hole.x1, 3);
  });

  it('cuts the ground over it: the window’s walls rise to the land’s own height all round, and the lid closes it', () => {
    go(house);
    const { x0, x1, z0, z1 } = H.tube.hole;
    // the window is the one asked for, snapped outwards to the land’s cells
    expect(x0).toBeLessThanOrEqual(TUBE_PIT.x0);
    expect(x1).toBeGreaterThanOrEqual(TUBE_PIT.x1);
    expect(z0).toBeLessThanOrEqual(TUBE_PIT.z0);
    expect(z1).toBeGreaterThanOrEqual(TUBE_PIT.z1);
    expect(x1 - x0).toBeLessThan(TUBE_PIT.x1 - TUBE_PIT.x0 + 1.5);
    const walls = H.tube.pit.children.find((c) => c.name === 'pit-walls') as THREE.Mesh;
    const p = walls.geometry.attributes.position as THREE.BufferAttribute;
    // the top vertices of a wall are at the land’s height at their own place, and the land’s own surface just outside the window is as high as the wall’s top there, within a centimetre
    const land0 = (house as unknown as { scenery(): THREE.Object3D[] }).scenery()[0] as THREE.Mesh;
    let worst = 0;
    for (const [px, pz] of [
      [x0 - 0.03, (z0 + z1) / 2],
      [x1 + 0.03, z0 + 1],
      [(x0 + x1) / 2, z0 - 0.03],
      [(x0 + x1) / 2, z1 + 0.03],
      [x0 + 2, z1 + 0.03],
    ] as const) {
      const r = new THREE.Raycaster(new THREE.Vector3(px, 40, pz), new THREE.Vector3(0, -1, 0));
      const hit = r.intersectObject(land0)[0]!;
      worst = Math.max(worst, Math.abs(hit.point.y - groundY(px, pz)));
    }
    expect(worst).toBeLessThan(0.01);
    let top = 0;
    for (let i = 0; i < p.count; i++) top = Math.max(top, p.getY(i) - groundY(p.getX(i), p.getZ(i)));
    expect(top).toBeLessThan(1e-6);
    // the land has no triangle over the window: a ray from above, through its middle, hits the lid and the floor, not the land’s surface
    const land = (house as unknown as { scenery(): THREE.Object3D[] }).scenery()[0] as THREE.Mesh;
    const ray = new THREE.Raycaster(new THREE.Vector3((x0 + x1) / 2, 30, (z0 + z1) / 2), new THREE.Vector3(0, -1, 0));
    expect(ray.intersectObject(land).length).toBe(0);
    const above = new THREE.Raycaster(new THREE.Vector3(x0 - 1.4, 30, (z0 + z1) / 2), new THREE.Vector3(0, -1, 0));
    expect(above.intersectObject(land).length).toBeGreaterThan(0);
    const lid = H.tube.pit.parent!.children.find((c) => c.name === 'ground-window') as THREE.Mesh;
    expect(lid).toBeDefined();
    expect(ray.intersectObject(lid).length).toBe(1);
    // the lid is see-through: the pipe is drawn under it
    expect((lid.material as THREE.Material).transparent).toBe(true);
    expect((lid.material as THREE.Material).opacity).toBeLessThan(0.7);
  });

  it('stays out of the house’s way: clear of the north wall’s footing, of the boulders and of the trees', () => {
    const r = tubeRoute();
    for (const p of r) expect(p.z).toBeLessThan(Z_NORTH - 0.3);
    const rocks = (house as unknown as { scenery(): THREE.Object3D[] }).scenery()[2] as THREE.Object3D;
    const { x0, x1, z0, z1 } = H.tube.hole;
    const b = new THREE.Box3(new THREE.Vector3(x0, -9, z0), new THREE.Vector3(x1, 9, z1));
    // no boulder vertex inside the window
    const pos = (rocks as THREE.Mesh).geometry.attributes.position as THREE.BufferAttribute;
    let inside = 0;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) if (b.containsPoint(v.fromBufferAttribute(pos, i))) inside++;
    expect(inside).toBe(0);
    for (const t of (house as unknown as { trees(): { x: number; z: number; s: number }[] }).trees())
      expect(
        b
          .clone()
          .expandByScalar(0.8 * t.s)
          .containsPoint(new THREE.Vector3(t.x, 0, t.z)),
        `tree at ${t.x},${t.z}`,
      ).toBe(false);
  });

  it('closes the window with an opaque lid when the pipe is isolated away, and opens it again', () => {
    go(house);
    const lid = H.tube.pit.parent!.children.find((c) => c.name === 'ground-window') as THREE.Mesh;
    const mat = lid.material as THREE.MeshStandardMaterial;
    expect(mat.transparent).toBe(true);
    isolateOne(house.registry, 'foundation', 'hidden');
    go(house, {}, {}, 2);
    expect(mat.opacity).toBe(1);
    expect(mat.transparent).toBe(false);
    expect(H.tube.pit.visible).toBe(false);
    house.registry.setAllDisplay('solid');
    go(house, {}, {}, 2);
    expect(mat.transparent).toBe(true);
    expect(mat.opacity).toBeLessThan(0.7);
    expect(H.tube.pit.visible).toBe(true);
  });

  it('explodes up out of its window, each part to its own height, and comes back', () => {
    const reg = house.registry;
    reg.setAllFactors(1);
    go(house, {}, {}, 2);
    for (const id of WHAT_IF_PARTS) expect(reg.get(id)!.explode.y, id).toBeGreaterThan(1);
    expect(new Set(WHAT_IF_PARTS.map((id) => reg.get(id)!.explode.y)).size).toBe(3);
    reg.setAllFactors(0);
    go(house, {}, {}, 2);
  });
});

describe('D4: in the plateau the camera turns round the selected part', () => {
  it('has no ground, meadow, road, ridge or far wood to hit: a press on them hits nothing', () => {
    go(site);
    const reg = site.registry;
    const rc = new THREE.Raycaster();
    const hit = (o: THREE.Vector3, d: THREE.Vector3) => {
      rc.set(o, d.normalize());
      return rc.intersectObjects(reg.pickables(), false).map((h) => reg.partOf(h.object));
    };
    // straight down on the meadow, on the road, on the slope above the houses, on the plateau beyond the furnace: no part
    expect(hit(new THREE.Vector3(60, 80, 12), new THREE.Vector3(0, -1, 0))).toEqual([]);
    expect(hit(new THREE.Vector3(22, 80, 31), new THREE.Vector3(0, -1, 0))).toEqual([]);
    expect(hit(new THREE.Vector3(-30, 120, -42), new THREE.Vector3(0, -1, 0))).toEqual([]);
    expect(hit(new THREE.Vector3(600, 400, -400), new THREE.Vector3(0, -1, 0))).toEqual([]);
    // along the ground to the ridges
    expect(hit(new THREE.Vector3(0, 10, 0), new THREE.Vector3(0, 0.02, 1))).toEqual([]);
    // but the house is still there to press on, and so is the furnace
    expect(hit(new THREE.Vector3(0, 40, 0), new THREE.Vector3(0, -1, 0))).toContain('prototype-house');
  });
});

describe('D7: the east gable is readable with the section on', () => {
  it('is drawn, pale and out of the section’s clip, when the cut is on, and plain render when it is off', () => {
    go(house, {}, { cutaway: true });
    const gable = H.build.pieces['east-gable-wall']!;
    const mat = gable.material as THREE.MeshStandardMaterial;
    expect(mat.clippingPlanes ?? []).toEqual([]);
    expect(mat.transparent).toBe(true);
    expect(mat.opacity).toBeLessThan(0.3);
    expect(shown(gable)).toBe(true);
    const edges = H.build.groups['east-gable']!.children.find((c) => c.name === 'east-gable-edges')!;
    expect(edges.visible).toBe(true);
    // it is on the removed side: with the cut on, the rest of the east half is gone and this stays
    const b = meshBox(gable);
    expect(b.min.x).toBeGreaterThan(5);
    go(house, {}, { cutaway: false });
    expect(mat.transparent).toBe(false);
    expect(mat.opacity).toBe(1);
    expect(edges.visible).toBe(false);
    // pickable with the cut on: the kit skips a hit only where a clipping plane says so
    go(house, {}, { cutaway: true });
    expect(house.registry.pickables()).toContain(gable);
    go(house, {}, { cutaway: false });
  });
});

describe('N1: the east gable’s ghost is the end of the removed half, drawn from the section’s plane', () => {
  const outline = (): THREE.LineSegments => house.scene.getObjectByName('removed-half-outline') as THREE.LineSegments;

  it('joins the section’s plane to the gable with the cut on: lines start on x = CUT_X and end on the gable, none in the void between', () => {
    go(house, {}, { cutaway: true });
    const o = outline();
    expect(shown(o)).toBe(true);
    const p = o.geometry.attributes.position as THREE.BufferAttribute;
    expect(p.count).toBeGreaterThan(20);
    let onPlane = 0;
    let onGable = 0;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      if (Math.abs(x - CUT_X) < 1e-4) onPlane++;
      else if (Math.abs(x - X_EAST) < 1e-4) onGable++;
      else throw new Error(`a line ends at x = ${x}, in the void`);
    }
    expect(onPlane).toBeGreaterThan(10);
    expect(onGable).toBeGreaterThan(10);
    // the plate’s own profile is the outline’s: the roof ridge is there, over the house’s own height
    const box = new THREE.Box3().setFromBufferAttribute(p);
    expect(box.max.y).toBeGreaterThan(5.5);
    expect(box.min.x).toBeCloseTo(CUT_X, 6);
    expect(box.max.x).toBeCloseTo(X_EAST, 6);
  });

  it('is gone with the cut off, and with the gable isolated away', () => {
    go(house, {}, { cutaway: false });
    expect(shown(outline())).toBe(false);
    go(house, {}, { cutaway: true });
    isolateOne(house.registry, 'foundation', 'hidden');
    go(house, {}, { cutaway: true }, 2);
    expect(shown(outline())).toBe(false);
    house.registry.setAllDisplay('solid');
    go(house, {}, { cutaway: true }, 2);
    expect(shown(outline())).toBe(true);
    go(house, {}, { cutaway: false });
  });
});

describe('D8: the house opens as the overview, and fills a phone’s width', () => {
  const sizes: [string, number, number, number][] = [
    ['1280×800', 842, 678, 96],
    ['768×1024', 380, 902, 130],
    ['390×844', 390, 632, 92],
  ];
  it('has the south front covering over half of the free view across, and inside it, at every size, with the tube drawn', () => {
    for (const mod of [houseOff, house]) {
      go(mod);
      for (const [name, w, h, tb] of sizes) {
        const cam = homeCamera(mod, { w, h }, tb);
        const b = mod.registry.bounds('south-facade');
        const xs: number[] = [];
        for (const x of [b.min.x, b.max.x])
          for (const y of [b.min.y, b.max.y])
            for (const z of [b.min.z, b.max.z]) xs.push(new THREE.Vector3(x, y, z).project(cam).x);
        const across = (Math.max(...xs) - Math.min(...xs)) / 2;
        expect(across, name).toBeGreaterThan(0.55);
        expect(Math.max(...xs.map(Math.abs)), `${name} inside`).toBeLessThan(1);
      }
    }
  });
  it('frames every part of the world in the overview, the earth tube’s included: its box is in the home box', () => {
    go(houseOff);
    const all = new THREE.Box3();
    for (const id of HOUSE_PARTS) all.union(houseOff.registry.bounds(id));
    for (const id of WHAT_IF_PARTS) expect(all.containsBox(houseOff.registry.bounds(id)), id).toBe(true);
    // the box is not stretched: the tube’s plan is north of the house, inside its width
    const s = all.getSize(new THREE.Vector3());
    expect(s.x).toBeLessThan(17.5);
    expect(s.z).toBeLessThan(18.5);
  });
});

describe('D20: a chosen part is framed close enough to read', () => {
  it('fills at least 30 % of the free view, inside it, at 1280 and at 390, with the world’s own padding', () => {
    go(houseOff);
    const pad = WORLD.house.partPadding;
    const bad: string[] = [];
    for (const id of HOUSE_PARTS)
      for (const [n, w, h, tb] of [
        ['1280', 842, 678, 0],
        ['390', 390, 632, 92],
      ] as const) {
        const v = partView(houseOff, id, { w, h }, pad, tb);
        const fill = Math.max(v.across, v.up);
        if (fill < 0.3) bad.push(`${id} at ${n}: ${(fill * 100).toFixed(0)} % (${v.distance.toFixed(0)} m)`);
        if (fill > 1) bad.push(`${id} at ${n} overflows`);
        if (!v.inside) bad.push(`${id} at ${n} is behind the camera`);
      }
    expect(bad).toEqual([]);
  });
});

describe('D22: the plateau opens on the setting', () => {
  it('shows the houses, the 1974 building and the furnace at the opening view, with a label each at a wide size', () => {
    go(site);
    for (const [name, w, h, tb] of [
      ['1280×800', 842, 678, 96],
      ['390×844', 390, 632, 92],
    ] as const) {
      const cam = homeCamera(site, { w, h }, tb);
      for (const id of ['prototype-house', 'solar-houses-1974', 'solar-furnace']) {
        const b = site.registry.bounds(id);
        const c = b.getCenter(new THREE.Vector3()).project(cam);
        expect(Math.max(Math.abs(c.x), Math.abs(c.y)), `${id} at ${name}`).toBeLessThan(0.97);
        expect(c.z, `${id} in front`).toBeLessThan(1);
      }
    }
    const names = labelBoxes(site, { w: 842, h: 678 }, 'fr', 96)
      .filter((l) => !l.minor)
      .map((l) => l.id);
    expect(names).toContain('prototype-house');
    expect(names).toContain('solar-houses-1974');
    expect(names).toContain('solar-furnace');
  });
});

describe('D9: the 1974 preset has no block of wall over the glass, and its labels stand on their parts', () => {
  it('lowers the room to the element: ceiling and head band a hand over its head, the scale post under the ceiling', () => {
    go(wall74);
    const spec = elementSpecOf({
      build: '1974',
      wallThickness: ELEMENT_1974.thickness,
      gap: ELEMENT_1974.gap,
      glazingLayers: 2,
    });
    const L = elementLayout(spec);
    const stub = (n: string): THREE.Mesh => {
      let out: THREE.Mesh | undefined;
      wall74.scene.traverse((o) => {
        if (o.name === n) out = o as THREE.Mesh;
      });
      return out!;
    };
    const head = meshBox(stub('head-band-stub'));
    expect(head.max.y - L.yTop).toBeLessThan(0.6);
    expect(head.max.y - L.yTop).toBeGreaterThan(0.1);
    const ceil = meshBox(stub('ceiling-stub'));
    expect(ceil.max.y).toBeLessThan(L.yTop + 0.6);
    expect(ceil.min.y).toBeGreaterThan(L.yTop);
    // nothing over the ceiling's top but the head band's last centimetres
    const all = new THREE.Box3();
    for (const n of ['head-band-stub', 'ceiling-stub', 'end-wall-stub']) all.union(meshBox(stub(n)));
    expect(all.max.y).toBeLessThan(L.yTop + 0.7);
    // the stubs are as wide as the element
    expect(head.max.x - head.min.x).toBeCloseTo(spec.width / 2, 2);
    // the scale of the false colour stands under the ceiling
    let scale: THREE.Object3D | undefined;
    wall74.scene.traverse((o) => {
      if (o.name === 'scale') scale = o;
    });
    expect(meshBox(scale!).max.y).toBeLessThan(ceil.min.y);
    // every label of a part stands on the part’s own box, to a hand
    wall74.scene.updateMatrixWorld(true);
    const p = new THREE.Vector3();
    for (const h of wall74.hotspots) {
      if (h.label.en.endsWith('°C')) continue;
      h.anchor.getWorldPosition(p);
      expect(wall74.registry.bounds(h.partId).distanceToPoint(p), `${h.partId} label`).toBeLessThan(0.35);
    }
  });
  it('leaves the 1967 room as it was: the head band reaches the plate, the ceiling the house’s own', () => {
    go(wall);
    let head: THREE.Mesh | undefined;
    let ceil: THREE.Mesh | undefined;
    wall.scene.traverse((o) => {
      if (o.name === 'head-band-stub') head = o as THREE.Mesh;
      if (o.name === 'ceiling-stub') ceil = o as THREE.Mesh;
    });
    const L = elementLayout(elementSpecOf({ wallThickness: 0.6, gap: 0.12, glazingLayers: 2 }));
    expect(meshBox(head!).min.y).toBeCloseTo(L.yTop, 6);
    expect(meshBox(ceil!).min.y).toBeCloseTo(CEILING, 6);
    expect(meshBox(ceil!).max.y).toBeCloseTo(CEILING + CEILING_T, 6);
  });
});

describe('the world’s ghost is the kit’s', () => {
  it('uses the kit’s GHOST for a ghosted what-if part', () => {
    const reg = houseOff.registry;
    reg.setDisplay('earth-tube-pipe', 'ghost');
    for (const m of reg.get('earth-tube-pipe')!.meshes) expect(m.material).toBe(GHOST);
    reg.setDisplay('earth-tube-pipe', 'solid');
  });
});

describe('D19: « Toutes » on a phone keeps the labels that have room', () => {
  afterEach(() => vi.unstubAllGlobals());
  for (const [name, mod] of [
    ['house', house],
    ['wall', wall],
    ['room', room],
    ['site', site],
  ] as const) {
    it(`${name}: puts the crowd labels away under 1100 px, puts them back above, and never touches a main label`, () => {
      vi.stubGlobal('window', { innerWidth: 390 });
      go(mod);
      const anchorShown = (h: { anchor: THREE.Object3D }): boolean => h.anchor.visible;
      const crowd = mod.hotspots.filter((h) => !anchorShown(h));
      expect(crowd.length, `${name} labels put away`).toBeGreaterThanOrEqual(4);
      for (const h of crowd)
        expect((h as unknown as { minor?: boolean }).minor, `${name}: ${h.partId} is a minor label`).toBe(true);
      vi.stubGlobal('window', { innerWidth: 1280 });
      go(mod);
      expect(mod.hotspots.every(anchorShown), `${name} labels back`).toBe(true);
    });
  }
});

describe('N2: the section’s cut faces follow the part they cut', () => {
  const capsOf = (mod: SceneModule<HouseState>): THREE.Mesh[] => {
    const out: THREE.Mesh[] = [];
    mod.scene.traverse((o) => {
      if (o.userData.cap && (o as THREE.Mesh).isMesh) out.push(o as THREE.Mesh);
    });
    return out;
  };
  const carrier = (m: THREE.Mesh): string => m.name.replace(/-cap$/, '');

  it('shows every face with the cut on and nothing isolated, and the roof, the wall, the slab and the foundation each have some', () => {
    go(house, {}, { cutaway: true });
    const shownCaps = capsOf(house).filter((m) => m.visible);
    expect(shownCaps.length).toBeGreaterThan(8);
    const carriers = new Set(shownCaps.map(carrier));
    for (const id of ['pitched-roof', 'north-wall', 'floor-slab', 'foundation', 'roof-insulation', 'south-facade'])
      expect(carriers.has(id), `a face of ${id}`).toBe(true);
  });

  it('shows, with any one part isolated and the cut on, only that part’s faces and the earth’s', () => {
    const reg = house.registry;
    const bad: string[] = [];
    for (const id of HOUSE_PARTS) {
      isolateOne(reg, id, 'hidden');
      go(house, {}, { cutaway: true }, 2);
      for (const m of capsOf(house))
        if (m.visible && carrier(m) !== id && carrier(m) !== 'caps')
          bad.push(`${carrier(m)} stands with only ${id} drawn`);
    }
    expect(bad).toEqual([]);
    reg.setAllDisplay('solid');
    go(house, {}, { cutaway: true }, 2);
    go(house, {}, { cutaway: false }, 2);
    expect(capsOf(house).some((m) => m.visible)).toBe(false);
  });

  it('keeps the roof’s boards, rafters and slates together with the roof', () => {
    const reg = house.registry;
    isolateOne(reg, 'pitched-roof', 'hidden');
    go(house, {}, { cutaway: true }, 2);
    expect(capsOf(house).filter((m) => m.visible && carrier(m) === 'pitched-roof').length).toBe(6);
    reg.setAllDisplay('solid');
    go(house, {}, { cutaway: false }, 2);
  });
});

describe('D19: on a phone and a tablet no label shown with « Toutes » runs past the edge of the view', () => {
  afterEach(() => vi.unstubAllGlobals());
  for (const [name, mod] of [
    ['house', house],
    ['wall', wall],
    ['room', room],
    ['site', site],
  ] as const)
    for (const lang of ['fr', 'en'] as const)
      it(`${name}, ${lang}: at 390 px and at a tablet's 380 px of 3D`, () => {
        vi.stubGlobal('window', { innerWidth: 390 });
        go(mod);
        for (const [w, h, toolbar] of [
          [390, 632, 92],
          [380, 902, 130],
        ] as const) {
          const bad = labelBoxes(mod, { w, h }, lang, toolbar)
            .filter((b) => b.x1 > w || b.x0 < 0)
            .map((b) => `${b.text} to x = ${Math.round(b.x1)}`);
          expect(bad, `${name} ${w}`).toEqual([]);
        }
      });
});
