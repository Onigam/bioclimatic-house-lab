import * as THREE from 'three';
import { PartRegistry, damp } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { HouseState } from '../../sim/types';
import { AirFlow } from '../collector/air';
import {
  CEILING,
  ELEMENT_1967,
  LIVING_X0,
  LIVING_X1,
  ROOM,
  SAMPLE_BAY,
  SLAB,
  WALL,
  Y_EAVE,
  Z_NORTH,
  Z_NORTH_IN,
  Z_SOUTH,
  bayX,
  elementLayout,
  elementSpecOf,
  type ElementSpec,
} from '../dims';
import { ROOM_PARTS, type RoomPart } from '../ids';
import { Z_RUN, buildHouse } from '../house/shell';
import { makeMaterials } from '../materials';
import { Followers } from '../follow';
import { Caps, ClipSet } from '../section';
import { makeRig } from '../sun';
import { anchor, box, crowdLabels, hotspots, viewFrom, type HotspotDef, type PartFraming } from '../world';
import { AT } from './equipment';
import { buildLiving } from './living';

// The `room` world: where the heat arrives and where the current goes. The living room of the house, in the plan's own place, one bay line to the other: the same house the `house` world draws (the very function), with
// the roof, the gables and the foundation taken away, the other rooms cut off at the bay lines, and the rest of the room as the family left it. The wall of one collector element stands at the back with its two grilles and
// the instruments of 1974–75; the jet leaves the upper one and the return enters the lower one. No section: it would teach nothing here. The north wall, the cross walls and the ceiling stand aside by the side the camera is on.

export type RoomOptions = {
  params?: () => { setpoint: number; gap: number; glazingLayers: number; ductScale?: number; build?: '1967' | '1974' };
};

export const FRAMING: Record<RoomPart, PartFraming> = {
  'inner-wall-face': { viewDir: viewFrom(14, 190) },
  'warm-air-jet': { viewDir: viewFrom(10, 150) },
  'floor-return': { viewDir: viewFrom(12, 160) },
  thermostat: { viewDir: viewFrom(6, 0), frame: box(0.9, 1.4, -3.0, 1.2, 1.6, -2.95) },
  'electric-heater': { viewDir: viewFrom(14, 25), frame: box(-1.1, 0.1, -3.0, -0.1, 0.7, -2.8) },
  'electric-panel': { viewDir: viewFrom(8, 10), frame: box(0.35, 1.35, -3.0, 0.75, 1.9, -2.85) },
  'room-air-probe': { viewDir: viewFrom(10, 60), frame: box(0.6, 1.4, 0.5, 1.0, 1.7, 0.9) },
  'room-surface-probes': { viewDir: viewFrom(18, 160) },
  'chart-recorder': { viewDir: viewFrom(24, 205), frame: box(0.9, 0.7, 1.95, 1.5, 1.1, 2.5) },
  'fresh-air-vent': { viewDir: viewFrom(10, 20) },
  'room-floor': { viewDir: viewFrom(40, 160) },
  'room-ceiling': { viewDir: viewFrom(-6, 160) },
  armchair: { viewDir: viewFrom(18, 150) },
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'inner-wall-face', fr: 'Face intérieure du mur', en: 'Inner face of the wall', wide: true },
  { id: 'warm-air-jet', fr: 'Jet d’air chaud', en: 'Warm-air jet', wide: true },
  { id: 'floor-return', fr: 'Retour au sol', en: 'Floor return', wide: true },
  { id: 'thermostat', fr: 'Thermostat', en: 'Thermostat', minor: true, crowd: true },
  { id: 'electric-heater', fr: 'Radiateur électrique', en: 'Electric heater', minor: true },
  { id: 'chart-recorder', fr: 'Enregistreur', en: 'Chart recorder' },
  { id: 'electric-panel', fr: 'Tableau électrique', en: 'Electric panel', minor: true },
  { id: 'room-air-probe', fr: 'Sonde d’air', en: 'Air probe', minor: true, crowd: true },
  { id: 'room-surface-probes', fr: 'Sondes de surface', en: 'Surface probes', minor: true, crowd: true },
  { id: 'fresh-air-vent', fr: 'Entrée d’air frais', en: 'Fresh-air vent', minor: true, crowd: true },
  { id: 'room-floor', fr: 'Sol', en: 'Floor', minor: true },
  { id: 'room-ceiling', fr: 'Plafond', en: 'Ceiling', minor: true, crowd: true },
  { id: 'armchair', fr: 'Fauteuil', en: 'Armchair', minor: true },
];

