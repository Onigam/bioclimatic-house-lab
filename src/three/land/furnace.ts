import * as THREE from 'three';
import { joined, smoothstep, stick, uvMetric } from '../common';
import { SITE } from '../dims';
import { bx, extrudeX } from '../house/geo';
import { buildElement, type ElementBuild } from '../collector/element';
import { ELEMENT_1974 } from '../dims';
import type { Mats } from '../materials';
import { plain } from '../materials';
import { facetMap, tiled, shutteredConcreteMap, fbm } from '../textures';
import { SITES } from '../../sim/climate';
import { sunDirection } from '../sun';
import { FIELD, landY, terraceLevel } from './ground';

// The setting's other buildings, from what is reported: the solar furnace (a building 48 m high and 54 m wide, its concave mirror of 1,830 m² facing the heliostats, the focus 18 m in front of it), the 63 heliostats of
// 2,835 m² on eight terraces that turn with the sun, the 1974 building up the slope (three units, 37 × 14 × 12.9 m), a pyranometer on its stand, the far ridges. Positions are composed: the plateau is not a map.

const [FX, FZ] = SITE.furnaceAt;
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

export interface Furnace {
  group: THREE.Group;
  mirror: THREE.Mesh;
  /** Where the mirror's centre is, world coordinates: the heliostats aim at it. */
  mirrorCentre: THREE.Vector3;
  /** Pad level, m. */
  y0: number;
}

export function buildFurnace(mats: Mats): Furnace {
  const F = SITE.furnace;
  const y0 = landY(FX, FZ);
  const group = new THREE.Group();
  group.name = 'solar-furnace';
  group.position.set(FX, y0, FZ);
  const concrete = mats.concrete.clone();
  concrete.map = tiled(shutteredConcreteMap(), 1 / 3);
  concrete.color.set(0xc9c4b8);
  concrete.userData = { noShare: true };
  const W = F.width;
  const D = F.depth;
  const zF = D / 2;
  const recess = 11.5;
  const cy = 26;
  const halfU = 23;
  const halfV = 17;
  const parts: THREE.BufferGeometry[] = [
    // the back block and the frame round the dish
    bx(-W / 2, 0, -D / 2, W / 2, F.height, zF - recess),
    bx(-W / 2, 0, zF - recess, -25, F.height, zF),
    bx(25, 0, zF - recess, W / 2, F.height, zF),
    bx(-25, 0, zF - recess, 25, cy - halfV - 0.5, zF),
    bx(-25, cy + halfV + 0.5, zF - recess, 25, F.height, zF),
    // a parapet and rooftop plant
    bx(-W / 2 - 0.3, F.height, -D / 2 - 0.3, W / 2 + 0.3, F.height + 1.2, D / 2 + 0.3),
    bx(-14, F.height + 1.2, -8, -2, F.height + 5, 4),
    bx(8, F.height + 1.2, -10, 20, F.height + 3.6, -2),
  ];
  group.add(
    Object.assign(new THREE.Mesh(joined(parts.map((p) => uvMetric(p))), concrete), {
      castShadow: true,
      receiveShadow: true,
      name: 'furnace-body',
    }),
  );
  // bands of windows on the sides and the back
  const win: THREE.BufferGeometry[] = [];
  for (const y of [10, 17, 24, 31, 38]) {
    win.push(
      bx(-W / 2 - 0.05, y, -D / 2 + 3, -W / 2, y + 2.4, D / 2 - recess - 3),
      bx(W / 2, y, -D / 2 + 3, W / 2 + 0.05, y + 2.4, D / 2 - recess - 3),
      bx(-W / 2 + 4, y, -D / 2 - 0.05, W / 2 - 4, y + 2.4, -D / 2),
    );
  }
  group.add(
    Object.assign(
      new THREE.Mesh(joined(win), new THREE.MeshStandardMaterial({ color: 0x1b2631, roughness: 0.2, metalness: 0.5 })),
      { castShadow: false, name: 'furnace-windows' },
    ),
  );
  // the dish: a paraboloid of focal length 18 m, concave to the south, its vertex 11 m inside the frame
  const nu = 46;
  const nv = 34;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= nv; j++)
    for (let i = 0; i <= nu; i++) {
      const u = -halfU + (2 * halfU * i) / nu;
      const v = -halfV + (2 * halfV * j) / nv;
      pos.push(u, cy + v, zF - recess + 0.5 + (u * u + v * v) / (4 * F.focal));
      uv.push(i / nu, j / nv);
    }
  for (let j = 0; j < nv; j++)
    for (let i = 0; i < nu; i++) {
      const a = j * (nu + 1) + i;
      idx.push(a, a + 1, a + nu + 1, a + 1, a + nu + 2, a + nu + 1);
    }
  const dg = new THREE.BufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  dg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  dg.setIndex(idx);
  dg.computeVertexNormals();
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xe6eef5,
    metalness: 0.92,
    roughness: 0.14,
    map: facetMap(23, 17, 'furnace-facets'),
    envMapIntensity: 2.0,
  });
  const mirror = new THREE.Mesh(dg, mirrorMat);
  mirror.name = 'furnace-mirror';
  mirror.receiveShadow = true;
  group.add(mirror);
  // the focus building: 18 m in front of the vertex, a tower with a platform, and the two low annexes either side
  const focus: THREE.BufferGeometry[] = [
    bx(-7, 0, zF + 6, 7, 21, zF + 17),
    bx(-8, 21, zF + 5, 8, 22.2, zF + 18),
    bx(-W / 2 - 24, 0, -4, -W / 2 - 4, 8, 12),
    bx(W / 2 + 4, 0, -4, W / 2 + 24, 8, 12),
  ];
  group.add(
    Object.assign(new THREE.Mesh(joined(focus.map((p) => uvMetric(p))), concrete), {
      castShadow: true,
      receiveShadow: true,
      name: 'furnace-focus',
    }),
  );
  return { group, mirror, mirrorCentre: V(FX, y0 + cy, FZ + zF - recess + 0.5 + 0), y0 };
}

