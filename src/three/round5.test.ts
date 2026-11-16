import * as THREE from 'three';
import { beforeAll, describe, expect, it } from 'vitest';
import { HouseSim } from '../sim/engine';
import { RECORDS, type RecordId } from '../sim/climate';
import type { HouseState } from '../sim/types';
import {
  COVER_SHARE_FROM,
  COVER_SHARE_TO,
  clearIncident,
  cover,
  dayCover,
  dayShare,
  makeRig,
  recordedDay,
} from './sun';
import { smoothstep } from './common';
import { createSky } from './land/sky';
import { createWallScene } from './wall/scene';
import { SKY_ROWS } from './wall/sky';
import {
  HILL_FEATHER_PX,
  HILL_HAZE_AT_FOOT,
  HILL_HAZE_FADE,
  HILL_LAYERS,
  HILL_STEPS,
  HILL_STRIDE,
  SIGHT_BOULDERS,
  buildHills,
  hillGeometry,
  wallBoulders,
} from './wall/land';
import { stateWith, view } from './test-utils';

// Round 5 of the wall world (docs/3d.md, « Round 5 »): the grey cover of a dull recorded day is read from the day's own share of the clear day's radiation, from the day's first minute (R4-1: the dawn of the dull 24 December 1974 was a
// blue sky that flipped to grey in 24 frames at about 09:00); the first sight stone stands away from the stool (R4-5); the ridge has a haze gradient and a two-pixel feather (R4-3).

const noon = (over: Partial<HouseState> = {}) => stateWith(over, { day: 355 } as never, 12);
/** A recorded day's state at an hour, by its date: only what the 3D reads of the engine's state. */
const recordedState = (date: string, hour: number, alt: number, over: Partial<HouseState> = {}): HouseState => {
  const row = recordedDay(date)!;
  return { ...noon(), recordDate: date, dayOfYear: row.day, hour, sunAltitude: alt, incidentWm2: 0, ...over };
};

/** A simulation of the recorded Christmas 1974 run to a date and an hour, as the film's warm-up runs it (the picture does not see these hours). */
function christmas(date: string, hour: number): HouseSim {
  const sim = new HouseSim();
  sim.applyScenario('christmas-1974');
  sim.set({ running: true, timeScale: 14400 } as never);
  for (let i = 0; i < 4000; i++) {
    const s = sim.state;
    if (s.recordDate === date && s.hour >= hour) break;
    sim.step(0.25);
  }
  return sim;
}

