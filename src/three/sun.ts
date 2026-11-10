import * as THREE from 'three';
import { clamp, lerp } from '@onigam/lab-kit/three';
import { SITES, type SiteId } from '../sim/climate';
import { clearSkyPlane, sunTerms } from '../sim/solar';
import type { HouseState } from '../sim/types';
import { DEG } from './dims';
import { smoothstep } from './common';

// The sun of the 3D is the simulation's: its altitude and azimuth come from the state (`sunAltitude`, `sunAzimuth`, from the south towards the west), and so does the cloud, read as the share of the clear sky's sun
// that the state's irradiance on the wall holds. So the shadow of the head of the frame, the beam on the black face and the glass that refuses a high sun are the model's, not a picture of a sun.

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
  update(state: HouseState, site?: SiteId): void;
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
    update(state, site) {
      const alt = state.sunAltitude;
      const day = smoothstep(-6, 3, alt);
      const low = 1 - smoothstep(4, 26, alt);
      rig.night = 1 - day;
      const c = clarity(state, site);
      rig.beam = c;
      if (day > 0.02 && alt > -1) {
        sunDirection(Math.max(alt, 0.3), state.sunAzimuth, dir);
        key.color.copy(WHITE).lerp(WARM, low);
        // the beam: full under a clear sky, a fifth of it under a cover (the cover scatters it)
        key.intensity = keyMax * smoothstep(-0.5, 6, alt) * (0.1 + 0.9 * c) * (1 - 0.15 * low);
      } else {
        dir.copy(moon);
        key.color.copy(MOON);
        key.intensity = 0.55 * (1 - day);
      }
      // the sky gives more when the beam is gone: a cover is bright
      hemi.intensity = lerp(0.3, hemiMax * (0.9 + 0.35 * (1 - c)), day);
      hemi.color.copy(HEMI_NIGHT).lerp(HEMI_DAY, day);
      scene.environmentIntensity = lerp(0.12, 0.5 + 0.2 * (1 - c), day);
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
  return rig;
}
