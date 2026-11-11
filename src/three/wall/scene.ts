import * as THREE from 'three';
import { PartRegistry, contactShadow, damp } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import type { HouseState } from '../../sim/types';
import { AirFlow } from '../collector/air';
import { addElementCaps } from '../collector/caps';
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
import { joined } from '../common';
import { HEAT_MAX, HEAT_MIN, HeatStrip, heatColor } from '../heat';
import { WALL_PARTS, type WallPart } from '../ids';
import { makeMaterials } from '../materials';
import { Followers } from '../follow';
import { Caps, ClipSet } from '../section';
import { Slots } from '../slots';
import { makeRig } from '../sun';
import { anchor, box, crowdLabels, hotspots, viewFrom, type HotspotDef, type PartFraming } from '../world';
import { buildLivedIn } from './livedin';

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
  { id: 'wall-thermocouples', fr: 'Thermocouples du mur', en: 'Wall thermocouples', minor: true },
  { id: 'air-thermocouples', fr: 'Thermocouples d’air', en: 'Air thermocouples', minor: true, crowd: true },
  { id: 'hot-wire-anemometer', fr: 'Anémomètre à fil chaud', en: 'Hot-wire anemometer', minor: true },
  { id: 'storage-wall#t0', fr: `${HEAT_MIN} °C`, en: `${HEAT_MIN} °C`, minor: true },
  { id: 'storage-wall#t70', fr: `${HEAT_MAX} °C`, en: `${HEAT_MAX} °C`, minor: true },
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
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const PAPER = 0xe9e2d3;

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
  stub(
    mats.plinth,
    (s) => bx(-half(s), -1.3, elementLayout(s).inner, 0 + 0.0, elementLayout(s).yBottom, 0),
    'foundation-stub',
  );
  stub(
    mats.plinth,
    (s) => bx(-half(s), -SLAB, elementLayout(s).inner - ROOM_REACH - 0.1, 0, -0.03, elementLayout(s).inner),
    'slab-stub',
  );
  stub(
    mats.tile,
    (s) => bx(-half(s), -0.03, elementLayout(s).inner - ROOM_REACH - 0.1, 0, 0, elementLayout(s).inner),
    'tile-stub',
    false,
  );
  stub(
    mats.gravel,
    (s) => bx(-half(s), -1.3, elementLayout(s).inner - ROOM_REACH - 0.1, 0, -SLAB, elementLayout(s).inner),
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
        0,
        ceilOf(s) + CEILING_T,
        elementLayout(s).inner,
      ),
    'ceiling-stub',
  );
  // the room's far end: a plaster wall that carries the ceiling, so that nothing hangs in the air
  stub(
    mats.plaster,
    (s) =>
      bx(-half(s), 0, elementLayout(s).inner - ROOM_REACH - 0.1, 0, ceilOf(s), elementLayout(s).inner - ROOM_REACH),
    'end-wall-stub',
  );
  stub(
    mats.concrete,
    (s) => bx(-half(s), elementLayout(s).yTop, elementLayout(s).inner, 0, headTopOf(s), 0),
    'head-band-stub',
  );
  // stubs' caps: concrete grey, flat
  const capMat = (m: THREE.MeshStandardMaterial): THREE.Material => {
    const c = m.clone();
    c.side = THREE.DoubleSide;
    c.clippingPlanes = null;
    c.userData = { noShare: true };
    return c;
  };
  const rectCap = (make: (s: ElementSpec) => [number, number, number, number], mat: THREE.Material): THREE.Mesh => {
    const geo = (s: ElementSpec): THREE.BufferGeometry => {
      const [z0, y0, z1, y1] = make(s);
      const g = new THREE.PlaneGeometry(z1 - z0, y1 - y0);
      g.rotateY(Math.PI / 2);
      g.translate(0, (y0 + y1) / 2, (z0 + z1) / 2);
      const uv = g.attributes.uv as THREE.BufferAttribute;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (z1 - z0), uv.getY(i) * (y1 - y0));
      return g;
    };
    const m = capsSet.addScenery(scene, geo(spec), mat);
    return slots.add(m, geo);
  };
  rectCap((s) => [elementLayout(s).inner, -1.3, 0, elementLayout(s).yBottom], capMat(mats.plinth));
  rectCap(
    (s) => [elementLayout(s).inner - ROOM_REACH - 0.1, -SLAB, elementLayout(s).inner, -0.03],
    capMat(mats.plinth),
  );
  rectCap((s) => [elementLayout(s).inner - ROOM_REACH - 0.1, -1.3, elementLayout(s).inner, -SLAB], capMat(mats.gravel));
  rectCap(
    (s) => [elementLayout(s).inner - ROOM_REACH - 0.1, ceilOf(s), elementLayout(s).inner, ceilOf(s) + CEILING_T],
    capMat(mats.ceiling),
  );
  rectCap(
    (s) => [elementLayout(s).inner - ROOM_REACH - 0.1, 0, elementLayout(s).inner - ROOM_REACH, ceilOf(s)],
    capMat(mats.plaster),
  );
  rectCap((s) => [elementLayout(s).inner, elementLayout(s).yTop, 0, headTopOf(s)], capMat(mats.concrete));

  // ---- the ground: paper, which takes the shadows
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 60),
    new THREE.MeshStandardMaterial({ color: PAPER, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -1.3;
  ground.receiveShadow = true;
  ground.name = 'ground';
  ground.userData.notClipped = true;
  scene.add(ground);
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
        flow.relayout(build.layout, spec);
        placeAnchors();
        scale.position.z = build.layout.inner - 2.0;
        fitScale(spec);
        lived.attach(build.layout.inner);
        drawn.spec = spec;
      }
      rig.update(s);
      // the glass: more of a steep sun is sent back, so the sheets look brighter, and fainter ones show the black behind
      mats.glass.opacity = 0.07 + 0.3 * s.glassRefuses;
      mats.glass.envMapIntensity = 0.15 + 1.1 * s.glassRefuses;
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