export interface Heliostats {
  group: THREE.Group;
  panels: THREE.InstancedMesh;
  base: { x: number; y: number; z: number }[];
  /** The panel's normal now, per heliostat (tests). */
  update(alt: number, az: number): void;
  /** Panel's pivot above the ground, m. */
  pivot: number;
}

/** 63 heliostats on eight terraces, each a plane mirror of 6 × 7.5 m on a pedestal; they turn so that the sun's beam goes to the furnace's mirror: the normal is the bisector of the directions to the sun and to the mirror. */
export function buildHeliostats(mats: Mats, target: THREE.Vector3): Heliostats {
  const H = SITE.heliostat;
  const group = new THREE.Group();
  group.name = 'heliostat-terraces';
  const base: Heliostats['base'] = [];
  for (let k = 0; k < H.terraces; k++) {
    const n = k === H.terraces - 1 ? H.count - 8 * (H.terraces - 1) : 8;
    for (let i = 0; i < n; i++) {
      const x = FX + (i - (n - 1) / 2) * SITE.field.dx;
      const z = SITE.field.z0 + k * SITE.field.dz;
      base.push({ x, y: landY(x, z), z });
    }
  }
  const pivot = 4.2;
  // terrace walls: a low retaining wall on the downhill edge of each band, a concrete slab edge
  const walls: THREE.BufferGeometry[] = [];
  for (let k = 0; k < H.terraces; k++) {
    const zEdge = SITE.field.z0 + (k + 0.5) * SITE.field.dz;
    const y = terraceLevel(k);
    walls.push(bx(FIELD.x0 + 8, y - 0.6, zEdge - 0.2, FIELD.x1 - 8, y + 0.15, zEdge + 0.2));
  }
  const concrete = mats.concrete.clone();
  concrete.userData = { noShare: true };
  group.add(
    Object.assign(new THREE.Mesh(joined(walls.map((p) => uvMetric(p))), concrete), {
      castShadow: true,
      receiveShadow: true,
    }),
  );
  // pedestals: instanced posts and a steel yoke
  const ped = new THREE.InstancedMesh(
    joined([
      uvMetric(new THREE.CylinderGeometry(0.22, 0.3, pivot, 8).translate(0, pivot / 2, 0)),
      bx(-0.5, pivot - 0.15, -0.2, 0.5, pivot + 0.2, 0.2),
    ]),
    mats.steelDark,
    base.length,
  );
  const m = new THREE.Matrix4();
  base.forEach((b, i) => ped.setMatrixAt(i, m.makeTranslation(b.x, b.y, b.z)));
  ped.castShadow = true;
  ped.frustumCulled = false;
  ped.instanceMatrix.needsUpdate = true;
  group.add(ped);
  // the panels: a frame behind a mirror, the frame's front facing +z in the panel's own frame; the pivot is at the panel's middle, the panel's centre 0.1 m in front of the pivot
  const w = H.w;
  const h = H.h;
  const panelGeo = joined([
    bx(-w / 2, -h / 2, -0.14, w / 2, h / 2, -0.04),
    bx(-w / 2, -h / 2, -0.04, -w / 2 + 0.1, h / 2, 0.0),
    bx(w / 2 - 0.1, -h / 2, -0.04, w / 2, h / 2, 0.0),
  ]);
  const frameMesh = new THREE.InstancedMesh(panelGeo, mats.steelDark, base.length);
  const mirrorMat = new THREE.MeshStandardMaterial({
    color: 0xdfe8ee,
    metalness: 0.92,
    roughness: 0.12,
    envMapIntensity: 2,
  });
  const mirrorGeo = new THREE.PlaneGeometry(w - 0.2, h - 0.1);
  mirrorGeo.translate(0, 0, 0.002);
  const mirrors = new THREE.InstancedMesh(mirrorGeo, mirrorMat, base.length);
  for (const im of [frameMesh, mirrors]) {
    im.frustumCulled = false;
    im.castShadow = im === frameMesh;
    im.receiveShadow = true;
    group.add(im);
  }
  const UPV = V(0, 1, 0);
  const ax = new THREE.Vector3();
  const ay = new THREE.Vector3();
  const n = new THREE.Vector3();
  const to = new THREE.Vector3();
  const s = new THREE.Vector3();
  const pivotAt = new THREE.Vector3();
  const place = (i: number, normal: THREE.Vector3): void => {
    const b = base[i]!;
    // the panel's width stays horizontal, as on an azimuth-elevation mount: x = up × n, y = n × x
    ax.crossVectors(UPV, normal);
    if (ax.lengthSq() < 1e-8) ax.set(1, 0, 0);
    ax.normalize();
    ay.crossVectors(normal, ax).normalize();
    pivotAt.set(b.x, b.y + pivot + 0.45, b.z);
    m.makeBasis(ax, ay, normal).setPosition(pivotAt);
    frameMesh.setMatrixAt(i, m);
    mirrors.setMatrixAt(i, m);
  };
  const down = new THREE.Vector3(0, -1, 0);
  const api: Heliostats = {
    group,
    panels: mirrors,
    base,
    pivot,
    update(alt, az) {
      sunDirection(Math.max(alt, -5), az, s);
      // the panels turn face down at night and up to the sun by day, over the few degrees of the sun's rise: they used to flip, all 63 at once, at 2°, and the picture popped at every sunrise and sunset on a fast clock
      const w = smoothstep(1, 7, alt);
      for (let i = 0; i < base.length; i++) {
        const b = base[i]!;
        if (w <= 0) n.set(0.0, -1, 0.0);
        else {
          to.set(target.x - b.x, target.y - (b.y + pivot), target.z - b.z).normalize();
          n.copy(s).add(to).normalize();
          if (w < 1)
            n.multiplyScalar(w)
              .addScaledVector(down, 1 - w)
              .normalize();
        }
        place(i, n);
      }
      frameMesh.instanceMatrix.needsUpdate = true;
      mirrors.instanceMatrix.needsUpdate = true;
    },
  };
  api.update(35, 0);
  void stick;
  return api;
}

