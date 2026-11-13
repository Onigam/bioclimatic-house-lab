import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { HEAT_MATTER, HEAT_STONE_GREY, heatMaterial } from './collector/caps';
import { HEAT_MAX, HEAT_MIN, HeatStrip, heatColor } from './heat';
import { makeMaterials } from './materials';
import { SUN_UNIFORMS } from './sun';
import {
  aggregateMap,
  blackPaintMap,
  blackPaintNormalMap,
  cutConcreteMap,
  hardcoreMap,
  plateauGroundMap,
  renderNormalMap,
  textureStats,
  tf,
  tileNormalMap,
} from './textures';
import { HouseSim } from '../sim/engine';
import { PATCH_ALPHA, SHAFT_GAIN, SHAFT_LENGTH } from './wall/sunlight';
import { SUN_MAX_DEG_PER_MIN, SUN_RATE, followSun, makeSky } from './wall/sky';
import { createHouseScene, createRoomScene, createSiteScene, createWallScene } from './index';
import { stateWith, view } from './test-utils';

// The material pass of 2026-11-13 (docs/3d.md): the cut concrete under the false colour, a black paint on board-marked concrete, glass that holds a sky, a floor with its joints, the sun seen. These tests hold that the maps
// carry matter and no hole, that the shader edits find their place in three's standard material, that the legend stays true, that nothing the pass added stands in the film's occlusion pass, and that the cut edge of
// the floor has no face left uncovered.

const luma = (d: Uint8Array, k: number) => 0.2126 * d[k]! + 0.7152 * d[k + 1]! + 0.0722 * d[k + 2]!;

/** Mean and standard deviation of the luma of a map, in 8-bit levels, its darkest and lightest texel, and the rows that are one flat value (a hole). */
function matter(t: THREE.DataTexture): { mean: number; sd: number; min: number; max: number; rows: number } {
  const d = t.image.data as Uint8Array;
  const n = d.length / 4;
  let s = 0;
  let s2 = 0;
  let min = 255;
  let max = 0;
  for (let k = 0; k < d.length; k += 4) {
    const y = luma(d, k);
    s += y;
    s2 += y * y;
    min = Math.min(min, y);
    max = Math.max(max, y);
  }
  const size = t.image.width;
  let rows = 0;
  for (let j = 0; j < size; j++) {
    let same = true;
    for (let i = 1; i < size && same; i++) if (d[(j * size + i) * 4] !== d[j * size * 4]) same = false;
    if (same) rows++;
  }
  return { mean: s / n, sd: Math.sqrt(Math.max(0, s2 / n - (s / n) ** 2)), min, max, rows };
}

/** How much the map changes across its own wrap compared with inside it: a tile that repeats has no seam, so the ratio is about one. */
function seam(t: THREE.DataTexture): number {
  const d = t.image.data as Uint8Array;
  const size = t.image.width;
  let across = 0;
  let inside = 0;
  for (let k = 0; k < size; k++) {
    // columns 255 | 0 across the wrap, and 127 | 128 inside; the same in rows
    across +=
      Math.abs(d[(k * size + size - 1) * 4]! - d[k * size * 4]!) +
      Math.abs(d[((size - 1) * size + k) * 4]! - d[k * 4]!);
    const a = size / 2;
    inside +=
      Math.abs(d[(k * size + a - 1) * 4]! - d[(k * size + a) * 4]!) +
      Math.abs(d[((a - 1) * size + k) * 4]! - d[(a * size + k) * 4]!);
  }
  return across / Math.max(1, inside);
}

