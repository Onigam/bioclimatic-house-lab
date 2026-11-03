// The sun and the sky on a plane. COPIED from Solar Heater Lab, `src/sim/thermal/solar.ts` (the kit's 0.6.0 has no sun), with two changes: `clearSkyPlane` takes the site's altitude, by Laue's
// correction, and a horizon can cut the beam. Pure functions of plain numbers, SI, temperatures in °C, angles in degrees at the interface. The move into the kit is `docs/kit-requests.md`, item 2.

const RAD = Math.PI / 180;

/** Solar constant, W/m². */
export const SOLAR_CONSTANT = 1361;

/** Declination, degrees, for a day of the year (1 to 365), Cooper's formula. */
export const declination = (day: number): number => 23.45 * Math.sin((2 * Math.PI * (284 + day)) / 365);

/** Extraterrestrial normal irradiance on a day of the year, W/m². */
export const extraterrestrial = (day: number): number =>
  SOLAR_CONSTANT * (1 + 0.033 * Math.cos((2 * Math.PI * day) / 365));

/** What does not move during a day, for one place and one plane. */
export interface SunTerms {
  /** cos(incidence) = a + b·cos ω + c·sin ω. */
  a: number;
  b: number;
  c: number;
  /** cos(zenith) = d + e·cos ω. */
  d: number;
  e: number;
  latitude: number;
  decl: number;
  normal: number;
  /** cos(tilt), for the view factors. */
  cosTilt: number;
}

/** Prepare a day. `azimuth` is the plane's, degrees away from the equator (0 faces it), `latitude` positive north. */
export function sunTerms(latitude: number, day: number, tilt: number, azimuth = 0): SunTerms {
  const phi = latitude * RAD;
  const b = tilt * RAD;
  const g = azimuth * RAD;
  const decl = declination(day);
  const dl = decl * RAD;
  const sd = Math.sin(dl);
  const cd = Math.cos(dl);
  const sp = Math.sin(phi);
  const cp = Math.cos(phi);
  const sb = Math.sin(b);
  const cb = Math.cos(b);
  return {
    a: sd * sp * cb - sd * cp * sb * Math.cos(g),
    b: cd * cp * cb + cd * sp * sb * Math.cos(g),
    c: cd * sb * Math.sin(g),
    d: sd * sp,
    e: cd * cp,
    latitude,
    decl,
    normal: extraterrestrial(day),
    cosTilt: cb,
  };
}

/** Hour angle of a solar hour, radians. */
export const hourAngle = (hour: number): number => (hour - 12) * 15 * RAD;

export const cosIncidence = (t: SunTerms, hour: number): number => {
  const w = hourAngle(hour);
  return t.a + t.b * Math.cos(w) + t.c * Math.sin(w);
};

export const cosZenith = (t: SunTerms, hour: number): number => t.d + t.e * Math.cos(hourAngle(hour));

/** Sun's altitude, degrees (negative below the horizon). */
export const sunAltitude = (t: SunTerms, hour: number): number => Math.asin(cosZenith(t, hour)) / RAD;

/** Sun's azimuth, degrees from the south, positive towards the west. */
export function sunAzimuth(t: SunTerms, hour: number): number {
  const w = hourAngle(hour);
  const dl = t.decl * RAD;
  const phi = t.latitude * RAD;
  const y = Math.cos(dl) * Math.sin(w);
  const x = Math.cos(dl) * Math.sin(phi) * Math.cos(w) - Math.sin(dl) * Math.cos(phi);
  return Math.atan2(y, x) / RAD;
}

/** Air mass, Kasten and Young (1989). */
export function airMass(cosZ: number): number {
  if (cosZ <= 0) return Infinity;
  const zDeg = Math.acos(cosZ) / RAD;
  return 1 / (cosZ + 0.50572 * Math.pow(96.07995 - zDeg, -1.6364));
}

/** The incidence of a noon sun on a vertical wall facing the equator, degrees: that is the sun's altitude, 90° − (latitude − declination). */
export const noonIncidenceVertical = (latitude: number, day: number): number =>
  90 - Math.abs(latitude - declination(day));

export interface PlaneIrradiance {
  /** W/m². */
  beam: number;
  /** Sky and ground together, W/m². */
  diffuse: number;
  cosTheta: number;
  /** On the horizontal, W/m². */
  horizontal: number;
}

/** A coarse horizon, degrees: `[azimuth from south, height]`, straight between points. */
export type Horizon = readonly (readonly [number, number])[];

export function horizonAt(h: Horizon | undefined, az: number): number {
  if (!h || h.length === 0) return 0;
  if (az <= h[0]![0]) return h[0]![1];
  for (let i = 1; i < h.length; i++) {
    const a = h[i - 1]!;
    const b = h[i]!;
    if (az <= b[0]) return a[1] + ((b[1] - a[1]) * (az - a[0])) / (b[0] - a[0]);
  }
  return h[h.length - 1]![1];
}

/** Laue's correction for altitude, per kilometre (Laue 1970, as given by Meinel and Meinel). */
const LAUE = 0.14;

/**
 * Irradiance on the plane under a clear sky, W/m². Beam: Meinel's 0.7^(AM^0.678) with Laue's altitude term. Diffuse on the horizontal: a tenth of the beam at normal incidence (the rule of thumb that
 * goes with it, as in the solar lab); isotropic on the plane, with a ground that returns `albedo`. Beam stops under the horizon.
 */
export function clearSkyPlane(
  t: SunTerms,
  hour: number,
  albedo = 0.2,
  altitudeKm = 0,
  horizon?: Horizon,
  out?: PlaneIrradiance,
): PlaneIrradiance {
  const r = out ?? { beam: 0, diffuse: 0, cosTheta: 0, horizontal: 0 };
  const cz = cosZenith(t, hour);
  if (cz <= 0.01) {
    r.beam = 0;
    r.diffuse = 0;
    r.cosTheta = 0;
    r.horizontal = 0;
    return r;
  }
  const am = airMass(cz);
  const a = LAUE * altitudeKm;
  const bn = t.normal * ((1 - a) * Math.pow(0.7, Math.pow(am, 0.678)) + a);
  const dh = 0.1 * bn;
  const gh = bn * cz + dh;
  const ct = cosIncidence(t, hour);
  r.cosTheta = ct;
  r.horizontal = gh;
  const visible = !horizon || Math.asin(cz) / RAD >= horizonAt(horizon, sunAzimuth(t, hour));
  r.beam = visible ? bn * Math.max(0, ct) : 0;
  r.diffuse = (dh * (1 + t.cosTilt)) / 2 + (albedo * gh * (1 - t.cosTilt)) / 2;
  return r;
}

/** Sky temperature of a clear night, °C, Swinbank (1963): T_sky = 0.0552·T_a^1.5 in kelvins. */
export const skyTemperature = (Ta: number): number => 0.0552 * Math.pow(Ta + 273.15, 1.5) - 273.15;

/** Convective film on the outside of a glazing, W/m²·K (Watmuff's 2.8 + 3·v, for v in m/s). */
export const windFilm = (v: number): number => 2.8 + 3 * v;