describe('the cover of a recorded day is its own share of the clear day, from its first minute', () => {
  it('a recorded day’s share is the table’s total over the clear day’s, known from 00:00; no other sky has one', () => {
    // the 24 December 1974, 1.134 MJ/m² against a clear day of 20.3: a twentieth; the days either side are clear
    expect(recordedDay('24/12')!.incident).toBeCloseTo(1.134, 3);
    const first = recordedState('24/12', 0.02, -70);
    expect(dayShare(first)!).toBeGreaterThan(0.05);
    expect(dayShare(first)!).toBeLessThan(0.06);
    expect(dayShare(recordedState('23/12', 0.02, -70))!).toBeGreaterThan(1);
    expect(dayShare(recordedState('25/12', 0.02, -70))!).toBeGreaterThan(0.95);
    // the share is the day's: the same at midnight, at dawn and at noon
    for (const h of [0.02, 5, 7.8, 12, 17, 23.9]) expect(dayShare(recordedState('24/12', h, 0))).toBe(dayShare(first));
    // a sky that is not a recorded one has no table, and a date that is in none says nothing
    expect(dayShare(noon())).toBeNull();
    expect(dayCover(noon())).toBeNull();
    expect(dayShare({ ...noon(), recordDate: '32/13' })).toBeNull();
    // every date of every record is found, and found once
    for (const days of Object.values(RECORDS)) for (const d of days) expect(recordedDay(d.date)!.day).toBe(d.day);
  });

  it('the dull day’s dawn is already a cover (it was null under 11° of sun, and the sky kept the day before’s); a clear day’s dawn is not', () => {
    // 24 December: at every hour of the day, with the sun under the model’s ridge, at the horizon, in the night
    for (const [h, alt] of [
      [0.02, -70],
      [5, -26],
      [6.77, -8],
      [7.2, -3.3],
      [7.83, 1.9],
      [8.5, 8.6],
      [9, 12],
      [12, 24],
      [17, -5],
      [22, -59],
    ] as const) {
      const dull = recordedState('24/12', h, alt, { incidentWm2: alt > 0 ? 30 : 0 });
      expect(cover(dull), `24/12 ${h} h`).toBeGreaterThan(0.99);
      // the clear days round it
      expect(cover(recordedState('23/12', h, alt)), `23/12 ${h} h`).toBe(0);
      expect(cover(recordedState('25/12', h, alt)), `25/12 ${h} h`).toBe(0);
    }
    // a sky with no table is read as before: null at the dawn and in the night, whatever the irradiance
    expect(cover(stateWith({ incidentWm2: 28 }, { day: 355 } as never, 7.7))).toBeNull();
    expect(cover(stateWith({}, { day: 355 } as never, 2))).toBeNull();
  });

  it('it agrees with the reading it replaces where that reading was right: the state’s irradiance against the clear sky’s at the noon of every recorded day (within 0.15)', () => {
    let worst = 0;
    let n = 0;
    for (const id of Object.keys(RECORDS) as RecordId[]) {
      const sim = new HouseSim();
      sim.applyScenario('christmas-1974');
      sim.set({ record: id, sky: 'recorded', running: true, timeScale: 14400 } as never);
      for (const d of RECORDS[id]) {
        for (let i = 0; i < 4000; i++) {
          const s = sim.state;
          if (s.recordDate === d.date && s.hour >= 12) break;
          sim.step(0.25);
        }
        const s = sim.state;
        expect(s.recordDate).toBe(d.date);
        // the instant’s reading, as round 4 had it at a noon (the sun is 24° to 71° over the horizon: past its gate)
        const instant = 1 - smoothstep(COVER_SHARE_FROM, COVER_SHARE_TO, s.incidentWm2 / clearIncident(s));
        const byDay = dayCover(s)!;
        worst = Math.max(worst, Math.abs(byDay - instant));
        // a clear or a dull day is the same to the pixel: 0 or 1 in both
        if (instant < 0.02 || instant > 0.98) expect(Math.abs(byDay - instant), `${d.date} (${id})`).toBeLessThan(0.02);
        n++;
      }
    }
    expect(n).toBe(Object.values(RECORDS).reduce((a, days) => a + days.length, 0));
    expect(worst).toBeLessThan(0.15);
    // and the three days of the Short are the ones round 4 measured: 24 December 1, the days either side 0
    const s24 = christmas('24/12', 12).state;
    expect(dayCover(s24)).toBeGreaterThan(0.99);
    expect(cover(s24)).toBeGreaterThan(0.99);
  });
});

