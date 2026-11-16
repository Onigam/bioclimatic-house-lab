import * as THREE from 'three';
import { smoothstep } from '../common';

// The sky of the `wall` world, from the state's sun and cloud: a gradient from the horizon's paper to a pale blue overhead by day, a dusk's warmth on the horizon as the sun goes, a dark blue and a dim horizon at night. It is
// `scene.background`, a one-pixel-wide texture drawn behind everything (the renderer paints it as one plane: the one draw call the scene's own count does not include), and the fog's colour is its horizon's, so that
// the ground fades into it. No simulation: a function of `sunAltitude` and of the cover (the clear sky's share of the state's irradiance), followed by a follower of what the picture reads, which cannot snap and does not lag where nothing changes (below).

/**
 * The sun the wall's picture follows: the state's altitude, chased so that nothing the picture reads off it changes by more than a limit in a frame. The light, the sky and the ground's tone all read this one altitude, so
 * that no clock speed can make the picture jump (the first version eased the sky and snapped it when it was ten degrees behind the sun, and at ×12 000 dusk turned to night in one frame: 56 % of the pixels, −48 levels;
 * the review found the same strobe at the ×86 400 chip). The second version chased it at 4 degrees a second whatever the sky was doing, and above about ×2 500 the sky could not follow the clock: the Short's coda (×10 800,
 * ×5 885, ×32 040 from noon) showed a blue sky at 02:15 on the clock, and a ghost of the sun crossed it (round 3). The limit is now on what the picture shows and not on the degrees: the sky, the beam, the lamps and the
 * warmth are each a ramp of the altitude (`SUN_RAMPS`, the same as `sun.ts`'s and this file's own), each may move by its share of its range in a frame (the steepest of them, the sky, in 0.032 of it: its whole dusk can
 * not take under a second of picture, and the sun at ×3 600, which moves it by 0.027, is followed exactly), and where no ramp moves (the day's high sun, the night) the altitude goes at `SUN_FLAT_RATE`: a night is reached as the dusk ends,
 * and after the clock stops the picture is on the state's sun within a second. The clock being SET is not a pace (a film sets the hour, the visitor drags the slider): the sun then moved by more than any pace could in the
 * simulation's time that passed, and the picture goes there at once. A pace is bounded: the sun never moves faster than `SUN_MAX_DEG_PER_MIN` degrees of altitude per minute of the model's time (0.27, at the equinox
 * horizon; 0.18 at this latitude), and a move over three times that is a set, at any speed and any frame rate.
 */
export const SUN_MAX_DEG_PER_MIN = 0.27;
/**
 * What the picture reads off the sun's altitude: [from, to, the most it may move in a frame at 30 a second, as a share of its range]. The sky and the hemisphere (`smoothstep(−8, 12)`, here and in `sun.ts`), the beam, the disc
 * and the glint (`−1, 14`), the lamps and the moon (`−6, 3`), the beam's warmth (`4, 26`). Round 4: the sky's limit is the one that matters to what a viewer sees, and it holds: a channel of the sky's horizon row, red, goes
 * from the paper's to the night's, with the dusk's warmth on the way, and 0.032 of that is 11.8 levels, under the twelve the tests hold (0.03 was round 3's). The three others had been set as conservatively and bound the
 * afternoon long before the sky did (the beam's warmth, 22 degrees wide, may not move by more than 0.03 a frame: at ×11 000 the picture was half an hour of sun behind at 14:00 and two hours at 17:00): the beam's colour and
 * the lamps are few levels of the picture, and they are now 0.06 and 0.12 (the lamps' own, 0.065, stays: at 0.09 the moon's light crossing the sun's turned the direction of the key light in a few frames, and 1.1 % of the pixels of the coda changed by more than twelve levels in the frame, 0.04 % at 0.065). At the Short's coda (×11 150 from noon) the sky is half way to its night 37 minutes after the sun is (it was 93), and in its night 93 minutes after the sun's (it was 154).
 */
export const SUN_RAMPS: readonly (readonly [number, number, number])[] = [
  [-8, 12, 0.032],
  [-1, 14, 0.06],
  [-6, 3, 0.065],
  [4, 26, 0.12],
];
/** Degrees a second where no ramp moves: the high sun and the night. */
export const SUN_FLAT_RATE = 60;