export interface Monument {
  group: THREE.Group;
  collector: ElementBuild;
}

/** The 1974 building: three units in a row, 37 × 14 × 12.9 m in all, rendered walls, flat roofs with their parapets, a band of Trombe walls (the 1974 element, the same function) on the south front of the upper storey. */
export function buildMonument(mats: Mats): Monument {
  const [MX, MZ] = SITE.monumentAt;
  const M = SITE.monument;
  const group = new THREE.Group();
  group.name = 'solar-houses-1974';
  const y0 = landY(MX, MZ);
  group.position.set(MX, y0, MZ);
  const unit = M.length / 3;
  const render = mats.render;
  // The box is the open data's: `M.length` × `M.depth` on the shelf, its tallest roof `M.height` over it, and nothing else outside them but the collector's glazing, which stands 0.4 m proud of the south front (the sheet says
  // so: « Encombrement » is this box measured). It stood 2.9 m too high before (the foot 1.2 m under the shelf, the units stepped up by 0.9 m a unit, a 0.8 m parapet over the tallest) and a little wide (roof overhangs).
  // The units meet with a 4 cm joint; the end ones are flush with the rectangle. The windows are frames that stand 6 cm out of the walls, and the walls are set back by as much, so the faces are at the rectangle.
  const REVEAL = 0.06;
  const halfD = M.depth / 2;
  // each unit's roof over the shelf: the building steps down along its length (the middle unit is the tallest, a storey over the first)
  const tops = [M.height - 2.3, M.height, M.height - 1.1];
  const body: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const x0 = -M.length / 2 + i * unit;
    body.push(
      bx(x0 + (i > 0 ? 0.02 : 0), 0, -halfD + REVEAL, x0 + unit - (i < 2 ? 0.02 : 0), tops[i]!, halfD - REVEAL),
    );
  }
  group.add(
    Object.assign(new THREE.Mesh(joined(body.map((p) => uvMetric(p))), render), {
      castShadow: true,
      receiveShadow: true,
      name: 'monument-body',
    }),
  );
  // windows: bands on each storey; garage doors under the first unit
  const win: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const x0 = -M.length / 2 + i * unit;
    for (const y of [1.2])
      for (let k = 0; k < 4; k++)
        win.push(bx(x0 + 1.0 + k * 2.9, y, halfD - REVEAL - 0.01, x0 + 2.6 + k * 2.9, y + 1.6, halfD));
    // the north band, a storey under each unit's roof
    win.push(bx(x0 + 1.0, tops[i]! - 3.7, -halfD, x0 + unit - 1.0, tops[i]! - 2.3, -halfD + REVEAL + 0.01));
  }
  group.add(
    Object.assign(
      new THREE.Mesh(joined(win), new THREE.MeshStandardMaterial({ color: 0x20303a, roughness: 0.2, metalness: 0.4 })),
      { name: 'monument-windows' },
    ),
  );
  // the Trombe band: the 1974 element in the upper storey, 7 bays a unit
  const bays: number[] = [];
  for (let i = 0; i < 3; i++)
    for (let k = 0; k < 7; k++)
      bays.push(-M.length / 2 + i * unit + 0.9 + k * ELEMENT_1974.width * 1.0 + ELEMENT_1974.width / 2);
  const collector = buildElement(mats, ELEMENT_1974, bays, null);
  collector.root.position.set(0, 5.2, halfD + 0.4);
  group.add(collector.root);
  // a plinth under the band and a band of render over it: the elements' own back wall is the building's
  return { group, collector };
}

