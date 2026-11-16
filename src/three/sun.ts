import * as THREE from 'three';
import { clamp, damp, lerp } from '@onigam/lab-kit/three';
import { RECORDS, SITES, clearDay, type RecordedDay, type SiteId } from '../sim/climate';
import { clearSkyPlane, sunTerms } from '../sim/solar';
import type { HouseState } from '../sim/types';
import { DEG } from './dims';
import { smoothstep } from './common';

// The sun of the 3D is the simulation's: its altitude and azimuth come from the state (`sunAltitude`, `sunAzimuth`, from the south towards the west), and so does the cloud, read as the share of the clear sky's sun
// that the state's irradiance on the wall holds. So the shadow of the head of the frame, the beam on the black face and the glass that refuses a high sun are the model's, not a picture of a sun.

/**
 * The sun as the lab's shaders read it, one object for the page (only the world in view runs its rig): `dir` the unit vector towards the sun, `k` how much of it there is, 0 at night and under a cover that holds the beam
 * back, 1 in a clear sky at noon. The glass of the collector throws it back as a glint, and the `wall` world's shafts of light take their strength from it. It follows the state and nothing else.
 */
export const SUN_UNIFORMS = {
  dir: { value: new THREE.Vector3(0, 1, 0) },
  k: { value: 0 },
};

/** The unit vector towards the sun in the house frame (x east, y up, z south). `alt` and `az` in degrees; `az` from the south, positive towards the west. */
export function sunDirection(alt: number, az: number, out = new THREE.Vector3()): THREE.Vector3 {
  const h = alt * DEG;
  const a = az * DEG;
  return out.set(-Math.sin(a) * Math.cos(h), Math.sin(h), Math.cos(a) * Math.cos(h));
}

/**
 * The clear sky's irradiance on the vertical south plane at this day and hour, W/m², from the model's own formula (`sim/solar.ts`), for a site. Used only to say how much of the clear sky a state holds.
 */
export function clearIncident(state: HouseState, site: SiteId = 'odeillo'): number {
  const s = SITES[site];
  const t = sunTerms(s.latitude, state.dayOfYear, 90, 0);
  const r = clearSkyPlane(t, state.hour, 0.2, s.altitude / 1000);
  return r.beam + r.diffuse;
}

/** 0 under a cover that holds back the beam, 1 under a clear sky: the share of the clear sky's irradiance the state has, mapped so that 40 % or less is overcast. */
export function clarity(state: HouseState, site: SiteId = 'odeillo'): number {
  if (state.sunAltitude < 1) return 0;
  const clear = clearIncident(state, site);
  if (clear < 20) return 0;
  return smoothstep(0.4, 0.82, state.incidentWm2 / clear);
}

/** The clear sky's irradiance on the wall's plane (W/m²) from which the state's share of it says whether there is a cover: the model's own horizon (the ridges, up to 5.7°) takes the beam off a sun that is low, and a clear sky then looks as dull as a cloud. */
export const COVER_FROM_CLEAR = 380;
/** The sun's altitude from which the wall's irradiance says whether there is a cover: the model's horizon is 5.7° at the highest, and the beam comes out from behind it over a few degrees more (a clear morning at 6° of sun still reads a cover for a few frames: found in a day at ×3 600, 18 % of the pixels moved by more than 4 levels at 08:16). */
export const COVER_FROM_ALTITUDE = 11;

/** The share of the clear sky's irradiance (the day's, or the instant's) under which it is a cover, and over which it is a clear sky: `clarity`'s. */
export const COVER_SHARE_FROM = 0.4;
export const COVER_SHARE_TO = 0.82;

/** The recorded days by their date as the state prints it (`recordDate`, « 24/12 »): a date is in one row whatever the record it is read through (the four records share the December table). */
let recordedByDate: Map<string, RecordedDay> | null = null;
export function recordedDay(date: string): RecordedDay | null {
  if (!recordedByDate) {
    recordedByDate = new Map();
    for (const days of Object.values(RECORDS))
      for (const d of days) if (!recordedByDate.has(d.date)) recordedByDate.set(d.date, d);
  }
  return recordedByDate.get(date) ?? null;
}

/**
 * The share of the clear day's radiation on the wall that the state's own day has: the recorded day's total (the table's, MJ/m²) over the clear day's at this site (`clearDay`, the engine's own division: its `k` of `shareDay`),
 * or `null` when the sky is not a recorded one (the state's `recordDate` is empty: the engine prints the date of the record's day only when the sky is recorded). It is known from the day's first minute: the 24 December 1974 is
 * 0.056 from 00:00, a dawn is not a guess. The 23rd is 1.06, the 25th 0.99.
 */
export function dayShare(state: HouseState, site: SiteId = 'odeillo'): number | null {
  if (!state.recordDate) return null;
  const row = recordedDay(state.recordDate);
  if (!row) return null;
  const clear = clearDay(SITES[site], row.day).total;
  return clear > 0 ? row.incident / clear : null;
}