describe('the Short’s morning: from 23 December 04:00 at ×4 000, the wall’s sky is grey from the first light of the dull day and blue from the first light of the clear ones, and nothing changes in the light', () => {
  interface Frame {
    date: string;
    hour: number;
    alt: number;
    cover: number;
    target: number;
    /** the sky’s top row and its horizon row, as the screen shows them */
    top: number[];
    hor: number[];
  }
  const frames: Frame[] = [];
  const states = new Map<string, HouseState>();
  const night: Record<string, number[]> = {};

  beforeAll(() => {
    const sim = christmas('23/12', 4);
    sim.set({ timeScale: 4000 } as never);
    const wall = createWallScene();
    const rig = makeRig(new THREE.Scene(), { half: 4 });
    const rows = (): { top: number[]; hor: number[] } => {
      const d = (wall.scene.background as THREE.DataTexture).image.data as Uint8Array;
      const at = (j: number) => [d[j * 4]!, d[j * 4 + 1]!, d[j * 4 + 2]!];
      return { top: at(SKY_ROWS - 1), hor: at(Math.round(0.34 * SKY_ROWS)) };
    };
    // the picture is built on the first frame at the clock the film starts at
    wall.update(sim.state, 1 / 30, view());
    for (let f = 0; f < 1500; f++) {
      sim.step(1 / 30);
      const s = sim.state;
      if (s.recordDate === '25/12' && s.hour > 10.5) break;
      wall.update(s, 1 / 30, view());
      rig.update(s, undefined, 1 / 30);
      const r = rows();
      frames.push({
        date: s.recordDate,
        hour: s.hour,
        alt: s.sunAltitude,
        cover: rig.cover,
        target: dayCover(s)!,
        ...r,
      });
      // 07:50, 08:55 and 09:40 of each of the days, to look at the dawn of
      for (const h of [5.5, 7.83, 8.92, 9.67]) {
        const key = `${s.recordDate} ${h}`;
        if (!states.has(key) && s.hour >= h) {
          states.set(key, { ...s });
          if (h === 5.5) night[s.recordDate] = [...r.top, ...r.hor];
        }
      }
    }
  }, 120000);

  const at = (date: string, h: number) => frames.find((f) => f.date === date && f.hour >= h)!;

  it('the run is the Short’s: three mornings, a clear 23rd, the dull 24th and a clear 25th', () => {
    expect(frames.length).toBeGreaterThan(1000);
    expect(new Set(frames.map((f) => f.date))).toEqual(new Set(['23/12', '24/12', '25/12']));
  });

  it('at 07:50 of the dull day the cover is whole, and the sky is further from blue than the clear mornings’ at the same sun; by 08:55 and 09:40 it is grey and even', () => {
    for (const h of [7.83, 8.92, 9.67]) {
      const dull = at('24/12', h);
      expect(dull.cover, `24/12 ${h}`).toBeGreaterThan(0.99);
      for (const day of ['23/12', '25/12']) {
        const clear = at(day, h);
        expect(clear.cover, `${day} ${h}`).toBeLessThan(0.01);
        // the same sun (the days differ by minutes of it), the dull day’s sky is less blue than the clear one’s
        expect(Math.abs(clear.alt - dull.alt)).toBeLessThan(0.6);
        expect(
          clear.top[2]! - clear.top[0]! - (dull.top[2]! - dull.top[0]!),
          `${day} ${h} blue excess`,
        ).toBeGreaterThan(h < 8 ? 25 : 60);
      }
    }
    // grey: no blue in the top row, the horizon within a few levels of the top, from 08:55 to 14:00 (the dusk comes back to blue after)
    for (const f of frames.filter((f) => f.date === '24/12' && f.hour >= 8.92 && f.hour <= 14)) {
      expect(f.top[2]! - f.top[0]!, `top ${f.hour.toFixed(2)}`).toBeLessThan(12);
      for (let k = 0; k < 3; k++) expect(Math.abs(f.hor[k]! - f.top[k]!), `${f.hour.toFixed(2)}`).toBeLessThan(25);
    }
  });

  it('the dull morning does not flip: the sky of the dull day is the grey it will be at noon, never the blue of the day before, from the first light on', () => {
    const dawn = frames.filter((f) => f.date === '24/12' && f.alt > -8);
    expect(dawn.length).toBeGreaterThan(100);
    // the cover is whole through the first light and after it (the base held the day before’s, 0, to 09:00 and flipped in 24 frames)
    for (const f of dawn) expect(f.cover, `${f.hour.toFixed(2)}`).toBeGreaterThan(0.99);
    // the sky never has the clear day’s blue in it at any frame of the morning: the top row’s blue excess stays 30 levels under the clear noon’s
    const noonTop = at('24/12', 11.9).top;
    const clearTop = at('25/12', 9.67).top;
    for (const f of dawn)
      expect(f.top[2]! - f.top[0]!, `${f.hour.toFixed(2)}`).toBeLessThan(clearTop[2]! - clearTop[0]! - 30);
    expect(noonTop[2]! - noonTop[0]!).toBeLessThan(12);
    // the largest step of the sky’s top row between two frames of the dull morning is the sun’s own rise (the follower’s limit, 12 levels), not a flip (the base’s was 26 levels in one frame at 09:00)
    let step = 0;
    for (let i = 1; i < dawn.length; i++)
      for (let k = 0; k < 3; k++) step = Math.max(step, Math.abs(dawn[i]!.top[k]! - dawn[i - 1]!.top[k]!));
    expect(step).toBeLessThanOrEqual(12);
  });

  it('a clear dawn stays blue: the 23rd’s and the 25th’s sky at 08:55 is the blue sky, the cover is 0, and the 25th’s is the 23rd’s to a level', () => {
    for (const day of ['23/12', '25/12']) {
      const f = at(day, 8.92);
      expect(f.cover).toBeLessThan(0.01);
      expect(f.top[2]! - f.top[0]!).toBeGreaterThan(60);
    }
    const a = at('23/12', 9.67);
    const b = at('25/12', 9.67);
    for (let k = 0; k < 3; k++) expect(Math.abs(a.top[k]! - b.top[k]!)).toBeLessThanOrEqual(2);
  });

  it('the cover is continuous in time: at most the share a frame’s ease allows, and it changes only in the night, where it cannot be seen', () => {
    // the ease is 2.5 a second at 30 frames a second: 8 % of the distance a frame (22 % at the longest frame)
    let big = 0;
    for (let i = 1; i < frames.length; i++) big = Math.max(big, Math.abs(frames[i]!.cover - frames[i - 1]!.cover));
    expect(big).toBeLessThan(0.09);
    // by the time the sun is up (the sky leaves its night at −8°) the cover is its day’s own: it moved in the dark, at midnight, from the day before’s
    for (const f of frames.filter((f) => f.alt > -8))
      expect(Math.abs(f.cover - f.target), `${f.date} ${f.hour.toFixed(2)}`).toBeLessThan(0.01);
    // and it moved: the day rolls at midnight and the cover was still the day before’s a few frames after it
    const roll = frames.findIndex((f) => f.date === '24/12');
    expect(frames[roll - 1]!.cover).toBeLessThan(0.01);
    expect(frames[roll + 2]!.cover).toBeGreaterThan(0);
    expect(frames[roll + 2]!.cover).toBeLessThan(0.3);
    // the sky’s rows did not move at all while it did: the night of a dull day equals the night of a clear one
    expect(night['24/12']).toEqual(night['25/12']);
    for (let k = 0; k < 6; k++) expect(Math.abs(night['24/12']![k]! - night['23/12']![k]!)).toBeLessThanOrEqual(1);
  });

  it('the plateau’s sky (site) is grey at the dull day’s dawn and blue at the clear one’s: its factor reads the same cover', () => {
    const dawnDull = states.get('24/12 7.83')!;
    const dawnClear = states.get('25/12 7.83')!;
    expect(dawnDull.sunAltitude).toBeGreaterThan(0);
    const u = createSky(new THREE.Scene());
    const read = (s: HouseState, cv: number) => {
      u.update(s, 0, 0, 1 - cv);
      return u.sky.material.uniforms.uOver!.value as number;
    };
    // the rig’s cover, as the run had it at these frames
    const cvDull = frames.find((f) => f.date === '24/12' && f.hour >= 7.83)!.cover;
    const cvClear = frames.find((f) => f.date === '25/12' && f.hour >= 7.83)!.cover;
    // the dome’s grey is the dawn’s own day factor under a cover and none under a clear sky
    const day = smoothstep((-7 * Math.PI) / 180, (3 * Math.PI) / 180, (dawnDull.sunAltitude * Math.PI) / 180);
    expect(read(dawnDull, cvDull)).toBeCloseTo(day, 2);
    expect(read(dawnClear, cvClear)).toBe(0);
  });
});

