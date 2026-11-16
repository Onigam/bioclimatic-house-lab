import * as THREE from 'three';
import { SUN_UNIFORMS } from '../sun';
import { joined, smoothstep } from '../common';
import { ridgeElevation } from '../land/furnace';
import { boulderGeometry, scatterBoulders, type Boulder } from '../land/rocks';
import { fbm } from '../textures';

// The land round the `wall` world's element (round 4, docs/3d.md): what a plain with a diorama on it was missing. The ground is a granite gruss that is not one tone to the horizon (a polar grid, its vertex colours a few
// large patches of dry grass and gravel, in the Short's own sight a hand's breadth finer near the wall than at the fog), boulders of the plateau's rock lie on it with the sun's shadows, and the model's horizon (the `site`'s
// far ridges, the same function) stands behind it, hazed, so that the plain ends in hills and not in a line.

/** The ground's top, m: the element's frame (the footing's underside, `wall/scene.ts`). */
export const GROUND_Y = -1.3;
/** Where the ground ends, m: past the fog (22 to 105 m), the hills' radius and the camera's far plane (120 m), so that it has no edge anywhere. */
export const GROUND_RADIUS = 125;

// ---------------------------------------------------------------------------------------------- the ground

/** The ground's colour field: multipliers round one, in the colour space the vertex colours are (linear). Large and soft: a granite gruss with patches of dry grass, never a pattern. */
export function groundTone(x: number, z: number, out: [number, number, number] = [1, 1, 1]): [number, number, number] {
  const broad = fbm(x / 70 + 11.3, z / 70 - 4.1, 3) - 0.5;
  const mid = fbm(x / 17 + 3.7, z / 17 + 8.2, 3) - 0.5;
  const fine = fbm(x / 4.5 - 6.1, z / 4.5 + 1.9, 2) - 0.5;
  // dry grass, olive and straw, in patches of a few metres to a few tens: where the field is high, a tone away from the grey
  const grass = smoothstep(0.04, 0.16, fbm(x / 26 + 40.2, z / 26 + 17.7, 3) - 0.5 + 0.35 * mid);
  // gravel and bare grit, lighter and warmer, in streaks where the field is low
  const grit = smoothstep(0.1, 0.2, 0.5 - fbm(x / 33 - 21.6, z / 33 + 5.4, 3));
  // a tone a little under the map's own (the plateau's gruss in the sun reads pale, and the fog then takes it to a plain of salt), with the patches carrying a few levels each way
  const k = 0.84 + 0.24 * broad + 0.26 * mid + 0.12 * fine;
  out[0] = k * (1 + grit * 0.03) * (1 - grass * 0.1);
  out[1] = k * (1 + grit * 0.02) * (1 - grass * 0.04);
  out[2] = k * (1 - grass * 0.17);
  // the foot of the element is its own (the contact shadow and the floor's edge): the field is neutral within three metres
  const near = smoothstep(2.5, 6, Math.hypot(x, z + 0.4));
  for (let i = 0; i < 3; i++) out[i] = 0.84 + (out[i]! - 0.84) * near;
  return out;
}

/** A disc of ground as a polar grid, rings a tenth of their radius apart (so the cells are a metre round the element and thirty at the fog), UVs in metres, vertex colours from `groundTone`. */
export function groundGeometry(rings = 48, sectors = 96): THREE.BufferGeometry {
  const r0 = 0.6;
  const pos: number[] = [0, 0, 0];
  const col: number[] = [];
  const uv: number[] = [0, 0];
  const t: [number, number, number] = [1, 1, 1];
  groundTone(0, 0, t);
  col.push(...t);
  const idx: number[] = [];
  for (let i = 0; i < rings; i++) {
    const r = r0 * Math.pow(GROUND_RADIUS / r0, i / (rings - 1));
    for (let j = 0; j < sectors; j++) {
      const a = (j / sectors) * Math.PI * 2;
      const x = r * Math.cos(a);
      const z = r * Math.sin(a);
      pos.push(x, 0, z);
      uv.push(x, z);
      groundTone(x, z, t);
      col.push(...t);
    }
  }
  const at = (i: number, j: number): number => 1 + i * sectors + (j % sectors);
  for (let j = 0; j < sectors; j++) idx.push(0, at(0, j + 1), at(0, j));
  for (let i = 0; i < rings - 1; i++)
    for (let j = 0; j < sectors; j++) {
      idx.push(at(i, j), at(i, j + 1), at(i + 1, j));
      idx.push(at(i, j + 1), at(i + 1, j + 1), at(i + 1, j));
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  // the ground faces up whatever the winding says
  const n = g.attributes.normal as THREE.BufferAttribute;
  for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);
  return g;
}

// ---------------------------------------------------------------------------------------------- the boulders and their shadows