/** The explode: the ceiling up, the floor down, the wall's face and the loop's streams out into the room, each instrument off its wall. */
export const EXPLODE: Record<RoomPart, [number, number, number]> = {
  'inner-wall-face': [0, 0, -0.7],
  'warm-air-jet': [0, 0.5, -0.3],
  'floor-return': [0, -0.25, -0.3],
  thermostat: [0, 0.5, 0.7],
  'electric-heater': [0, 0, 0.9],
  'electric-panel': [0, 0.5, 0.7],
  'room-air-probe': [0, 0.5, 0],
  'room-surface-probes': [0, 0, -0.5],
  'chart-recorder': [0, 0.9, 0],
  'fresh-air-vent': [0, 0, 0.7],
  'room-floor': [0, -0.9, 0],
  'room-ceiling': [0, 1.4, 0],
  armchair: [-0.8, 0, 0.3],
};

export interface RoomScene extends SceneModule<HouseState> {
  house: ReturnType<typeof buildHouse>;
  living: ReturnType<typeof buildLiving>;
  flow: AirFlow;
  scenery(): THREE.Object3D[];
  drawn: { heater: number; carriage: number; jet: number; night: number; setpointDial: number };
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const PAPER = 0xe9e2d3;

export function createRoomScene(opts: RoomOptions = {}): RoomScene {
  const scene = new THREE.Scene();
  scene.name = 'room';
  scene.background = new THREE.Color(PAPER);
  scene.userData.wantsEnv = true;
  scene.userData.look = { toneMapping: 'aces', exposure: 1.1, environment: 'paper', ao: true, aoRadius: 0.5 };
  const rig = makeRig(scene, {
    half: 5.2,
    key: 3.2,
    hemi: 0.8,
    focus: V(0, 1.8, -0.2),
    normalBias: 0.045,
    bias: -0.0008,
    radius: 3,
  });
  const mats = makeMaterials();
  const registry = new PartRegistry();
  const spec0 = elementSpecOf({
    wallThickness: ELEMENT_1967.thickness,
    gap: ELEMENT_1967.gap,
    glazingLayers: ELEMENT_1967.layers,
  });
  let spec: ElementSpec = spec0;

  // ---- the house, the same function as `house`'s; what the room has no use for goes
  const house = buildHouse(mats, { interior: true, instruments: true });
  scene.add(house.root);
  for (const id of [
    'pitched-roof',
    'chimney',
    'east-gable',
    'west-gable',
    'foundation',
    'roof-insulation',
    'entrance-balcony',
    'earth-tube-intake',
    'earth-tube-pipe',
    'earth-tube-drain',
  ] as const)
    house.groups[id].visible = false;
  for (const n of ['floor-tile', 'floor-oak', 'ceiling']) house.pieces[n]!.visible = false;
  for (const o of house.scenery.children) o.visible = o.name === 'skirting-north';

  // ---- the section's two planes, along the cross walls' outer faces: the rest of the house is cut off, and the cut ends get their faces
  const clip = new ClipSet([
    { normal: [1, 0, 0], at: [LIVING_X0, 0, 0] },
    { normal: [-1, 0, 0], at: [LIVING_X1, 0, 0] },
  ]);
  clip.set(true);
  clip.clip(house.root);
  const caps = new Caps();
  const capMat = (m: THREE.MeshStandardMaterial): THREE.Material => {
    const c = m.clone();
    c.side = THREE.DoubleSide;
    c.clippingPlanes = null;
    c.userData = { noShare: true };
    return c;
  };
  const endCap = (x: number, face: 1 | -1, z0: number, y0: number, z1: number, y1: number, m: THREE.Material): void => {
    const g = new THREE.PlaneGeometry(z1 - z0, y1 - y0);
    g.rotateY((face * Math.PI) / 2);
    g.translate(x, (y0 + y1) / 2, (z0 + z1) / 2);
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (z1 - z0), uv.getY(i) * (y1 - y0));
    caps.addScenery(scene, g, m);
  };
  const L0 = elementLayout(spec0);
  for (const [x, f] of [
    [LIVING_X0, 1],
    [LIVING_X1, -1],
  ] as const) {
    endCap(x, f, Z_NORTH, -0.3, Z_NORTH + WALL, Y_EAVE, capMat(mats.render));
    endCap(x, f, Z_NORTH + WALL, -SLAB, Z_RUN, -0.03, capMat(mats.plinth));
    endCap(x, f, Z_SOUTH + L0.inner, L0.yTop, Z_SOUTH, Y_EAVE, capMat(mats.concrete));
  }

