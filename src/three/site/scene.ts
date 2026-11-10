import * as THREE from 'three';
import { PartRegistry, damp, rng } from '@onigam/lab-kit/three';
import type { Hotspot, SceneModule } from '@onigam/lab-kit/three';
import { SITES } from '../../sim/climate';
import { sunAltitude, sunAzimuth, sunTerms } from '../../sim/solar';
import type { HouseState } from '../../sim/types';
import { AirFlow } from '../collector/air';
import { COLLECTOR_BAYS, DEG, ELEMENT_1967, SITE, bayX, Z_SOUTH, elementSpecOf, type ElementSpec } from '../dims';
import { PLATEAU_PARTS, type PlateauPart } from '../ids';
import { buildHouse } from '../house/shell';
import { buildYard } from '../house/yard';
import { FIELD, groundY, landY, roadZ, ROAD_WIDTH } from '../land/ground';
import { boulderMesh, scatterBoulders } from '../land/rocks';
import { snowOfState } from '../land/season';
import { createSky } from '../land/sky';
import { SNOW, buildLandscape, landColor, patchLand, steepAt } from '../land/terrain';
import { oakSeason, stand, type Placement } from '../land/trees';
import { buildFurnace, buildHeliostats, buildMonument, buildPyranometer, buildRidges } from '../land/furnace';
import { makeMaterials } from '../materials';
import { makeRig } from '../sun';
import { anchor, box, hotspots, viewFrom, type HotspotDef, type PartFraming } from '../world';
import { gravelMap, tiled } from '../textures';
import { smoothstep } from '../common';

// The `site` world (the research's `plateau`): the setting. A mown clearing on a granite slope that falls to the south at 1,550 m, the prototype and its twin, clumps of pine and oak, the road, the solar furnace across the field
// with its 63 heliostats on eight terraces (they turn with the model's sun), the 1974 building up the slope, a pyranometer, the far ridges from the model's own horizon, and the sun's two arcs of December and June, tied to the
// simulation. Composed, never mapped: nothing here says where the houses stand beyond « Odeillo ». Flows off by default; the season slider moves the sun and the snow; no section.

export type SiteOptions = {
  params?: () => { gap: number; glazingLayers: number; ductScale?: number; wind?: number };
};

const [FX, FZ] = SITE.furnaceAt;
const [MX, MZ] = SITE.monumentAt;

export const FRAMING: Record<PlateauPart, PartFraming> = {
  'prototype-house': { viewDir: viewFrom(16, 20), frame: box(-8.5, -3, -4, 8.5, 7, 5) },
  'twin-house': { viewDir: viewFrom(16, 20), frame: box(29.5, -3, -4, 46.5, 7, 5) },
  'granite-slope': { viewDir: viewFrom(22, 25), frame: box(-60, -6, -75, 40, 14, 20) },
  'meadow-clearing': { viewDir: viewFrom(30, 15), frame: box(-30, -3, -14, 78, 3, 30) },
  'tree-clumps': { viewDir: viewFrom(14, 20), frame: box(-85, 0, -95, -25, 22, -45) },
  'access-road': { viewDir: viewFrom(25, 10), frame: box(-50, -6, 24, 70, 1, 42) },
  'solar-furnace': { viewDir: viewFrom(12, 25), frame: box(FX - 42, 18, FZ - 30, FX + 42, 70, FZ + 40) },
  'heliostat-terraces': { viewDir: viewFrom(22, 15), frame: box(FIELD.x0, -8, FIELD.z0, FIELD.x1, 20, FIELD.z1) },
  'solar-houses-1974': { viewDir: viewFrom(14, 25), frame: box(MX - 22, 4, MZ - 10, MX + 22, 28, MZ + 14) },
  pyranometer: { viewDir: viewFrom(16, 30), frame: box(-19.2, 0, -14.8, -16.4, 2, -13.2) },
  'far-ridge': { viewDir: viewFrom(6, 180), frame: box(-2600, 0, 3500, 2600, 700, 4200) },
};

