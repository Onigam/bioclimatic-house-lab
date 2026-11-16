import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { HouseSim } from '../sim/engine';
import { BLACK_IBL, makeMaterials } from './materials';
import { COVER_FROM_ALTITUDE, COVER_FROM_CLEAR, SUN_UNIFORMS, cover, makeRig } from './sun';
import { smoothstep } from './common';
import { createSky } from './land/sky';
import { RIDGE_LAYERS, ridgeElevation } from './land/furnace';
import { createWallScene } from './wall/scene';
import { SKY_ROWS, SUN_RAMPS, blueShare, followSun, makeSky } from './wall/sky';
import {
  GROUND_RADIUS,
  GROUND_Y,
  HILL_LAYERS,
  SHADOW_ALPHA,
  SIGHT_BOULDERS,
  boulderGeometries,
  groundGeometry,
  groundTone,
  hillGeometry,
  wallBoulders,
} from './wall/land';
import { stateWith, view } from './test-utils';
import { createRoomScene } from './index';

// Round 4 of the wall world (docs/3d.md, « Round 4 »): the black face that reads black, the sky laid on the horizon, the land round the element (ground, boulders and their shadows, hills), the sky a grey cover on a dull recorded
// day, the coda's sky nearer its clock, and the room face's warmth with no stream drawn.

const noon = (over = {}) => stateWith(over as never, { day: 355 } as never, 12);

describe('the black face reads black from the film’s camera', () => {
  it('the paint takes the environment down (three reads the scene’s, not the material’s): its program holds the two scalings', () => {
    const mats = makeMaterials();
    const shader = {
      fragmentShader: '#include <lights_fragment_maps>\n#include <aomap_fragment>\nvoid main() {}',
    } as unknown as THREE.WebGLProgramParametersWithUniforms;
    mats.black.onBeforeCompile(shader, null as never);
    expect(shader.fragmentShader).toContain(`radiance *= ${BLACK_IBL.radiance.toFixed(2)}`);
    expect(shader.fragmentShader).toContain(`iblIrradiance *= ${BLACK_IBL.irradiance.toFixed(2)}`);
    expect(shader.fragmentShader).toContain('reflectedLight.directSpecular *= 0.2');
    // dark: its colour is under a tenth in linear light, and it stays matt
    const c = mats.black.color;
    expect(Math.max(c.r, c.g, c.b)).toBeLessThan(0.05);
    expect(mats.black.roughness).toBe(1);
    // and the paint keeps its own program, which the night's glow test finds by its key
    expect(mats.black.customProgramCacheKey()).toBe('black-paint');
  });
});