describe('the flip back to a clear day is as smooth: the cover leaves in the night, the dawn of the 25th is blue', () => {
  it('from the dull 24th’s noon to the clear 25th’s dawn at ×4 000 the cover only moves at night and no frame of the sky moves by more than the limit', () => {
    const sim = christmas('24/12', 12);
    sim.set({ timeScale: 4000 } as never);
    const wall = createWallScene();
    const rig = makeRig(new THREE.Scene(), { half: 4 });
    wall.update(sim.state, 1 / 30, view());
    const d = (wall.scene.background as THREE.DataTexture).image.data as Uint8Array;
    let prev: number[] | null = null;
    let worstRow = 0;
    let movedBy = 0;
    let lastCover = 1;
    for (let f = 0; f < 700; f++) {
      sim.step(1 / 30);
      const s = sim.state;
      if (s.recordDate === '25/12' && s.hour > 9.5) break;
      wall.update(s, 1 / 30, view());
      rig.update(s, undefined, 1 / 30);
      const now = Array.from(d.subarray(0, SKY_ROWS * 4));
      if (prev)
        for (let i = 0; i < now.length; i++)
          if (i % 4 !== 3) worstRow = Math.max(worstRow, Math.abs(now[i]! - prev[i]!));
      prev = now;
      if (Math.abs(rig.cover - lastCover) > 1e-9) {
        // it moves only with the sun well under the horizon: the sky has no cover in it there to show
        if (s.sunAltitude > -8) movedBy = Math.max(movedBy, Math.abs(rig.cover - lastCover));
        lastCover = rig.cover;
      }
    }
    // the sky’s own bound (the follower’s: 12 levels a channel in a frame, the dusk’s) held through the run, with the dusk of the dull day and the dawn of the clear one in it
    expect(worstRow).toBeLessThanOrEqual(12);
    expect(movedBy).toBeLessThan(0.01);
    expect(rig.cover).toBeLessThan(0.01);
  }, 120000);
});

