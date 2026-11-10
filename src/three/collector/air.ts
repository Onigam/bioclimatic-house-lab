import * as THREE from 'three';
import { softDotTexture } from '../common';
import type { ElementLayout, ElementSpec } from '../dims';
import { heatColor } from '../heat';
import type { HouseState } from '../../sim/types';

// The air as the model moves it. Dots on the loop of each bay, at the model's speeds: the gap's (`gapSpeed`, about 13 cm/s at 20 L/s) and the duct's (`ductSpeed`, 32 cm/s), signed, so that a night's reverse flow turns
// them round. The path is the winter loop (room, lower duct, up the gap, upper duct, room) or the summer's (room, lower duct, up the gap, out by the head), by the flap. No dot goes faster on screen than the cap: the eye
// reads them. Every motion takes `view.slowMo`, and `dt = 0` moves nothing. Their colour is the model's air temperature along the way, on the lab's one ramp.

/** m/s on screen at most. */
export const AIR_VISUAL_CAP = 0.9;
/** The room's slow turning, m/s: a decoration, the model has no room flow field. estimate */
export const ROOM_SPEED = 0.16;

type Kind = 'room' | 'duct' | 'gap' | 'out';

interface Run {
  pts: THREE.Vector3[];
  kind: Kind[];
  cum: number[];
  length: number;
}

function makeRun(pts: THREE.Vector3[], kind: Kind[]): Run {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1]! + pts[i]!.distanceTo(pts[i - 1]!));
  return { pts, kind, cum, length: cum[cum.length - 1]! };
}

/** The two loops of one bay in the element's frame (x = 0). The room part sweeps out from the upper duct and falls back to the floor return, 1.3 m into the room. */
export function loopRuns(L: ElementLayout, s: ElementSpec): { winter: Run; summer: Run } {
  const zGap = (L.lastBack + L.face) / 2;
  const yL = L.yDuctLow;
  const yU = L.yDuctHigh;
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const reach = L.inner - 1.3;
  const winter = makeRun(
    [
      V(0, yL, L.inner - 0.9),
      V(0, yL, L.inner),
      V(0, yL, L.face),
      V(0, yL, zGap),
      V(0, yU, zGap),
      V(0, yU, L.face),
      V(0, yU, L.inner),
      V(0, yU - 0.05, L.inner - 0.55),
      V(0, yU - 0.5, reach),
      V(0, 1.6, reach - 0.1),
      V(0, 0.6, reach),
      V(0, yL + 0.05, L.inner - 0.9),
    ],
    ['room', 'duct', 'duct', 'gap', 'duct', 'duct', 'room', 'room', 'room', 'room', 'room'],
  );
  void s;
  const summer = makeRun(
    [
      V(0, yL, L.inner - 0.9),
      V(0, yL, L.inner),
      V(0, yL, L.face),
      V(0, yL, zGap),
      V(0, L.yTop - 0.15, zGap),
      V(0, L.yTop - 0.15, 0.0),
      V(0, L.yTop + 0.6, 0.12),
    ],
    ['room', 'duct', 'duct', 'gap', 'gap', 'out'],
  );
  return { winter, summer };
}

interface Dot {
  bay: number;
  /** Fraction of the run, 0 to 1. */
  u: number;
  a: number;
  b: number;
  i: number;
}

export class AirFlow {
  readonly group = new THREE.Group();
  readonly points: THREE.Points;
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private readonly geo = new THREE.BufferGeometry();
  private readonly dots: Dot[] = [];
  private runs: { winter: Run; summer: Run };
  private readonly tmp = new THREE.Vector3();
  private readonly c = new THREE.Color();
  /** What was last drawn: speeds on screen, for the tests. */
  drawn = { gap: 0, duct: 0, summer: false };