describe('the sky is laid on the horizon', () => {
  const sky = () => {
    const s = makeSky();
    s.update(24, new THREE.Color(0xe9e2d3));
    return s;
  };
  const rowOfElevation = (cam: THREE.PerspectiveCamera, deg: number): number => {
    // the NDC height of a direction at this elevation, straight ahead in yaw, as the camera projects it: a row of the texture
    const a = (deg * Math.PI) / 180;
    const v = new THREE.Vector3(Math.cos(a), Math.sin(a), 0).multiplyScalar(1000).add(cam.position).project(cam);
    return ((v.y + 1) / 2) * SKY_ROWS - 0.5;
  };
  const px = (s: ReturnType<typeof makeSky>, row: number) => {
    const d = s.texture.image.data as Uint8Array;
    const j = Math.max(0, Math.min(SKY_ROWS - 1, Math.round(row)));
    return [d[j * 4]!, d[j * 4 + 1]!, d[j * 4 + 2]!];
  };

  for (const [name, pitch, offset] of [
    ['level', 0, 0],
    ['the Short’s P1 (6° down, its subject zone)', -5.8, 115],
    ['looking up 20°', 20, 0],
    ['looking down 15°', -15, 0],
  ] as const) {
    it(`${name}: the sky’s colour at the horizon is the fog’s, and the blue comes with the elevation`, () => {
      const cam = new THREE.PerspectiveCamera(40, 1080 / 1920, 0.02, 120);
      if (offset) cam.setViewOffset(1080, 1920, 0, offset, 1080, 1920);
      cam.position.set(4, 2.4, 0.3);
      cam.rotation.order = 'YXZ';
      cam.rotation.set((pitch * Math.PI) / 180, Math.PI / 2, 0);
      cam.updateMatrixWorld(true);
      const s = sky();
      s.align(cam);
      const fog = s.horizon.clone().convertLinearToSRGB();
      const fogPx = [fog.r, fog.g, fog.b].map((v) => Math.round(v * 255));
      const horizon = rowOfElevation(cam, 0);
      const top = SKY_ROWS - 1;
      if (horizon > 1 && horizon < top - 6) {
        // at the horizon's row and under it: the fog's colour (to the rounding of 8 bits, and of a row's half height)
        for (const j of [horizon, horizon - 1, 0]) {
          const p = px(s, j);
          for (let k = 0; k < 3; k++)
            expect(Math.abs(p[k]! - fogPx[k]!), `row ${j} channel ${k}`).toBeLessThanOrEqual(3);
        }
        // above it the sky goes blue (red falls, blue stays): by the top row it is bluer than the haze by 40 levels or more
        const a = px(s, horizon + 2);
        const z = px(s, top);
        expect(z[2]! - z[0]!).toBeGreaterThan(a[2]! - a[0]!);
        expect(z[2]! - z[0]!).toBeGreaterThan(35);
      } else {
        // the horizon is out of the picture: the rows are all above it (blue) or all under it (the fog’s colour)
        const p = px(s, 0);
        const q = px(s, top);
        if (horizon <= 1) expect(q[2]! - q[0]!).toBeGreaterThan(35);
        else for (let k = 0; k < 3; k++) expect(Math.abs(q[k]! - fogPx[k]!)).toBeLessThanOrEqual(3);
        void p;
      }
    });
  }

  it('the blue share is nothing at the horizon and under it, smooth from it, and most of the way by 12 degrees', () => {
    expect(blueShare(-5)).toBe(0);
    expect(blueShare(0)).toBe(0);
    let last = 0;
    for (let e = 0.5; e <= 60; e += 0.5) {
      const b = blueShare(e);
      expect(b).toBeGreaterThanOrEqual(last);
      last = b;
    }
    expect(blueShare(0.5)).toBeLessThan(0.05);
    expect(blueShare(12)).toBeGreaterThan(0.85);
  });

  it('the rows follow the camera, not the clock: the same camera and sun give the same rows, a new pitch new ones', () => {
    const s = sky();
    const cam = new THREE.PerspectiveCamera(40, 0.5625, 0.02, 120);
    cam.position.set(3, 2, 0);
    cam.rotation.set(0, Math.PI / 2, 0);
    cam.updateMatrixWorld(true);
    s.align(cam);
    const a = Array.from(s.texture.image.data as Uint8Array);
    s.align(cam);
    expect(Array.from(s.texture.image.data as Uint8Array)).toEqual(a);
    cam.rotation.set(0.3, Math.PI / 2, 0, 'YXZ');
    cam.updateMatrixWorld(true);
    s.align(cam);
    expect(Array.from(s.texture.image.data as Uint8Array)).not.toEqual(a);
  });

  it('the world lays its sky by the camera the renderer gives it (before the background is drawn)', () => {
    const wall = createWallScene();
    wall.update(noon(), 1 / 30, view());
    const cam = new THREE.PerspectiveCamera(40, 0.5625, 0.02, 120);
    cam.position.set(3.95, 2.37, 0.3);
    cam.lookAt(0, 1.97, -0.6);
    cam.updateMatrixWorld(true);
    const bg = wall.scene.background as THREE.DataTexture;
    const before = Array.from(bg.image.data as Uint8Array);
    wall.scene.onBeforeRender(null as never, wall.scene, cam, null as never, null as never, null as never);
    expect(Array.from(bg.image.data as Uint8Array)).not.toEqual(before);
    // and the fog is the sky at the horizon: the ground fades into it with no line
    const fog = (wall.scene.fog as THREE.Fog).color;
    const d = bg.image.data as Uint8Array;
    expect(Math.abs(Math.round(new THREE.Color().copy(fog).convertLinearToSRGB().r * 255) - d[0]!)).toBeLessThanOrEqual(
      2,
    );
  });
});