/** A pyranometer on its stand: three legs, a white body, a glass dome, a shade ring, a cable to a post. Feet at y = 0. */
export function buildPyranometer(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.name = 'pyranometer';
  const legs: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    legs.push(stick(V(0, 1.45, 0), V(Math.cos(a) * 0.75, 0, Math.sin(a) * 0.75), 0.03, 6));
  }
  legs.push(bx(-0.15, 1.42, -0.15, 0.15, 1.5, 0.15));
  g.add(Object.assign(new THREE.Mesh(joined(legs), mats.steel), { castShadow: true }));
  const body = new THREE.CylinderGeometry(0.1, 0.12, 0.1, 18);
  body.translate(0, 1.55, 0);
  g.add(Object.assign(new THREE.Mesh(body, plain(0xe9e6dc, 0.4)), { castShadow: true }));
  const dome = new THREE.SphereGeometry(0.065, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  dome.translate(0, 1.6, 0);
  g.add(
    new THREE.Mesh(
      dome,
      new THREE.MeshStandardMaterial({ color: 0xcfe3e0, roughness: 0.05, transparent: true, opacity: 0.35 }),
    ),
  );
  const ring = new THREE.TorusGeometry(0.115, 0.006, 6, 20);
  ring.rotateX(Math.PI / 2);
  ring.translate(0, 1.62, 0);
  g.add(new THREE.Mesh(ring, plain(0xe9e6dc, 0.4)));
  // a post with a box, and the cable to it
  const post = bx(1.2, 0, -0.1, 1.28, 1.1, 0.0);
  const box = bx(1.12, 0.95, -0.14, 1.36, 1.2, 0.04);
  g.add(Object.assign(new THREE.Mesh(joined([post, box]), mats.steelDark), { castShadow: true }));
  const cable = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      V(0, 1.5, 0.1),
      V(0.2, 1.05, 0.5),
      V(0.7, 0.04, 0.3),
      V(1.1, 0.03, -0.05),
      V(1.24, 0.95, -0.06),
    ]),
    24,
    0.006,
    5,
  );
  g.add(Object.assign(new THREE.Mesh(cable, plain(0x1d1d1d, 0.7)), { castShadow: false }));
  return g;
}

