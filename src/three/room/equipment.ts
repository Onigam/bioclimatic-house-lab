import * as THREE from 'three';
import { joined, polyShape, stick, tubeGeometry, uvMetric } from '../common';
import { CEILING, ROOM, Z_NORTH_IN, elementLayout, type ElementSpec } from '../dims';
import { bx } from '../house/geo';
import { heatColor } from '../heat';
import type { Mats } from '../materials';
import { plain } from '../materials';

// The instruments and equipment of the living room, each a part: the electric heater and its panel, the thermostat at 1.50 m, the probes of the air and the surfaces, the chart recorder, the fresh-air vent, the inner face of
// the wall, and the two streams of the loop (the warm jet from the upper duct and the cool return at the floor). Positions are in the house frame; the wall's face and the ducts are the element's, in `src/three/collector`.

const part = (g: THREE.BufferGeometry, m: THREE.Material, cast = true): THREE.Mesh => {
  const o = new THREE.Mesh(g, m);
  o.castShadow = cast;
  o.receiveShadow = true;
  return o;
};
const cyl = (r0: number, r1: number, h: number, seg = 12): THREE.BufferGeometry =>
  uvMetric(new THREE.CylinderGeometry(r0, r1, h, seg));
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);

/** Where things stand on the north wall (x along it): estimates. */
export const AT = {
  heaterX: -0.6,
  panelX: 0.55,
  thermostatX: 1.05,
  ventX: 1.55,
  /** The recorder's desk and the recorder, on the south wall's side, east of the entrance, by the sample element's junction box. */
  desk: { x0: 0.9, x1: 1.5, z1: 2.5, depth: 0.58 },
  /** The ceiling hook of the air probe. */
  probe: { x: 0.8, z: 0.7 },
} as const;

export interface HeaterBuild {
  group: THREE.Group;
  /** The glowing slot: emissive follows the model's electricity. */
  slot: THREE.MeshStandardMaterial;
  cord: THREE.Mesh;
}

/** An electric convector: a white steel case on two brackets, a slotted top, a front grille, a dial, a lamp. */
export function buildHeater(mats: Mats): HeaterBuild {
  const group = new THREE.Group();
  group.name = 'electric-heater';
  const h = ROOM.heater;
  const x = AT.heaterX;
  const zb = Z_NORTH_IN;
  const case_ = new THREE.Mesh(uvMetric(new THREE.BoxGeometry(h.w, h.h, h.d)), plain(0xe6e3da, 0.45));
  case_.position.set(x, h.y + h.h / 2, zb + h.d / 2 + 0.02);
  case_.castShadow = true;
  group.add(case_);
  // front grille: horizontal slots on the face, as thin dark bars
  const bars: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 9; k++)
    bars.push(
      bx(
        x - h.w / 2 + 0.05,
        h.y + 0.05 + k * 0.045,
        zb + h.d + 0.019,
        x + h.w / 2 - 0.05,
        h.y + 0.058 + k * 0.045,
        zb + h.d + 0.024,
      ),
    );
  group.add(part(joined(bars), plain(0x3a3a3a, 0.6), false));
  // top slot, the glow, and the side dial
  const slot = new THREE.MeshStandardMaterial({
    color: 0x2a1a14,
    emissive: 0xff5a1f,
    emissiveIntensity: 0,
    roughness: 0.5,
  });
  slot.userData = { noShare: true };
  const top = new THREE.Mesh(uvMetric(new THREE.BoxGeometry(h.w - 0.1, 0.004, 0.04)), slot);
  top.position.set(x, h.y + h.h + 0.001, zb + 0.06);
  group.add(top);
  const dial = new THREE.Mesh(cyl(0.025, 0.025, 0.02, 14), plain(0x1a1a1a, 0.5));
  dial.rotation.x = Math.PI / 2;
  dial.position.set(x + h.w / 2 - 0.07, h.y + h.h - 0.08, zb + h.d + 0.03);
  group.add(dial);
  // brackets on the wall: two plates, and two feet
  group.add(
    part(
      joined([
        bx(x - 0.3, h.y + 0.08, zb, x - 0.26, h.y + 0.38, zb + 0.022),
        bx(x + 0.26, h.y + 0.08, zb, x + 0.3, h.y + 0.38, zb + 0.022),
      ]),
      mats.steel,
    ),
  );
  group.add(
    part(
      joined([bx(x - 0.4, 0, zb + 0.02, x - 0.34, h.y, zb + 0.1), bx(x + 0.34, 0, zb + 0.02, x + 0.4, h.y, zb + 0.1)]),
      plain(0xcfccc2, 0.5),
    ),
  );
  // the supply: a conduit from the heater's end up to the panel, with clips
  const cord = new THREE.Mesh(
    tubeGeometry(
      [
        V(x + h.w / 2, h.y + 0.25, zb + 0.02),
        V(x + h.w / 2 + 0.14, h.y + 0.25, zb + 0.02),
        V(AT.panelX - 0.1, h.y + 0.25, zb + 0.02),
        V(AT.panelX - 0.1, ROOM.panel.y, zb + 0.02),
      ],
      0.009,
      40,
      6,
    ),
    plain(0xd9d4c4, 0.6),
  );
  cord.castShadow = false;
  group.add(cord);
  return { group, slot, cord };
}