/** How many of the first boulders of the list stand in the Short's sight. */
export const SIGHT_BOULDERS = 4;

/** The plateau's rock lying round the element: placed by a seeded list, outside the yard of the diorama (the camera stands in it), each on the ground at its own x and z. */
export function wallBoulders(): Boulder[] {
  const yard = { x0: -7, x1: 13, z0: -9, z1: 8 };
  // a few where the Short's camera looks (it stands east of the wall and looks west-north-west, so that the ground behind the room is what the right of its frame sees): a stone at ten, sixteen and twenty-eight metres, with the sun's
  // shadow lying to their north, which is the right of the frame
  const sight: Boulder[] = [
    { x: -5.5, z: -3.4, r: 0.32, squash: 0.62, sink: 0.34, seed: 3.1 },
    { x: -12, z: -5.4, r: 0.55, squash: 0.58, sink: 0.36, seed: 17.7 },
    { x: -24, z: -9.6, r: 0.8, squash: 0.66, sink: 0.4, seed: 8.2 },
    { x: -35, z: -14.5, r: 0.45, squash: 0.6, sink: 0.38, seed: 29.4 },
  ];
  return [
    ...sight,
    ...scatterBoulders(41, 14, { x0: -75, x1: -8, z0: -42, z1: 9 }, yard, 0.4, 1.3),
    ...scatterBoulders(43, 6, { x0: -30, x1: 14, z0: 8, z1: 45 }, yard, 0.35, 1.0),
    ...scatterBoulders(47, 5, { x0: 13, x1: 55, z0: -28, z1: 24 }, yard, 0.35, 1.0),
  ];
}

/** The boulders as one geometry: smooth, the near ones (the ones in the Short's sight, the first of the list) in more triangles. */
export function boulderGeometries(list: Boulder[]): THREE.BufferGeometry {
  return joined(list.map((b, i) => boulderGeometry(b, GROUND_Y, i < SIGHT_BOULDERS ? 4 : 2, true)));
}

const SHADOW_VERT = /* glsl */ `
  #include <common>
  #include <fog_pars_vertex>
  uniform vec3 uDir;
  uniform float uGround;
  void main() {
    vec4 wp = modelMatrix * vec4( position, 1.0 );
    // slide each point down the sun's ray onto the ground, away from the sun: the shadow of a body on a plane. At a low sun the length stops growing (and the shadow fades with the sun)
    float t = max( wp.y - uGround, 0.0 ) / max( uDir.y, 0.1 );
    wp.xz -= uDir.xz * t;
    wp.y = uGround + 0.006;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;

const SHADOW_FRAG = /* glsl */ `
  #include <common>
  #include <fog_pars_fragment>
  uniform float uAlpha;
  void main() {
    gl_FragColor = vec4( 0.02, 0.03, 0.06, uAlpha );
    #include <fog_fragment>
  }