describe('the maps of the material pass', () => {
  it('the concrete’s multiplier: stones and voids around a paste at 0.5, a mean of one for the legend, a tile that repeats', () => {
    const t = aggregateMap();
    expect(t.colorSpace).toBe(THREE.NoColorSpace);
    const m = matter(t);
    // the legend is true when what multiplies the ramp averages one: the map's mean is its neutral value, 0.5
    expect(m.mean / 255).toBeGreaterThan(0.48);
    expect(m.mean / 255).toBeLessThan(0.52);
    // stones that read: a deviation of 0.05 on the whole map, texels well over and well under the paste
    expect(m.sd / 255).toBeGreaterThan(0.045);
    expect(m.max / 255).toBeGreaterThan(0.62);
    expect(m.min / 255).toBeLessThan(0.3);
    expect(m.rows).toBe(0);
    expect(seam(t)).toBeLessThan(1.6);
  });

  it('the cut concrete as a colour: a pale grey with its stones, no black hole', () => {
    const m = matter(cutConcreteMap());
    expect(m.sd).toBeGreaterThan(4);
    expect(m.min).toBeGreaterThan(60);
    expect(m.mean).toBeGreaterThan(110);
    expect(m.mean).toBeLessThan(170);
    expect(m.rows).toBe(0);
  });

  it('the black paint: dark, and not one colour (boards, a tie hole, pits)', () => {
    const m = matter(blackPaintMap());
    expect(m.mean).toBeLessThan(70);
    expect(m.sd).toBeGreaterThan(3);
    expect(m.max).toBeGreaterThan(m.mean + 25);
    expect(m.rows).toBe(0);
    expect(seam(blackPaintMap())).toBeLessThan(2);
  });

  it('the hardcore: broken stone of every grey and buff, in its fines', () => {
    const m = matter(hardcoreMap());
    expect(m.sd).toBeGreaterThan(14);
    expect(m.min).toBeGreaterThan(20);
    expect(m.rows).toBe(0);
  });

  const normals: [string, () => THREE.DataTexture][] = [
    ['black paint', blackPaintNormalMap],
    ['tile', tileNormalMap],
  ];
  for (const [name, make] of normals) {
    it(`${name}: a normal map that leans and stays a normal`, () => {
      const t = make();
      expect(t.colorSpace).toBe(THREE.NoColorSpace);
      const d = t.image.data as Uint8Array;
      let lean = 0;
      let worst = 0;
      for (let k = 0; k < d.length; k += 4) {
        const x = d[k]! / 127.5 - 1;
        const y = d[k + 1]! / 127.5 - 1;
        const z = d[k + 2]! / 127.5 - 1;
        lean += Math.hypot(x, y);
        worst = Math.max(worst, Math.abs(Math.hypot(x, y, z) - 1));
        expect(z).toBeGreaterThan(0.5);
      }
      lean /= d.length / 4;
      expect(lean).toBeGreaterThan(0.004);
      expect(lean).toBeLessThan(0.3);
      expect(worst).toBeLessThan(0.03);
    });
  }

  it('a tileable noise refuses more cells than its lattice holds', () => {
    expect(() => tf(0.95, 0.95, 72, 3)).toThrow();
    expect(Number.isFinite(tf(0.95, 0.95, 64, 3))).toBe(true);
  });

  it('every map is a power of two, none over 512 px, and the whole stays within a phone’s memory', () => {
    // all four worlds built, so that every map of the lab is drawn
    for (const make of [createSiteScene, createHouseScene, createWallScene, createRoomScene]) {
      // the worlds are lazy: one update builds it, and with it every map it wears
      make().update(stateWith(), 1 / 60, view());
    }
    const stats = textureStats();
    expect(stats.length).toBeGreaterThan(15);
    for (const s of stats) {
      expect(s.size, s.name).toBeLessThanOrEqual(512);
      expect(Number.isInteger(Math.log2(s.size)), s.name).toBe(true);
    }
    expect(stats.reduce((a, s) => a + s.bytes, 0)).toBeLessThan(16 * 1024 * 1024);
  });
});

// ------------------------------------------------------------------------------------------------ the shader edits find their place

/** A standard material's program as three would hand it to `onBeforeCompile`. */
function compiled(mat: THREE.Material): { vertexShader: string; fragmentShader: string } {
  const shader = {
    uniforms: {} as Record<string, THREE.IUniform>,
    vertexShader: THREE.ShaderLib.standard.vertexShader,
    fragmentShader: THREE.ShaderLib.standard.fragmentShader,
  };
  mat.onBeforeCompile(
    shader as unknown as THREE.WebGLProgramParametersWithUniforms,
    null as unknown as THREE.WebGLRenderer,
  );
  return shader;
}