export interface PanelBuild {
  group: THREE.Group;
  lamp: THREE.MeshStandardMaterial;
}

/** The electric panel: a grey enclosure on the wall, a door with its handle, a row of breakers, two lamps. */
export function buildPanel(mats: Mats): PanelBuild {
  const group = new THREE.Group();
  group.name = 'electric-panel';
  const p = ROOM.panel;
  const x = AT.panelX;
  const zb = Z_NORTH_IN;
  group.add(part(bx(x - p.w / 2, p.y, zb, x + p.w / 2, p.y + p.h, zb + p.d), plain(0xcfd1cf, 0.5)));
  group.add(
    part(
      bx(x - p.w / 2 + 0.02, p.y + 0.02, zb + p.d, x + p.w / 2 - 0.02, p.y + p.h - 0.02, zb + p.d + 0.008),
      plain(0xb9bbb7, 0.45),
    ),
  );
  group.add(
    part(
      bx(
        x + p.w / 2 - 0.06,
        p.y + p.h / 2 - 0.03,
        zb + p.d + 0.008,
        x + p.w / 2 - 0.045,
        p.y + p.h / 2 + 0.03,
        zb + p.d + 0.02,
      ),
      mats.steelDark,
    ),
  );
  const br: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 5; k++)
    br.push(
      bx(
        x - p.w / 2 + 0.04 + k * 0.04,
        p.y + 0.06,
        zb + p.d + 0.008,
        x - p.w / 2 + 0.07 + k * 0.04,
        p.y + 0.14,
        zb + p.d + 0.016,
      ),
    );
  group.add(part(joined(br), plain(0x2a2a2a, 0.5), false));
  const lamp = new THREE.MeshStandardMaterial({
    color: 0x1c2a1c,
    emissive: 0x33ff66,
    emissiveIntensity: 0,
    roughness: 0.4,
  });
  lamp.userData = { noShare: true };
  const l1 = new THREE.Mesh(cyl(0.01, 0.01, 0.01, 10), lamp);
  l1.rotation.x = Math.PI / 2;
  l1.position.set(x - 0.08, p.y + p.h - 0.07, zb + p.d + 0.012);
  group.add(l1);
  const red = new THREE.Mesh(cyl(0.01, 0.01, 0.01, 10), plain(0x6a1a1a, 0.4));
  red.rotation.x = Math.PI / 2;
  red.position.set(x - 0.045, p.y + p.h - 0.07, zb + p.d + 0.012);
  group.add(red);
  // the mains in: a short flexible up the wall to the ceiling
  group.add(
    part(
      tubeGeometry(
        [
          V(x + 0.05, p.y + p.h, zb + 0.04),
          V(x + 0.05, p.y + p.h + 0.3, zb + 0.02),
          V(x + 0.05, CEILING - 0.02, zb + 0.02),
        ],
        0.011,
        12,
        6,
      ),
      plain(0x1d1d1d, 0.7),
      false,
    ),
  );
  return { group, lamp };
}

export interface ThermostatBuild {
  group: THREE.Group;
  led: THREE.MeshStandardMaterial;
  needle: THREE.Mesh;
}

