import * as THREE from 'three';
import { PartRegistry, contactShadow, damp } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { HouseState } from '../../sim/types';
import { AirFlow } from '../collector/air';
import { addElementCaps, mergeRects, type Rect } from '../collector/caps';
import { buildElement } from '../collector/element';
import { bx } from '../house/geo';
import {
  CEILING,
  CEILING_T,
  ELEMENT_1967,
  SLAB,
  Y_EAVE,
  elementLayout,
  elementSpecOf,
  type ElementSpec,
} from '../dims';
import { joined, smoothstep } from '../common';
import { HEAT_MAX, HEAT_MIN, HeatStrip, heatColor } from '../heat';
import { WALL_PARTS, type WallPart } from '../ids';
import { makeMaterials } from '../materials';
import { Followers } from '../follow';
import { Caps, ClipSet } from '../section';
import { Slots } from '../slots';
import { SUN_UNIFORMS, makeRig } from '../sun';
import { cutConcreteMap, plateauGroundMap, tiled } from '../textures';
import { anchor, box, crowdLabels, hotspots, viewFrom, type HotspotDef, type PartFraming } from '../world';
import { buildLivedIn } from './livedin';
import { clockSet, followSun, makeSky } from './sky';
import { buildSunlight } from './sunlight';
import { GROUND_Y, boulderGeometries, buildHills, groundGeometry, planarShadow, wallBoulders } from './land';

// The `wall` world: where the heat goes. One collector element at one to one, cut open down its middle: the frame and two sheets of glass, the air gap, the black face, the concrete coloured by the model's temperatures cell by
// cell, the two ducts through it, the flap, the instruments of 1974–75. The section is always on (it is the world), so there is no tool. It is the very function `house` uses for its nine bays, in the element's own frame.

export type WallOptions = {
  /** What the state does not carry: the sliders of the gap, the sheets, the ducts and the build. */
  params?: () => { build?: '1967' | '1974'; gap: number; glazingLayers: number; ductScale?: number };
};

export const FRAMING: Record<WallPart, PartFraming> = {
  'outer-glazing': { viewDir: viewFrom(12, 100) },
  'inner-glazing': { viewDir: viewFrom(12, 100) },
  'steel-frame': { viewDir: viewFrom(14, 100) },
  'air-gap': { viewDir: viewFrom(8, 95) },
  'black-paint': { viewDir: viewFrom(10, 95) },
  'storage-wall': { viewDir: viewFrom(6, 92) },
  'upper-duct': { viewDir: viewFrom(10, 100) },
  'lower-duct': { viewDir: viewFrom(10, 100) },
  'summer-flap': { viewDir: viewFrom(16, 96) },
  'head-beam': { viewDir: viewFrom(10, 100) },
  'sill-beam': { viewDir: viewFrom(10, 100) },
  'wall-thermocouples': { viewDir: viewFrom(10, 100) },
  'air-thermocouples': { viewDir: viewFrom(10, 100), frame: box(-0.4, 1.3, -0.17, 0.0, 2.2, -0.04) },
  'hot-wire-anemometer': { viewDir: viewFrom(12, 128), frame: box(-0.4, -0.15, -1.05, 0.1, 0.6, -0.4) },
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'storage-wall', fr: 'Mur de stockage', en: 'Storage wall' },
  { id: 'air-gap', fr: 'Lame d’air', en: 'Air gap' },
  { id: 'outer-glazing', fr: 'Vitrage extérieur', en: 'Outer glazing', wide: true },
  { id: 'upper-duct', fr: 'Conduit haut', en: 'Upper duct' },
  { id: 'lower-duct', fr: 'Conduit bas', en: 'Lower duct' },
  { id: 'black-paint', fr: 'Peinture noire', en: 'Black paint', wide: true },
  { id: 'inner-glazing', fr: 'Vitrage intérieur', en: 'Inner glazing', minor: true, crowd: true },
  { id: 'steel-frame', fr: 'Cadre acier', en: 'Steel frame', minor: true, crowd: true },
  { id: 'summer-flap', fr: 'Clapet d’été', en: 'Summer flap', minor: true },
  { id: 'head-beam', fr: 'Poutre de tête', en: 'Head beam', minor: true, crowd: true },
  { id: 'sill-beam', fr: 'Poutre d’appui', en: 'Sill beam', minor: true, crowd: true },
  { id: 'wall-thermocouples', fr: 'Thermocouples du mur', en: 'Wall thermocouples', minor: true, crowd: true },
  { id: 'air-thermocouples', fr: 'Thermocouples d’air', en: 'Air thermocouples', minor: true, crowd: true },
  { id: 'hot-wire-anemometer', fr: 'Anémomètre à fil chaud', en: 'Hot-wire anemometer', minor: true, crowd: true },
  { id: 'storage-wall#t0', fr: `${HEAT_MIN} °C`, en: `${HEAT_MIN} °C`, minor: true, crowd: true },
  { id: 'storage-wall#t70', fr: `${HEAT_MAX} °C`, en: `${HEAT_MAX} °C`, minor: true, crowd: true },
];

