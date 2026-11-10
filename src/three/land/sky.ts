import * as THREE from 'three';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { clamp, lerp } from '@onigam/lab-kit/three';
import type { HouseState } from '../../sim/types';
import { smoothstep } from '../common';
import { DEG } from '../dims';
import { sunDirection } from '../sun';

// The sky of the plateau: a Preetham dome whose sun is the simulation's (its altitude and azimuth in the state), stars and a moon at night, an environment map for the reflections on glass and mirrors, and the fog that lets the far
// ridges recede. Ported from Mill Lab by way of the sand lab and the mass heater lab (docs/kit-requests.md), with the sun taken from the state in place of a clock of its own.

function injectNight(sky: Sky): void {
  const m = sky.material;
  m.uniforms.uNight = { value: 0 };
  const hook = 'gl_FragColor = vec4( texColor, 1.0 );';
  if (!m.fragmentShader.includes(hook)) return;
  m.fragmentShader = m.fragmentShader.replace('void main() {', 'uniform float uNight;\nvoid main() {').replace(
    hook,
    /* glsl */ `
      {
        float up = max(direction.y, 0.0);
        vec3 nightCol = mix(vec3(0.010, 0.016, 0.040), vec3(0.0025, 0.004, 0.012), pow(up, 0.6));
        vec3 sd = direction * 260.0;
        vec3 cell = floor(sd);
        float h = fract(sin(dot(cell, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
        float star = step(0.9965, h) * smoothstep(0.45, 0.05, length(fract(sd) - 0.5));
        star *= smoothstep(0.02, 0.25, up) * (0.5 + 0.5 * fract(h * 91.7));
        texColor = mix(texColor, nightCol + vec3(star) * 0.9, uNight);
      }
      ${hook}`,
  );
}

/** Equirectangular sky-and-ground gradient used as the environment (reflections on pipes, water, metal). */
function envTexture(): THREE.DataTexture {
  const W = 64;
  const H = 32;
  const data = new Uint8Array(W * H * 4);
  const stops: [number, [number, number, number]][] = [
    [0, [111, 156, 208]],
    [0.42, [188, 210, 230]],
    [0.5, [217, 226, 228]],
    [0.53, [190, 196, 204]],
    [1, [150, 156, 166]],
  ];
  for (let j = 0; j < H; j++) {
    const t = j / (H - 1);
    let k = 0;
    while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
    const [t0, c0] = stops[k];
    const [t1, c1] = stops[k + 1];
    const f = clamp((t - t0) / (t1 - t0), 0, 1);
    for (let i = 0; i < W; i++) {
      const o = (j * W + i) * 4;
      data[o] = lerp(c0[0], c1[0], f);
      data[o + 1] = lerp(c0[1], c1[1], f);
      data[o + 2] = lerp(c0[2], c1[2], f);
      data[o + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, W, H, THREE.RGBAFormat);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = tex.minFilter = THREE.LinearFilter;
  tex.needsUpdate = true;
  return tex;
}

/** Thin haze: the ridges at 4 to 6 km stay a pale blue-grey rather than vanish. */
const FOG_DENSITY = 0.00013;

export interface SkyRig {
  sky: Sky;
  update(state: HouseState, time: number, night: number): void;
}

export function createSky(scene: THREE.Scene): SkyRig {
  const sky = new Sky();
  sky.name = 'sky';
  sky.scale.setScalar(9000);
  sky.frustumCulled = false;
  const u = sky.material.uniforms;
  u.turbidity.value = 3.2;
  u.rayleigh.value = 1.2;
  u.mieCoefficient.value = 0.004;
  u.mieDirectionalG.value = 0.82;
  if (u.cloudCoverage) {
    u.cloudCoverage.value = 0.3;
    u.cloudDensity.value = 0.5;
    u.cloudElevation.value = 0.45;
    u.cloudScale.value = 0.00022;
  }
  injectNight(sky);
  scene.add(sky);
  scene.environment = envTexture();
  scene.fog = new THREE.FogExp2(0xc6d4e0, FOG_DENSITY);
  const sunDir = new THREE.Vector3(0, 1, 0);
  const fogDay = new THREE.Color(0xc4d3e2);
  const fogDusk = new THREE.Color(0xd8b49a);
  const fogNight = new THREE.Color(0x0b1222);
  return {
    sky,
    update(state, time, night) {
      sunDirection(Math.max(state.sunAltitude, -12), state.sunAzimuth, sunDir);
      const alt = state.sunAltitude * DEG;
      const day = smoothstep(-7 * DEG, 3 * DEG, alt);
      const low = 1 - smoothstep(4 * DEG, 25 * DEG, alt);
      u.sunPosition.value.copy(sunDir);
      u.uNight.value = smoothstep(-2 * DEG, -10 * DEG, alt);
      if (u.time) u.time.value = time;
      (scene.fog as THREE.FogExp2).color
        .copy(fogNight)
        .lerp(fogDay, day)
        .lerp(fogDusk, low * day * 0.6);
      void night;
      void clamp;
      void lerp;
    },
  };
}