/** The thermostat, at 1.50 m: a round case, a ring with its marks, a needle for the setpoint and a lamp that lights when the heater is on. */
export function buildThermostat(): ThermostatBuild {
  const group = new THREE.Group();
  group.name = 'thermostat';
  const x = AT.thermostatX;
  const zb = Z_NORTH_IN;
  const y = ROOM.thermostat;
  const base = new THREE.Mesh(cyl(0.055, 0.055, 0.03, 24), plain(0xe8e4d8, 0.5));
  base.rotation.x = Math.PI / 2;
  base.position.set(x, y, zb + 0.015);
  base.castShadow = true;
  group.add(base);
  const dial = new THREE.Mesh(cyl(0.045, 0.045, 0.004, 24), plain(0xf6f3ea, 0.5));
  dial.rotation.x = Math.PI / 2;
  dial.position.set(x, y, zb + 0.032);
  group.add(dial);
  const marks: THREE.BufferGeometry[] = [];
  for (let k = 0; k <= 10; k++) {
    const a = (-135 + k * 27) * (Math.PI / 180);
    const g = new THREE.BoxGeometry(0.0025, k % 5 === 0 ? 0.011 : 0.006, 0.0006);
    g.translate(0, 0.036, 0);
    g.rotateZ(-a);
    g.translate(x, y, zb + 0.0345);
    marks.push(g);
  }
  group.add(part(joined(marks), plain(0x2a2a2a, 0.6), false));
  const needleG = new THREE.BoxGeometry(0.004, 0.034, 0.001);
  needleG.translate(0, 0.017, 0);
  const needle = new THREE.Mesh(needleG, plain(0xb23a2a, 0.5));
  needle.position.set(x, y, zb + 0.0352);
  group.add(needle);
  const led = new THREE.MeshStandardMaterial({
    color: 0x2a1a14,
    emissive: 0xff7a2a,
    emissiveIntensity: 0,
    roughness: 0.4,
  });
  led.userData = { noShare: true };
  const lamp = new THREE.Mesh(cyl(0.004, 0.004, 0.003, 10), led);
  lamp.rotation.x = Math.PI / 2;
  lamp.position.set(x + 0.03, y - 0.03, zb + 0.0355);
  group.add(lamp);
  // its wire to the panel, along the wall
  group.add(
    part(
      tubeGeometry(
        [
          V(x - 0.055, y - 0.01, zb + 0.012),
          V(x - 0.1, y - 0.04, zb + 0.012),
          V(AT.panelX + ROOM.panel.w / 2, y - 0.04, zb + 0.012),
        ],
        0.0035,
        12,
        5,
      ),
      plain(0x1d1d1d, 0.7),
      false,
    ),
  );
  return { group, led, needle };
}

/** The air's probe: a double cup of aluminium on a cord from the ceiling, 1.5 m up, and a cable on to the south wall's junction box. */
export function buildAirProbe(mats: Mats, boxTop: THREE.Vector3): THREE.Group {
  const g = new THREE.Group();
  g.name = 'room-air-probe';
  const { x, z } = AT.probe;
  const y = ROOM.thermostat;
  const shield: THREE.BufferGeometry[] = [];
  const cup = new THREE.CylinderGeometry(0.03, 0.026, 0.07, 14, 1, true);
  cup.translate(x, y, z);
  shield.push(cup);
  const cup2 = new THREE.CylinderGeometry(0.04, 0.036, 0.08, 14, 1, true);
  cup2.translate(x, y, z);
  shield.push(cup2);
  const cap = new THREE.CylinderGeometry(0.043, 0.043, 0.006, 14);
  cap.translate(x, y + 0.043, z);
  shield.push(cap);
  const mat = mats.alu.clone();
  mat.side = THREE.DoubleSide;
  mat.userData = { noShare: true };
  g.add(part(joined(shield), mat));
  // hung from a small hook in the ceiling by its cable, which goes on along the ceiling and down the wall to the box
  const hook = V(x, CEILING - 0.003, z);
  g.add(part(joined([stick(V(x, y + 0.043, z), hook, 0.0018, 6)]), plain(0x1d1d1d, 0.6), false));
  g.add(part(joined([stick(V(x - 0.012, CEILING, z), V(x + 0.012, CEILING, z), 0.006, 6)]), mats.steel, false));
  const run = tubeGeometry(
    [
      hook,
      V(x + 0.15, CEILING - 0.012, z + 0.5),
      V(boxTop.x - 0.1, CEILING - 0.012, boxTop.z - 0.0),
      V(boxTop.x - 0.1, CEILING - 0.3, boxTop.z),
      V(boxTop.x - 0.03, boxTop.y + 0.6, boxTop.z),
      V(boxTop.x, boxTop.y, boxTop.z),
    ],
    0.0028,
    60,
    5,
  );
  g.add(part(run, plain(0x1d1d1d, 0.6), false));
  return g;
}

