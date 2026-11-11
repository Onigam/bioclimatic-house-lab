import * as THREE from 'three';
import { PartRegistry, damp } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { HouseState } from '../../sim/types';
import { AirFlow } from '../collector/air';
import { addElementCaps } from '../collector/caps';
import {
  BAY,
  CEILING,
  CEILING_T,
  COLLECTOR_BAYS,
  CUT_X,
  ELEMENT_1967,
  FOOTING,
  GROUND_NORTH,
  GROUND_SOUTH,
  LENGTH,
  ROOF,
  SLAB,
  WALL,
  X_EAST,
  X_WEST,
  TUBE_PIT,
  TUBE_PLAN,
  Y_EAVE,
  Z_NORTH,
  Z_NORTH_IN,
  Z_SOUTH,
  bayX,
  elementLayout,
  elementSpecOf,
  type ElementSpec,
} from '../dims';
import { Followers } from '../follow';
import { HeatStrip } from '../heat';
import { HOUSE_PARTS, type HousePart } from '../ids';
import { groundY } from '../land/ground';
import { boulderMesh, scatterBoulders } from '../land/rocks';
import { snowOfState } from '../land/season';
import { SNOW, buildBlock, earthCap } from '../land/terrain';
import { oakSeason, stand, type Placement } from '../land/trees';
import { makeMaterials } from '../materials';
import { buildLiving } from '../room/living';
import { buildOtherRooms } from '../room/others';
import { Caps, ClipSet } from '../section';
import { makeRig } from '../sun';
import { anchor, box, hotspots, viewFrom, type HotspotDef, type PartFraming } from '../world';
import { buildEarthTube, tubeRuns } from './earthtube';
import { Z_RUN, buildHouse, roofUnder } from './shell';
import { buildYard } from './yard';

// The `house` world: the machine. The house on a block of its land, cut along the section you can ask for (the plane through the middle of the sample collector bay, the east half taken away), with the sun that the
// simulation has, the air going round the nine bays, the rooms lived in. Winter and summer on one switch: the flap. The earth tube, in its scenario only. Built by the same function `site` uses, from `dims.ts`.

export type HouseOptions = {
  params?: () => {
    setpoint: number;
    gap: number;
    glazingLayers: number;
    ductScale?: number;
    earthTube?: boolean;
    wind?: number;
  };
};