const HOTSPOTS: HotspotDef[] = [
  { id: 'prototype-house', fr: 'La maison', en: 'The house', goto: 'house' },
  { id: 'twin-house', fr: 'Sa jumelle', en: 'Its twin', wide: true },
  { id: 'solar-furnace', fr: 'Four solaire', en: 'Solar furnace', minor: true },
  { id: 'heliostat-terraces', fr: 'Héliostats', en: 'Heliostats', minor: true },
  { id: 'solar-houses-1974', fr: 'Maisons de 1974', en: 'Houses of 1974', minor: true },
  { id: 'far-ridge', fr: 'Crêtes', en: 'Ridges', minor: true },
  { id: 'granite-slope', fr: 'Pente de granit', en: 'Granite slope', minor: true },
  { id: 'meadow-clearing', fr: 'Clairière', en: 'Clearing', minor: true },
  { id: 'tree-clumps', fr: 'Bosquets', en: 'Tree clumps', minor: true },
  { id: 'access-road', fr: 'Route', en: 'Road', minor: true },
  { id: 'pyranometer', fr: 'Pyranomètre', en: 'Pyranometer', minor: true },
  { id: 'prototype-house#dec', fr: 'Soleil de décembre', en: 'December sun', minor: true },
  { id: 'prototype-house#jun', fr: 'Soleil de juin', en: 'June sun', minor: true },
];

/** The setting does not come apart. */
export const EXPLODE: Record<PlateauPart, [number, number, number]> = Object.fromEntries(
  PLATEAU_PARTS.map((id) => [id, [0, 0, 0]]),
) as Record<PlateauPart, [number, number, number]>;

export interface SiteScene extends SceneModule<HouseState> {
  houses: [ReturnType<typeof buildHouse>, ReturnType<typeof buildHouse>];
  heliostats: ReturnType<typeof buildHeliostats>;
  furnace: ReturnType<typeof buildFurnace>;
  monument: ReturnType<typeof buildMonument>;
  yard: ReturnType<typeof buildYard>;
  drawn: { snow: number; sunAltitude: number; spec: ElementSpec };
  scenery(): THREE.Object3D[];
  trees(): Placement[];
  arcs: { december: THREE.Mesh; june: THREE.Mesh; disc: THREE.Mesh };
}

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Overlay on the land: a mown meadow, lighter and greener, faded out at its edge. */
function meadowOverlay(): THREE.Mesh {
  const x0 = -46;
  const x1 = 96;
  const z0 = -22;
  const z1 = 36;
  const cell = 2;
  const nx = (x1 - x0) / cell;
  const nz = (z1 - z0) / cell;
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
  const col = new Float32Array((nx + 1) * (nz + 1) * 4);
  const c = new THREE.Color();
  for (let j = 0; j <= nz; j++)
    for (let i = 0; i <= nx; i++) {
      const x = x0 + i * cell;
      const z = z0 + j * cell;
      const k = j * (nx + 1) + i;
      pos[k * 3] = x;
      pos[k * 3 + 1] = landY(x, z) + 0.05;
      pos[k * 3 + 2] = z;
      landColor(x, z, 0, c).lerp(new THREE.Color(0x7c8f3a), 0.55);
      const e = Math.min(
        smoothstep(x0, x0 + 18, x),
        smoothstep(x1, x1 - 18, x),
        smoothstep(z0, z0 + 8, z),
        smoothstep(z1, z1 - 8, z),
      );
      // not over the road or the bare yard: the colour has already dealt with them
      col[k * 4] = c.r;
      col[k * 4 + 1] = c.g;
      col[k * 4 + 2] = c.b;
      col[k * 4 + 3] = e * 0.85;
    }
  const idx: number[] = [];
  for (let j = 0; j < nz; j++)
    for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i;
      idx.push(a, a + nx + 1, a + 1, a + 1, a + nx + 1, a + nx + 2);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    transparent: true,
    roughness: 1,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  patchLand(mat);
  const m = new THREE.Mesh(g, mat);
  m.name = 'meadow';
  m.receiveShadow = true;
  m.renderOrder = 1;
  return m;
}