  constructor(
    private readonly bays: readonly number[],
    perBay: number,
    L: ElementLayout,
    s: ElementSpec,
    size = 5,
  ) {
    this.group.name = 'air-flow';
    this.runs = loopRuns(L, s);
    const n = bays.length * perBay;
    this.pos = new Float32Array(n * 3);
    this.col = new Float32Array(n * 3);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('color', new THREE.BufferAttribute(this.col, 3));
    this.geo.setDrawRange(0, n);
    let k = 0;
    for (let b = 0; b < bays.length; b++) {
      for (let i = 0; i < perBay; i++) {
        // a fixed scatter for each dot
        const a = Math.sin(k * 12.9898 + 1.3) * 43758.5453;
        const c = Math.sin(k * 78.233 + 4.1) * 12543.123;
        this.dots.push({
          bay: b,
          u: (i + 0.5) / perBay,
          a: (a - Math.floor(a)) * 2 - 1,
          b: (c - Math.floor(c)) * 2 - 1,
          i: k,
        });
        k++;
      }
    }
    const mat = new THREE.PointsMaterial({
      size,
      sizeAttenuation: false,
      map: softDotTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
      depthTest: false,
      fog: false,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    this.points.renderOrder = 20;
    this.points.userData.noShadow = true;
    this.points.userData.notClipped = true;
    this.points.raycast = () => {};
    this.group.add(this.points);
    this.group.visible = false;
  }

  /** The element was laid out again (thickness, gap, ducts): the loop follows. */
  relayout(L: ElementLayout, s: ElementSpec): void {
    this.runs = loopRuns(L, s);
  }

  private segment(run: Run, d: number): number {
    let lo = 0;
    let hi = run.cum.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (run.cum[mid]! <= d) lo = mid;
      else hi = mid;
    }
    return lo;
  }

  /** Air temperature along the path, by the stretch it is on (the indexes of `loopRuns`). */
  private temperature(s: HouseState, seg: number, t: number, summer: boolean): number {
    if (seg <= 2) return s.tGapIn;
    if (seg === 3) return s.tGapIn + (s.tGapOut - s.tGapIn) * t;
    if (summer || seg <= 5) return s.tGapOut;
    // the jet cools towards the room's air as it goes
    const f = Math.min(1, (seg - 6 + t) / 3);
    return s.tGapOut + (s.tRoom - s.tGapOut) * f;
  }

  /** `dt` in real seconds; `slowMo` the view's. */
  update(s: HouseState, dt: number, slowMo: number, show: boolean): void {
    this.group.visible = show;
    if (!show) return;
    const summer = s.flapOpen > 0.5;
    this.drawn.summer = summer;
    const run = summer ? this.runs.summer : this.runs.winter;
    const dir = s.flowDir === 0 ? 0 : Math.sign(s.gapSpeed || s.flowDir);
    const vGap = Math.min(AIR_VISUAL_CAP, Math.abs(s.gapSpeed));
    const vDuct = Math.min(AIR_VISUAL_CAP, Math.abs(s.ductSpeed));
    this.drawn.gap = vGap;
    this.drawn.duct = vDuct;
    for (const dot of this.dots) {
      let d = dot.u * run.length;
      const seg0 = this.segment(run, Math.min(d, run.length - 1e-6));
      const k0 = run.kind[seg0]!;
      const v = k0 === 'gap' ? vGap : k0 === 'duct' ? vDuct : k0 === 'out' ? vDuct : ROOM_SPEED;
      d += dir * v * dt * slowMo;
      if (d >= run.length) d -= run.length;
      if (d < 0) d += run.length;
      dot.u = d / run.length;
      const seg = this.segment(run, Math.min(d, run.length - 1e-6));
      const a = run.pts[seg]!;
      const b = run.pts[seg + 1]!;
      const t = (d - run.cum[seg]!) / Math.max(1e-6, run.cum[seg + 1]! - run.cum[seg]!);
      this.tmp.lerpVectors(a, b, t);
      const kind = run.kind[seg]!;
      // stray across the channel: the gap is 12 cm deep and 1.2 m wide, a duct 11 cm by 56 cm, the room's stream a few tens of cm
      const wx = kind === 'room' ? 0.25 : kind === 'gap' ? 0.5 : 0.22;
      const wz = kind === 'gap' ? 0.04 : 0.0;
      const wy = kind === 'duct' ? 0.04 : kind === 'room' ? 0.12 : 0.0;
      const horizontal = Math.abs(b.y - a.y) < Math.abs(b.z - a.z);
      const k = dot.i * 3;
      this.pos[k] = this.bays[dot.bay]! + this.tmp.x + dot.a * wx;
      this.pos[k + 1] = this.tmp.y + (horizontal ? dot.b * wy : 0);
      this.pos[k + 2] = this.tmp.z + (horizontal ? 0 : dot.b * wz);
      heatColor(this.temperature(s, seg, t, summer), this.c);
      this.col[k] = this.c.r;
      this.col[k + 1] = this.c.g;
      this.col[k + 2] = this.c.b;
    }
    (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }
}