describe('the shader edits of the material pass', () => {
  it('the false colour of a section is multiplied by the concrete, in the diffuse and in the emissive alike', () => {
    const heat = heatMaterial(new HeatStrip(8));
    const { vertexShader, fragmentShader } = compiled(heat);
    expect(vertexShader).toContain('attribute vec2 aAgg');
    expect(vertexShader).toContain('vAgg = aAgg');
    expect(fragmentShader).toContain('uniform sampler2D uAgg');
    // the ramp's colour is the strip's, untouched: the edit comes after the emissive map is read and multiplies it
    expect(fragmentShader.indexOf('float agm')).toBeGreaterThan(fragmentShader.indexOf('totalEmissiveRadiance'));
    expect(fragmentShader).toMatch(/diffuseColor\.rgb\s*=\s*mix\(\s*diffuseColor\.rgb \* agm/);
    expect(fragmentShader).toMatch(/totalEmissiveRadiance\s*=\s*mix\(\s*totalEmissiveRadiance \* agm/);
    // and it is its own program
    expect(heat.customProgramCacheKey()).toBe('heat-concrete');
    expect(HEAT_MATTER).toBeGreaterThan(0.2);
    expect(HEAT_MATTER).toBeLessThan(0.5);
  });

  it('the multiplier is built to average one: the same texel read at three scales deviates around the paste', () => {
    // what the shader computes at a texel is 1 + matter * 2 * (a + 0.1 b + 0.4 c), with a, b, c the deviations of the map from 0.5: their mean is zero, so is the multiplier's departure from one
    const d = aggregateMap().image.data as Uint8Array;
    let dev = 0;
    for (let k = 0; k < d.length; k += 4) dev += d[k]! / 255 - 0.5;
    dev /= d.length / 4;
    expect(Math.abs(HEAT_MATTER * 2 * (1 + 0.1 + 0.4) * dev)).toBeLessThan(0.05);
  });

  it('the glass holds a sky, a Fresnel edge and the state’s sun', () => {
    const glass = makeMaterials().glass;
    const { fragmentShader } = compiled(glass);
    expect(fragmentShader).toContain('uniform vec3 uSunDir');
    expect(fragmentShader).toContain('gGlint');
    expect(fragmentShader).toContain('pow( 1.0 - gCos, 5.0 )');
    expect(glass.customProgramCacheKey()).toBe('collector-glass');
    // the sun it throws back is the one object the rigs write
    const s: Record<string, THREE.IUniform> = {};
    glass.onBeforeCompile(
      { uniforms: s, vertexShader: '', fragmentShader: '#include <common>\n#include <opaque_fragment>' } as never,
      null as never,
    );
    expect(s.uSunDir).toBe(SUN_UNIFORMS.dir);
    expect(s.uSunK).toBe(SUN_UNIFORMS.k);
  });
});

// ------------------------------------------------------------------------------------------------ the sun

describe('the sun of the wall world is the model’s', () => {
  it('it follows the state: up and warm at the December noon, gone at night and under a cover', () => {
    const wall = createWallScene();
    const sunGroup = wall.scene.getObjectByName('sun')!;
    expect(sunGroup).toBeTruthy();
    const noon = stateWith({}, { day: 355 } as never, 12);
    wall.update(noon, 1 / 60, view());
    wall.scene.onBeforeRender(null as never, wall.scene, null as never, null as never, null as never, null as never);
    expect(sunGroup.visible).toBe(true);
    expect(SUN_UNIFORMS.k.value).toBeGreaterThan(0.5);
    // the sun the shaders read is the state's: its altitude is the model's
    expect(SUN_UNIFORMS.dir.value.y).toBeCloseTo(Math.sin((noon.sunAltitude * Math.PI) / 180), 2);
    expect(SUN_UNIFORMS.dir.value.z).toBeGreaterThan(0.6);

    const night = stateWith({}, { day: 355 } as never, 2);
    for (let i = 0; i < 80; i++) wall.update(night, 1 / 30, view());
    wall.scene.onBeforeRender(null as never, wall.scene, null as never, null as never, null as never, null as never);
    expect(sunGroup.visible).toBe(false);
    expect(SUN_UNIFORMS.k.value).toBe(0);
  });

  it('it is out of the film’s occlusion pass, which draws every mesh in a normal material of its own', () => {
    const wall = createWallScene();
    wall.update(stateWith({}, { day: 355 } as never, 12), 1 / 60, view());
    const mesh = wall.scene.getObjectByName('sunlight') as THREE.Mesh;
    const own = mesh.material;
    mesh.material = new THREE.MeshNormalMaterial();
    wall.scene.onBeforeRender(null as never, wall.scene, null as never, null as never, null as never, null as never);
    expect(wall.scene.getObjectByName('sun')!.visible).toBe(false);
    mesh.material = own;
    wall.scene.onBeforeRender(null as never, wall.scene, null as never, null as never, null as never, null as never);
    expect(wall.scene.getObjectByName('sun')!.visible).toBe(true);
  });

  it('it makes no new shadow, takes no click and names no part', () => {
    const wall = createWallScene();
    const mesh = wall.scene.getObjectByName('sunlight') as THREE.Mesh;
    expect(mesh.castShadow).toBe(false);
    expect(mesh.receiveShadow).toBe(false);
    expect(mesh.userData.noShadow).toBe(true);
    const hits: THREE.Intersection[] = [];
    mesh.raycast(new THREE.Raycaster(new THREE.Vector3(5, 2, 0), new THREE.Vector3(-1, 0, 0)), hits);
    expect(hits.length).toBe(0);
    // it belongs to no part: no registered part holds it
    for (const id of wall.registry.ids()) {
      let found = false;
      wall.registry.get(id)!.object.traverse((o) => {
        if (o === mesh) found = true;
      });
      expect(found, id).toBe(false);
    }
  });
});

// ------------------------------------------------------------------------------------------------ the two flickers of the Short

describe('what flickered in the film does not', () => {
  it('the air’s volume lies on the faces that bound it, and its material gives way to them', () => {
    const wall = createWallScene();
    wall.update(stateWith(), 1 / 60, view());
    const air = wall.scene.getObjectByName('air') as THREE.Mesh;
    const mat = air.material as THREE.Material;
    // the volume's rear face lies in the plane of the paint's front (face + 2 mm), its sides in those of the frame's jambs: coplanar with an opaque face it fought for the depth test in a checkerboard that changed with every
    // frame (the film's 20 % of a band, 68 % of its worst block). Pushed back, it loses to the face it lies on.
    expect(mat.polygonOffset).toBe(true);
    expect(mat.polygonOffsetFactor).toBeGreaterThan(0);
    expect(mat.polygonOffsetUnits).toBeGreaterThan(0);
    expect(mat.depthWrite).toBe(false);
  });

  it('the stubs of the floor, the slab, the hardcore, the ceiling and the head band stand behind the section’s plane, and a cap covers each cut face', () => {
    const wall = createWallScene();
    wall.update(stateWith(), 1 / 60, view());
    wall.scene.updateMatrixWorld(true);
    const stubs = wall.scene.getObjectByName('stubs')!;
    expect(stubs.children.length).toBeGreaterThanOrEqual(7);
    // the caps' triangles in the plane x = 0, as (z, y)
    const tris: [number, number, number, number, number, number][] = [];
    wall.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.userData.cap || !m.visible) return;
      const p = m.geometry.attributes.position as THREE.BufferAttribute;
      const idx = m.geometry.index!;
      for (let t = 0; t < idx.count; t += 3) {
        const a = idx.getX(t);
        const b = idx.getX(t + 1);
        const c = idx.getX(t + 2);
        if (Math.abs(p.getX(a)) > 1e-6) continue;
        tris.push([p.getZ(a), p.getY(a), p.getZ(b), p.getY(b), p.getZ(c), p.getY(c)]);
      }
    });
    const inside = (z: number, y: number): boolean =>
      tris.some(([az, ay, bz, by, cz, cy]) => {
        // barycentric coordinates in the plane
        const den = (by - cy) * (az - cz) + (cz - bz) * (ay - cy);
        const l1 = ((by - cy) * (z - cz) + (cz - bz) * (y - cy)) / den;
        const l2 = ((cy - ay) * (z - cz) + (az - cz) * (y - cy)) / den;
        return l1 >= -1e-4 && l2 >= -1e-4 && 1 - l1 - l2 >= -1e-4;
      });
    for (const stub of stubs.children) {
      const box = new THREE.Box3().setFromObject(stub);
      // behind the plane, by a hair: not on it
      expect(box.max.x, stub.name).toBeLessThan(-0.0003);
      expect(box.max.x, stub.name).toBeGreaterThan(-0.002);
      // its east face is covered by a cap, over a grid of points
      for (let i = 1; i <= 4; i++)
        for (let j = 1; j <= 2; j++) {
          const z = box.min.z + ((box.max.z - box.min.z) * i) / 5;
          const y = box.min.y + ((box.max.y - box.min.y) * j) / 3;
          expect(inside(z, y), `${stub.name} at z ${z.toFixed(2)}, y ${y.toFixed(2)}`).toBe(true);
        }
    }
  });

  it('a pane takes no shadow: its faces lie along the light at noon and show the shadow map’s acne', () => {
    const wall = createWallScene();
    for (const name of ['outer-sheet', 'inner-sheet']) {
      const m = wall.scene.getObjectByName(name) as THREE.Mesh;
      expect(m, name).toBeTruthy();
      expect(m.receiveShadow, name).toBe(false);
      expect(m.castShadow, name).toBe(false);
    }
  });
});