describe('the ground, the boulders and the hills', () => {
  it('the ground is a disc past the far plane, up-facing, with its UVs in metres and a tone round one', () => {
    const g = groundGeometry();
    g.computeBoundingBox();
    expect(g.boundingBox!.max.x).toBeGreaterThanOrEqual(GROUND_RADIUS - 1);
    expect(GROUND_RADIUS).toBeGreaterThanOrEqual(120);
    const n = g.attributes.normal as THREE.BufferAttribute;
    const p = g.attributes.position as THREE.BufferAttribute;
    const uv = g.attributes.uv as THREE.BufferAttribute;
    const col = g.attributes.color as THREE.BufferAttribute;
    for (let i = 0; i < n.count; i += 37) {
      expect(n.getY(i)).toBe(1);
      expect(uv.getX(i)).toBeCloseTo(p.getX(i), 6);
      expect(uv.getY(i)).toBeCloseTo(p.getZ(i), 6);
    }
    // every triangle faces up from above (a ground one sees from above is not culled)
    const idx = g.index!;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    for (let t = 0; t < idx.count; t += 3 * 29) {
      a.fromBufferAttribute(p, idx.getX(t));
      b.fromBufferAttribute(p, idx.getX(t + 1)).sub(a);
      c.fromBufferAttribute(p, idx.getX(t + 2)).sub(a);
      expect(b.cross(c).y).toBeGreaterThan(0);
    }
    let lo = 9;
    let hi = 0;
    for (let i = 0; i < col.count; i++)
      for (const k of [col.getX(i), col.getY(i), col.getZ(i)]) ((lo = Math.min(lo, k)), (hi = Math.max(hi, k)));
    expect(lo).toBeGreaterThan(0.55);
    expect(hi).toBeLessThan(1.15);
    // cool: not a sand (red over blue under a seventh at the field's mean) and not a pattern (no tone more than a quarter from the mean)
    const t: [number, number, number] = [1, 1, 1];
    let r = 0;
    let bl = 0;
    let m = 0;
    let n2 = 0;
    for (let x = -80; x <= 80; x += 4)
      for (let z = -80; z <= 80; z += 4) {
        groundTone(x, z, t);
        r += t[0];
        bl += t[2];
        m += (t[0] + t[1] + t[2]) / 3;
        n2++;
      }
    expect(r / bl).toBeLessThan(1.14);
    expect(m / n2).toBeGreaterThan(0.75);
    expect(m / n2).toBeLessThan(0.95);
    // the foot of the element is neutral (its own contact shadow and floor edge): the field is flat within two and a half metres
    groundTone(0.5, -0.4, t);
    expect(t[0]).toBeCloseTo(0.84, 6);
  });

  it('the ground’s cells are a metre round the element and no more than twice a tenth of the distance beyond', () => {
    const g = groundGeometry();
    const p = g.attributes.position as THREE.BufferAttribute;
    const idx = g.index!;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const worst = new Map<number, number>();
    for (let t = 0; t < idx.count; t += 3) {
      a.fromBufferAttribute(p, idx.getX(t));
      b.fromBufferAttribute(p, idx.getX(t + 1));
      const r = Math.hypot(a.x, a.z);
      if (r < 1) continue;
      const e = a.distanceTo(b);
      const bucket = Math.round(Math.log2(r));
      worst.set(bucket, Math.max(worst.get(bucket) ?? 0, e));
    }
    for (const [bucket, e] of worst) {
      const r = 2 ** bucket;
      expect(e, `edge at ${r} m`).toBeLessThan(0.2 * r + 0.8);
    }
  });

  it('the boulders lie outside the yard, each sunk into the ground a hand’s breadth, the Short’s first and in more triangles', () => {
    const list = wallBoulders();
    expect(list.length).toBeGreaterThanOrEqual(20);
    expect(SIGHT_BOULDERS).toBe(4);
    for (const b of list) {
      // not on the element (its footprint, the room and the end wall) and not in the yard east of it, where the cameras stand
      const onElement = b.x > -1.5 - b.r && b.x < 1.5 + b.r && b.z > -4.2 - b.r && b.z < 1.2 + b.r;
      const inYard = b.x > 1 && b.x < 13 && b.z > -9 && b.z < 8;
      expect(onElement || inYard, `${b.x.toFixed(1)},${b.z.toFixed(1)}`).toBe(false);
      expect(b.r).toBeGreaterThan(0.25);
      expect(b.r).toBeLessThan(1.4);
    }
    const g = boulderGeometries(list);
    g.computeBoundingBox();
    // the lowest point of the stones is under the ground’s top (sunk), and none is lifted
    expect(g.boundingBox!.min.y).toBeLessThan(GROUND_Y + 0.001);
    expect(g.boundingBox!.min.y).toBeGreaterThan(GROUND_Y - 1.2);
    const p = g.attributes.position as THREE.BufferAttribute;
    const perStone = p.count / list.length;
    expect(perStone).toBeGreaterThan(100);
    // every stone, taken on its own, has its foot at or under the ground
    const own = list.map((b) => boulderGeometries([b]));
    for (const [i, o] of own.entries()) {
      o.computeBoundingBox();
      expect(o.boundingBox!.min.y, `stone ${i}`).toBeLessThanOrEqual(GROUND_Y + 0.001);
      expect(o.boundingBox!.max.y, `stone ${i}`).toBeGreaterThan(GROUND_Y + 0.05);
    }
    // smooth: where triangles meet at a corner they share one normal (a stone of the Short’s is a round stone, not a polyhedron: the corners of a flat-shaded one carry each face’s own)
    const pos = own[0]!.attributes.position as THREE.BufferAttribute;
    const nor = own[0]!.attributes.normal as THREE.BufferAttribute;
    const seen = new Map<string, THREE.Vector3>();
    let spread = 0;
    const v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) {
      const key = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
      v.fromBufferAttribute(nor, i);
      const first = seen.get(key);
      if (first) spread = Math.max(spread, first.angleTo(v));
      else seen.set(key, v.clone());
    }
    expect(spread).toBeLessThan(0.05);
  });

  it('the boulders cast the sun’s shadow on the ground: it follows the state’s sun, fades with it, is none at night and none under a cover', () => {
    const wall = createWallScene();
    const sh = wall.scene.getObjectByName('boulder-shadows') as THREE.Mesh;
    expect(sh).toBeTruthy();
    const mat = sh.material as THREE.ShaderMaterial;
    expect(sh.castShadow).toBe(false);
    expect(sh.receiveShadow).toBe(false);
    // the sun’s direction is the very object the rig and the glass read
    expect(mat.uniforms.uDir!.value).toBe(SUN_UNIFORMS.dir.value);
    wall.update(noon(), 1 / 30, view());
    for (let i = 0; i < 90; i++) wall.update(noon(), 1 / 30, view());
    expect(mat.uniforms.uAlpha!.value).toBeGreaterThan(0.8 * SHADOW_ALPHA);
    expect(sh.visible).toBe(true);
    // the sun’s direction is the state’s: south and up
    expect(SUN_UNIFORMS.dir.value.z).toBeGreaterThan(0.8);
    expect(SUN_UNIFORMS.dir.value.y).toBeGreaterThan(0.3);
    // night: none
    const night = stateWith({}, { day: 355 } as never, 2);
    for (let i = 0; i < 200; i++) wall.update(night, 1 / 30, view());
    expect(sh.visible).toBe(false);
    // a cover (the recorded 24 December: a twentieth of the sun): no hard shadow
    const dull = noon({ incidentWm2: 45 });
    for (let i = 0; i < 200; i++) wall.update(dull, 1 / 30, view());
    expect(mat.uniforms.uAlpha!.value).toBeLessThan(0.05 * SHADOW_ALPHA);
  });

  it('the land is out of the film’s occlusion pass: the hills and the shadows are not solids', () => {
    const wall = createWallScene();
    wall.update(noon(), 1 / 30, view());
    for (let i = 0; i < 30; i++) wall.update(noon(), 1 / 30, view());
    for (const name of ['hills', 'boulder-shadows']) {
      const mesh = wall.scene.getObjectByName(name) as THREE.Mesh;
      const own = mesh.material;
      mesh.material = new THREE.MeshNormalMaterial();
      wall.scene.onBeforeRender(null as never, wall.scene, null as never, null as never, null as never, null as never);
      expect(mesh.visible, `${name} in the pass`).toBe(false);
      mesh.material = own;
      wall.scene.onBeforeRender(null as never, wall.scene, null as never, null as never, null as never, null as never);
      expect(mesh.visible, name).toBe(true);
    }
  });

  it('the hills are the site’s ridges at the elevation the model’s horizon gives, inside the camera’s far plane, carried with the eye', () => {
    const wall = createWallScene();
    const hills = wall.scene.getObjectByName('hills') as THREE.Mesh;
    expect(hills.raycast).toBeTruthy();
    const g = hillGeometry();
    const p = g.attributes.position as THREE.BufferAttribute;
    const k = g.attributes.aK as THREE.BufferAttribute;
    const per = (p.count / HILL_LAYERS.length) | 0;
    let top = 0;
    for (const [li, L] of HILL_LAYERS.entries()) {
      expect(L.r).toBeLessThan(wall.far ?? 120);
      for (let i = 0; i < per; i += 11) {
        const v = li * per + i;
        if (k.getX(v) < 0.5) continue;
        const az = ((i / 2 / 540) * 360 - 180) | 0;
        void az;
      }
      // the crest’s elevation from the eye at the centre is the one `site` draws the ring at: test a handful of azimuths
      for (const az of [-150, -90, -40, 0, 45, 90, 150]) {
        const i = Math.round(((az + 180) / 360) * 540);
        const v = li * per + i * 2 + 1;
        const y = p.getY(v);
        const r = Math.hypot(p.getX(v), p.getZ(v));
        expect((Math.atan2(y, r) * 180) / Math.PI).toBeCloseTo(ridgeElevation(az, L.layer), 1);
        top = Math.max(top, y / r);
      }
    }
    // never above 9 degrees: they are the plateau’s low hills, and the model’s horizon is 5.7 at the highest
    expect((Math.atan(top) * 180) / Math.PI).toBeLessThan(9);
    expect(RIDGE_LAYERS[HILL_LAYERS[0].layer]).toBeTruthy();
    // carried with the eye, the foot at the ground wherever the eye is
    const cam = new THREE.PerspectiveCamera();
    cam.position.set(7, 3.1, 2);
    wall.update(noon(), 1 / 30, view());
    wall.scene.onBeforeRender(null as never, wall.scene, cam, null as never, null as never, null as never);
    expect(hills.position.x).toBe(7);
    expect(hills.position.z).toBe(2);
    expect((hills.material as THREE.ShaderMaterial).uniforms.uBase!.value).toBeCloseTo(GROUND_Y - 3.1, 6);
  });

  it('the hills are a blue-grey against the haze by day, a dark one at night, and go into the haze under a cover', () => {
    const wall = createWallScene();
    const hills = wall.scene.getObjectByName('hills') as THREE.Mesh;
    const u = (hills.material as THREE.ShaderMaterial).uniforms;
    const run = (state: ReturnType<typeof noon>, n = 200) => {
      for (let i = 0; i < n; i++) wall.update(state, 1 / 30, view());
      const haze = u.uHaze!.value as THREE.Color;
      const ridge = u.uRidge!.value as THREE.Color;
      return { haze: haze.clone(), ridge: ridge.clone() };
    };
    const day = run(noon());
    expect(day.ridge.r + day.ridge.g + day.ridge.b).toBeLessThan(0.75 * (day.haze.r + day.haze.g + day.haze.b));
    // bluer than the haze
    expect(day.ridge.b / day.ridge.r).toBeGreaterThan(day.haze.b / day.haze.r);
    const dull = run(noon({ incidentWm2: 45 }));
    expect(dull.ridge.r + dull.ridge.g + dull.ridge.b).toBeGreaterThan(day.ridge.r + day.ridge.g + day.ridge.b);
    const night = run(stateWith({}, { day: 355 } as never, 2));
    expect(night.ridge.r + night.ridge.g + night.ridge.b).toBeLessThan(day.ridge.r + day.ridge.g + day.ridge.b);
  });
});