/** Three black thermistors for the surfaces' own temperature: two on the wall's face, one on the floor, each with its lead to the recorder. */
export function buildSurfaceProbes(zInner: number, desk: THREE.Vector3): THREE.Group {
  const g = new THREE.Group();
  g.name = 'room-surface-probes';
  const black = plain(0x151515, 0.5);
  const discs: THREE.BufferGeometry[] = [];
  const leads: THREE.BufferGeometry[] = [];
  const add = (p: THREE.Vector3, normal: THREE.Vector3) => {
    const d = new THREE.CylinderGeometry(0.022, 0.022, 0.006, 14);
    d.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), normal));
    d.translate(p.x + normal.x * 0.003, p.y + normal.y * 0.003, p.z + normal.z * 0.003);
    discs.push(d);
  };
  // on the wall's face
  const w1 = V(1.15, 1.2, zInner - 0.0);
  const w2 = V(1.15, 2.9, zInner - 0.0);
  add(w1, V(0, 0, -1));
  add(w2, V(0, 0, -1));
  // on the floor
  const f1 = V(1.1, 0.0, 1.55);
  add(f1, V(0, 1, 0));
  const lead = (pts: THREE.Vector3[]) => leads.push(tubeGeometry(pts, 0.0016, 24, 4));
  lead([
    w1.clone().add(V(0, 0, -0.004)),
    V(1.15, 1.1, zInner - 0.006),
    V(1.15, 0.95, zInner - 0.012),
    V(desk.x - 0.1, desk.y, desk.z),
  ]);
  lead([
    w2.clone().add(V(0, 0, -0.004)),
    V(1.14, 2.4, zInner - 0.006),
    V(1.13, 1.2, zInner - 0.012),
    V(desk.x - 0.12, desk.y, desk.z),
  ]);
  lead([
    f1.clone().add(V(0, 0.003, 0)),
    V(1.1, 0.003, 1.9),
    V(1.0, 0.003, 2.0),
    V(0.93, 0.5, 2.1),
    V(desk.x - 0.14, desk.y, desk.z),
  ]);
  g.add(part(joined(discs), black, false));
  g.add(part(joined(leads), plain(0x2b2b2b, 0.6), false));
  return g;
}

export interface RecorderBuild {
  group: THREE.Group;
  /** The pen carriage, moves along the paper by the inner face's temperature. */
  carriage: THREE.Object3D;
  paper: THREE.Mesh;
  /** Where its input cable arrives, in the house frame. */
  inputTop: THREE.Vector3;
}