describe('the first sight stone stands away from the stool (R4-5)', () => {
  const home = (w: number, h: number, wall: ReturnType<typeof createWallScene>): THREE.PerspectiveCamera => {
    const c = new THREE.PerspectiveCamera(40, w / h, 0.02, 120);
    c.position.copy(wall.home!.position);
    c.lookAt(wall.home!.target);
    c.updateMatrixWorld(true);
    return c;
  };
  const px = (c: THREE.Camera, v: THREE.Vector3, w: number, h: number): [number, number] => {
    const p = v.clone().project(c);
    return [((p.x + 1) / 2) * w, ((1 - p.y) / 2) * h];
  };

  it('from the home camera at 1280 and 390 px, it is clear of the stool by more than the stool is tall, and of the other stones', () => {
    const wall = createWallScene();
    wall.update(noon(), 1 / 30, view());
    wall.scene.updateMatrixWorld(true);
    const stool = wall.scene.getObjectByName('lived-in')!.children[0]!;
    const seat = new THREE.Box3().setFromObject(stool).getCenter(new THREE.Vector3());
    const list = wallBoulders();
    for (const [w, h, clear] of [
      [1280, 720, 60],
      [390, 844, 45],
    ] as const) {
      const c = home(w, h, wall);
      const s = px(c, seat, w, h);
      const first = list[0]!;
      const b = px(c, new THREE.Vector3(first.x, -1.3 + first.r * 0.6, first.z), w, h);
      expect(Math.hypot(b[0] - s[0], b[1] - s[1]), `${w} px`).toBeGreaterThan(clear);
    }
  });

  it('the film’s pose is kept: the four stones in the Short’s sight stand on the line of the camera, where they stood, nearer or farther along it', () => {
    // the Short’s camera (P1) and the bearings of the four from it in round 4: 21.4°, 24.4°, 21.7°, 22.4° off west
    const was = [
      { x: -5.5, z: -3.4 },
      { x: -12, z: -5.4 },
      { x: -24, z: -9.6 },
      { x: -35, z: -14.5 },
    ];
    const list = wallBoulders();
    expect(SIGHT_BOULDERS).toBe(4);
    const bearing = (p: { x: number; z: number }) => (Math.atan2(p.z - 0.3, p.x - 3.95) * 180) / Math.PI;
    for (let i = 0; i < 4; i++) expect(Math.abs(bearing(list[i]!) - bearing(was[i]!)), `stone ${i}`).toBeLessThan(0.6);
    // they are still a column that recedes, each farther than the one before, and none inside the room’s yard
    const dist = (p: { x: number; z: number }) => Math.hypot(p.x - 3.95, p.z - 0.3);
    for (let i = 1; i < 4; i++) expect(dist(list[i]!)).toBeGreaterThan(dist(list[i - 1]!) + 3);
    expect(dist(list[0]!)).toBeGreaterThan(12);
  });
});