/** The explode: along the line the sun's heat takes, each layer out of the one behind it; what is inside the wall comes out to the room. */
export const EXPLODE: Record<WallPart, [number, number, number]> = {
  'outer-glazing': [0, 0, 1.0],
  'steel-frame': [0, 0, 1.35],
  'inner-glazing': [0, 0, 0.62],
  'air-gap': [0, 0, 0.3],
  'black-paint': [0, 0, 0.12],
  'storage-wall': [0, 0, 0],
  'head-beam': [0, 0.75, 0],
  'sill-beam': [0, -0.75, 0],
  'upper-duct': [0, 0, -0.95],
  'lower-duct': [0, 0, -0.95],
  'summer-flap': [0, 0.45, 0.3],
  'wall-thermocouples': [0, 0, -1.3],
  'air-thermocouples': [0, 0, 0.3],
  'hot-wire-anemometer': [0, 0, -1.6],
};

export interface WallScene extends SceneModule<HouseState> {
  build: ReturnType<typeof buildElement>;
  flow: AirFlow;
  strip: HeatStrip;
  clip: ClipSet;
  drawn: { flap: number; spec: ElementSpec };
  scenery(): THREE.Object3D[];
  /** The altitude of the sun the picture shows now, degrees: the state's, followed (`followSun`). */
  readonly shownSun: number;
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const PAPER = 0xe9e2d3;
/**
 * What the black paint keeps of the night, as light it gives back (linear, a hundredth: 10 levels over a dark of 5): a dark blue-grey and not a hole, at the hour the sky is dark and the rig's hemisphere is 0.3. It is
 * the paint's alone: a lift of the hemisphere (tried at 0.4 to 0.8) would do the same for the face and for the glazing's bars with it, and the bars' edges against the face then change more than twelve levels a frame on
 * a drifting camera (the still-camera share 0.32 → 0.48 % at 0.8). Zero by day (`rig.night`).
 */
const NIGHT_PAINT = new THREE.Color().setRGB(0.009, 0.0125, 0.0195);
/** The pace (the clock's seconds in a second of the picture) from which the sun's disc, shafts and glint begin to go, and the pace where they are gone. */
export const SUN_FADE_FROM = 8000;
export const SUN_FADE_TO = 20000;
/** How fast the glazing's opacity follows the model's flag, a unit a second: a flip of the whole range takes a third of a second. */
export const GLASS_RATE = 3;

export function createWallScene(opts: WallOptions = {}): WallScene {
  const scene = new THREE.Scene();
  scene.name = 'wall';
  scene.background = new THREE.Color(PAPER);
  scene.userData.wantsEnv = true;
  scene.userData.look = { toneMapping: 'aces', exposure: 1.08, environment: 'paper', ao: true, aoRadius: 0.35 };
  const rig = makeRig(scene, {
    half: 4.5,
    key: 2.6,
    hemi: 0.85,
    focus: V(0, 1.8, -0.4),
    normalBias: 0.03,
    bias: -0.0006,
    radius: 3,
  });
  const mats = makeMaterials();
  const registry = new PartRegistry();
  const strip = new HeatStrip(48);
  const clip = new ClipSet([{ normal: [-1, 0, 0], at: [0, 0, 0] }]);
  clip.set(true);
  const capsSet = new Caps();

  let spec = elementSpecOf({
    wallThickness: ELEMENT_1967.thickness,
    gap: ELEMENT_1967.gap,
    glazingLayers: ELEMENT_1967.layers,
  });
  const build = buildElement(mats, spec, [0], 0);
  scene.add(build.root);
  const flow = new AirFlow([0], 34, build.layout, spec, 6);
  scene.add(flow.group);

  // ---- the sun: shafts of light through the four panes and the sun's own disc, from the state's sun
  const sunlight = buildSunlight(spec);
  const sunGroup = new THREE.Group();
  sunGroup.name = 'sun';
  sunGroup.add(sunlight.mesh);
  scene.add(sunGroup);
  let sunWanted = false;
  // The film's ambient occlusion draws the scene again, each mesh in a normal material of its own, transparent ones too: the light's sheets would stand in the depth like walls in the air and darken what lies round them, in
  // dashes (the first version did, film look only). While that pass has swapped the light's material the light is out (`docs/kit-requests.md`: the pass should skip what is not solid).
  scene.onBeforeRender = (_renderer, _scene, camera) => {
    sunGroup.visible = sunWanted && sunlight.mesh.material === sunlight.material;
    // the hills and the shadows' decals are not solids (they would stand in the pass as walls at the far plane and as sheets on the ground)
    hills.mesh.visible = hills.mesh.material === hills.material;
    shadows.mesh.visible = shadows.on && shadows.mesh.material === shadows.material;
    // the sky's rows are laid by the camera in use (its pitch, its field of view and a film's view offset), so that the horizon of the sky is the horizon of the ground and the fog's colour is the colour at it
    if (camera) {
      sky.align(camera);
      hills.update(sky.horizon, sky.day, cover, camera);
    }
  };

  // ---- the caps of the section: the element's own, and the stubs of the foundation, the floor, the ceiling and the head band that carry it
  const elementCaps = addElementCaps(capsSet, scene, mats, strip, 0, spec, (p) => p);
  const slots = new Slots<ElementSpec>();
  const stubs = new THREE.Group();
  stubs.name = 'stubs';
  scene.add(stubs);
  // The room round the element follows the element. At 1967 it is the house's own (a ceiling at `CEILING`, the head band up to the plate, `Y_EAVE`); a shorter element (the 1974 preset, 2.5 m) stands in a room that is
  // only as high as it needs, a ceiling a hand's breadth over its head, so that no block of wall stands over the glass with nothing in it. The stubs are as wide as the element.
  const ceilOf = (s: ElementSpec): number => Math.min(CEILING, elementLayout(s).yTop + 0.35);
  const headTopOf = (s: ElementSpec): number => (ceilOf(s) < CEILING - 1e-6 ? ceilOf(s) + CEILING_T + 0.04 : Y_EAVE);
  const half = (s: ElementSpec): number => s.width / 2;
  const stub = (
    mat: THREE.Material,
    make: (s: ElementSpec) => THREE.BufferGeometry,
    name: string,
    cast = true,
  ): THREE.Mesh => {
    const m = new THREE.Mesh(make(spec), mat);
    m.name = name;
    m.castShadow = cast;
    m.receiveShadow = true;
    stubs.add(m);
    return slots.add(m, make);
  };
  const ROOM_REACH = 2.4;
  // The stubs' faces in the section's plane (x = 0) lay on the clip plane, so that the clip took them away or kept them by the rounding of the frame, and what one saw through it was the same box seen from inside: the cut
  // edge of the floor flickered, tile or its own back (docs/3d.md, « Material pass 2026-11-13 »). Each stub now ends 0.6 mm behind the plane, and the cap of its own lies in it.
  const STUB_BACK = 0.0006;
  stub(
    mats.plinth,
    (s) => bx(-half(s), -1.3, elementLayout(s).inner, -STUB_BACK, elementLayout(s).yBottom, 0),
    'foundation-stub',
  );
  stub(
    mats.plinth,
    (s) => bx(-half(s), -SLAB, elementLayout(s).inner - ROOM_REACH - 0.1, -STUB_BACK, -0.03, elementLayout(s).inner),
    'slab-stub',
  );
  stub(
    mats.tile,
    (s) => bx(-half(s), -0.03, elementLayout(s).inner - ROOM_REACH - 0.1, -STUB_BACK, 0, elementLayout(s).inner),
    'tile-stub',
    false,
  );
  stub(
    mats.gravel,
    (s) => bx(-half(s), -1.3, elementLayout(s).inner - ROOM_REACH - 0.1, -STUB_BACK, -SLAB, elementLayout(s).inner),
    'hardcore-stub',
    false,
  );
  stub(
    mats.ceiling,
    (s) =>
      bx(
        -half(s),
        ceilOf(s),
        elementLayout(s).inner - ROOM_REACH - 0.1,
        -STUB_BACK,
        ceilOf(s) + CEILING_T,
        elementLayout(s).inner,
      ),
    'ceiling-stub',
  );
  // the room's far end: a plaster wall that carries the ceiling, so that nothing hangs in the air
  stub(
    mats.plaster,
    (s) =>
      bx(
        -half(s),
        0,
        elementLayout(s).inner - ROOM_REACH - 0.1,
        -STUB_BACK,
        ceilOf(s),
        elementLayout(s).inner - ROOM_REACH,
      ),
    'end-wall-stub',
  );
  stub(
    mats.concrete,
    (s) => bx(-half(s), elementLayout(s).yTop, elementLayout(s).inner, -STUB_BACK, headTopOf(s), 0),
    'head-band-stub',
  );
  // stubs' caps: concrete grey, flat
  const capMat = (m: THREE.MeshStandardMaterial, section?: THREE.Texture): THREE.Material => {
    const c = m.clone();
    c.side = THREE.DoubleSide;
    c.clippingPlanes = null;
    c.userData = { noShare: true };
    // a cut shows the inside: the concrete's aggregate, a tile's body, not the face a surface of it wears; no relief on a plane that was sawn
    if (section) {
      c.map = section;
      c.color.set(0xffffff);
    }
    c.normalMap = null;
    return c;
  };
  const cutConcrete = tiled(cutConcreteMap(), 1 / 0.5);
  // The faces of the section's plane that the stubs leave: flat rectangles in the plane x = 0, UVs in metres of the element's frame (a map that spans two of them is one). Rectangles of one material are one mesh, so that the
  // draw calls of the world are what they were before the cut of the floor got its tiles.
  const rectCaps = (make: (s: ElementSpec) => Rect[], mat: THREE.Material): THREE.Mesh => {
    const geo = (s: ElementSpec): THREE.BufferGeometry => mergeRects(0, make(s), (z, y) => [z, y]);
    const m = capsSet.addScenery(scene, geo(spec), mat);
    return slots.add(m, geo);
  };
  // concrete in section: the footing, the slab, the head band
  rectCaps(
    (s) => [
      [elementLayout(s).inner, -1.3, 0, elementLayout(s).yBottom],
      [elementLayout(s).inner - ROOM_REACH - 0.1, -SLAB, elementLayout(s).inner, -0.03],
      [elementLayout(s).inner, elementLayout(s).yTop, 0, headTopOf(s)],
    ],
    capMat(mats.plinth, cutConcrete),
  );
  // the tiles' own: a terracotta body with a joint of mortar under it, in the plane like the rest
  rectCaps((s) => [[elementLayout(s).inner - ROOM_REACH - 0.1, -0.03, elementLayout(s).inner, 0]], capMat(mats.tile));
  rectCaps(
    (s) => [[elementLayout(s).inner - ROOM_REACH - 0.1, -1.3, elementLayout(s).inner, -SLAB]],
    capMat(mats.gravel),
  );
  rectCaps(
    (s) => [[elementLayout(s).inner - ROOM_REACH - 0.1, ceilOf(s), elementLayout(s).inner, ceilOf(s) + CEILING_T]],
    capMat(mats.ceiling),
  );
  rectCaps(
    (s) => [[elementLayout(s).inner - ROOM_REACH - 0.1, 0, elementLayout(s).inner - ROOM_REACH, ceilOf(s)]],
    capMat(mats.plaster),
  );

  // ---- the ground: the plateau's granite, which takes the shadows and fades into the backdrop's paper at a distance (a place, not a table)
  // (the plane runs past the camera's far plane, and the fog is complete before it: the ground never ends in a line, it goes into the sky)
  const groundMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    map: tiled(plateauGroundMap(), 1 / 0.8),
    vertexColors: true,
  });
  const GROUND = new THREE.Color(0xffffff);
  // by night the ground is a dark blue-grey, not a neutral grey: moonlight and the hemisphere's blue
  const NIGHT_GROUND = new THREE.Color(0.55, 0.64, 0.9);
  const ground = new THREE.Mesh(groundGeometry(), groundMat);
  const sky = makeSky();
  const paper = new THREE.Color(PAPER);
  sky.update(35, paper);
  scene.background = sky.texture;
  scene.fog = new THREE.Fog(PAPER, 30, 108);
  ground.position.y = GROUND_Y;
  ground.receiveShadow = true;
  ground.name = 'ground';
  ground.userData.notClipped = true;
  scene.add(ground);
  // the land round it (docs/3d.md, « Round 4 »): the hills of the model's own horizon behind the ground's fog, and the plateau's boulders with the sun's shadow on the ground
  const hills = buildHills();
  let cover = 0;
  scene.add(hills.mesh);
  const boulderList = wallBoulders();
  // the stones' own material (the granite's map, the wall's copy): a little cooler than the map by day, and by night the ground's blue-grey, so that they do not stand lit on a dark ground
  const stoneMat = mats.granite.clone();
  stoneMat.userData = { noShare: true };
  const STONE_DAY = new THREE.Color(0.88, 0.91, 0.97);
  const boulders = new THREE.Mesh(boulderGeometries(boulderList), stoneMat);
  boulders.name = 'boulders';
  boulders.castShadow = true;
  boulders.receiveShadow = true;
  boulders.userData.notClipped = true;
  boulders.raycast = () => {};
  scene.add(boulders);
  const shadows = planarShadow(boulders.geometry);
  scene.add(shadows.mesh);
  const cs = contactShadow(ELEMENT_1967.width + 0.6, 1.6, 0.35, 0.3);
  cs.position.set(-ELEMENT_1967.width / 4, -1.299, -0.35);
  scene.add(cs);

  // ---- a stool, a coat on a nail, a mug: someone works in this room
  const lived = buildLivedIn(mats);
  scene.add(lived.group);

  // ---- the scale of the false colour: a bar on a post, standing on the floor in the room
  const barX = -0.42;
  const barZ = build.layout.inner - 2.0;
  const BAR_Y0 = 0.5;
  const BAR_H = 3.0;
  const scale = new THREE.Group();
  scale.name = 'scale';
  {
    const pos: number[] = [];
    const col: number[] = [];
    const idx: number[] = [];
    const n = 28;
    const c = new THREE.Color();
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      heatColor(HEAT_MIN + t * (HEAT_MAX - HEAT_MIN), c);
      for (const sx of [-0.035, 0.035]) {
        pos.push(sx, BAR_Y0 + t * BAR_H, 0);
        col.push(c.r, c.g, c.b);
      }
      if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    const bar = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }));
    bar.userData.notClipped = true;
    bar.userData.noShadow = true;
    bar.name = 'scale-bar';
    bar.position.z = 0.012;
    scale.add(bar);
    const post = new THREE.Mesh(
      joined([bx(-0.05, 0, -0.012, 0.05, BAR_Y0 + BAR_H + 0.1, 0.0), bx(-0.18, 0, -0.1, 0.18, 0.02, 0.1)]),
      mats.frame,
    );
    post.castShadow = true;
    post.name = 'scale-post';
    scale.add(post);
  }
  scale.position.set(barX, 0, barZ);
  scene.add(scale);
  // under a lower ceiling the post is shortened to stand under it (the bar's colours and its two labels, which hang on it, go with it)
  const fitScale = (s: ElementSpec): void => {
    scale.scale.y = Math.min(1, (ceilOf(s) - 0.15) / (BAR_Y0 + BAR_H + 0.1));
  };
  fitScale(spec);

  // ---- parts
  for (const id of WALL_PARTS) {
    registry.add(id, build.groups[id], V(...EXPLODE[id]), undefined, FRAMING[id]);
  }
  // the coat hangs on the storage wall's inner face: with the wall isolated away, or not yet built in a guide's step, it would hang in the void. The wall does not explode, so the coat keeps its place
  const followers = new Followers();
  followers.add(lived.coat, 'storage-wall', { moves: false });
  clip.clip(build.root);
  clip.clip(sunGroup);
  clip.clip(stubs);
  // the instruments' beads and leads lie in the plane and are never clipped; the caps are made unclipped already
  for (const o of build.cutOnly) o.userData.notClipped = true;

  // ---- labels: each follows its part
  const anchors: Record<string, THREE.Object3D> = {};
  const key: Record<WallPart, string> = {
    'outer-glazing': 'outerGlazing',
    'inner-glazing': 'innerGlazing',
    'steel-frame': 'steelFrame',
    'air-gap': 'airGap',
    'black-paint': 'blackPaint',
    'storage-wall': 'storageWall',
    'upper-duct': 'upperDuct',
    'lower-duct': 'lowerDuct',
    'summer-flap': 'summerFlap',
    'head-beam': 'headBeam',
    'sill-beam': 'sillBeam',
    'wall-thermocouples': 'wallThermocouples',
    'air-thermocouples': 'airThermocouples',
    'hot-wire-anemometer': 'anemometer',
  };
  const anchorObjs = new Map<WallPart, THREE.Object3D>();
  for (const id of WALL_PARTS) {
    const a = anchor(build.groups[id], 0, 0, 0, `${id}-label`);
    anchorObjs.set(id, a);
    anchors[id] = a;
  }
  const placeAnchors = (): void => {
    for (const id of WALL_PARTS) anchorObjs.get(id)!.position.copy(build.anchors[key[id]]!);
  };
  placeAnchors();
  anchors['storage-wall#t0'] = anchor(scale, 0.07, BAR_Y0, 0.02, 't0');
  anchors['storage-wall#t70'] = anchor(scale, 0.07, BAR_Y0 + BAR_H, 0.02, 't70');

  let sunAlt: number | null = null;
  let sunSeen: number | null = null;
  let simSeen = 0;
  // how much of the sun's disc, shafts and glint the clock's pace lets through (below), and the glass's own state, followed (below)
  let paceFade = 1;
  let glassNow: number | null = null;
  const sunState = {} as HouseState;
  let flapNow = 0;
  const drawn = { flap: 0, spec };
  const phoneLabels = crowdLabels(HOTSPOTS, anchors);
  const mod: WallScene = {
    id: 'wall',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors) as Hotspot[],
    build,
    flow,
    strip,
    clip,
    drawn,
    scenery: () => [ground, stubs],
    get shownSun() {
      return sunAlt ?? 0;
    },
    home: { position: V(8.6, 3.3, 2.3), target: V(0, 2.0, -0.6) },
    minDistance: 0.12,
    maxDistance: 22,
    near: 0.02,
    far: 120,
    homePadding: 1.35,
    declutter: true,
    update(s, dt, view) {
      phoneLabels();
      const p = opts.params?.();
      const next = elementSpecOf({
        build: p?.build ?? '1967',
        wallThickness: s.wallThickness,
        gap: p?.gap ?? ELEMENT_1967.gap,
        glazingLayers: p?.glazingLayers ?? ELEMENT_1967.layers,
        ductScale: p?.ductScale ?? 1,
      });
      if (
        Math.abs(next.thickness - spec.thickness) > 1e-4 ||
        Math.abs(next.gap - spec.gap) > 1e-4 ||
        next.layers !== spec.layers ||
        Math.abs(next.ductWidth - spec.ductWidth) > 1e-4 ||
        next.height !== spec.height
      ) {
        spec = next;
        build.relayout(spec);
        elementCaps.relayout(spec);
        slots.apply(spec);
        sunlight.relayout(spec);
        flow.relayout(build.layout, spec);
        placeAnchors();
        scale.position.z = build.layout.inner - 2.0;
        fitScale(spec);
        lived.attach(build.layout.inner);
        drawn.spec = spec;
      }
      // the one sun the picture follows (docs/3d.md, « Round 3 »): the state's, chased so that no ramp the picture reads moves by more than its limit in a frame
      const moved = sunSeen === null ? Infinity : s.sunAltitude - sunSeen;
      const elapsed = s.simTime - simSeen;
      const set = clockSet(sunAlt, moved, elapsed);
      sunAlt = followSun(sunAlt, s.sunAltitude, dt, moved, elapsed);
      sunSeen = s.sunAltitude;
      simSeen = s.simTime;
      Object.assign(sunState, s);
      sunState.sunAltitude = sunAlt;
      rig.update(sunState, undefined, dt);
      // a sun that crosses the sky in under half a second is not an object but a flash: the disc, the shafts and the glint go as the pace goes up (the clock's seconds in a second of the picture: the sun turns a degree
      // every 240 s of it), fully there to ×8 000 (33 degrees a second: a view of forty degrees in a second), gone from ×20 000 (83: in under half a second). A set is no pace. The light itself is the model's and stays
      const pace = set || dt <= 0 ? 0 : Math.abs(elapsed) / dt;
      if (dt > 0) paceFade = damp(paceFade, 1 - smoothstep(SUN_FADE_FROM, SUN_FADE_TO, pace), 8, Math.min(dt, 0.1));
      SUN_UNIFORMS.k.value *= paceFade;
      // a night of this world is a dark blue-grey, not black: the sky's and the ground's own colours say so, the black paint gives back a little (`NIGHT_PAINT`), and the light is the rig's
      mats.black.emissive.copy(NIGHT_PAINT).multiplyScalar(rig.night);
      sunlight.update();
      // the sky and the fog's horizon follow the sun and the cloud
      sky.update(sunAlt, paper, 1 - rig.cover);
      cover = rig.cover;
      hills.update(sky.horizon, sky.day, cover);
      shadows.update();
      (scene.fog as THREE.Fog).color.copy(sky.horizon);
      // the ground is dark at night: the moon and the hemisphere's dim light are all it has
      groundMat.color.copy(NIGHT_GROUND).lerp(GROUND, sky.day);
      stoneMat.color.copy(NIGHT_GROUND).multiply(STONE_DAY).lerp(STONE_DAY, sky.day);
      // the light goes through the glass: with the outer sheet isolated away or not yet built, it has nothing to come through
      sunWanted = sunlight.on && Followers.drawn(registry, 'outer-glazing');
      sunGroup.visible = sunWanted;
      // the glass: more of a steep sun is sent back, so the sheets look brighter, and fainter ones show the black behind
      // (the model's flag flips at the true sunrise and sunset, and the strip of glazing with it, in a frame or two at a fast clock: followed over a third of a second of the picture, at once when the clock is set)
      glassNow =
        glassNow === null || set
          ? s.glassRefuses
          : glassNow + Math.max(-GLASS_RATE * dt, Math.min(GLASS_RATE * dt, s.glassRefuses - glassNow));
      mats.glass.opacity = 0.07 + 0.3 * glassNow;
      mats.glass.envMapIntensity = 0.15 + 1.1 * glassNow;
      // the flap goes where the model's goes, smoothly
      flapNow = dt > 0 ? damp(flapNow, s.flapOpen, 5, Math.min(dt, 0.1)) : flapNow;
      build.setFlap(flapNow);
      drawn.flap = flapNow;
      strip.update(s.layers, s.tOuterFace, s.tInnerFace);
      flow.update(s, dt, view.slowMo, view.schematic);
      capsSet.update(true, registry);
      // the instruments' beads and leads lie in the plane: always there, but only while their part is
      for (const o of build.cutOnly) o.visible = Followers.drawn(registry, registry.partOf(o) ?? '');
      followers.update(registry);
      lived.update(s, view.time);
    },
  };
  return mod;
}