/** Whether the altitude moved by more than a pace could: the clock was set (or this is the first frame). `moved`: the state's altitude minus the last one; `elapsed`: the simulation's own time that passed, seconds. */
export function clockSet(prev: number | null, moved: number, elapsed: number): boolean {
  if (prev === null) return true;
  const allowed = elapsed < 1 ? 0.02 : Math.max(2, 3 * SUN_MAX_DEG_PER_MIN * (elapsed / 60));
  return Math.abs(moved) > allowed;
}

/**
 * `moved`, `elapsed` as `clockSet`. A set goes at once; a pace is chased, a frame at a time, by the largest step that keeps every ramp inside its limit (and the flat rate), so that it neither lags where the picture
 * does not change nor moves it faster than its limit where it does. No time, no move.
 */
export function followSun(prev: number | null, target: number, dt: number, moved: number, elapsed: number): number {
  if (prev === null || clockSet(prev, moved, elapsed)) return target;
  if (dt <= 0) return prev;
  const frame = Math.min(dt, 0.1) * 30;
  const dist = target - prev;
  const sign = Math.sign(dist);
  const cap = Math.min(Math.abs(dist), SUN_FLAT_RATE * Math.min(dt, 0.1));
  const within = (step: number): boolean =>
    SUN_RAMPS.every(
      ([lo, hi, limit]) => Math.abs(smoothstep(lo, hi, prev + sign * step) - smoothstep(lo, hi, prev)) <= limit * frame,
    );
  if (within(cap)) return prev + sign * cap;
  // every ramp is monotone in the altitude: the largest step that keeps them all inside is found by halving
  let lo = 0;
  let hi = cap;
  for (let i = 0; i < 18; i++) {
    const mid = (lo + hi) / 2;
    if (within(mid)) lo = mid;
    else hi = mid;
  }
  return prev + sign * lo;
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
const DAY_TOP = srgb(0x4a86cf);
const DUSK = srgb(0xe0a070);
/** A cover: an even, bright grey, a little lighter at the horizon (the Short's 24 December: the beam's share is a twentieth, and the sky is not blue). */
const OVERCAST_TOP = srgb(0xbfc3c6);
const OVERCAST_HORIZON = srgb(0xd2d4d4);

/** The sky's rows (the texture is one pixel wide; row 0 is the bottom of the picture). */
export const SKY_ROWS = 128;
/** Degrees of elevation over which the horizon's haze gives way to the sky's blue (63 % of the way at this height, 93 % at twice it: the Short's camera looks at the sky from the horizon to about twelve degrees, and a blue that comes more slowly is a haze the whole picture long). */
export const SKY_BLUE_DEG = 6;
/** Where the rows stand when no camera has been asked (a test, the first frame before a draw): the horizon at 34 % of the picture's height and 60 degrees a picture height. */
const DEFAULT_HORIZON = 0.34;
const DEFAULT_DEG_PER_HEIGHT = 60;

/** How much of the way from the horizon's haze to the zenith's colour a direction at this elevation has gone: nothing at or under the horizon, smooth from it (no kink where the ground ends), most of it by 30 degrees. */
export function blueShare(elevationDeg: number): number {
  if (elevationDeg <= 0) return 0;
  return 1 - Math.exp(-((elevationDeg / SKY_BLUE_DEG) ** 1.5));
}

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
  /**
   * The rows for this camera: a row's colour is the sky's at the elevation the picture's row looks at (through the projection, the view offset of a film's subject zone included), so that the horizon of the sky is the
   * horizon of the ground, at whatever pitch and field of view: the ground fades into the fog's colour, which is the sky's colour at the horizon, and there is no line where they meet. Does nothing when nothing changed.
   */
  align(camera: THREE.Camera): void;
  /** The sky's colour at an elevation (degrees), as the screen shows it, into `out`. */
  colorAt(elevationDeg: number, out: THREE.Color): THREE.Color;
}