export const FRAMING: Record<HousePart, PartFraming> = {
  'south-facade': { viewDir: viewFrom(14, 20) },
  'collector-element': { viewDir: viewFrom(10, 35) },
  'entrance-recess': { viewDir: viewFrom(10, 15) },
  'entrance-balcony': { viewDir: viewFrom(16, 25) },
  'south-window': { viewDir: viewFrom(8, 25) },
  'east-gable': { viewDir: viewFrom(10, 90) },
  'west-gable': { viewDir: viewFrom(10, -90) },
  'north-wall': { viewDir: viewFrom(10, 180) },
  'north-window': { viewDir: viewFrom(8, 180) },
  'pitched-roof': { viewDir: viewFrom(30, 30) },
  'roof-insulation': { viewDir: viewFrom(35, 60) },
  'floor-slab': { viewDir: viewFrom(20, 60) },
  foundation: { viewDir: viewFrom(8, 30) },
  'interior-partitions': { viewDir: viewFrom(45, 70) },
  chimney: { viewDir: viewFrom(18, 30) },
  // the what-if parts are framed on the window in the ground, from the north: the house is behind them
  'earth-tube-intake': {
    viewDir: viewFrom(22, 215),
    frame: box(
      TUBE_PLAN.xWest - 1.6,
      groundY(TUBE_PLAN.xWest, TUBE_PLAN.zFar) - 0.8,
      TUBE_PLAN.zFar - 1.6,
      TUBE_PLAN.xWest + 1.6,
      groundY(TUBE_PLAN.xWest, TUBE_PLAN.zFar) + 2.4,
      TUBE_PLAN.zFar + 1.6,
    ),
  },
  'earth-tube-pipe': {
    viewDir: viewFrom(58, 195),
    frame: box(TUBE_PIT.x0, -3.0, TUBE_PIT.z0, TUBE_PIT.x1, 0.8, TUBE_PIT.z1),
  },
  'earth-tube-drain': {
    viewDir: viewFrom(38, 165),
    frame: box(
      TUBE_PLAN.xEast - 1.5,
      tubeRuns()[TUBE_PLAN.runs - 1]!.y - 0.6,
      tubeRuns()[TUBE_PLAN.runs - 1]!.z - 0.25,
      TUBE_PLAN.xEast - 0.1,
      groundY(TUBE_PLAN.xEast, Z_NORTH - 0.7) + 0.35,
      tubeRuns()[TUBE_PLAN.runs - 1]!.z + 1.15,
    ),
  },
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'collector-element', fr: 'Élément de captage', en: 'Collector element', goto: 'wall' },
  { id: 'interior-partitions', fr: 'Pièces', en: 'Rooms', goto: 'room', wide: true },
  { id: 'pitched-roof', fr: 'Toit', en: 'Roof', wide: true },
  { id: 'entrance-balcony', fr: 'Balcon', en: 'Balcony', wide: true },
  { id: 'south-window', fr: 'Fenêtre sud', en: 'South window', wide: true, minor: true },
  { id: 'foundation', fr: 'Fondations', en: 'Foundation', wide: true },
  { id: 'south-facade', fr: 'Façade sud', en: 'South front', minor: true },
  { id: 'entrance-recess', fr: 'Entrée en retrait', en: 'Entrance recess', minor: true },
  { id: 'east-gable', fr: 'Pignon est', en: 'East gable', minor: true },
  { id: 'west-gable', fr: 'Pignon ouest', en: 'West gable', minor: true },
  { id: 'north-wall', fr: 'Mur nord', en: 'North wall', minor: true },
  { id: 'north-window', fr: 'Fenêtre nord', en: 'North window', minor: true },
  { id: 'roof-insulation', fr: 'Isolation du toit', en: 'Roof insulation', minor: true },
  { id: 'floor-slab', fr: 'Dalle', en: 'Floor slab', minor: true },
  { id: 'chimney', fr: 'Cheminée', en: 'Chimney', minor: true },
  { id: 'earth-tube-intake', fr: 'Prise d’air (et si…)', en: 'Intake (what if…)', minor: true },
  { id: 'earth-tube-pipe', fr: 'Tuyau enterré (et si…)', en: 'Buried pipe (what if…)', minor: true },
  { id: 'earth-tube-drain', fr: 'Purge (et si…)', en: 'Drain (what if…)', minor: true },
];

/** The explode: the roof up, the floor and foundation down, the south front out towards the sun, the walls out, the rooms' own pieces lifted, the what-if parts off along their own axes. */
export const EXPLODE: Record<HousePart, [number, number, number]> = {
  'pitched-roof': [0, 2.6, 0],
  'roof-insulation': [0, 1.3, 0],
  chimney: [0, 3.4, 0],
  'east-gable': [2.6, 0, 0],
  'west-gable': [-2.6, 0, 0],
  'north-wall': [0, 0, -2.8],
  'north-window': [0, 0, -3.6],
  'south-facade': [0, 1.6, 1.4],
  'collector-element': [0, 0, 2.4],
  'south-window': [0, 0, 2.4],
  'entrance-recess': [0, 0, 2.8],
  'entrance-balcony': [0, -0.4, 4.2],
  'interior-partitions': [0, 0.9, 0],
  'floor-slab': [0, -1.2, 0],
  foundation: [0, -3.0, 0],
  // the buried parts come up out of their window in the ground, each to its own height
  'earth-tube-intake': [0, 1.4, 0],
  'earth-tube-pipe': [0, 3.4, 0],
  'earth-tube-drain': [0, 2.0, 0],
};