describe('the sky of the wall world follows the sun', () => {
  const rows = (t: THREE.DataTexture, a: number, b: number) => {
    const d = t.image.data as Uint8Array;
    return [d[a * 4]!, d[a * 4 + 1]!, d[a * 4 + 2]!, d[b * 4]!, d[b * 4 + 1]!, d[b * 4 + 2]!];
  };
  it('a pale blue overhead and the paper at the horizon by day, a dark blue-grey at night, a warm horizon at dusk', () => {
    const sky = makeSky();
    const paper = new THREE.Color(0xe9e2d3);
    sky.update(40, paper);
    const [hr, hg, hb, tr, tg, tb] = rows(sky.texture, 0, 63);
    // the horizon is the paper's, the top is bluer than red
    expect(hr).toBeGreaterThan(200);
    expect(tb).toBeGreaterThan(tr + 30);
    expect(hr + hg + hb).toBeGreaterThan(tr + tg + tb);
    const dayHorizon = sky.horizon.clone();
    sky.update(-30, paper);
    const night = rows(sky.texture, 0, 63);
    expect(night[0]! + night[1]! + night[2]!).toBeLessThan(hr + hg + hb - 300);
    expect(night[5]!).toBeGreaterThan(night[3]!);
    // a night that is a dark blue-grey and not black (round 2: 8 to 10 % of the night frames were at luma 5 or less): neither row under 24 levels
    for (const v of [night[0]!, night[1]!, night[2]!, night[3]!, night[4]!, night[5]!]) expect(v).toBeGreaterThan(24);
    // the fog takes the horizon's colour: the ground fades into the sky
    expect(sky.horizon.r).toBeLessThan(dayHorizon.r);
    // at dusk (the day factor half way) the horizon is warmer than the paper (red over blue by more)
    const dusk = makeSky();
    dusk.update(0.5, paper);
    const duskRows = rows(dusk.texture, 0, 63);
    expect(duskRows[0]! - duskRows[2]!).toBeGreaterThan(hr - hb);
    // and it is never one colour
    const d = sky.texture.image.data as Uint8Array;
    expect(new Set(Array.from({ length: 64 }, (_, j) => d[j * 4 + 2])).size).toBeGreaterThan(8);
  });

  it('the sun the picture follows: at most SUN_RATE degrees a second, still when no time passes, at once when the clock is set', () => {
    // a chase: the state is far ahead (a pace: 1.2 degrees in two minutes of the model's time), the picture moves by its rate and no more, a frame at a time
    let alt: number | null = followSun(null, 20, 1 / 30, Infinity, 0);
    expect(alt).toBe(20);
    for (let i = 0; i < 40; i++) {
      const next: number = followSun(alt, 20 - 1.2 * (i + 1), 1 / 30, -1.2, 120);
      expect(Math.abs(next - alt!)).toBeLessThanOrEqual((SUN_RATE / 30) * 1.0001);
      alt = next;
    }
    // no time, no move
    expect(followSun(10, -20, 0, -1, 60)).toBe(10);
    // the clock is set: the hour moved and the simulation's time did not (or a minute): the picture goes there at once
    expect(followSun(-40, 24, 1 / 30, 64, 0)).toBe(24);
    expect(followSun(-40, 24, 1 / 30, 64, 60)).toBe(24);
    // no pace is a set, at any speed and any frame rate: the sun moves at most SUN_MAX_DEG_PER_MIN of the model's minutes; ×86 400 at 30 frames a second is 48 minutes a frame, at 10 frames a second 144
    for (const [elapsed, dt] of [
      [2880, 1 / 30],
      [8640, 0.1],
      [400, 1 / 30],
    ] as const) {
      const move = SUN_MAX_DEG_PER_MIN * (elapsed / 60);
      const next = followSun(0, -move, dt, -move, elapsed);
      expect(Math.abs(next)).toBeLessThanOrEqual(SUN_RATE * Math.min(dt, 0.1) * 1.0001);
    }
    // and the real sun at ×86 400, ×30 000, ×12 000: a day of frames, the worst move of the altitude in a frame against what the time that passed allows
    for (const scale of [12000, 30000, 86400]) {
      const sim = new HouseSim();
      sim.set({ preset: 'prototype-1967', day: 355, hour: 12, running: true, timeScale: scale } as never);
      let was = sim.state.sunAltitude;
      let before = sim.state.simTime;
      for (let f = 0; f < Math.round((24 * 3600) / (scale / 30)); f++) {
        sim.step(1 / 30);
        const moved = sim.state.sunAltitude - was;
        const elapsed = sim.state.simTime - before;
        expect(followSun(was, sim.state.sunAltitude, 1 / 30, moved, elapsed), `×${scale} frame ${f}`).toBeCloseTo(
          was + Math.max(-SUN_RATE / 30, Math.min(SUN_RATE / 30, moved)),
          6,
        );
        was = sim.state.sunAltitude;
        before = sim.state.simTime;
      }
    }
  });

  it('the world sets its sun with the clock and chases it with the pace: a slider goes there at once, a running clock lags', () => {
    const wall = createWallScene();
    const key = () => (wall.scene.getObjectByProperty('isDirectionalLight', true) as THREE.DirectionalLight).intensity;
    // an hour set: noon, then nine, then two: each is where the state says, with no frame between (the glass and the shafts read `SUN_UNIFORMS`, which keeps the last sun above the horizon at night)
    for (const hour of [12, 9, 14]) {
      const st = stateWith({}, { day: 355 } as never, hour);
      wall.update(st, 1 / 30, view());
      expect(Math.abs(SUN_UNIFORMS.dir.value.y - Math.sin((st.sunAltitude * Math.PI) / 180))).toBeLessThan(0.01);
    }
    expect(key()).toBeGreaterThan(1);
    // a running clock: the simulation's time moves with the hour, and the picture's sun is behind the state's by a few degrees at the horizon at ×12 000
    const sim = new HouseSim();
    sim.set({ preset: 'prototype-1967', day: 355, hour: 12, running: true, timeScale: 12000 } as never);
    let lag = 0;
    for (let f = 0; f < 120; f++) {
      sim.step(1 / 30);
      wall.update(sim.state, 1 / 30, view());
      const shown = (Math.asin(Math.min(1, Math.max(-1, SUN_UNIFORMS.dir.value.y))) * 180) / Math.PI;
      lag = Math.max(lag, Math.abs(shown - Math.max(sim.state.sunAltitude, 0.3)));
    }
    expect(lag).toBeGreaterThan(3);
  });

  // The sky is chased by a follower that cannot snap (`SKY_RATE`): the first version eased and jumped when it was ten degrees behind the sun, so at ×12 000 dusk turned to night in one frame (56 % of the pixels).
  // A day of the model's clock at three paces, at the film's 30 frames a second: no frame changes the sky's rows by more than 4 levels, and the fog's colour (the ground's horizon) not by more than 4 either.
  for (const scale of [3600, 12000, 30000, 86400]) {
    it(`a day at ×${scale}: no frame of the sky changes by more than 4 levels, none of the ground's fog by more than 2.5 %`, () => {
      const sim = new HouseSim();
      sim.set({ preset: 'prototype-1967', day: 355, hour: 12, running: true, timeScale: scale } as never);
      const wall = createWallScene();
      const frames = Math.round((24 * 3600) / (scale / 30));
      let prev: number[] | null = null;
      let prevFog: number[] | null = null;
      let worst = 0;
      let worstFog = 0;
      let lowest = 255;
      for (let f = 0; f < frames; f++) {
        sim.step(1 / 30);
        wall.update(sim.state, 1 / 30, view());
        const data = Array.from((wall.scene.background as THREE.DataTexture).image.data as Uint8Array);
        const fog = (wall.scene.fog as THREE.Fog).color;
        const fogNow = [fog.r, fog.g, fog.b];
        if (prev) {
          for (let k = 0; k < data.length; k++) if (k % 4 !== 3) worst = Math.max(worst, Math.abs(data[k]! - prev[k]!));
          for (let k = 0; k < 3; k++) worstFog = Math.max(worstFog, Math.abs(fogNow[k]! - prevFog![k]!));
        }
        for (let k = 0; k < data.length; k++) if (k % 4 !== 3) lowest = Math.min(lowest, data[k]!);
        prev = data;
        prevFog = fogNow;
      }
      expect(worst).toBeLessThanOrEqual(4);
      // a linear colour channel, 0 to 1: 4 levels of 255 in sRGB at the bright end are 0.02 or so
      expect(worstFog).toBeLessThan(0.025);
      // and the night keeps a floor: never a black sky
      expect(lowest).toBeGreaterThan(24);
    });
  }

  it('the world uses it: the background is the sky and the fog is its horizon, dark at night and pale by day', () => {
    const wall = createWallScene();
    const fogAt = (hour: number): number => {
      const st = stateWith({}, { day: 355 } as never, hour);
      for (let i = 0; i < 120; i++) wall.update(st, 1 / 30, view());
      expect((wall.scene.background as THREE.Texture).name).toBe('sky');
      const fog = wall.scene.fog as THREE.Fog;
      return fog.color.r + fog.color.g + fog.color.b;
    };
    const noon = fogAt(12);
    const night = fogAt(2);
    expect(noon).toBeGreaterThan(1.5);
    expect(night).toBeLessThan(0.5);
    // the night is a blue-grey, not black
    expect(night).toBeGreaterThan(0.1);
  });
});