/**
 * The cover a recorded day has, by its own share of the clear day's radiation, the whole day long (0 from 82 % and over, 1 at 40 % and under: the measure of `clarity`). The instantaneous irradiance cannot say it at a dawn
 * (the model's ridge takes the beam off a clear morning: a clear day at 1° of sun is at a seventh of its noon), and the day's total can, from its first minute. `null` where the sky is not a recorded one.
 */
export function dayCover(state: HouseState, site: SiteId = 'odeillo'): number | null {
  const k = dayShare(state, site);
  return k === null ? null : 1 - smoothstep(COVER_SHARE_FROM, COVER_SHARE_TO, k);
}

/**
 * 1 under a cover that holds the sun back, 0 under a clear sky. **A recorded day is read by its own share of the clear day's radiation** (`dayCover`), the whole day long, from its first minute: the dawn of the dull 24 December
 * 1974 is a grey one, and the clear morning that the model's ridge takes the beam off is not a cover. A sky that is not recorded (the mean year, the series, the clear day) has no table to read, and is read by the state's
 * irradiance against the clear sky's (the same measure as `clarity`, which is its complement), only while the sun is `COVER_FROM_ALTITUDE` or more over the horizon and the clear sky gives the wall `COVER_FROM_CLEAR` or more (the sun well over
 * the model's ridges), and is `null` below, at night, and at the dawn and the dusk, where the model's horizon and not a cloud takes the beam (a clear morning at 1° of sun is at a seventh of the clear sky's irradiance).
 */
export function cover(state: HouseState, site: SiteId = 'odeillo'): number | null {
  const byDay = dayCover(state, site);
  if (byDay !== null) return byDay;
  if (state.sunAltitude < COVER_FROM_ALTITUDE) return null;
  const clear = clearIncident(state, site);
  if (clear < COVER_FROM_CLEAR) return null;
  return 1 - smoothstep(COVER_SHARE_FROM, COVER_SHARE_TO, state.incidentWm2 / clear);
}

export interface RigOptions {
  /** Half the side of the shadow's box, metres. */
  half: number;
  /** Strength of the key at full sun, and of the hemisphere's light. */
  key?: number;
  hemi?: number;
  mapSize?: number;
  /** Where the box is centred. */
  focus?: THREE.Vector3;
  bias?: number;
  normalBias?: number;
  radius?: number;
}

export interface Rig {
  key: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  /** 0 by day, 1 by night. */
  night: number;
  /** Direction towards the sun, or the moon at night. */
  dir: THREE.Vector3;
  /** Share of the beam that reaches the ground (0 under cloud and at night). */
  beam: number;
  /** How much of a cover the state is under (`cover`), eased as the beam is: 0 under a clear sky, 1 under a cloud that holds the sun back. A recorded day's is its own from its first minute (`dayCover`: at midnight it eases from the day before's, a night before the dawn it matters at), the others' is read at the noon and held through dusk, night and dawn. What a world's sky reads, to be a grey even cover and not a blue. */
  cover: number;
  /** `dt` is the view's step in seconds: the beam's share is eased over it (the model's ridge cuts the beam in one step; the picture lets the sun come out over a few frames). Without it the share is the state's, whole; at 0 nothing moves (the share stays where it was). */
  update(state: HouseState, site?: SiteId, dt?: number): void;
  focus(point: THREE.Vector3, half?: number): void;
}

const WARM = new THREE.Color(0xffc690);
const WHITE = new THREE.Color(0xfff2e2);
const MOON = new THREE.Color(0x9fb4d8);
const HEMI_DAY = new THREE.Color(0xdfe7f0);
const HEMI_NIGHT = new THREE.Color(0x3a4a78);