export interface HouseScene extends SceneModule<HouseState> {
  build: ReturnType<typeof buildHouse>;
  flow: AirFlow;
  clip: ClipSet;
  tube: ReturnType<typeof buildEarthTube>;
  yard: ReturnType<typeof buildYard>;
  living: ReturnType<typeof buildLiving>;
  strip: HeatStrip;
  drawn: { flap: number; snow: number; cut: boolean; tube: boolean; spec: ElementSpec };
  scenery(): THREE.Object3D[];
  trees(): Placement[];
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const PAPER = 0xe9e2d3;
export const BLOCK = { x0: -26, x1: 26, z0: -24, z1: 30, bottom: -9, cell: 0.7 } as const;

export function createHouseScene(opts: HouseOptions = {}): HouseScene {
  const scene = new THREE.Scene();
  scene.name = 'house';
  scene.background = new THREE.Color(PAPER);
  scene.userData.wantsEnv = true;
  scene.userData.look = { toneMapping: 'aces', exposure: 1.1, environment: 'paper', ao: true, aoRadius: 0.8 };
  const rig = makeRig(scene, {
    half: 30,
    key: 3.2,
    hemi: 0.78,
    focus: V(0, 1, 2),
    mapSize: 4096,
    normalBias: 0.06,
    bias: -0.0006,
    radius: 2.2,
  });
  const mats = makeMaterials();
  const registry = new PartRegistry();
  const strip = new HeatStrip(48);
  const spec0 = elementSpecOf({
    wallThickness: ELEMENT_1967.thickness,
    gap: ELEMENT_1967.gap,
    glazingLayers: ELEMENT_1967.layers,
  });
  let spec = spec0;

  // everything the section may cut lives under `world`; the caps live beside it
  const world = new THREE.Group();
  world.name = 'world';
  scene.add(world);

  // ---- the land: a block with its strata on the four sides, the boulders, a few trees, the yard
  const land = buildBlock({ ...BLOCK, strata: mats.strata, hole: TUBE_PIT });
  world.add(land.top, land.skirts!, land.lid!);
  const rocks = boulderMesh(
    [
      ...scatterBoulders(11, 18, { x0: -24, x1: 24, z0: -22, z1: -9 }, { x0: -12, x1: 7, z0: -30, z1: 30 }, 0.5, 2.2),
      ...scatterBoulders(23, 9, { x0: -24, x1: 24, z0: 8, z1: 28 }, { x0: -14, x1: 8, z0: -30, z1: 30 }, 0.3, 0.9),
    ],
    mats.granite,
  );
  world.add(rocks);
  const placements = (list: [number, number, number][]): Placement[] =>
    list.map(([x, z, s], i) => ({ x, z, y: groundY(x, z), s, r: i * 1.7 }));
  const pines = stand(
    'pine',
    placements([
      [-21, -17, 1.15],
      [-15, -20, 1.3],
      [-9, -15, 1.0],
      [12, -17, 1.1],
      [18, -20, 1.25],
      [22, -14, 0.95],
      [-23, -9, 0.9],
      [24, -6, 1.0],
    ]),
  );
  const oaks = stand(
    'oak',
    placements([
      [-19, 7, 1.0],
      [-22, 15, 1.15],
      [-12, 25, 0.9],
      [-21, 24, 1.05],
    ]),
  );
  const bushes = stand(
    'bush',
    placements([
      [-11, 12, 1.0],
      [-14, 18, 1.2],
      [-11, -9, 1.2],
      [8, -9, 1.0],
      [-17, 3, 1.0],
      [-6, 20, 0.9],
    ]),
  );
  world.add(pines.group, oaks.group, bushes.group);
  const yard = buildYard(mats);
  world.add(yard.group);

  // ---- the house
  const house = buildHouse(mats, { interior: true, instruments: true });
  world.add(house.root);
  const living = buildLiving(mats, spec0, { floorAndCeiling: false });
  for (const id of Object.keys(living.parts) as (keyof typeof living.parts)[]) world.add(living.parts[id]);
  const others = buildOtherRooms(mats);
  world.add(living.furniture, living.roomLight, others);

  // ---- the earth tube
  const tube = buildEarthTube(mats, land.hole!);
  world.add(tube.intake, tube.pipe, tube.drain, tube.pit);

  // ---- the air in the nine bays
  const flowHolder = new THREE.Group();
  flowHolder.position.z = Z_SOUTH;
  world.add(flowHolder);
  const flow = new AirFlow(
    COLLECTOR_BAYS.map((i) => bayX(i)),
    16,
    house.collector.layout,
    spec,
    5,
  );
  flowHolder.add(flow.group);

  // ---- the section: the plane x = CUT_X keeps the west; the faces of everything it cuts
  const clip = new ClipSet([{ normal: [-1, 0, 0], at: [CUT_X, 0, 0] }]);
  const caps = new Caps();
  const capMat = (m: THREE.MeshStandardMaterial, offset = 0): THREE.Material => {
    const c = m.clone();
    c.side = THREE.DoubleSide;
    c.clippingPlanes = null;
    c.userData = { noShare: true };
    if (offset) {
      c.polygonOffset = true;
      c.polygonOffsetFactor = offset;
      c.polygonOffsetUnits = offset;
    }
    return c;
  };
  const capsRoot = new THREE.Group();
  capsRoot.name = 'caps';
  scene.add(capsRoot);
  const polyCap = (points: [number, number][], mat: THREE.Material): THREE.Mesh => {
    const shape = new THREE.Shape(points.map(([z, y]) => new THREE.Vector2(z, y)));
    const g = new THREE.ShapeGeometry(shape);
    const p = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const z = p.getX(i);
      const y = p.getY(i);
      p.setXYZ(i, CUT_X, y, z);
      uv.setXY(i, z, y);
    }
    return caps.addScenery(capsRoot, g, mat);
  };
  const rect = (z0: number, y0: number, z1: number, y1: number, mat: THREE.Material): THREE.Mesh =>
    polyCap(
      [
        [z0, y0],
        [z1, y0],
        [z1, y1],
        [z0, y1],
      ],
      mat,
    );
  const L0 = elementLayout(spec0);
  const dynamicCaps: { mesh: THREE.Mesh; make: (s: ElementSpec) => THREE.BufferGeometry }[] = [];
  const dyn = (make: (s: ElementSpec) => [number, number][], mat: THREE.Material): void => {
    const geo = (s: ElementSpec): THREE.BufferGeometry => {
      const pts = make(s);
      const g = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y))));
      const p = g.attributes.position as THREE.BufferAttribute;
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < p.count; i++) {
        const z = p.getX(i);
        const y = p.getY(i);
        p.setXYZ(i, CUT_X, y, z);
        uv.setXY(i, z, y);
      }
      return g;
    };
    const mesh = caps.addScenery(capsRoot, geo(spec0), mat);
    dynamicCaps.push({ mesh, make: geo });
  };
  const R = (z0: number, y0: number, z1: number, y1: number): [number, number][] => [
    [z0, y0],
    [z1, y0],
    [z1, y1],
    [z0, y1],
  ];
  // the earth: its own strata, behind everything else in the plane
  const earthMat = capMat(mats.strata, 3);
  caps.addScenery(capsRoot, earthCap(CUT_X, BLOCK.z0, BLOCK.z1, BLOCK.bottom), earthMat);
  // the foundation: south wall and footing, north footing, the hardcore under the slab
  dyn(
    (s) => R(Z_SOUTH + elementLayout(s).inner, GROUND_SOUTH - FOOTING + 0.02, Z_SOUTH, elementLayout(s).yBottom),
    capMat(mats.plinth, -1),
  );
  dyn(
    (s) => R(Z_SOUTH + elementLayout(s).inner - 0.2, GROUND_SOUTH - FOOTING, Z_SOUTH + 0.15, GROUND_SOUTH + 0.02),
    capMat(mats.plinth, -1),
  );
  rect(Z_NORTH - 0.12, GROUND_NORTH - FOOTING, Z_NORTH + WALL + 0.12, GROUND_NORTH, capMat(mats.plinth, -1));
  dyn(
    (s) => [
      [Z_NORTH_IN, -SLAB],
      [Z_SOUTH + elementLayout(s).inner, -SLAB],
      [Z_SOUTH + elementLayout(s).inner, groundY(0, Z_SOUTH + elementLayout(s).inner)],
      [Z_NORTH_IN, groundY(0, Z_NORTH_IN)],
    ],
    capMat(mats.gravel, -1),
  );
  // slab, tile, ceiling, insulation
  rect(Z_NORTH_IN, -SLAB, Z_RUN, -0.03, capMat(mats.plinth, -1));
  rect(Z_NORTH_IN, -0.03, Z_RUN, 0, capMat(mats.tile, -2));
  rect(Z_NORTH_IN, CEILING, Z_RUN, CEILING + CEILING_T, capMat(mats.ceiling, -1));
  rect(Z_NORTH_IN, CEILING + CEILING_T, Z_RUN, CEILING + CEILING_T + 0.12, capMat(mats.insulation, -1));
  // the north wall, the head band
  rect(Z_NORTH, GROUND_NORTH, Z_NORTH + WALL, Y_EAVE, capMat(mats.render, -1));
  dyn((s) => R(Z_SOUTH + elementLayout(s).inner, elementLayout(s).yTop, Z_SOUTH, Y_EAVE), capMat(mats.concrete, -1));
  // the roof's boards and slates: two parallelograms each side
  const tv = (o: number) => o / Math.cos((24 * Math.PI) / 180);
  for (const sgn of [1, -1] as const) {
    const zE = sgn * (Z_SOUTH + 0.15);
    const layer = (o0: number, o1: number, mat: THREE.Material): void => {
      const a = (z: number, o: number): [number, number] => [z, roofUnder(z) + tv(o)];
      polyCap(sgn > 0 ? [a(0, o0), a(zE, o0), a(zE, o1), a(0, o1)] : [a(zE, o0), a(0, o0), a(0, o1), a(zE, o1)], mat);
    };
    layer(ROOF.rafter, ROOF.rafter + 0.02, capMat(mats.timberDark, -1));
    layer(ROOF.rafter + 0.02, ROOF.rafter + 0.02 + ROOF.cover, capMat(mats.slate, -1));
    layer(0, ROOF.rafter, capMat(mats.timber, -1));
  }
  // the collector element's own faces, with the heat in the concrete, in a frame at the section
  const capsParent = new THREE.Group();
  capsParent.position.set(CUT_X, 0, Z_SOUTH);
  capsRoot.add(capsParent);
  const elementCaps = addElementCaps(caps, capsParent, mats, strip, 0, spec0, () => 'collector-element');
  void L0;

  // ---- the east gable: with the section on, the east half of the house is taken away, and the gable with it. A part the visitor can choose has to be readable in every view, so the gable stays as a pale ghost with its edges
  // drawn, out of the section's reach: the part to select, outlined, when the cut is on; plain render when it is off.
  const gableMesh = house.pieces['east-gable-wall']!;
  const gableMat = (gableMesh.material as THREE.MeshStandardMaterial).clone();
  gableMat.userData = { noShare: true };
  gableMat.side = THREE.DoubleSide;
  gableMesh.material = gableMat;
  gableMesh.userData.notClipped = true;
  const gableEdges = new THREE.LineSegments(
    new THREE.EdgesGeometry(gableMesh.geometry, 25),
    new THREE.LineBasicMaterial({ color: 0x7d7566, transparent: true, opacity: 0.8 }),
  );
  gableEdges.name = 'east-gable-edges';
  gableEdges.raycast = () => {};
  gableEdges.visible = false;
  house.groups['east-gable'].add(gableEdges);
  const setGable = (cut: boolean): void => {
    gableMat.transparent = cut;
    gableMat.opacity = cut ? 0.14 : 1;
    gableMat.depthWrite = !cut;
    gableEdges.visible = cut;
  };

  // ---- registered parts
  const groups: Record<HousePart, THREE.Object3D> = { ...house.groups } as Record<HousePart, THREE.Object3D>;
  groups['earth-tube-intake'] = tube.intake;
  groups['earth-tube-pipe'] = tube.pipe;
  groups['earth-tube-drain'] = tube.drain;
  for (const id of HOUSE_PARTS) registry.add(id, groups[id], V(...EXPLODE[id]), undefined, FRAMING[id]);

  // ---- what is not a part follows the part that carries it: hidden with it, exploded with it (the kit moves the parts, never the props round them). The yard's things stand on the land, which is not a part: they stay.
  const followers = new Followers();
  {
    const mine = living.parts;
    const hung = living.mounts;
    // the floor carries the furniture, the other rooms' beds and kitchen, the recorder's desk, the armchair, and the floor's finish
    followers.add(hung.floor, 'floor-slab');
    followers.add(others, 'floor-slab');
    followers.add(mine['chart-recorder'], 'floor-slab');
    followers.add(mine['armchair'], 'floor-slab');
    for (const n of ['floor-tile', 'floor-oak']) followers.add(house.pieces[n]!, 'floor-slab');
    // the north wall carries the heater and its panel, the thermostat, the vent, a picture and the skirting
    for (const id of ['electric-heater', 'electric-panel', 'thermostat', 'fresh-air-vent'] as const)
      followers.add(mine[id], 'north-wall');
    followers.add(hung.north, 'north-wall');
    followers.add(house.pieces['skirting-north']!, 'north-wall');
    // the cross walls carry a coat and a picture
    followers.add(hung.west, 'interior-partitions');
    followers.add(hung.east, 'interior-partitions');
    // the south wall's inner face carries the curtains, its plate with the ducts' holes, the instruments' jet and return
    followers.add(hung.south, 'collector-element');
    for (const id of [
      'inner-wall-face',
      'warm-air-jet',
      'floor-return',
      'room-air-probe',
      'room-surface-probes',
    ] as const)
      followers.add(mine[id], 'collector-element');
    // the ceiling hangs under the roof's insulation and carries the lamp
    followers.add(house.pieces['ceiling']!.parent!, 'roof-insulation');
    followers.add(mine['room-ceiling'], 'roof-insulation');
    // the balcony's chair and pots
    followers.add(yard.balcony, 'entrance-balcony');
  }
  clip.clip(world);
  // the instruments' beads and leads lie in the plane: shown only while the section is on, never clipped
  for (const o of house.collector.cutOnly) o.userData.notClipped = true;

  // ---- labels
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: HousePart, p: THREE.Vector3) => {
    anchors[id] = anchor(groups[id], p.x, p.y, p.z, `${id}-label`);
  };
  const A = house.anchors;
  at('south-facade', A.southFacade!);
  // the label stands on a bay of the west block (the nearest to the home view's left edge), the section on the sample bay: the part is all nine
  at('collector-element', V(bayX(2), elementLayout(spec0).yBottom + 2.4, Z_SOUTH + 0.05));
  at('entrance-recess', A.recess!);
  at('entrance-balcony', A.balcony!);
  at('south-window', A.window!);
  at('east-gable', A.eastGable!);
  at('west-gable', A.westGable!);
  at('north-wall', A.northWall!);
  at('north-window', A.northWindow!);
  at('pitched-roof', A.roof!);
  at('roof-insulation', A.insulation!);
  at('floor-slab', A.slab!);
  at('foundation', A.foundation!);
  at('interior-partitions', A.partitions!);
  at('chimney', A.chimney!);
  at('earth-tube-intake', tube.intakeTop);
  at('earth-tube-pipe', tube.route[1]!.clone().setY(groundY(tube.route[1]!.x, tube.route[1]!.z) + 0.1));
  at('earth-tube-drain', tube.drainAt);

  const drawn = { flap: 0, snow: 0, cut: false, tube: false, spec };
  let gableCut = false;
  let flapNow = 0;
  const mod: HouseScene = {
    id: 'house',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors) as Hotspot[],
    build: house,
    flow,
    clip,
    tube,
    yard,
    living,
    strip,
    drawn,
    scenery: () => [land.top, land.skirts!, rocks],
    trees: () => [...pines.placements, ...oaks.placements, ...bushes.placements],
    // The opening is the overview: the kit frames the world once it is built, from this direction, on the box of every part (the earth tube's window in the ground north of the house included). The camera stands south-south-east
    // and a little above, 24° off the south front's normal, so that the glass front reads square on, the cut faces and the stair show, and the front fills the width of a phone.
    home: { position: V(15.3, 15.5, 34.9), target: V(0, 1.8, 0.6) },
    minDistance: 0.3,
    maxDistance: 120,
    near: 0.06,
    far: 400,
    homePadding: 0.8,
    declutter: true,
    update(s, dt, view) {
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
        elementCaps.relayout(spec);
        for (const d of dynamicCaps) {
          const old = d.mesh.geometry;
          d.mesh.geometry = d.make(spec);
          old.dispose();
        }
        drawn.spec = spec;
      }
      rig.update(s);
      SNOW.value = snowOfState(s);
      drawn.snow = SNOW.value;
      oakSeason(oaks.crownMaterial, s.dayOfYear);
      mats.glass.opacity = 0.07 + 0.3 * s.glassRefuses;
      mats.glass.envMapIntensity = 0.15 + 1.1 * s.glassRefuses;
      flapNow = dt > 0 ? damp(flapNow, s.flapOpen, 5, Math.min(dt, 0.1)) : flapNow;
      house.collector.setFlap(flapNow);
      drawn.flap = flapNow;
      strip.update(s.layers, s.tOuterFace, s.tInnerFace);
      flow.update(s, dt, view.slowMo, view.schematic);
      living.update(s, {
        setpoint: p?.setpoint ?? 20,
        night: Math.min(1, rig.night * 1.3),
        forwardFlow: s.flowDir > 0 && s.flapOpen < 0.5,
      });
      yard.update(view.time, p?.wind ?? 2);

      // the section: on with the tool. The instruments' beads and leads lie in the plane: shown while it is on, and only while their part is
      clip.set(view.cutaway);
      drawn.cut = view.cutaway;
      caps.update(view.cutaway, registry);
      for (const o of house.collector.cutOnly)
        o.visible = view.cutaway && Followers.drawn(registry, registry.partOf(o) ?? '');

      // the earth tube is always drawn, pale: it is a what-if, and the scenario makes it firm. Never collapsed, never hidden: it has its size, its box and its place in every view
      tube.setOn(!!p?.earthTube);
      drawn.tube = !!p?.earthTube;
      followers.update(registry);
      if (gableCut !== view.cutaway) {
        gableCut = view.cutaway;
        setGable(gableCut);
      }
    },
  };
  void LENGTH;
  void BAY;
  void X_EAST;
  void X_WEST;
  return mod;
}