`;

/** What the sun's shadow takes off the ground's light: the ground is lit by the sun, the sky and its own bounce, and in shadow it has the last two. */
export const SHADOW_ALPHA = 0.42;

export interface Shadows {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  /** The sun's direction and strength now (`SUN_UNIFORMS`: the state's sun, 0 at night and under a cover). */
  update(): void;
  /** Whether there is a shadow to draw (the sun is up and not behind a cover). */
  readonly on: boolean;
}

/** The planar shadow of a geometry on the ground: the sun-facing triangles, flattened along the sun's ray, drawn once each (a closed body's front faces cover its silhouette once), darkening what is under them. */
export function planarShadow(geometry: THREE.BufferGeometry): Shadows {
  const material = new THREE.ShaderMaterial({
    // (the fog's four uniforms are written by the renderer each frame when `fog` is set; three's `UniformsLib.fog` is the same four, and importing it brings the shader library with it into the bundle, +168 kB raw)
    uniforms: {
      fogColor: { value: new THREE.Color() },
      fogNear: { value: 1 },
      fogFar: { value: 2000 },
      fogDensity: { value: 0.00025 },
      // the sun's direction is the one object the rig, the glass and the shafts read, and the shadow reads it too (a `merge` of uniforms would have cloned it: the first version's shadows stood under their stones)
      uDir: SUN_UNIFORMS.dir,
      uGround: { value: GROUND_Y },
      uAlpha: { value: 0 },
    },
    vertexShader: SHADOW_VERT,
    fragmentShader: SHADOW_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide,
    fog: true,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4,
  });
  material.userData.notShared = true;
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = 'boulder-shadows';
  mesh.frustumCulled = false;
  mesh.renderOrder = 1;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.noShadow = true;
  mesh.raycast = () => {};
  let on = false;
  return {
    mesh,
    material,
    get on() {
      return on;
    },
    update() {
      material.uniforms.uAlpha!.value = SHADOW_ALPHA * SUN_UNIFORMS.k.value;
      on = SUN_UNIFORMS.k.value > 0.004 && SUN_UNIFORMS.dir.value.y > 0.02;
      mesh.visible = on;
    },
  };
}

// ---------------------------------------------------------------------------------------------- the horizon

/** Where the hills stand: nearer and darker, then farther and paler; at this radius from the eye, which is inside the camera's far plane, and carried with the camera (a hill has no parallax). */
export const HILL_LAYERS = [
  { layer: 1, r: 98, haze: 0.22 },
  { layer: 2, r: 104, haze: 0.5 },
] as const;
const HILL_STEPS = 540;

export function hillGeometry(): THREE.BufferGeometry {
  const pos: number[] = [];
  const k: number[] = [];
  const t: number[] = [];
  const idx: number[] = [];
  HILL_LAYERS.forEach((L) => {
    const b0 = pos.length / 3;
    for (let i = 0; i <= HILL_STEPS; i++) {
      // azimuth from south positive west, as the ridges of the `site` (x = −r sin az, z = r cos az)
      const az = (i / HILL_STEPS) * 360 - 180;
      const a = (az * Math.PI) / 180;
      const h = L.r * Math.tan((ridgeElevation(az, L.layer) * Math.PI) / 180);
      const x = -Math.sin(a) * L.r;
      const z = Math.cos(a) * L.r;
      // the crest's height above the eye (the elevation is the one the `site` draws its hills at, from an eye at their centre); the foot's is set in the shader, at the ground
      pos.push(x, h, z, x, h, z);
      k.push(0, 1);
      t.push(L.haze, L.haze);
      if (i > 0) {
        const p = b0 + (i - 1) * 2;
        idx.push(p, p + 2, p + 1, p + 1, p + 2, p + 3);
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 1));
  g.setAttribute('aHaze', new THREE.Float32BufferAttribute(t, 1));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 200);
  return g;
}

const HILL_VERT = /* glsl */ `
  attribute float aK;
  attribute float aHaze;
  uniform float uBase;
  varying float vK;
  varying float vHaze;
  void main() {
    vK = aK;
    vHaze = aHaze;
    vec3 p = position;
    if ( aK < 0.5 ) p.y = uBase;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( p, 1.0 );
  }
`;

const HILL_FRAG = /* glsl */ `
  uniform vec3 uHaze;
  uniform vec3 uRidge;
  varying float vK;
  varying float vHaze;
  void main() {
    // the crest a blue-grey seen through the haze (the farther ring more of it), the foot the haze itself, which is the colour of the fogged ground it stands on
    vec3 crest = mix( uRidge, uHaze, vHaze );
    gl_FragColor = vec4( mix( uHaze, crest, smoothstep( 0.0, 0.6, vK ) ), 1.0 );
  }
`;

export interface Hills {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  /** The sky's horizon (the fog's colour), how much day there is (0 to 1) and how much of a cover (0 to 1: the hills go into the haze under it); the camera the hills are carried with. */
  update(horizon: THREE.Color, day: number, cover: number, camera?: THREE.Camera): void;
}

const RIDGE_DAY = new THREE.Color().setRGB(0.3, 0.4, 0.55, THREE.SRGBColorSpace);
const RIDGE_NIGHT = new THREE.Color().setRGB(0.07, 0.1, 0.19, THREE.SRGBColorSpace);

export function buildHills(): Hills {
  const material = new THREE.ShaderMaterial({
    uniforms: { uHaze: { value: new THREE.Color() }, uRidge: { value: new THREE.Color() }, uBase: { value: -4 } },
    vertexShader: HILL_VERT,
    fragmentShader: HILL_FRAG,
    side: THREE.DoubleSide,
    depthWrite: false,
    fog: false,
  });
  material.userData.notShared = true;
  const mesh = new THREE.Mesh(hillGeometry(), material);
  mesh.name = 'hills';
  mesh.frustumCulled = false;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.noShadow = true;
  mesh.userData.notClipped = true;
  mesh.raycast = () => {};
  const ridge = new THREE.Color();
  return {
    mesh,
    material,
    update(horizon, day, cover, camera) {
      (material.uniforms.uHaze!.value as THREE.Color).copy(horizon);
      ridge
        .copy(RIDGE_NIGHT)
        .lerp(RIDGE_DAY, day)
        .lerp(horizon, 0.55 * cover * day);
      (material.uniforms.uRidge!.value as THREE.Color).copy(ridge);
      if (camera) {
        // carried with the eye (a hill has no parallax); the foot of the wall is the ground, wherever the eye is
        mesh.position.copy(camera.position);
        material.uniforms.uBase!.value = GROUND_Y - camera.position.y;
      }
    },
  };
}
