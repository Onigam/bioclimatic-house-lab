import * as THREE from 'three';
import { smoothstep } from '../common';

// The sky of the `wall` world, from the state's sun and cloud: a gradient from the horizon's paper to a pale blue overhead by day, a dusk's warmth on the horizon as the sun goes, a dark blue and a dim horizon at night. It is
// `scene.background`, a one-pixel-wide texture drawn behind everything (the renderer paints it as one plane: the one draw call the scene's own count does not include), and the fog's colour is its horizon's, so that
// the ground fades into it. No simulation: a function of `sunAltitude` and of the cover (the clear sky's share of the state's irradiance), followed by a rate-limited follower that cannot snap (below).

const ROWS = 64;
/** The sky's rows: horizon below this share of the height, the zenith's colour above. */
const HORIZON_SHARE = 0.34;

/**
 * The sun the wall's picture follows: the state's altitude, chased at no more than `SUN_RATE` degrees a second of the picture's time. The light, the sky and the ground's tone all read this one altitude, so that no clock
 * speed can make the picture jump (the first version eased the sky and snapped it when it was ten degrees behind the sun, and at ×12 000 dusk turned to night in one frame: 56 % of the pixels, −48 levels; the review found
 * the same strobe at the ×86 400 chip). It goes where the state goes at a visitor's pace and behind it where the clock outruns it (at ×12 000 the sun crosses its horizon in a dozen frames and the picture takes fifty). The clock
 * being SET is not a pace (a film sets the hour, the visitor drags the slider): the sun then moved by more than any pace could in the simulation's time that passed, and the picture goes there at once. A pace is bounded:
 * the sun never moves faster than `SUN_MAX_DEG_PER_MIN` degrees of altitude per minute of the model's time (0.27, at the equinox horizon; 0.18 at this latitude), and a move over three times that is a set. That holds at any
 * speed (×86 400 is 12° a frame at 30 frames a second, in 48 minutes of the model's time: 13° of room) and at any frame rate.
 */
export const SUN_RATE = 4;
export const SUN_MAX_DEG_PER_MIN = 0.27;
/**
 * `moved`: the state's altitude minus the last one (Infinity on the first call); `elapsed`: the simulation's own time that passed, seconds. A move beyond what the time that passed can explain, and any move at all in no time, is a set (a pace moves the sun
 * only as the simulation's time moves).
 */
export function followSun(prev: number | null, target: number, dt: number, moved: number, elapsed: number): number {
  const allowed = elapsed < 1 ? 0.02 : Math.max(2, 3 * SUN_MAX_DEG_PER_MIN * (elapsed / 60));
  if (prev === null || Math.abs(moved) > allowed) return target;
  if (dt <= 0) return prev;
  const step = SUN_RATE * Math.min(dt, 0.1);
  return prev + Math.max(-step, Math.min(step, target - prev));
}

type RGB = [number, number, number];
/** A colour as the screen shows it, 0 to 1 a channel. The sky is mixed in these (a linear mix of a dark colour moves tens of levels in a step: the first version's 17 levels in one frame at deep night). */
const srgb = (hex: number): RGB => [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
const mix = (a: RGB, b: RGB, t: number): RGB => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

const NIGHT_TOP = srgb(0x1b2b4b);
const NIGHT_HORIZON = srgb(0x2d3b57);
const DAY_TOP = srgb(0x8fb4d6);
const DUSK = srgb(0xe0a070);
const OVERCAST = srgb(0xb9bcbd);

export interface Sky {
  readonly texture: THREE.DataTexture;
  /** The colour at the horizon, which the fog takes. */
  readonly horizon: THREE.Color;
  /** The zenith's. */
  readonly top: THREE.Color;
  /** 0 by night, 1 by day: what the ground's tone follows too. */
  readonly day: number;
  /** `sunAltitude` the one the picture follows (`followSun`), `clear` the share of the clear sky's beam the state has (0 under a cover). */
  update(sunAltitude: number, paper: THREE.Color, clear?: number): void;
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
  const last = new Float64Array(6).fill(NaN);
  const paperRgb: RGB = [0, 0, 0];
  const tmp = { r: 0, g: 0, b: 0 };
  let dayNow = 1;
  return {
    texture,
    horizon,
    top,
    get day() {
      return dayNow;
    },
    update(altitude, paper, clearShare = 1) {
      // the sun's factor, twenty degrees wide
      dayNow = smoothstep(-8, 12, altitude);
      const day = dayNow;
      paper.getRGB(tmp as THREE.Color, THREE.SRGBColorSpace);
      paperRgb[0] = tmp.r;
      paperRgb[1] = tmp.g;
      paperRgb[2] = tmp.b;
      // the beam's share stands for the clouds: a cover greys the blue and takes the sun's colour off the horizon
      const clear = Math.max(0.25, Math.min(1, clearShare));
      const topRgb = mix(mix(NIGHT_TOP, DAY_TOP, day), OVERCAST, (1 - clear) * 0.7 * day);
      // dusk and dawn: the horizon warms while the day factor is half way (a sine squared of it, so that it begins and ends slowly)
      const warm = Math.sin(Math.PI * day) ** 2 * 0.5 * clear;
      const horRgb = mix(mix(NIGHT_HORIZON, paperRgb, day), DUSK, warm);
      top.setRGB(topRgb[0], topRgb[1], topRgb[2], THREE.SRGBColorSpace);
      horizon.setRGB(horRgb[0], horRgb[1], horRgb[2], THREE.SRGBColorSpace);
      const key = [...topRgb, ...horRgb];
      if (key.every((v, i) => Math.abs(v - last[i]!) < 0.002)) return;
      key.forEach((v, i) => (last[i] = v));
      for (let j = 0; j < ROWS; j++) {
        // v runs up the picture: the horizon's share at the bottom, the zenith at the top
        const t = smoothstep(HORIZON_SHARE, 1, j / (ROWS - 1));
        const c = mix(horRgb, topRgb, t);
        const k = j * 4;
        data[k] = Math.round(c[0] * 255);
        data[k + 1] = Math.round(c[1] * 255);
        data[k + 2] = Math.round(c[2] * 255);
        data[k + 3] = 255;
      }
      texture.needsUpdate = true;
    },
  };
}