describe('round 2: the black face, the ground and the night of the wall world', () => {
  it('the black face is matt, its sky reflection low, its patch of sun a hair and no veil of light in the gap', () => {
    const wall = createWallScene();
    wall.update(stateWith({}, { day: 355 } as never, 12), 1 / 60, view());
    const black = makeMaterials().black;
    expect(black.roughness).toBeGreaterThanOrEqual(0.75);
    expect(black.envMapIntensity).toBeLessThanOrEqual(0.12);
    // the sun's specular on it is a fifth of three's: the edit finds its place in the standard program, and the paint's program is its own
    const frag = compiled(black).fragmentShader;
    expect(frag).toContain('reflectedLight.directSpecular *= 0.2');
    expect(frag.indexOf('reflectedLight.directSpecular *= 0.2')).toBeLessThan(frag.indexOf('vec3 totalDiffuse'));
    expect(black.customProgramCacheKey()).toBe('black-paint');
    // the light in the air between the glass and the paint: seen from the side along the face it was a veil over it, grey-beige by day (135 levels at noon against 92 before the pass)
    const mesh = wall.scene.getObjectByName('sunlight') as THREE.Mesh;
    const g = mesh.geometry;
    const col = g.attributes.aColor as THREE.BufferAttribute;
    const sh = g.attributes.aShaft as THREE.BufferAttribute;
    let patch = 0;
    for (let i = 0; i < col.count; i++) {
      if (sh.getY(i) > 0.5) continue;
      const along = sh.getX(i);
      if (along <= 0)
        expect(col.getW(i), `vertex ${i} at ${along}`).toBeLessThanOrEqual(
          PATCH_ALPHA + 1e-9 > 0.06 ? PATCH_ALPHA : 0.06,
        );
      if (along === -1 && col.getW(i) > 0) patch = Math.max(patch, col.getW(i));
    }
    expect(PATCH_ALPHA).toBeLessThanOrEqual(0.03);
    expect(PATCH_ALPHA).toBeGreaterThan(0);
    expect(patch).toBeLessThanOrEqual(PATCH_ALPHA + 1e-9);
  });

  it('the ground is a cool grey granite gruss: fine grain, low contrast, no blotch', () => {
    const t = plateauGroundMap();
    const d = t.image.data as Uint8Array;
    const size = t.image.width;
    let r = 0;
    let g = 0;
    let b = 0;
    const lum: number[] = [];
    for (let k = 0; k < d.length; k += 4) {
      r += d[k]!;
      g += d[k + 1]!;
      b += d[k + 2]!;
      lum.push(0.2126 * d[k]! + 0.7152 * d[k + 1]! + 0.0722 * d[k + 2]!);
    }
    const n = lum.length;
    // cool: not a sand (the first ground's red was 1.3 over its blue)
    expect(r / b).toBeLessThan(1.12);
    expect(b / g).toBeGreaterThan(0.9);
    const mean = lum.reduce((a, v) => a + v, 0) / n;
    const sd = Math.sqrt(lum.reduce((a, v) => a + (v - mean) ** 2, 0) / n);
    // low contrast overall, a fine grain, and little at the scale of a hand to an arm (the blotches): the means of 32 × 32 blocks
    expect(sd).toBeGreaterThan(5);
    expect(sd).toBeLessThan(16);
    const bs = 16;
    const blocks: number[] = [];
    for (let by = 0; by < size; by += bs)
      for (let bx = 0; bx < size; bx += bs) {
        let s = 0;
        for (let y = 0; y < bs; y++) for (let x = 0; x < bs; x++) s += lum[(by + y) * size + bx + x]!;
        blocks.push(s / (bs * bs));
      }
    const bm = blocks.reduce((a, v) => a + v, 0) / blocks.length;
    const bsd = Math.sqrt(blocks.reduce((a, v) => a + (v - bm) ** 2, 0) / blocks.length);
    expect(bsd).toBeLessThan(5);
    expect(t.name).toBe('plateau-ground');
  });

  it('the ground runs into the fog and the fog into the sky: a plane past the far plane, the fog complete before it', () => {
    const wall = createWallScene();
    const ground = wall.scene.getObjectByName('ground') as THREE.Mesh;
    ground.geometry.computeBoundingBox();
    expect(ground.geometry.boundingBox!.max.x).toBeGreaterThanOrEqual(wall.far ?? 120);
    const fog = wall.scene.fog as THREE.Fog;
    expect(fog.far).toBeLessThan(wall.far ?? 120);
    expect(fog.near).toBeGreaterThanOrEqual(wall.maxDistance ?? 22);
  });

  it('the night is a dark blue-grey and not black: the ground keeps a share of its day tone, and the light is the rig’s (a lifted hemisphere makes the glazing’s lit bars flicker)', () => {
    const wall = createWallScene();
    const night = stateWith({}, { day: 355 } as never, 2);
    for (let i = 0; i < 120; i++) wall.update(night, 1 / 30, view());
    const hemi = wall.scene.children.find(
      (o) => (o as THREE.HemisphereLight).isHemisphereLight,
    ) as THREE.HemisphereLight;
    // the rig's own night (0.3): the pass tried 0.4 to 0.8, and the bars' edges against the black face moved more than twelve levels a frame on a drifting camera (0.32 % of the pixels at 0.4, 0.48 at 0.8)
    expect(hemi.intensity).toBeLessThanOrEqual(0.35);
    expect(wall.scene.environmentIntensity).toBeLessThanOrEqual(0.15);
    const ground = wall.scene.getObjectByName('ground') as THREE.Mesh;
    const nightTone = (ground.material as THREE.MeshStandardMaterial).color;
    // not under half of its day tone, and blue-grey: more blue than red
    expect(nightTone.r).toBeGreaterThanOrEqual(0.5);
    expect(nightTone.b).toBeGreaterThan(nightTone.r + 0.2);
    // the black paint gives a little back at night (a blue-grey, a hundredth), and nothing by day
    let paint: THREE.MeshStandardMaterial | null = null;
    wall.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined;
      if (m && !Array.isArray(m) && m.customProgramCacheKey?.() === 'black-paint') paint = m;
    });
    expect(paint).toBeTruthy();
    const glow = (paint as unknown as THREE.MeshStandardMaterial).emissive;
    expect(glow.b).toBeGreaterThan(0.01);
    expect(glow.b).toBeLessThan(0.02);
    expect(glow.b).toBeGreaterThan(glow.r);
    // by day the same hemisphere is the rig's own, and the paint is dark
    const noon = stateWith({}, { day: 355 } as never, 12);
    for (let i = 0; i < 120; i++) wall.update(noon, 1 / 30, view());
    expect((ground.material as THREE.MeshStandardMaterial).color.r).toBeGreaterThan(0.95);
    expect(glow.r + glow.g + glow.b).toBe(0);
  });
});