export function makeSky(): Sky {
  const data = new Uint8Array(SKY_ROWS * 4);
  const texture = new THREE.DataTexture(data, 1, SKY_ROWS, THREE.RGBAFormat);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.name = 'sky';
  const horizon = new THREE.Color();
  const top = new THREE.Color();
  const paperRgb: RGB = [0, 0, 0];
  const tmp = { r: 0, g: 0, b: 0 };
  let dayNow = 1;
  let horRgb: RGB = [1, 1, 1];
  let topRgb: RGB = [0.5, 0.6, 0.8];
  // what the rows were last made from: the two colours and the elevation of the bottom row and of the top one
  const made = new Float64Array(8).fill(NaN);
  const elevations = new Float64Array(SKY_ROWS);
  const dir = { x: 0, y: 0, z: 0 };
  const colorAt = (e: number): RGB => mix(horRgb, topRgb, blueShare(e));
  const fill = (): void => {
    const key = [...horRgb, ...topRgb, elevations[0]!, elevations[SKY_ROWS - 1]!];
    if (key.every((v, i) => Math.abs(v - made[i]!) < 0.002 * (i < 6 ? 1 : 25))) return;
    key.forEach((v, i) => (made[i] = v));
    for (let j = 0; j < SKY_ROWS; j++) {
      const c = colorAt(elevations[j]!);
      const k = j * 4;
      data[k] = Math.round(c[0] * 255);
      data[k + 1] = Math.round(c[1] * 255);
      data[k + 2] = Math.round(c[2] * 255);
      data[k + 3] = 255;
    }
    texture.needsUpdate = true;
  };
  const defaultRows = (): void => {
    for (let j = 0; j < SKY_ROWS; j++)
      elevations[j] = ((j + 0.5) / SKY_ROWS - DEFAULT_HORIZON) * DEFAULT_DEG_PER_HEIGHT;
  };
  defaultRows();
  let aligned = false;
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
      // the beam's share stands for the clouds: a cover takes the blue to a bright, even grey (the top and the horizon almost one grey: no gradient to speak of) and the sun's colour off the horizon. A share of 0 is a sky with no
      // blue in it (the recorded 24 December 1974, a twentieth of the day before's radiation); a share of 1, the clear sky
      const clear = Math.max(0, Math.min(1, clearShare));
      const over = (1 - clear) * day;
      topRgb = mix(mix(NIGHT_TOP, DAY_TOP, day), OVERCAST_TOP, over);
      // dusk and dawn: the horizon warms while the day factor is half way (a sine squared of it, so that it begins and ends slowly)
      const warm = Math.sin(Math.PI * day) ** 2 * 0.5 * clear;
      horRgb = mix(mix(mix(NIGHT_HORIZON, paperRgb, day), OVERCAST_HORIZON, over), DUSK, warm);
      top.setRGB(topRgb[0], topRgb[1], topRgb[2], THREE.SRGBColorSpace);
      horizon.setRGB(horRgb[0], horRgb[1], horRgb[2], THREE.SRGBColorSpace);
      if (!aligned) defaultRows();
      fill();
    },
    align(camera) {
      const m = camera.matrixWorld.elements;
      const inv = (camera as THREE.PerspectiveCamera).projectionMatrixInverse?.elements;
      if (!inv) return;
      aligned = true;
      // the direction each row of the centre column looks along, in the camera's frame, then its height in the world's
      for (let j = 0; j < SKY_ROWS; j++) {
        const y = (2 * (j + 0.5)) / SKY_ROWS - 1;
        // projectionMatrixInverse * (0, y, 1, 1), column-major
        const w = inv[7]! * y + inv[11]! + inv[15]!;
        dir.x = (inv[4]! * y + inv[8]! + inv[12]!) / w;
        dir.y = (inv[5]! * y + inv[9]! + inv[13]!) / w;
        dir.z = (inv[6]! * y + inv[10]! + inv[14]!) / w;
        const len = Math.hypot(dir.x, dir.y, dir.z);
        const up = (m[1]! * dir.x + m[5]! * dir.y + m[9]! * dir.z) / len;
        elevations[j] = (Math.asin(Math.max(-1, Math.min(1, up))) * 180) / Math.PI;
      }
      fill();
    },
    colorAt(e, out) {
      const c = colorAt(e);
      return out.setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
    },
  };
}