/** The road: a ribbon of gravel along the centre line, with two ruts, laid on the land. */
function roadMesh(): THREE.Mesh {
  const step = 6;
  const x0 = -1400;
  const x1 = 1500;
  const n = Math.round((x1 - x0) / step);
  const pos: number[] = [];
  const uv: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const half = ROAD_WIDTH / 2 + 0.4;
  for (let i = 0; i <= n; i++) {
    const x = x0 + i * step;
    const zc = roadZ(x);
    for (const s of [-1, 0, 1]) {
      const z = zc + s * half;
      pos.push(x, landY(x, z) + 0.07, z);
      uv.push(x / 3, (s + 1) * 0.5 * 2);
      col.push(1, 1, 1, s === 0 ? 1 : 0.0);
    }
    if (i > 0) {
      const p = (i - 1) * 3;
      for (const k of [0, 1]) idx.push(p + k, p + k + 3, p + k + 1, p + k + 1, p + k + 3, p + k + 4);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  g.setIndex(idx);
  g.computeVertexNormals();
  const rmat = new THREE.MeshStandardMaterial({
    color: 0x9c968a,
    map: tiled(gravelMap(), 1 / 1.4),
    vertexColors: true,
    transparent: true,
    roughness: 1,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4,
  });
  patchLand(rmat);
  const m = new THREE.Mesh(g, rmat);
  m.name = 'road';
  m.receiveShadow = true;
  m.renderOrder = 2;
  m.frustumCulled = false;
  return m;
}

/** The sun's two arcs: a tube along the sun's path at each solstice, drawn by the model's own sun formulas, with a bead each hour. */
function sunArc(day: number, color: number, radius: number): THREE.Mesh {
  const lat = SITES.odeillo.latitude;
  const t = sunTerms(lat, day, 90, 0);
  const pts: THREE.Vector3[] = [];
  const beads: THREE.BufferGeometry[] = [];
  const o = new THREE.Vector3();
  for (let h = 3; h <= 21; h += 0.1) {
    const alt = sunAltitude(t, h);
    if (alt < 0.4) continue;
    const az = sunAzimuth(t, h);
    const d = new THREE.Vector3(
      -Math.sin(az * DEG) * Math.cos(alt * DEG),
      Math.sin(alt * DEG),
      Math.cos(az * DEG) * Math.cos(alt * DEG),
    );
    pts.push(
      o
        .clone()
        .addScaledVector(d, radius)
        .add(V(0, 2, 0)),
    );
    if (Math.abs(h - Math.round(h)) < 0.05) {
      const s = new THREE.SphereGeometry(0.75, 8, 6);
      s.translate(pts[pts.length - 1]!.x, pts[pts.length - 1]!.y, pts[pts.length - 1]!.z);
      beads.push(s);
    }
  }
  const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.28, 5);
  const merged = [tube, ...beads];
  const m = new THREE.Mesh(
    mergeAll(merged),
    new THREE.MeshBasicMaterial({ color, fog: false, transparent: true, opacity: 0.85, depthWrite: false }),
  );
  m.name = day > 300 ? 'sun-arc-december' : 'sun-arc-june';
  m.userData.noShadow = true;
  m.raycast = () => {};
  m.castShadow = false;
  m.renderOrder = 6;
  return m;
}

function mergeAll(gs: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  for (const g of gs) {
    const base = pos.length / 3;
    pos.push(...(g.attributes.position as THREE.BufferAttribute).array);
    const index = g.index!;
    for (let i = 0; i < index.count; i++) idx.push(base + index.getX(i));
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setIndex(idx);
  return out;
}

export function createSiteScene(opts: SiteOptions = {}): SiteScene {
  const scene = new THREE.Scene();
  scene.name = 'site';
  scene.userData.wantsEnv = true;
  scene.userData.look = { exposure: 1.05, ao: false };
  const sky = createSky(scene);
  const rig = makeRig(scene, {
    half: 46,
    key: 3.4,
    hemi: 0.85,
    mapSize: 4096,
    focus: V(18, 2, 0),
    normalBias: 0.06,
    bias: -0.0005,
    radius: 2.2,
  });
  rig.hemi.color.set(0xc9daf0);
  const mats = makeMaterials();
  const registry = new PartRegistry();
  const spec0 = elementSpecOf({
    wallThickness: ELEMENT_1967.thickness,
    gap: ELEMENT_1967.gap,
    glazingLayers: ELEMENT_1967.layers,
  });
  let spec = spec0;
  const roots = {} as Record<PlateauPart, THREE.Group>;
  for (const id of PLATEAU_PARTS) {
    const g = new THREE.Group();
    g.name = id;
    roots[id] = g;
    scene.add(g);
  }

  // ---- the land, the rock, the meadow, the road
  const land = buildLandscape();
  roots['granite-slope'].add(land);
  const rocks = boulderMesh(
    [
      ...scatterBoulders(
        41,
        70,
        { x0: -120, x1: 120, z0: -150, z1: -10 },
        { x0: -18, x1: 56, z0: -12, z1: 40 },
        0.6,
        2.6,
      ),
      ...scatterBoulders(42, 40, { x0: -80, x1: 140, z0: 6, z1: 80 }, { x0: -18, x1: 56, z0: -12, z1: 40 }, 0.3, 1.0),
      ...scatterBoulders(
        43,
        40,
        { x0: FX - 120, x1: FX + 120, z0: FZ - 100, z1: FZ + 80 },
        { x0: FIELD.x0 - 8, x1: FIELD.x1 + 8, z0: FZ - 38, z1: FIELD.z1 + 8 },
        0.6,
        3.2,
      ),
    ],
    mats.granite,
    2,
  );
  roots['granite-slope'].add(rocks);
  roots['meadow-clearing'].add(meadowOverlay());
  roots['access-road'].add(roadMesh());

  // ---- trees: pines on the slope to the north, oaks and bushes round the clearing, none on the houses, the road, the field or the buildings' shelves
  const r = rng(77);
  const free = (x: number, z: number): boolean => {
    if (x > -17 && x < 55 && z > -11 && z < 18) return false; // the two yards
    if (Math.abs(z - roadZ(x)) < 7) return false;
    if (x > FIELD.x0 - 14 && x < FIELD.x1 + 14 && z > FZ - 44 && z < FIELD.z1 + 12) return false;
    if (x > MX - 30 && x < MX + 30 && z > MZ - 22 && z < MZ + 20) return false;
    return true;
  };
  const make = (
    n: number,
    box: { x0: number; x1: number; z0: number; z1: number },
    s0: number,
    s1: number,
    cluster = 0,
  ): Placement[] => {
    const out: Placement[] = [];
    const centres: [number, number][] = Array.from({ length: Math.max(1, cluster) }, () => [
      box.x0 + r() * (box.x1 - box.x0),
      box.z0 + r() * (box.z1 - box.z0),
    ]);
    let guard = 0;
    while (out.length < n && guard++ < n * 40) {
      let x: number;
      let z: number;
      if (cluster) {
        const c = centres[Math.floor(r() * centres.length)]!;
        x = c[0] + (r() + r() + r() - 1.5) * 26;
        z = c[1] + (r() + r() + r() - 1.5) * 20;
      } else {
        x = box.x0 + r() * (box.x1 - box.x0);
        z = box.z0 + r() * (box.z1 - box.z0);
      }
      if (!free(x, z)) continue;
      out.push({ x, y: landY(x, z), z, s: s0 + r() * (s1 - s0), r: r() * 6.28 });
    }
    return out;
  };
  const pinesNear = stand('pine', make(48, { x0: -150, x1: 120, z0: -200, z1: -14 }, 0.8, 1.3, 6), 3, 0);
  const pinesFar = stand('pine', make(110, { x0: -500, x1: 800, z0: -700, z1: -60 }, 0.9, 1.5, 9), 3, 1);
  const oaks = stand('oak', make(24, { x0: -70, x1: 130, z0: -22, z1: 50 }, 0.8, 1.2, 5), 3);
  const bushes = stand('bush', make(70, { x0: -80, x1: 150, z0: -40, z1: 60 }, 0.8, 1.6, 7), 3);
  roots['tree-clumps'].add(pinesNear.group, pinesFar.group, oaks.group, bushes.group);

  // ---- the two houses: the same function, the twin moved along the row
  const house = buildHouse(mats, { interior: false, instruments: true });
  const twin = buildHouse(mats, { interior: false, instruments: false });
  twin.root.position.x = SITE.twinAt;
  roots['prototype-house'].add(house.root);
  roots['twin-house'].add(twin.root);
  const yard = buildYard(mats);
  roots['prototype-house'].add(yard.group);
  const flow = new AirFlow(
    COLLECTOR_BAYS.map((i) => bayX(i)),
    6,
    house.collector.layout,
    spec,
    5,
  );
  const flowHolder = new THREE.Group();
  flowHolder.position.z = Z_SOUTH;
  flowHolder.add(flow.group);
  roots['prototype-house'].add(flowHolder);

  // ---- the furnace, its field, the monument, the pyranometer, the ridges
  const furnace = buildFurnace(mats);
  roots['solar-furnace'].add(furnace.group);
  const heliostats = buildHeliostats(mats, furnace.mirrorCentre);
  roots['heliostat-terraces'].add(heliostats.group);
  const monument = buildMonument(mats);
  roots['solar-houses-1974'].add(monument.group);
  const pyr = buildPyranometer(mats);
  pyr.position.set(SITE.pyranometerAt[0], groundY(SITE.pyranometerAt[0], SITE.pyranometerAt[2]), SITE.pyranometerAt[2]);
  roots['pyranometer'].add(pyr);
  const ridges = buildRidges();
  roots['far-ridge'].add(ridges.mesh);

  // ---- the sun's two arcs, December and June, and the sun itself on them
  const arcR = 78;
  const december = sunArc(355, 0xf08a2c, arcR);
  const june = sunArc(172, 0xf6e27a, arcR);
  scene.add(december, june);
  const disc = new THREE.Mesh(
    new THREE.SphereGeometry(2.6, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff4c8, fog: false }),
  );
  disc.name = 'sun-disc';
  disc.userData.noShadow = true;
  disc.raycast = () => {};
  disc.renderOrder = 7;
  scene.add(disc);

  // ---- registered
  for (const id of PLATEAU_PARTS) registry.add(id, roots[id], V(...EXPLODE[id]), undefined, FRAMING[id]);

  // ---- labels
  const anchors: Record<string, THREE.Object3D> = {};
  const at = (id: string, parent: THREE.Object3D, x: number, y: number, z: number) => {
    anchors[id] = anchor(parent, x, y, z, `${id}-label`);
  };
  at('prototype-house', roots['prototype-house'], -5.5, 7.2, 0.3);
  at('twin-house', roots['twin-house'], SITE.twinAt - 5.5, 7.2, 0.3);
  at('solar-furnace', roots['solar-furnace'], FX, furnace.y0 + 52, FZ + 14);
  at('heliostat-terraces', roots['heliostat-terraces'], FX, terraceTop(), SITE.field.z0 + 4 * SITE.field.dz);
  at('solar-houses-1974', roots['solar-houses-1974'], MX, landY(MX, MZ) + 14.4, MZ);
  at('far-ridge', roots['far-ridge'], -480, 330, 3800);
  at('granite-slope', roots['granite-slope'], -32, groundY(-32, -42) + 3.5, -42);
  at('meadow-clearing', roots['meadow-clearing'], 62, 1.6, 12);
  at('tree-clumps', roots['tree-clumps'], -58, groundY(-58, -70) + 16, -70);
  at('access-road', roots['access-road'], 22, groundY(22, roadZ(22)) + 2, roadZ(22));
  at(
    'pyranometer',
    roots['pyranometer'],
    SITE.pyranometerAt[0],
    groundY(SITE.pyranometerAt[0], SITE.pyranometerAt[2]) + 2.4,
    SITE.pyranometerAt[2],
  );
  at('prototype-house#dec', scene, 0, 2 + arcR * Math.sin(24 * DEG), arcR * Math.cos(24 * DEG));
  at('prototype-house#jun', scene, 0, 2 + arcR * Math.sin(71 * DEG), arcR * Math.cos(71 * DEG));

  function terraceTop(): number {
    return landY(FX, SITE.field.z0 + 4 * SITE.field.dz) + 9;
  }

  const drawn = { snow: 0, sunAltitude: 0, spec };
  let flapNow = 0;
  const sunPos = new THREE.Vector3();
  const mod: SiteScene = {
    id: 'site',
    scene,
    registry,
    hotspots: hotspots(HOTSPOTS, anchors) as Hotspot[],
    houses: [house, twin],
    heliostats,
    furnace,
    monument,
    yard,
    drawn,
    arcs: { december, june, disc },
    scenery: () => [land, rocks],
    trees: () => [...pinesNear.placements, ...oaks.placements, ...bushes.placements],
    home: { position: V(-24, 12.5, 42), target: V(14, 3.4, -4) },
    minDistance: 1.5,
    maxDistance: 900,
    near: 0.15,
    far: 12000,
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
        twin.relayout(spec);
        flow.relayout(house.collector.layout, spec);
        drawn.spec = spec;
      }
      rig.update(s);
      sky.update(s, view.time, rig.night);
      drawn.sunAltitude = s.sunAltitude;
      SNOW.value = snowOfState(s);
      drawn.snow = SNOW.value;
      oakSeason(oaks.crownMaterial, s.dayOfYear);
      mats.glass.opacity = 0.07 + 0.3 * s.glassRefuses;
      mats.glass.envMapIntensity = 0.15 + 1.1 * s.glassRefuses;
      flapNow = dt > 0 ? damp(flapNow, s.flapOpen, 5, Math.min(dt, 0.1)) : flapNow;
      house.collector.setFlap(flapNow);
      twin.collector.setFlap(flapNow);
      flow.update(s, dt, view.slowMo, view.schematic);
      heliostats.update(s.sunAltitude, s.sunAzimuth);
      yard.update(view.time, p?.wind ?? 2);
      // the sun on its arc: at the arcs' radius, where the model says
      const a = s.sunAltitude * DEG;
      const z = s.sunAzimuth * DEG;
      sunPos
        .set(-Math.sin(z) * Math.cos(a), Math.sin(a), Math.cos(z) * Math.cos(a))
        .multiplyScalar(arcR)
        .add(V(0, 2, 0));
      disc.position.copy(sunPos);
      disc.visible = s.sunAltitude > -0.5;
    },
  };
  void steepAt;
  return mod;
}