describe('a dull day is a grey cover: no blue sky, no hard shadow', () => {
  it('the state’s share of the clear sky’s irradiance says whether it is a cover; the model’s horizon at a low sun does not', () => {
    // the recorded 24 December 1974 at noon: 48 W/m² of an 880 clear sky
    const dull = noon({ incidentWm2: 48 });
    expect(cover(dull)).toBeGreaterThan(0.99);
    // the mean sky at the same hour: clear (the model’s ground reflection puts it over the formula’s)
    expect(cover(noon())).toBe(0);
    // a half-covered sky is half a cover
    const half = cover(noon({ incidentWm2: 0.6 * noon().incidentWm2 }));
    expect(half).not.toBeNull();
    expect(half!).toBeGreaterThan(0);
    expect(half!).toBeLessThan(1);
    // at night, at the dawn and at the dusk, where the beam is the model’s ridge’s and not a cloud’s, nothing is said: null, and the rig holds the last
    const dawn = stateWith({ incidentWm2: 28 }, { day: 355 } as never, 7.7);
    expect(cover(dawn)).toBeNull();
    expect(cover(stateWith({}, { day: 355 } as never, 2))).toBeNull();
    // a clear morning at 6° of sun: the beam has just come out from behind the model's ridge, and the state’s share is not yet the sky’s
    const morning = stateWith({ incidentWm2: 140 }, { day: 355 } as never, 8.25);
    expect(morning.sunAltitude).toBeGreaterThan(5);
    expect(morning.sunAltitude).toBeLessThan(8);
    expect(cover(morning)).toBeNull();
    expect(COVER_FROM_CLEAR).toBeGreaterThan(217);
    expect(COVER_FROM_ALTITUDE).toBeGreaterThan(5.7);
  });

  it('the rig reads it, eased, holds it through the dusk and does not call a clear morning at a seventh of the sun a cover', () => {
    const scene = new THREE.Scene();
    const rig = makeRig(scene, { half: 4 });
    for (let i = 0; i < 90; i++) rig.update(noon({ incidentWm2: 48 }), undefined, 1 / 30);
    expect(rig.cover).toBeGreaterThan(0.99);
    // eased: from a clear sky to a cover in about a second, never in a frame
    const clear = makeRig(new THREE.Scene(), { half: 4 });
    clear.update(noon(), undefined, 1 / 30);
    expect(clear.cover).toBe(0);
    clear.update(noon({ incidentWm2: 48 }), undefined, 1 / 30);
    expect(clear.cover).toBeGreaterThan(0);
    expect(clear.cover).toBeLessThan(0.2);
    for (let i = 0; i < 60; i++) clear.update(noon({ incidentWm2: 48 }), undefined, 1 / 30);
    expect(clear.cover).toBeGreaterThan(0.9);
    // the dusk of a dull day keeps its cover; a clear dusk is not one
    clear.update(stateWith({}, { day: 355 } as never, 16.4), undefined, 1 / 30);
    expect(clear.cover).toBeGreaterThan(0.85);
    const sim = new HouseSim();
    sim.set({ preset: 'prototype-1967', day: 355, hour: 7.5, running: true, timeScale: 600 } as never);
    const r2 = makeRig(new THREE.Scene(), { half: 4 });
    let worst = 0;
    for (let f = 0; f < 600; f++) {
      sim.step(1 / 30);
      r2.update(sim.state, undefined, 1 / 30);
      worst = Math.max(worst, r2.cover);
    }
    expect(worst).toBe(0);
  });

  it('the wall’s sky on a dull day is an even grey: no blue, the top and the horizon within a few levels; on a clear day it is the blue sky', () => {
    const rows = (wall: ReturnType<typeof createWallScene>) => {
      const d = (wall.scene.background as THREE.DataTexture).image.data as Uint8Array;
      return [0, SKY_ROWS - 1].map((j) => [d[j * 4]!, d[j * 4 + 1]!, d[j * 4 + 2]!]);
    };
    const clearWall = createWallScene();
    for (let i = 0; i < 90; i++) clearWall.update(noon(), 1 / 30, view());
    const [ch, ct] = rows(clearWall);
    expect(ct![2]! - ct![0]!).toBeGreaterThan(50);
    expect(ch![0]!).toBeGreaterThan(ch![2]!);
    const dullWall = createWallScene();
    for (let i = 0; i < 150; i++) dullWall.update(noon({ incidentWm2: 48 }), 1 / 30, view());
    const [dh, dt] = rows(dullWall);
    // no blue in it: the blue channel over the red by less than a dozen levels at the top, and the two rows within 25 levels of each other
    expect(dt![2]! - dt![0]!).toBeLessThan(12);
    expect(dh![2]! - dh![0]!).toBeLessThan(12);
    for (let k = 0; k < 3; k++) expect(Math.abs(dh![k]! - dt![k]!)).toBeLessThan(25);
    // and the fog is the cover’s grey too (the ground goes into it)
    const fog = (dullWall.scene.fog as THREE.Fog).color;
    expect(Math.abs(fog.b - fog.r)).toBeLessThan(0.05);
  });

  it('the plateau’s sky (site) is a grey cover under it, with nothing changed under a clear sky', () => {
    const scene = new THREE.Scene();
    const rig = createSky(scene);
    const s = noon();
    rig.update(s, 0, 0, 1);
    const u = rig.sky.material.uniforms;
    expect(u.uOver!.value).toBe(0);
    const clearFog = (scene.fog as THREE.FogExp2).color.clone();
    rig.update(s, 0, 0, 0);
    expect(u.uOver!.value).toBeGreaterThan(0.95);
    const dullFog = (scene.fog as THREE.FogExp2).color;
    expect(Math.abs(dullFog.b - dullFog.r)).toBeLessThan(Math.abs(clearFog.b - clearFog.r));
    // at night a cover changes nothing the eye can see: the shader’s factor is the day’s
    rig.update(stateWith({}, { day: 355 } as never, 2), 0, 1, 0);
    expect(u.uOver!.value).toBe(0);
  });
});

