import * as THREE from 'three';
import { damp } from '@onigam/lab-kit/three';
import { smoothstep } from '../common';
import { SUN_UNIFORMS } from '../sun';

// The sky of the `wall` world, from the state's sun and cloud: a gradient from the horizon's paper to a pale blue overhead by day, a dusk's warmth on the horizon as the sun goes, a dark blue and a dim horizon at night. It is
// `scene.background`, a one-pixel-wide texture drawn behind everything (the renderer paints it as one plane: the one draw call the scene's own count does not include), and the fog's colour is its horizon's, so that
// the ground fades into it. No simulation: a function of `sunAltitude` and of the beam's share (`SUN_UNIFORMS.k`, the clear sky's share of the state's irradiance).

const ROWS = 64;
/** The sky's rows: horizon below this share of the height, the zenith's colour above. */
const HORIZON_SHARE = 0.34;

const NIGHT_TOP = new THREE.Color(0x0a1224);
const NIGHT_HORIZON = new THREE.Color(0x1d2536);
const DAY_TOP = new THREE.Color(0x8fb4d6);
const DUSK = new THREE.Color(0xe0a070);
const OVERCAST = new THREE.Color(0xb9bcbd);

export interface Sky {
  readonly texture: THREE.DataTexture;
  /** The colour at the horizon, which the fog takes. */
  readonly horizon: THREE.Color;
  /** The zenith's. */
  readonly top: THREE.Color;
  /** 0 by night, 1 by day, as eased: what the ground's tone follows too. */
  readonly day: number;
  /** `dt` in seconds: the sky follows the sun's altitude over a few tenths of a second, not in one frame (a fast clock crosses a sunset in a few frames); the first call, a jump of more than ten degrees and a call with no time set it where it is or leave it. */
  update(sunAltitude: number, paper: THREE.Color, dt?: number): void;
}

export function makeSky(): Sky {
  const data = new Uint8Array(ROWS * 4);
  const texture = new THREE.DataTexture(data, 1, ROWS, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.name = 'sky';
  const horizon = new THREE.Color();
  const top = new THREE.Color();
  const c = new THREE.Color();
  const last = new Float64Array(6).fill(NaN);
  const dusk = new THREE.Color();
  let seen: number | null = null;
  let dayNow = 1;
  return {
    texture,
    horizon,
    top,
    get day() {
      return dayNow;
    },
    update(altitude, paper, dt = 0) {
      // the same ease as the light's (`sun.ts`): the sky comes up over twenty degrees of the sun's rise, so that a sunrise on a fast clock is a fade
      // a jump of the clock (the hour was set) is not a sunrise: the sky goes where the sun is
      if (seen === null || Math.abs(altitude - seen) > 10) seen = altitude;
      else if (dt > 0) seen = damp(seen, altitude, 1.8, Math.min(dt, 0.1));
      const alt = seen;
      const day = smoothstep(-8, 12, alt);
      dayNow = day;
      // the beam's share stands for the clouds: a cover greys the blue and takes the sun's colour off the horizon
      const clear = Math.max(0.25, Math.min(1, SUN_UNIFORMS.k.value));
      top
        .copy(NIGHT_TOP)
        .lerp(DAY_TOP, day)
        .lerp(OVERCAST, (1 - clear) * 0.7 * day);
      horizon.copy(NIGHT_HORIZON).lerp(paper, day);
      // dusk and dawn: the horizon warms while the sun is within a few degrees of it
      const warm = Math.exp(-(((alt - 1) / 5) ** 2)) * 0.5 * clear;
      dusk.copy(DUSK);
      horizon.lerp(dusk, warm);
      const key = [top.r, top.g, top.b, horizon.r, horizon.g, horizon.b];
      if (key.every((v, i) => Math.abs(v - last[i]!) < 0.002)) return;
      key.forEach((v, i) => (last[i] = v));
      for (let j = 0; j < ROWS; j++) {
        // v runs up the picture: the horizon's share at the bottom, the zenith at the top
        const t = smoothstep(HORIZON_SHARE, 1, j / (ROWS - 1));
        c.copy(horizon).lerp(top, t);
        const k = j * 4;
        // the colour space of the texture is sRGB: write what the screen shows
        const s = c.clone().convertLinearToSRGB();
        data[k] = Math.round(s.r * 255);
        data[k + 1] = Math.round(s.g * 255);
        data[k + 2] = Math.round(s.b * 255);
        data[k + 3] = 255;
      }
      texture.needsUpdate = true;
    },
  };
}