/** The far ridges: two rings of hills, their silhouettes from the model's own horizon (`SITES.odeillo.horizon`, from the terrain), snow on the high ground in winter. Height `r tan(angle)`; the ground is under them. */
export function buildRidges(snowTone = new THREE.Color(0xf2f4f8)): {
  mesh: THREE.Mesh;
  heightAt: (az: number, layer: number) => number;
} {
  const hor = SITES.odeillo.horizon!;
  const angleAt = (az: number): number => {
    // piecewise linear through the table, azimuth from south positive west, wrapped
    const a = ((((az + 180) % 360) + 360) % 360) - 180;
    for (let i = 1; i < hor.length; i++)
      if (a <= hor[i]![0])
        return hor[i - 1]![1] + ((hor[i]![1] - hor[i - 1]![1]) * (a - hor[i - 1]![0])) / (hor[i]![0] - hor[i - 1]![0]);
    return hor[hor.length - 1]![1];
  };
  const layers = [
    { r: 2600, scale: 0.5 },
    { r: 4000, scale: 0.8 },
    { r: 6200, scale: 1.0 },
  ];
  const heightAt = (az: number, layer: number): number => {
    const L = layers[layer]!;
    const base = Math.tan((angleAt(az) * Math.PI) / 180) * L.r * L.scale;
    const ang = (az * Math.PI) / 180;
    // broad swells, then peaks and cols: two octaves finer than the model's coarse horizon
    const broad = 0.7 + 0.6 * fbm(Math.cos(ang) * 3 + layer * 7, Math.sin(ang) * 3, 4);
    const peaks = 0.5 * Math.abs(fbm(ang * 22 + layer * 5, 4.1, 3) - 0.5) * 2 + 0.35 * fbm(ang * 60 + layer, 1.7, 3);
    return base * broad * (0.85 + 0.5 * peaks) + 40 * fbm(ang * 9 + layer * 3, 2.2, 3);
  };
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const N = 360;
  const c = new THREE.Color();
  layers.forEach((L, li) => {
    const b0 = pos.length / 3;
    for (let i = 0; i <= N; i++) {
      // azimuth from south (+z) positive west (−x): x = −r sin az, z = r cos az
      const az = (i / N) * 360 - 180;
      const a = (az * Math.PI) / 180;
      const h = heightAt(az, li);
      const x = -Math.sin(a) * L.r;
      const z = Math.cos(a) * L.r;
      pos.push(x, -120, z, x, h, z);
      // the foot is forest, the crown a blue-grey going to snow: nearer rings darker, further ones paler
      c.setHSL(0.3, 0.14, 0.2 + 0.05 * li);
      col.push(c.r, c.g, c.b);
      const top = new THREE.Color().setHSL(0.6, 0.1, 0.42 + 0.06 * li).lerp(snowTone, 0.45 + 0.15 * li);
      col.push(top.r, top.g, top.b);
      if (i > 0) {
        const p = b0 + (i - 1) * 2;
        idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3);
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const m = new THREE.Mesh(
    g,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide, flatShading: false }),
  );
  m.name = 'ridges';
  m.frustumCulled = false;
  return { mesh: m, heightAt };
}

export { extrudeX };