describe('the coda’s sky is nearer its clock', () => {
  it('at ×11 150 from noon the sky is half way to its night within 45 minutes of the sun (37) and in its night within 100 (93), where it was 93 and 154', () => {
    const sim = new HouseSim();
    sim.set({ preset: 'prototype-1967', day: 355, hour: 12, running: false } as never);
    const t0 = sim.state.simTime;
    let shown: number | null = null;
    let seen: number | null = null;
    let simSeen = 0;
    const rows: { h: number; day: number; stateDay: number }[] = [];
    const frame = () => {
      sim.step(1 / 30);
      const s = sim.state;
      const moved = seen === null ? Infinity : s.sunAltitude - seen;
      shown = followSun(shown, s.sunAltitude, 1 / 30, moved, s.simTime - simSeen);
      seen = s.sunAltitude;
      simSeen = s.simTime;
      rows.push({
        h: 12 + (s.simTime - t0) / 3600,
        day: smoothstep(-8, 12, shown),
        stateDay: smoothstep(-8, 12, s.sunAltitude),
      });
    };
    for (let f = 0; f < 30; f++) frame();
    sim.set({ running: true, timeScale: 11150.8 } as never);
    for (let f = 0; f < 118; f++) frame();
    const at = (pick: (r: (typeof rows)[0]) => boolean) => rows.find((r, i) => i >= 30 && pick(r))!.h;
    const half = at((r) => r.day < 0.5) - at((r) => r.stateDay < 0.5);
    const night = at((r) => r.day < 0.05) - at((r) => r.stateDay < 0.05);
    expect(half).toBeLessThan(45 / 60);
    expect(night).toBeLessThan(100 / 60);
    // by 18:00 on the clock it is nearly night
    const h18 = rows.find((r, i) => i >= 30 && r.h >= 18)!;
    expect(h18.day).toBeLessThan(0.2);
    // and no frame of it moved the day’s factor by more than its limit
    let worst = 0;
    for (let i = 1; i < rows.length; i++) worst = Math.max(worst, Math.abs(rows[i]!.day - rows[i - 1]!.day));
    expect(worst).toBeLessThanOrEqual(SUN_RAMPS[0]![2] * 1.0001);
    // the four limits, in the order of `SUN_RAMPS`: the sky’s stays under the 12 levels a channel the tests hold on the horizon row, the beam, the lamps and the warmth are the picture’s few levels
    expect(SUN_RAMPS.map((r) => r[2])).toEqual([0.032, 0.06, 0.065, 0.12]);
  });
});