describe('the ridge has a haze gradient and a two-pixel feather (R4-3)', () => {
  it('a third of a degree a sample, three vertices to a sample (the foot, the crest, the skirt that stands at the crest)', () => {
    expect(360 / HILL_STEPS).toBeLessThanOrEqual(0.34);
    const g = hillGeometry();
    const p = g.attributes.position as THREE.BufferAttribute;
    const k = g.attributes.aK as THREE.BufferAttribute;
    expect(p.count).toBe(HILL_LAYERS.length * (HILL_STEPS + 1) * HILL_STRIDE);
    for (let i = 0; i < p.count; i += HILL_STRIDE * 37) {
      expect([k.getX(i), k.getX(i + 1), k.getX(i + 2)]).toEqual([0, 1, 2]);
      // the skirt is the crest’s own point: the shader lifts it by the feather’s width on the screen
      for (const c of ['getX', 'getY', 'getZ'] as const) expect(p[c](i + 2)).toBe(p[c](i + 1));
    }
    // and the triangles: the body and the skirt, two each a sample, a layer
    expect(g.index!.count / 3).toBe(HILL_LAYERS.length * HILL_STEPS * 4);
  });

  it('the hills are drawn over the ground and the element, depth-tested, and before the glass and the shafts; the feather is two pixels of the picture whatever the buffer', () => {
    const hills = buildHills();
    const m = hills.material;
    expect(m.transparent).toBe(true);
    expect(m.depthWrite).toBe(false);
    expect(m.depthTest).toBe(true);
    expect(hills.mesh.renderOrder).toBeLessThan(0);
    // the width in clip units over w: HILL_FEATHER_PX pixels of a canvas of this height (the full range of clip y is 2)
    expect(HILL_FEATHER_PX).toBe(2);
    for (const height of [720, 960, 1920, 2532]) {
      hills.mesh.onBeforeRender(
        { domElement: { height } } as never,
        null as never,
        null as never,
        null as never,
        null as never,
        null as never,
      );
      expect(m.uniforms.uFeather!.value).toBeCloseTo((HILL_FEATHER_PX * 2) / height, 9);
    }
    // the shaders: the skirt is lifted by it, and its alpha runs 1 at the crest to 0; the body goes into the haze below the crest
    expect(m.vertexShader).toContain('gl_Position.y += uFeather * gl_Position.w');
    expect(m.vertexShader).toContain('vAlpha = aK > 1.5 ? 0.0 : 1.0');
    expect(m.fragmentShader).toContain('gl_FragColor = vec4( body, vAlpha )');
    expect(m.fragmentShader).toContain('uAtFoot * smoothstep( 0.0, uFade, vDepth )');
    expect(m.uniforms.uFade!.value).toBe(HILL_HAZE_FADE);
    expect(m.uniforms.uAtFoot!.value).toBe(HILL_HAZE_AT_FOOT);
    // a degree and a half to two degrees, most of the way into the haze
    expect((Math.atan(HILL_HAZE_FADE) * 180) / Math.PI).toBeGreaterThan(1.4);
    expect((Math.atan(HILL_HAZE_FADE) * 180) / Math.PI).toBeLessThan(2.1);
    expect(HILL_HAZE_AT_FOOT).toBeGreaterThan(0.7);
    expect(HILL_HAZE_AT_FOOT).toBeLessThan(1);
  });
});