describe('the legend stays true through the concrete', () => {
  const smooth = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  /** The shader's multiplier and the stone's grey, over the whole tile, three taps at places of their own (the same arithmetic as `heatMaterial`'s fragment, one texel at a time). */
  const mean = (T: number): { colour: [number, number, number]; multiplier: number } => {
    const d = aggregateMap().image.data as Uint8Array;
    const n = d.length / 4;
    const c = heatColor(T);
    const luma = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
    let r = 0;
    let g = 0;
    let b = 0;
    let mult = 0;
    for (let k = 0; k < n; k++) {
      const agA = d[k * 4]! / 255 - 0.5;
      // the other taps read the same map at other scales and phases: a place of their own, a fixed scatter
      const agB = d[((k * 7919 + 1013) % n) * 4]! / 255 - 0.5;
      const agC = d[((k * 104729 + 7) % n) * 4]! / 255 - 0.5;
      const agm = Math.min(1.5, Math.max(0.66, 1 + HEAT_MATTER * 2 * (agA + 0.1 * agB + 0.4 * agC)));
      const st = smooth(0.05, 0.16, Math.abs(agA)) * HEAT_STONE_GREY;
      r += c.r * agm * (1 - st) + luma * agm * st;
      g += c.g * agm * (1 - st) + luma * agm * st;
      b += c.b * agm * (1 - st) + luma * agm * st;
      mult += agm;
    }
    return { colour: [r / n, g / n, b / n], multiplier: mult / n };
  };
  const srgb = (rgb: [number, number, number]) => new THREE.Color(rgb[0], rgb[1], rgb[2]).convertLinearToSRGB();

  it('a section at a uniform temperature, 10 to 70 °C: the mean colour inverted through the ramp is that temperature within 1.5 °C, and the multiplier averages one within 2 %', () => {
    const ramp: [number, THREE.Color][] = [];
    for (let T = HEAT_MIN; T <= HEAT_MAX + 1e-9; T += 0.25) ramp.push([T, heatColor(T).clone().convertLinearToSRGB()]);
    let worst = 0;
    for (const T of [10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70]) {
      const m = mean(T);
      expect(Math.abs(m.multiplier - 1), `the multiplier at ${T} °C`).toBeLessThan(0.02);
      const got = srgb(m.colour);
      let best = Infinity;
      let at = T;
      for (const [t, rc] of ramp) {
        const dist = (rc.r - got.r) ** 2 + (rc.g - got.g) ** 2 + (rc.b - got.b) ** 2;
        if (dist < best) {
          best = dist;
          at = t;
        }
      }
      worst = Math.max(worst, Math.abs(at - T));
    }
    expect(worst).toBeLessThanOrEqual(1.5);
  });
});

