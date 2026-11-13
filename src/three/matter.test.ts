import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { HEAT_MATTER, heatMaterial } from './collector/caps';
import { HeatStrip } from './heat';
import { makeMaterials } from './materials';
import { SUN_UNIFORMS } from './sun';
import {
  aggregateMap,
  blackPaintMap,
  blackPaintNormalMap,
  cutConcreteMap,
  hardcoreMap,
  textureStats,
  tf,
  tileNormalMap,
} from './textures';
import { makeSky } from './wall/sky';
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
    // what the shader computes at a texel is 1 + matter * 2 * (a + 0.55 b + 0.45 c), with a, b, c the deviations of the map from 0.5: their mean is zero, so is the multiplier's departure from one
    const d = aggregateMap().image.data as Uint8Array;
    let dev = 0;
    for (let k = 0; k < d.length; k += 4) dev += d[k]! / 255 - 0.5;
    dev /= d.length / 4;
    expect(Math.abs(HEAT_MATTER * 2 * (1 + 0.55 + 0.45) * dev)).toBeLessThan(0.05);
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
  it('a pale blue overhead and the paper at the horizon by day, a dark blue at night, a warm horizon at dusk', () => {
    const sky = makeSky();
    const paper = new THREE.Color(0xe9e2d3);
    SUN_UNIFORMS.k.value = 1;
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
    // the fog takes the horizon's colour: the ground fades into the sky
    expect(sky.horizon.r).toBeLessThan(dayHorizon.r);
    // at dusk the horizon is warmer than the paper (red over blue by more)
    sky.update(1, paper);
    const dusk = rows(sky.texture, 0, 63);
    expect(dusk[0]! - dusk[2]!).toBeGreaterThan(hr - hb);
    // and it is never one colour
    const d = sky.texture.image.data as Uint8Array;
    expect(new Set(Array.from({ length: 64 }, (_, j) => d[j * 4 + 2])).size).toBeGreaterThan(8);
    SUN_UNIFORMS.k.value = 0;
  });

  it('the world uses it: the background is the sky and the fog is its horizon, dark at night and pale by day', () => {
    const wall = createWallScene();
    const fogAt = (hour: number): number => {
      wall.update(stateWith({}, { day: 355 } as never, hour), 1 / 60, view());
      expect((wall.scene.background as THREE.Texture).name).toBe('sky');
      const fog = wall.scene.fog as THREE.Fog;
      return fog.color.r + fog.color.g + fog.color.b;
    };
    const noon = fogAt(12);
    const night = fogAt(2);
    expect(noon).toBeGreaterThan(1.5);
    expect(night).toBeLessThan(0.5);
  });
});