/** The key light is the sun: one directional light that follows the state, a hemisphere that is the sky and the ground's bounce. */
export function makeRig(scene: THREE.Scene, o: RigOptions): Rig {
  const mapSize = o.mapSize ?? 2048;
  const keyMax = o.key ?? 3.0;
  const hemiMax = o.hemi ?? 0.8;
  const key = new THREE.DirectionalLight(0xfff2e2, keyMax);
  key.castShadow = true;
  key.shadow.mapSize.set(mapSize, mapSize);
  key.shadow.bias = o.bias ?? -0.0004;
  key.shadow.normalBias = o.normalBias ?? 0.02;
  key.shadow.radius = o.radius ?? 2.5;
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = o.half * 6 + 60;
  const hemi = new THREE.HemisphereLight(0xdfe7f0, 0x9a8a72, hemiMax);
  scene.add(key, key.target, hemi);

  let half = o.half;
  const focus = (o.focus ?? new THREE.Vector3()).clone();
  const dir = new THREE.Vector3(0, 1, 0);
  const moon = new THREE.Vector3(-0.35, 0.8, 0.45).normalize();
  const right = new THREE.Vector3();
  const upv = new THREE.Vector3();
  const snapped = new THREE.Vector3();
  const worldUp = new THREE.Vector3(0, 1, 0);
  const sunV = new THREE.Vector3();
  let cNow: number | null = null;
  let coverNow: number | null = null;

  const setHalf = (h: number): void => {
    half = h;
    const c = key.shadow.camera;
    c.left = -h;
    c.right = h;
    c.top = h;
    c.bottom = -h;
    c.far = h * 6 + 60;
    c.updateProjectionMatrix();
  };
  setHalf(half);

  const place = (): void => {
    // snap the focus to the shadow's texels in light space, so the shadows do not swim when the sun moves a little
    right.crossVectors(worldUp, dir).normalize();
    if (right.lengthSq() < 1e-6) right.set(1, 0, 0);
    upv.crossVectors(dir, right).normalize();
    const texel = (2 * half) / mapSize;
    const a = Math.round(focus.dot(right) / texel) * texel;
    const b = Math.round(focus.dot(upv) / texel) * texel;
    const c = focus.dot(dir);
    snapped.set(0, 0, 0).addScaledVector(right, a).addScaledVector(upv, b).addScaledVector(dir, c);
    key.target.position.copy(snapped);
    key.position.copy(snapped).addScaledVector(dir, half * 3 + 30);
    key.target.updateMatrixWorld();
  };

  const rig: Rig = {
    key,
    hemi,
    night: 0,
    dir,
    beam: 1,
    cover: 0,
    update(state, site, dt = 0) {
      const alt = state.sunAltitude;
      const day = smoothstep(-6, 3, alt);
      const low = 1 - smoothstep(4, 26, alt);
      rig.night = 1 - day;
      // the model's horizon cuts the beam in one step when the sun comes over the ridge (and puts it back in one step behind it): the light follows it over a few frames, not in one
      const target = clarity(state, site);
      cNow = cNow === null ? target : dt <= 0 ? cNow : damp(cNow, target, 2.5, Math.min(dt, 0.1));
      const c = cNow;
      rig.beam = c;
      // a recorded day has its own cover from its first minute, so that the dull day's dawn is grey and the clear one's is not: the day rolls at midnight and the cover eases over the night, where the sky cannot show it (the
      // sky weights its cover by its day factor). A sky with no table is read while the sun is over the ridges, and held where it is not (dawn, dusk, night): a sky that was a cover at four in the afternoon is one at dusk
      const cv = cover(state, site);
      if (cv !== null)
        coverNow = coverNow === null ? cv : dt <= 0 ? coverNow : damp(coverNow, cv, 2.5, Math.min(dt, 0.1));
      rig.cover = coverNow ?? 0;
      // The sun's beam and the moon's are laid together, each at its own strength, in one light: at dusk the sun fades out as the moon comes in, the direction turns from one to the other with them, and nothing changes in
      // one frame (the light used to be the sun's above −1° and the moon's under it, and it jumped there, twice a day: a pop in every picture at sunrise and sunset, on a fast clock). The beam comes in over the sun's first fourteen degrees: low, it crosses the thick of the air.
      const sunI = keyMax * smoothstep(-1, 14, alt) * (0.1 + 0.9 * c) * (1 - 0.15 * low);
      const moonI = 0.55 * (1 - day);
      const total = sunI + moonI;
      if (sunI > 1e-4) {
        sunDirection(Math.max(alt, 0.3), state.sunAzimuth, sunV);
        dir.copy(sunV).multiplyScalar(sunI).addScaledVector(moon, moonI).normalize();
        key.color
          .copy(WHITE)
          .lerp(WARM, low)
          .lerp(MOON, moonI / Math.max(total, 1e-6));
      } else {
        dir.copy(moon);
        key.color.copy(MOON);
      }
      key.intensity = total;
      SUN_UNIFORMS.k.value = smoothstep(-1, 14, alt) * c;
      if (alt > -1) SUN_UNIFORMS.dir.value.copy(sunDirection(Math.max(alt, 0.3), state.sunAzimuth, sunV));
      // the sky gives more when the beam is gone: a cover is bright
      // the sky comes up over twenty degrees of the sun's rise (the lamps and the stars keep to `day`, which is shorter): on a fast clock the whole picture brightens, and a steeper ramp reads as a flash
      const sky = smoothstep(-8, 12, alt);
      hemi.intensity = lerp(0.3, hemiMax * (0.9 + 0.35 * (1 - c)), sky);
      hemi.color.copy(HEMI_NIGHT).lerp(HEMI_DAY, sky);
      scene.environmentIntensity = lerp(0.12, 0.5 + 0.2 * (1 - c), sky);
      place();
    },
    focus(point, h) {
      focus.copy(point);
      if (h !== undefined && Math.abs(h - half) > 1e-6) setHalf(h);
      place();
    },
  };
  void clamp;
  rig.update({ sunAltitude: 35, sunAzimuth: 0, dayOfYear: 15, hour: 12, incidentWm2: 600 } as HouseState);
  // that state was a placeholder: no cover has been read yet
  coverNow = null;
  rig.cover = 0;
  return rig;
}