describe('the room’s face shows the heat it gives with no stream drawn', () => {
  it('the lime wash takes a warm tone with how much hotter the face is than the room’s air, with the flows off and the jet and return hidden', () => {
    const room = createRoomScene();
    const wash = (state: ReturnType<typeof noon>) => {
      for (let i = 0; i < 5; i++) room.update(state, 1 / 30, view({ schematic: false }));
      let colour: THREE.Color | null = null;
      room.scene.traverse((o) => {
        if (o.name === 'inner-face-plate')
          colour = ((o as THREE.Mesh).material as THREE.MeshStandardMaterial).color.clone();
      });
      return colour as unknown as THREE.Color;
    };
    const cold = wash(noon({ tInnerFace: 20, tRoom: 20 }));
    // 24 December 1974 at noon: the face at 24 °C, the room’s air at 20: four kelvins, and a wash that is no longer the colour of the lime
    const dull = wash(noon({ tInnerFace: 24, tRoom: 20 }));
    const hot = wash(noon({ tInnerFace: 36, tRoom: 20 }));
    expect(cold.b - dull.b).toBeGreaterThan(0.05);
    expect(dull.b - hot.b).toBeGreaterThan(0.01);
    // the same state with the jet and the return hidden: the face does not depend on them
    room.registry.setDisplay('warm-air-jet', 'hidden');
    room.registry.setDisplay('floor-return', 'hidden');
    const again = wash(noon({ tInnerFace: 24, tRoom: 20 }));
    expect(again.b).toBeCloseTo(dull.b, 6);
    // a face colder than the room’s air gives nothing
    expect(wash(noon({ tInnerFace: 15, tRoom: 20 })).b).toBeCloseTo(cold.b, 6);
  });
});