/** The desk and the chart recorder on it: a grey case, a window with the paper's roll behind a strip of chart, a pen on a rail. */
export function buildRecorder(mats: Mats, zInner: number): RecorderBuild {
  const group = new THREE.Group();
  group.name = 'chart-recorder';
  const { x0, x1, z1, depth } = AT.desk;
  const dz0 = z1 - depth;
  // the desk
  const desk: THREE.BufferGeometry[] = [bx(x0, 0.72, dz0, x1, 0.75, z1)];
  for (const sx of [x0 + 0.04, x1 - 0.04])
    for (const sz of [dz0 + 0.04, z1 - 0.04]) desk.push(bx(sx - 0.025, 0, sz - 0.025, sx + 0.025, 0.72, sz + 0.025));
  desk.push(bx(x0 + 0.04, 0.15, dz0 + 0.02, x1 - 0.04, 0.17, dz0 + 0.04));
  // a drawer
  desk.push(bx(x0 + 0.1, 0.6, dz0 + 0.0, x1 - 0.1, 0.71, dz0 + 0.012));
  const deskMesh = part(joined(desk), mats.timber);
  deskMesh.name = 'desk';
  group.add(deskMesh);
  const R = ROOM.recorder;
  const cx = (x0 + x1) / 2;
  const cz = dz0 + R.d / 2 + 0.05;
  const y0 = 0.75;
  const body = part(bx(cx - R.w / 2, y0, cz - R.d / 2, cx + R.w / 2, y0 + R.h, cz + R.d / 2), plain(0x6b7a72, 0.5));
  group.add(body);
  // front window: dark glass, and the strip of chart behind it
  const frontZ = cz - R.d / 2;
  group.add(
    part(
      bx(cx - R.w / 2 + 0.03, y0 + 0.05, frontZ - 0.004, cx + R.w / 2 - 0.03, y0 + R.h - 0.03, frontZ),
      plain(0x182026, 0.2),
      false,
    ),
  );
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xe9efe0, roughness: 0.95, map: chartMap() });
  paperMat.userData = { noShare: true };
  const paper = new THREE.Mesh(new THREE.PlaneGeometry(R.w - 0.08, R.h - 0.1), paperMat);
  paper.rotation.y = Math.PI;
  paper.position.set(cx, y0 + 0.05 + (R.h - 0.08) / 2, frontZ - 0.0045);
  group.add(paper);
  // the pen carriage: a rail across the window and a pen arm on it
  group.add(
    part(
      bx(cx - R.w / 2 + 0.03, y0 + R.h - 0.045, frontZ - 0.016, cx + R.w / 2 - 0.03, y0 + R.h - 0.04, frontZ - 0.01),
      mats.steel,
      false,
    ),
  );
  const carriage = new THREE.Group();
  carriage.position.set(cx, y0 + R.h - 0.042, frontZ - 0.013);
  carriage.add(part(bx(-0.012, -0.012, -0.006, 0.012, 0.004, 0.006), mats.steelDark, false));
  carriage.add(part(stick(V(0, -0.012, 0), V(0, -(R.h - 0.1), -0.004), 0.0012, 5), plain(0xb23a2a, 0.5), false));
  group.add(carriage);
  // take-up roll above and an input socket row at the rear top
  const roll = new THREE.Mesh(cyl(0.022, 0.022, R.w - 0.06, 14), plain(0xe9efe0, 0.9));
  roll.rotation.z = Math.PI / 2;
  roll.position.set(cx, y0 + R.h + 0.022, cz);
  group.add(roll);
  const sockets: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 4; k++)
    sockets.push(cyl(0.008, 0.008, 0.02, 8).translate(cx + 0.12 - k * 0.04, y0 + R.h - 0.005, cz + R.d / 2 + 0.008));
  group.add(part(joined(sockets.map((s) => s.rotateX(0))), plain(0xd4a017, 0.4), false));
  const inputTop = V(cx - 0.03, y0 + R.h - 0.005, cz + R.d / 2 + 0.012);
  void zInner;
  return { group, carriage, paper, inputTop };
}

/** A grid with three faint traces: the paper's print, a DataTexture (no canvas). */
function chartMap(): THREE.DataTexture {
  const W = 128;
  const H = 64;
  const d = new Uint8Array(W * H * 4);
  for (let j = 0; j < H; j++)
    for (let i = 0; i < W; i++) {
      const k = (j * W + i) * 4;
      let r = 233;
      let g = 239;
      let b = 224;
      if (i % 16 === 0 || j % 16 === 0) {
        r = 190;
        g = 215;
        b = 190;
      }
      const tr = [26 + 6 * Math.sin(i / 11), 40 + 5 * Math.sin(i / 9 + 1), 20 + 3 * Math.sin(i / 14)];
      for (const [n, c] of [
        [0, [180, 60, 40]],
        [1, [40, 70, 160]],
        [2, [30, 30, 30]],
      ] as const) {
        if (Math.abs(j - tr[n]!) < 1.1) {
          r = c[0];
          g = c[1];
          b = c[2];
        }
      }
      d[k] = r;
      d[k + 1] = g;
      d[k + 2] = b;
      d[k + 3] = 255;
    }
  const t = new THREE.DataTexture(d, W, H, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** The fresh-air vent, inside: a grille on the north wall's foot with its slats, a frame and a flap. Where fresh air comes from is not said in the source: nothing is drawn behind it. */
export function buildFreshVent(mats: Mats): THREE.Group {
  const g = new THREE.Group();
  g.name = 'fresh-air-vent';
  const fv = ROOM.freshVent;
  const x = AT.ventX;
  const zb = Z_NORTH_IN;
  const x0 = x - fv.w / 2 - 0.025;
  const x1 = x + fv.w / 2 + 0.025;
  const y0 = fv.y - 0.025;
  const y1 = fv.y + fv.h + 0.025;
  const p: THREE.BufferGeometry[] = [
    bx(x0, y0, zb, x1, y0 + 0.025, zb + 0.016),
    bx(x0, y1 - 0.025, zb, x1, y1, zb + 0.016),
    bx(x0, y0, zb, x0 + 0.025, y1, zb + 0.016),
    bx(x1 - 0.025, y0, zb, x1, y1, zb + 0.016),
  ];
  for (let k = 1; k < 6; k++) {
    const s = new THREE.BoxGeometry(fv.w + 0.01, 0.004, 0.02);
    s.rotateX(0.5);
    s.translate(x, y0 + 0.025 + k * ((y1 - y0 - 0.05) / 6), zb + 0.012);
    p.push(uvMetric(s));
  }
  g.add(part(joined(p), plain(0xd8d4c8, 0.45)));
  void mats;
  return g;
}

/** The plate of the wall's inner face: a lime wash over the concrete, holes for the two ducts, z and the duct's width following the spec. `Make` is for a slot. */
export function innerFaceGeo(s: ElementSpec, x0: number, x1: number): THREE.BufferGeometry {
  const L = elementLayout(s);
  const hole = (y: number): [number, number][] => [
    [-s.ductWidth / 2, y],
    [-s.ductWidth / 2, y + s.ductHeight],
    [s.ductWidth / 2, y + s.ductHeight],
    [s.ductWidth / 2, y],
  ];
  const xc = (x0 + x1) / 2;
  const shape = polyShape(
    [
      [x0 - xc, 0],
      [x1 - xc, 0],
      [x1 - xc, CEILING],
      [x0 - xc, CEILING],
    ],
    [hole(L.ySillTop), hole(L.yHeadBottom - s.ductHeight)],
  );
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.003, bevelEnabled: false });
  // the plate's face is turned to the room (north): extruded from z = 0 to 0.003, put just in front of the inner face
  g.translate(xc, 0, L.inner - 0.003);
  return uvMetric(g);
}

