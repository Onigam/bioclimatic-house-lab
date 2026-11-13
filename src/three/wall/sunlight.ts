import * as THREE from 'three';
import { FRAME, elementLayout, type ElementSpec } from '../dims';
import { SUN_UNIFORMS } from '../sun';

// The sun, in the `wall` world: seen, and the model's. One mesh, one draw call. It holds
//   - the shafts of light: for each of the four panes of the column, the light that comes in through the glass and goes on to the black face, and the air it crosses on the way. Each shaft is a few sheets in the direction of the
//     sun (the state's: its altitude and azimuth), with a soft edge at the frame's rails where their shadow cuts it, brightest at the glass, fading away towards the sun and ending on the black face, where the light lies as a
//     pale patch on the paint;
//   - the sun itself: a disc and its glare, a quad that faces the camera at the end of the sun's direction (a sun has no parallax), drawn only when the camera looks that way.
// Nothing here is a simulation: the direction is `SUN_UNIFORMS.dir`, the strength `SUN_UNIFORMS.k` (0 at night and under a cover, from `clarity` of `sun.ts`). Nothing in it moves but with them, and no random number.

/** The light on the paint lies this far in front of it, m (the paint's own front is at 2 mm). */
const PAINT_LIFT = 0.004;

/** What the shafts' alpha is multiplied by: the light in the air is a hint, not a wall. */
export const SHAFT_GAIN = 0.2;

/** The pale patch of sun on the black face: a hair of warm light, added to a paint whose own value is under 0.01 (its luma is the patch's, mostly): 0.008 keeps the face under 45 levels at noon. */
export const PATCH_ALPHA = 0.008;

/** How far the shafts reach towards the sun from the glass, m. */
export const SHAFT_LENGTH = 2.6;
/** How far the sun's quad stands from the eye, m, and the half-width of the glare in angle. */
const SUN_DISTANCE = 90;
const GLARE_HALF = (13 * Math.PI) / 180;

const VERT = /* glsl */ `
  #include <common>
  #include <clipping_planes_pars_vertex>
  attribute vec4 aColor;
  attribute vec4 aShaft;   // x: along, -1 at the black face, 0 at the glass, 1 at the far end; y: 1 for the sun's quad; zw: its corner, -1..1
  uniform vec3 uSunDir;
  uniform float uBack;     // how far along the sun's direction the black face lies behind the glass, m
  uniform float uReach;
  uniform float uGlare;
  varying vec4 vC;
  varying vec2 vQ;
  varying float vB;
  void main() {
    vec4 mv;
    if ( aShaft.y > 0.5 ) {
      vec3 centre = cameraPosition + uSunDir * ${SUN_DISTANCE.toFixed(1)};
      mv = viewMatrix * vec4( centre, 1.0 );
      mv.xy += aShaft.zw * uGlare;
      vQ = aShaft.zw;
    } else {
      float t = aShaft.x < 0.0 ? aShaft.x * uBack : aShaft.x * uReach;
      mv = modelViewMatrix * vec4( position + t * uSunDir, 1.0 );
      vQ = vec2( 0.0 );
    }
    vB = aShaft.y;
    vC = aColor;
    vec4 mvPosition = mv;
    gl_Position = projectionMatrix * mv;
    #include <clipping_planes_vertex>
  }
`;

const FRAG = /* glsl */ `
  #include <clipping_planes_pars_fragment>
  uniform float uSun;
  uniform float uShaft;
  uniform vec3 uTint;
  varying vec4 vC;
  varying vec2 vQ;
  varying float vB;
  void main() {
    float a;
    if ( vB > 0.5 ) {
      float r = length( vQ );
      float core = 1.0 - smoothstep( 0.1, 0.13, r );
      float glow = 0.5 * exp( -r * 8.0 ) + 0.12 * exp( -r * 2.4 );
      a = ( core * 7.0 + glow ) * ( 1.0 - smoothstep( 0.8, 1.0, r ) );
      gl_FragColor = vec4( uTint * a * uSun, 1.0 );
    } else {
      #include <clipping_planes_fragment>
      gl_FragColor = vec4( uTint * vC.rgb * vC.a * uSun * uShaft, 1.0 );
    }
  }
`;

export interface Sunlight {
  mesh: THREE.Mesh;
  /** The material the mesh is drawn in: another one on it means a pass has taken it over. */
  readonly material: THREE.Material;
  /** The geometry again for a new spec (the gap, the sheets, the height). */
  relayout(spec: ElementSpec): void;
  /** The strength and the slant the sun has now. */
  update(): void;
  /** Whether the sun has any strength to draw: none at night and under a cover. */
  readonly on: boolean;
}

/** The four panes' footprints on the glass: [y0, y1], from the layout. */
function panes(spec: ElementSpec): [number, number][] {
  const L = elementLayout(spec);
  const f = FRAME.face;
  const n = FRAME.panes;
  const ph = (L.yTop - L.yBottom - 2 * f - (n - 1) * f) / n;
  const out: [number, number][] = [];
  for (let j = 0; j < n; j++) {
    const y0 = L.yBottom + f + j * (ph + f);
    out.push([y0, y0 + ph]);
  }
  return out;
}