  // ---- the parts of this world and the furniture
  const living = buildLiving(mats, spec0, { floorAndCeiling: true });
  const groups = living.parts;
  for (const id of ROOM_PARTS) scene.add(groups[id]);
  scene.add(living.furniture, living.roomLight);
  const sampleX = bayX(SAMPLE_BAY);
  const zIn = Z_SOUTH + L0.inner;

  // ---- the loop's dots in the sample bay
  const flowHolder = new THREE.Group();
  flowHolder.position.z = Z_SOUTH;
  scene.add(flowHolder);
  const flow = new AirFlow([sampleX], 40, house.collector.layout, spec, 6);
  flowHolder.add(flow.group);

  for (const id of ROOM_PARTS) registry.add(id, groups[id], V(...EXPLODE[id]), undefined, FRAMING[id]);
  // the furniture stands on the room's floor: with the floor isolated away, or exploded, it goes with it
  const followers = new Followers();
  followers.add(living.mounts.floor, 'room-floor');

  // ---- labels
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: RoomPart, x: number, y: number, z: number) => {
    anchors[id] = anchor(groups[id], x, y, z, `${id}-label`);
  };
  at('inner-wall-face', sampleX + 0.4, 2.3, zIn - 0.01);
  at('warm-air-jet', sampleX, L0.yDuctHigh - 0.35, zIn - 1.0);
  at('floor-return', sampleX, 0.18, zIn - 0.8);
  at('thermostat', AT.thermostatX, ROOM.thermostat + 0.06, Z_NORTH_IN + 0.04);
  at('electric-heater', AT.heaterX, ROOM.heater.y + ROOM.heater.h + 0.02, Z_NORTH_IN + 0.06);
  at('electric-panel', AT.panelX, ROOM.panel.y + ROOM.panel.h + 0.02, Z_NORTH_IN + 0.06);
  at('room-air-probe', AT.probe.x, ROOM.thermostat + 0.06, AT.probe.z);
  at('room-surface-probes', 1.15, 1.2, zIn - 0.02);
  at('chart-recorder', (AT.desk.x0 + AT.desk.x1) / 2, 0.75 + ROOM.recorder.h + 0.05, AT.desk.z1 - AT.desk.depth / 2);
  at('fresh-air-vent', AT.ventX, ROOM.freshVent.y + ROOM.freshVent.h + 0.06, Z_NORTH_IN + 0.03);
  at('room-floor', 0.2, 0.0, 0.5);
  at('room-ceiling', 0.3, CEILING + 0.0, -0.4);
  at('armchair', -1.95, 0.85, 2.05);

  // ---- the north wall and the cross walls stand aside by the side the camera is on: seen from outside, a wall goes to a pale ghost (the camera is inside the room at home, and sees them whole)
  // What hangs on a wall goes with it: seen from outside, the wall is a pale ghost, and a heater, a panel, a window, a door or a picture left solid in front of it would hang in the air. Each wall carries its own fixtures
  // (they are put back when the camera is on the room's side again); what stands on the floor stays.
  const onWall: Record<'north' | 'west' | 'east', THREE.Object3D[]> = {
    north: [
      groups['electric-heater'],
      groups['electric-panel'],
      groups['thermostat'],
      groups['fresh-air-vent'],
      living.mounts.north,
      house.groups['north-window'],
      house.pieces['skirting-north']!,
    ],
    west: [living.mounts.west, house.pieces['door-west']!],
    east: [living.mounts.east, house.pieces['door-east']!],
  };
  const wallSides: {
    side: 'north' | 'west' | 'east';
    mat: THREE.MeshStandardMaterial;
    visibleFrom: (c: THREE.Vector3) => boolean;
  }[] = [
    {
      side: 'north',
      mat: house.pieces['north-wall']!.material as THREE.MeshStandardMaterial,
      visibleFrom: (c) => c.z > Z_NORTH + WALL * 0.5,
    },
    {
      side: 'west',
      mat: house.pieces['partition-west']!.material as THREE.MeshStandardMaterial,
      visibleFrom: (c) => c.x > LIVING_X0 + 0.05,
    },
    {
      side: 'east',
      mat: house.pieces['partition-east']!.material as THREE.MeshStandardMaterial,
      visibleFrom: (c) => c.x < LIVING_X1 - 0.05,
    },
  ];
  const wallSolid = { north: true, west: true, east: true };
  // a wall that the camera goes through fades to its ghost and back over a fifth of a second, not in one frame (the clock is the view's)
  const opacity = new Map<THREE.Material, number>();
  let clock = 0;
  let clockAt = 0;
  const ceilingGroup = groups['room-ceiling'];
  scene.onBeforeRender = (_r, _s, camera) => {
    const p = camera.position;
    const dtf = Math.min(0.1, Math.max(0, clock - clockAt));
    clockAt = clock;
    for (const w of wallSides) {
      const target = w.visibleFrom(p) ? 1 : 0.1;
      const cur = opacity.get(w.mat) ?? 1;
      const next =
        dtf > 0 || !opacity.has(w.mat)
          ? cur + (target - cur) * Math.min(1, 8 * Math.max(dtf, 0.1 * (opacity.has(w.mat) ? 0 : 1)))
          : cur;
      if (!opacity.has(w.mat) || Math.abs(next - cur) > 1e-4) {
        opacity.set(w.mat, next);
        w.mat.opacity = next;
        const clear = next < 0.999;
        if (w.mat.transparent !== clear) {
          w.mat.transparent = clear;
          w.mat.needsUpdate = true;
        }
        w.mat.depthWrite = next > 0.6;
      }
      const solid = (opacity.get(w.mat) ?? 1) > 0.5;
      if (solid !== wallSolid[w.side]) {
        wallSolid[w.side] = solid;
        for (const o of onWall[w.side]) o.visible = solid;
      }
    }
    // the ceiling is hidden from above (and its lamp with it) unless it is shown on its own
    const e = registry.get('room-ceiling');
    ceilingGroup.visible = e?.display === 'hidden' ? false : p.y < CEILING + 0.02 || e?.display === 'ghost';
  };

  let flapNow = 0;
  const hotspotList = hotspots(HOTSPOTS, anchors) as Hotspot[];
  const phoneLabels = crowdLabels(HOTSPOTS, anchors);
  const mod: RoomScene = {
    id: 'room',
    scene,
    registry,
    hotspots: hotspotList,
    house,
    living,
    flow,
    scenery: () => [house.root, living.furniture],
    drawn: living.drawn,
    home: { position: V(-3.4, 4.6, -6.0), target: V(-0.2, 1.9, 0.3) },
    minDistance: 0.15,
    maxDistance: 22,
    near: 0.03,
    far: 160,
    homePadding: 0.8,
    declutter: true,
    update(s, dt, view) {
      phoneLabels();
      clock = view.time;
      const p = opts.params?.();
      const next = elementSpecOf({
        build: '1967',
        wallThickness: s.wallThickness,
        gap: p?.gap ?? ELEMENT_1967.gap,
        glazingLayers: p?.glazingLayers ?? ELEMENT_1967.layers,
        ductScale: p?.ductScale ?? 1,
      });
      if (
        Math.abs(next.thickness - spec.thickness) > 1e-4 ||
        Math.abs(next.gap - spec.gap) > 1e-4 ||
        next.layers !== spec.layers ||
        Math.abs(next.ductWidth - spec.ductWidth) > 1e-4
      ) {
        spec = next;
        house.relayout(spec);
        flow.relayout(house.collector.layout, spec);
        living.relayout(spec);
      }
      rig.update(s);
      mats.glass.opacity = 0.07 + 0.3 * s.glassRefuses;
      mats.glass.envMapIntensity = 0.15 + 1.1 * s.glassRefuses;
      flapNow = dt > 0 ? damp(flapNow, s.flapOpen, 5, Math.min(dt, 0.1)) : flapNow;
      house.collector.setFlap(flapNow);
      flow.update(s, dt, view.slowMo, view.schematic);
      living.update(s, {
        setpoint: p?.setpoint ?? ROOM.setpoint,
        night: Math.min(1, rig.night * 1.3),
        forwardFlow: s.flowDir > 0 && s.flapOpen < 0.5,
      });
      caps.update(true, null);
      followers.update(registry);
    },
  };
  return mod;
}