/** A plume: a soft tube along a path, growing from `r0` to `r1`, flattened by `flat` in y. */
export function plumeGeo(
  points: THREE.Vector3[],
  r0: number,
  r1: number,
  flat = 1,
  seg = 24,
  radial = 12,
): THREE.BufferGeometry {
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const pos: number[] = [];
  const idx: number[] = [];
  const alpha: number[] = [];
  const up = new THREE.Vector3(0, 1, 0);
  const side = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    const c = curve.getPointAt(t);
    const tan = curve.getTangentAt(t);
    side.crossVectors(tan, up);
    if (side.lengthSq() < 1e-6) side.set(1, 0, 0);
    side.normalize();
    nrm.crossVectors(side, tan).normalize();
    const r = r0 + (r1 - r0) * Math.pow(t, 0.8);
    for (let k = 0; k < radial; k++) {
      const a = (k / radial) * Math.PI * 2;
      const px = c.x + side.x * Math.cos(a) * r + nrm.x * Math.sin(a) * r * flat;
      const py = c.y + side.y * Math.cos(a) * r + nrm.y * Math.sin(a) * r * flat;
      const pz = c.z + side.z * Math.cos(a) * r + nrm.z * Math.sin(a) * r * flat;
      pos.push(px, py, pz);
      alpha.push(Math.sin(Math.min(1, t * 1.2) * Math.PI) * 0.95 + 0.05 * (1 - t));
    }
  }
  for (let i = 0; i < seg; i++)
    for (let k = 0; k < radial; k++) {
      const a = i * radial + k;
      const b = i * radial + ((k + 1) % radial);
      const c2 = (i + 1) * radial + k;
      const d = (i + 1) * radial + ((k + 1) % radial);
      idx.push(a, c2, b, b, c2, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aAlpha', new THREE.Float32BufferAttribute(alpha, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A soft, additive-looking material for a stream: an alpha that falls to both ends, a colour and an opacity set from the state. */
export function streamMaterial(): THREE.MeshBasicMaterial {
  const m = new THREE.MeshBasicMaterial({
    color: 0xffa060,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
    fog: false,
  });
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aAlpha;\nvarying float vA;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvA = aAlpha;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vA;')
      .replace('#include <opaque_fragment>', 'gl_FragColor = vec4( outgoingLight, diffuseColor.a * vA );');
  };
  m.customProgramCacheKey = () => 'stream-alpha';
  m.userData.noShare = true;
  return m;
}

/** Heat colour into a stream material. */
export function tintStream(m: THREE.MeshBasicMaterial, T: number): void {
  heatColor(T, m.color);
}