/** The width, in millimetres, at which a map's autocorrelation along its rows falls to a half (what a grain of stones is: a speckle of single texels falls there at once). `tileM` the tile's side in metres. */
function grainMm(t: THREE.DataTexture, tileM: number): number {
  const d = t.image.data as Uint8Array;
  const S = t.image.width;
  let mean = 0;
  for (let i = 0; i < S * S; i++) mean += d[i * 4]!;
  mean /= S * S;
  let v0 = 0;
  for (let i = 0; i < S * S; i++) v0 += (d[i * 4]! - mean) ** 2;
  let prev = 1;
  for (let lag = 1; lag < S / 2; lag++) {
    let c = 0;
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) c += (d[(j * S + i) * 4]! - mean) * (d[(j * S + ((i + lag) % S)) * 4]! - mean);
    c /= v0;
    if (prev >= 0.5 && c < 0.5) return ((lag - 1 + (prev - 0.5) / (prev - c)) * tileM * 1000) / S;
    prev = c;
  }
  return Infinity;
}

describe('round 2, second pass: the aggregate that reads, the shafts that fade, a relief that is a texture', () => {
  it('the concrete’s grain is stones and not a speckle: over 13 mm at half correlation (10.8 mm before, 7 px at the Short’s 0.66 px a millimetre; now 10)', () => {
    const g = grainMm(aggregateMap(), 1);
    expect(g).toBeGreaterThan(13);
    // and not a blotch: stones are a few centimetres, not a cloud
    expect(g).toBeLessThan(30);
  });

  it('the multiplier is bounded, so that the legend holds at the darkest void, and the cast has its hairlines', () => {
    const { fragmentShader } = compiled(heatMaterial(new HeatStrip(8)));
    expect(fragmentShader).toContain('agm = clamp( agm, 0.66, 1.5 )');
    expect(fragmentShader).toContain('agLift');
    // the hairline is one pixel-ish of a millimetre and a half a quarter darker, and it comes before the bound
    expect(fragmentShader.indexOf('agLift')).toBeLessThan(fragmentShader.indexOf('clamp( agm'));
    // the stones' share in the matter is larger than before (0.38), in the legend's two thirds of a degree
    expect(HEAT_MATTER).toBeGreaterThanOrEqual(0.4);
  });

  it('the shafts of light end in nothing and fade at their edges: no hard straight edge, and a lower gain', () => {
    expect(SHAFT_GAIN).toBeLessThanOrEqual(0.2);
    expect(SHAFT_LENGTH).toBeLessThanOrEqual(2.7);
    const wall = createWallScene();
    const g = (wall.scene.getObjectByName('sunlight') as THREE.Mesh).geometry;
    const col = g.attributes.aColor as THREE.BufferAttribute;
    const sh = g.attributes.aShaft as THREE.BufferAttribute;
    const pos = g.attributes.position as THREE.BufferAttribute;
    let strongest = 0;
    let far = 0;
    const row: { y: number; a: number; x: number }[] = [];
    for (let i = 0; i < col.count; i++) {
      if (sh.getY(i) > 0.5) continue; // the sun's quad
      const along = sh.getX(i);
      if (along > 0.999) far = Math.max(far, col.getW(i));
      if (along > 0 && along < 0.999) strongest = Math.max(strongest, col.getW(i));
      if (Math.abs(along - 0.1) < 1e-6) row.push({ y: pos.getY(i), a: col.getW(i), x: pos.getX(i) });
    }
    // the far end is nothing, and the strongest light is under a gain of 0.2 times 0.7, as the light would be
    expect(far).toBe(0);
    expect(strongest).toBeLessThanOrEqual(0.7 + 1e-9);
    // across a pane, from nothing at the rail to the full over a third of a metre or more (a hard edge was six centimetres)
    const x0 = Math.min(...row.map((r) => r.x));
    const first = row.filter((r) => Math.abs(r.x - x0) < 1e-6).sort((a, b) => a.y - b.y);
    expect(first.length).toBeGreaterThanOrEqual(4);
    expect(first[0]!.a).toBe(0);
    expect(first[1]!.a).toBeGreaterThan(0.5);
    expect(first[1]!.y - first[0]!.y).toBeGreaterThanOrEqual(0.3);
  });

  it('the relief of the render and the plaster is a fine grain and a calm wave: little of it broader than ten centimetres, and a slope under what the first version had', () => {
    const t = renderNormalMap();
    const d = t.image.data as Uint8Array;
    const S = t.image.width;
    const f = new Float32Array(S * S);
    let mean = 0;
    for (let i = 0; i < S * S; i++) {
      f[i] = d[i * 4]! / 255 - 0.5;
      mean += f[i]!;
    }
    mean /= S * S;
    let v0 = 0;
    for (const v of f) v0 += (v - mean) ** 2;
    v0 /= f.length;
    // the share of the variance left after a box of ten centimetres (the tile is 1.5 m): the first version's was 0.15, the review's cloud
    const k = Math.round((0.1 / 1.5) * S);
    let sv = 0;
    for (let j = 0; j < S; j++)
      for (let i = 0; i < S; i++) {
        let a = 0;
        for (let dj = 0; dj < k; dj++) for (let di = 0; di < k; di++) a += f[((j + dj) % S) * S + ((i + di) % S)]!;
        sv += (a / (k * k) - mean) ** 2;
      }
    sv /= S * S;
    expect(sv / v0).toBeLessThan(0.06);
    // the slope a surface shows is the map's times the material's normal scale: 0.039 before (0.043 × 0.9), 0.028 now
    const m = makeMaterials();
    for (const mat of [m.render, m.plaster, m.ceiling]) {
      const scale = (mat.normalScale as THREE.Vector2).x;
      expect(Math.sqrt(v0) * scale).toBeLessThan(0.03);
    }
  });
});