/** The shafts' geometry, and the sun's quad, as one buffer. */
export function sunlightGeometry(spec: ElementSpec): THREE.BufferGeometry {
  const L = elementLayout(spec);
  const hw = L.openW / 2;
  const zF = L.sheetFront[0]!;
  const pos: number[] = [];
  const col: number[] = [];
  const sh: number[] = [];
  const idx: number[] = [];
  const quad = (a: number, b: number, c: number, d: number): void => {
    idx.push(a, b, c, a, c, d);
  };
  const vert = (
    x: number,
    y: number,
    z: number,
    alpha: number,
    along: number,
    rgb: [number, number, number],
  ): number => {
    pos.push(x, y, z);
    col.push(rgb[0], rgb[1], rgb[2], alpha);
    sh.push(along, 0, 0, 0);
    return pos.length / 3 - 1;
  };
  const WHITE: [number, number, number] = [1, 1, 1];
  // along: -1 at the paint (alpha 0.5), 0 at the glass (1), 1 at the far end (0); across the pane, a soft edge of 6 cm
  const alongs: [number, number][] = [
    // in the gap, between the glass and the paint, the light in the air is nothing: seen from the side along the black face it was a veil over it, and the black face read grey-beige by day (round 2)
    [-1, 0],
    [0, 0.04],
    // close to the glass it is light, strongest a few decimetres out; it thins away towards the sun and has no end
    [0.1, 0.7],
    [0.4, 0.34],
    [0.75, 0.1],
    [1, 0],
  ];
  // the edges are long: where a rail (or the top of the glazing) cuts the light it fades over a third of a metre, so that the four shafts run into one soft band and no edge is a line across the sky (the review's « sail »)
  const edge = 0.32;
  // the sheets stand in the planes x = const: the west wall of the opening, a third of the way, and just behind the section's plane (x = 0 is where the world cuts); the first is the brightest
  const sheets: [number, number][] = [
    [-hw * 0.8, 1],
    [-hw * 0.42, 0.8],
    [-0.025, 0.8],
  ];
  for (const [ya, yb] of panes(spec)) {
    for (const [x, weight] of sheets) {
      const ys: [number, number][] = [
        [ya, 0],
        [ya + edge, 1],
        [yb - edge, 1],
        [yb, 0],
      ];
      const grid: number[][] = [];
      for (const [along, a] of alongs) {
        const row: number[] = [];
        for (const [y, w] of ys) row.push(vert(x, y, zF, a * w * weight, along, WHITE));
        grid.push(row);
      }
      for (let i = 0; i < alongs.length - 1; i++)
        for (let j = 0; j < ys.length - 1; j++)
          quad(grid[i]![j]!, grid[i]![j + 1]!, grid[i + 1]![j + 1]!, grid[i + 1]![j]!);
    }
    // the light on the paint: the pane's own footprint carried along the ray to the paint (`along` -1, which the shader does), a pale patch a hair in front of it
    const patch = [
      vert(-hw, ya, zF, PATCH_ALPHA, -1, WHITE),
      vert(-hw, yb, zF, PATCH_ALPHA, -1, WHITE),
      vert(hw, yb, zF, PATCH_ALPHA, -1, WHITE),
      vert(hw, ya, zF, PATCH_ALPHA, -1, WHITE),
    ];
    quad(patch[0]!, patch[1]!, patch[2]!, patch[3]!);
  }
  // the sun's quad: four corners, its centre set by the shader
  const q0 = pos.length / 3;
  for (const [cx, cy] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ] as const) {
    pos.push(0, 0, 0);
    col.push(1, 1, 1, 1);
    sh.push(0, 1, cx, cy);
  }
  quad(q0, q0 + 1, q0 + 2, q0 + 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 4));
  g.setAttribute('aShaft', new THREE.Float32BufferAttribute(sh, 4));
  g.setIndex(idx);
  // the sun's quad is placed by the shader: the box that culls it must hold the sky
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 1e4);
  return g;
}

export function buildSunlight(spec0: ElementSpec): Sunlight {
  const uniforms = {
    uSunDir: SUN_UNIFORMS.dir,
    uSun: { value: 0 },
    uShaft: { value: SHAFT_GAIN },
    uTint: { value: new THREE.Color(1, 0.9, 0.7) },
    uBack: { value: 0.2 },
    uReach: { value: SHAFT_LENGTH },
    uGlare: { value: Math.tan(GLARE_HALF) * SUN_DISTANCE },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneFactor,
    clipping: true,
    fog: false,
    // the light on the paint lies 3 mm in front of it: seen along the face (the film's camera is 7° off it) that is not enough for the depth test, which fought in dashes; pulled towards the eye it wins
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -6,
  });
  mat.userData.notShared = true;
  const mesh = new THREE.Mesh(sunlightGeometry(spec0), mat);
  mesh.name = 'sunlight';
  mesh.frustumCulled = false;
  mesh.renderOrder = 5;
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.noShadow = true;
  mesh.raycast = () => {};
  let spec = spec0;
  let on = false;
  return {
    mesh,
    material: mat,
    get on() {
      return on;
    },
    relayout(next) {
      spec = next;
      const old = mesh.geometry;
      mesh.geometry = sunlightGeometry(next);
      old.dispose();
    },
    update() {
      const k = SUN_UNIFORMS.k.value;
      const dir = SUN_UNIFORMS.dir.value;
      on = k > 0.002 && dir.y > 0.01;
      uniforms.uSun.value = k;
      // the distance along the ray from the glass to the black face
      const L = elementLayout(spec);
      uniforms.uBack.value = (L.sheetFront[0]! - (L.face + PAINT_LIFT)) / Math.max(0.05, dir.z);
      // the lower the sun, the warmer
      const low = 1 - Math.min(1, Math.max(0, (Math.asin(Math.min(1, Math.max(-1, dir.y))) * 180) / Math.PI / 30));
      uniforms.uTint.value.setRGB(1, 0.84 - 0.12 * low, 0.5 - 0.15 * low);
    },
  };
}
