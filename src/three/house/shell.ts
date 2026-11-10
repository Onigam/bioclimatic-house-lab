import * as THREE from 'three';
import { stick } from '../common';
import {
  BALCONY,
  BAY,
  BAY_KINDS,
  CEILING,
  CEILING_T,
  CHIMNEY,
  COLLECTOR_BAYS,
  EAVE,
  ELEMENT_1967,
  FOOTING,
  FRAME,
  GABLE_STEPS,
  GROUND_NORTH,
  GROUND_SOUTH,
  LENGTH,
  RECESS,
  RECESS_BAYS,
  ROOF,
  ROOF_PITCH,
  ROOM,
  SAMPLE_BAY,
  SLAB,
  WALL,
  WINDOW,
  WINDOW_BAY,
  X_EAST,
  X_EAST_IN,
  X_WEST,
  LIVING_X0,
  LIVING_X1,
  X_WEST_IN,
  Y_EAVE,
  Y_RIDGE,
  Z_NORTH,
  Z_NORTH_IN,
  Z_SOUTH,
  bayX,
  elementLayout,
  type ElementSpec,
} from '../dims';
import type { HousePart } from '../ids';
import { HOUSE_PARTS } from '../ids';
import { groundY } from '../land/ground';
import type { Mats } from '../materials';
import { buildElement, type ElementBuild } from '../collector/element';
import { bx, extrudeX, extrudeZ, joined, rect } from './geo';

// The house, built once from `dims.ts` and used by every world that shows it (`house` cuts it open, `site` sets it on the land, twice): the one function. House frame: x east, y up from the floor's top, z south.
// It makes the groups of the eighteen parts of the `house` world and the pieces that belong to the rooms (the floor's finish, the ceiling, the roof's insulation), which a world shows as scenery.
//
// What depends on the wall's thickness, the gap and the sheets (the visitor's sliders) is made by slots again whenever the element is laid out again: the foundation's south wall, the slab's reach, the head band, the
// window's reveals, the recess's back. What does not is made once. Everything that is horizontal runs into the south wall (to z = Z_SOUTH − 0.30), under any thickness the sliders allow, and is hidden there.

export interface HouseBuild {
  root: THREE.Group;
  groups: Record<HousePart, THREE.Group>;
  /** The floor's finish, the ceiling and the insulation on it: pieces of the rooms. */
  scenery: THREE.Group;
  collector: ElementBuild;
  spec: ElementSpec;
  relayout(spec: ElementSpec): void;
  /** Where things stand, for labels and tests. */
  anchors: Record<string, THREE.Vector3>;
  /** The steps of the balcony's stair, from the top: world positions of their treads, for tests. */
  stair: { x: number; z: number; y: number }[];
  /** The foot of each downpipe against the ground, for tests. */
  downpipes: THREE.Vector3[];
  /** Window glass, m², drawn. */
  windowGlass: () => number;
  /** Named meshes a world may need on their own (the cut walls of the `room` world, the floor and the ceiling). */
  pieces: Record<string, THREE.Mesh>;
}

export interface HouseOptions {
  /** Partitions, the ceiling and the insulation, the floor's finish: invisible from outside, so the landscape leaves them out. */
  interior?: boolean;
  /** Instruments in the sample bay. */
  instruments?: boolean;
  /** Flap and sliders follow the state. */
  spec?: ElementSpec;
}

/** The roof's underside at z (rafters' underside), m. */
export const roofUnder = (z: number): number => Y_EAVE + (Z_SOUTH - Math.abs(z)) * Math.tan(ROOF_PITCH);
/** The roof's top surface at z, m: the underside plus the roof's thickness, as a vertical. */
export const roofTop = (z: number): number => roofUnder(z) + (ROOF.rafter + 0.02 + ROOF.cover) / Math.cos(ROOF_PITCH);

/** The end of everything that runs into the south wall: inside the wall, whatever the sliders. */
export const Z_RUN = Z_SOUTH - 0.3;

/** Tops of the gables' foundation steps, from the north: each at the ground's height at the middle of its step, m. */
export function stepTops(): { z0: number; z1: number; top: number }[] {
  const out: { z0: number; z1: number; top: number }[] = [];
  const L = Z_RUN - Z_NORTH;
  for (let k = 0; k < GABLE_STEPS; k++) {
    const z0 = Z_NORTH + (k * L) / GABLE_STEPS;
    const z1 = Z_NORTH + ((k + 1) * L) / GABLE_STEPS;
    out.push({ z0, z1, top: Math.round(groundY(0, (z0 + z1) / 2) * 20) / 20 });
  }
  return out;
}

interface SlotCtx {
  spec: ElementSpec;
  face: number;
  inner: number;
  /** World z of the black face and of the inner face. */
  zFace: number;
  zInner: number;
  yBottom: number;
  yTop: number;
}
type Make = (c: SlotCtx) => THREE.BufferGeometry;

export function buildHouse(mats: Mats, opts: HouseOptions = {}): HouseBuild {
  const spec0 = opts.spec ?? ELEMENT_1967;
  const root = new THREE.Group();
  root.name = 'house';
  const groups = {} as Record<HousePart, THREE.Group>;
  for (const id of HOUSE_PARTS) {
    const g = new THREE.Group();
    g.name = id;
    groups[id] = g;
    root.add(g);
  }
  const scenery = new THREE.Group();
  scenery.name = 'rooms-scenery';
  root.add(scenery);

  const collector = buildElement(
    mats,
    spec0,
    COLLECTOR_BAYS.map((i) => bayX(i)),
    opts.instruments === false ? null : COLLECTOR_BAYS.indexOf(SAMPLE_BAY),
  );
  collector.root.position.z = Z_SOUTH;
  groups['collector-element'].add(collector.root);

  const slots: { mesh: THREE.Mesh; make: Make }[] = [];
  const pieces: Record<string, THREE.Mesh> = {};
  const ctxOf = (spec: ElementSpec): SlotCtx => {
    const L = elementLayout(spec);
    return {
      spec,
      face: L.face,
      inner: L.inner,
      zFace: Z_SOUTH + L.face,
      zInner: Z_SOUTH + L.inner,
      yBottom: L.yBottom,
      yTop: L.yTop,
    };
  };
  let ctx = ctxOf(spec0);
  const place = (
    part: HousePart | null,
    parent: THREE.Object3D,
    material: THREE.Material,
    make: Make,
    name: string,
    cast = true,
  ): THREE.Mesh => {
    const m = new THREE.Mesh(make(ctx), material);
    m.name = name;
    m.castShadow = cast;
    m.receiveShadow = true;
    m.userData.dynamic = true;
    (part ? groups[part] : parent).add(m);
    slots.push({ mesh: m, make });
    pieces[name] = m;
    return m;
  };
  /** Static geometry in a part. */
  const fixed = (
    part: HousePart | THREE.Object3D,
    material: THREE.Material,
    g: THREE.BufferGeometry,
    name: string,
    cast = true,
    receive = true,
  ): THREE.Mesh => {
    const m = new THREE.Mesh(g, material);
    m.name = name;
    m.castShadow = cast;
    m.receiveShadow = receive;
    (typeof part === 'string' ? groups[part as HousePart] : part).add(m);
    pieces[name] = m;
    return m;
  };

  const tanP = Math.tan(ROOF_PITCH);
  const cosP = Math.cos(ROOF_PITCH);

  // ---------------------------------------------------------------------------------------------- foundation
  // south: the wall's own foundation, from the footing to the frame's foot, as wide as the front assembly; its footing and the north strip; the gables' steps; the hardcore under the slab
  place(
    'foundation',
    root,
    mats.plinth,
    (c) => bx(X_WEST, GROUND_SOUTH - FOOTING + 0.02, c.zInner, X_EAST, c.yBottom, Z_SOUTH),
    'foundation-south',
  );
  place(
    'foundation',
    root,
    mats.plinth,
    (c) =>
      bx(X_WEST - 0.15, GROUND_SOUTH - FOOTING, c.zInner - 0.2, X_EAST + 0.15, GROUND_SOUTH + 0.02, Z_SOUTH + 0.15),
    'footing-south',
  );
  fixed(
    'foundation',
    mats.plinth,
    bx(X_WEST - 0.15, GROUND_NORTH - FOOTING, Z_NORTH - 0.12, X_EAST + 0.15, GROUND_NORTH, Z_NORTH + WALL + 0.12),
    'footing-north',
  );
  const steps = stepTops();
  const stepGeos: THREE.BufferGeometry[] = [];
  for (const s of steps) {
    for (const [xa, xb] of [
      [X_WEST - 0.1, X_WEST + WALL + 0.1],
      [X_EAST - WALL - 0.1, X_EAST + 0.1],
    ] as const)
      stepGeos.push(bx(xa, s.top - 0.6, s.z0 - (s.z0 === Z_NORTH ? 0.1 : 0), xb, s.top, s.z1));
  }
  fixed('foundation', mats.plinth, joined(stepGeos), 'foundation-steps');
  // the hardcore under the slab: a wedge on the ground's ramp, up to the slab's underside
  place(
    'foundation',
    root,
    mats.gravel,
    (c) => {
      const ramp = (z: number) => groundY(0, z);
      const zN = Z_NORTH_IN;
      const zS = c.zInner;
      return extrudeX(
        [
          [zN, -SLAB],
          [zS, -SLAB],
          [zS, ramp(zS)],
          [zN, ramp(zN)],
        ],
        X_WEST_IN,
        X_EAST_IN,
      );
    },
    'hardcore',
    false,
  );

  // ---------------------------------------------------------------------------------------------- floor slab: concrete under a thin finish, running into the south wall
  place(
    'floor-slab',
    root,
    mats.plinth,
    (c) => bx(X_WEST_IN, -SLAB, Z_NORTH_IN, X_EAST_IN, -0.03, Z_SOUTH - 0.3 > c.zInner ? Z_RUN : c.zInner),
    'slab',
  );
  // the balcony's slab: the same slab continued out of the recess
  const BZ1 = Z_SOUTH + BALCONY.depth;
  place(
    'entrance-balcony',
    root,
    mats.plinth,
    (c) =>
      bx(bayX(RECESS_BAYS[0]!) - BAY * 0.5 - 0.1, -SLAB, c.zInner, bayX(RECESS_BAYS[1]!) + BAY * 0.5 + 0.1, -0.03, BZ1),
    'balcony-slab',
  );

  // ---------------------------------------------------------------------------------------------- the north wall, with its window and the fresh-air vent
  {
    const nw = ROOM.northWindow;
    const wx = -0.6;
    const fv = ROOM.freshVent;
    const vx = 1.55;
    const holes = [
      rect(wx - nw.w / 2, nw.sill, wx + nw.w / 2, nw.head),
      rect(vx - fv.w / 2, fv.y, vx + fv.w / 2, fv.y + fv.h),
    ];
    fixed(
      'north-wall',
      mats.render,
      extrudeZ(rect(X_WEST, GROUND_NORTH, X_EAST, Y_EAVE), Z_NORTH, Z_NORTH + WALL, holes),
      'north-wall',
    );
    // the window: a steel frame and two sheets, in the thickness of the wall at its outer face; a concrete sill
    const f = 0.028;
    const w = nw.w;
    const h = nw.head - nw.sill;
    const zf0 = Z_NORTH + 0.02;
    const frame: THREE.BufferGeometry[] = [
      bx(wx - w / 2, nw.sill, zf0, wx - w / 2 + f, nw.head, zf0 + 0.07),
      bx(wx + w / 2 - f, nw.sill, zf0, wx + w / 2, nw.head, zf0 + 0.07),
      bx(wx - w / 2 + f, nw.sill, zf0, wx + w / 2 - f, nw.sill + f, zf0 + 0.07),
      bx(wx - w / 2 + f, nw.head - f, zf0, wx + w / 2 - f, nw.head, zf0 + 0.07),
      bx(wx - f / 2, nw.sill + f, zf0, wx + f / 2, nw.head - f, zf0 + 0.07),
    ];
    fixed('north-window', mats.frame, joined(frame), 'north-window-frame');
    const gl = (zz: number) =>
      joined([
        bx(wx - w / 2 + f - 0.005, nw.sill + f - 0.005, zz, wx - 0.0 - f / 2 + 0.005, nw.head - f + 0.005, zz + 0.004),
        bx(wx + f / 2 - 0.005, nw.sill + f - 0.005, zz, wx + w / 2 - f + 0.005, nw.head - f + 0.005, zz + 0.004),
      ]);
    for (const zz of [zf0 + 0.02, zf0 + 0.045]) {
      const g = fixed('north-window', mats.glass, gl(zz), 'north-window-glass', false);
      g.renderOrder = 2;
    }
    // sill of the window, outside: a slab of concrete under the frame
    fixed(
      'north-window',
      mats.concrete,
      bx(wx - w / 2 - 0.04, nw.sill - 0.04, Z_NORTH - 0.05, wx + w / 2 + 0.04, nw.sill, Z_NORTH + 0.1),
      'north-window-sill',
    );
    void h;
    // the fresh-air vent: a grille on the outside of the hole, at the foot of the wall: the room's own part shows it inside
    const grille: THREE.BufferGeometry[] = [];
    const gx0 = vx - fv.w / 2 - 0.02;
    const gx1 = vx + fv.w / 2 + 0.02;
    const gy0 = fv.y - 0.02;
    const gy1 = fv.y + fv.h + 0.02;
    grille.push(
      bx(gx0, gy0, Z_NORTH - 0.012, gx1, gy0 + 0.02, Z_NORTH),
      bx(gx0, gy1 - 0.02, Z_NORTH - 0.012, gx1, gy1, Z_NORTH),
      bx(gx0, gy0, Z_NORTH - 0.012, gx0 + 0.02, gy1, Z_NORTH),
      bx(gx1 - 0.02, gy0, Z_NORTH - 0.012, gx1, gy1, Z_NORTH),
    );
    for (let k = 1; k < 5; k++)
      grille.push(
        bx(
          gx0,
          gy0 + 0.02 + k * ((fv.h + 0.0) / 5),
          Z_NORTH - 0.008,
          gx1,
          gy0 + 0.02 + k * (fv.h / 5) + 0.008,
          Z_NORTH,
        ),
      );
    fixed('north-wall', mats.steel, joined(grille), 'vent-grille');
  }

  // ---------------------------------------------------------------------------------------------- the gables: render over the stepped foundation, up to the roof
  for (const [part, xa, xb] of [
    ['west-gable', X_WEST, X_WEST + WALL],
    ['east-gable', X_EAST - WALL, X_EAST],
  ] as const) {
    const pts: [number, number][] = [];
    pts.push([Z_NORTH, steps[0]!.top]);
    for (let k = 0; k < steps.length; k++) {
      const s = steps[k]!;
      pts.push([s.z1, s.top]);
      if (k < steps.length - 1) pts.push([s.z1, steps[k + 1]!.top]);
    }
    pts.push([Z_RUN, roofUnder(Z_RUN)], [0, roofUnder(0)], [Z_NORTH, roofUnder(Z_NORTH)]);
    fixed(part, mats.render, extrudeX(pts, xa, xb), `${part}-wall`);
  }

  // ---------------------------------------------------------------------------------------------- the south front, apart from the collectors
  // head band: the ring beam the rafters stand on, along the whole front, above the elements
  place('south-facade', root, mats.concrete, (c) => bx(X_WEST, c.yTop, c.zInner, X_EAST, Y_EAVE, Z_SOUTH), 'head-band');
  // the lintel over the window and the recess, at the height of the elements' head beams
  {
    const b0 = Math.min(WINDOW_BAY, RECESS_BAYS[0]!);
    const b1 = Math.max(WINDOW_BAY, RECESS_BAYS[1]!);
    place(
      'south-facade',
      root,
      mats.concrete,
      (c) => bx(bayX(b0) - BAY / 2, elementLayout(c.spec).yHeadBottom, c.zInner, bayX(b1) + BAY / 2, c.yTop, Z_SOUTH),
      'lintel',
    );
  }
  // gutters and downpipes
  const downpipes: THREE.Vector3[] = [];
  {
    const gy = Y_EAVE - EAVE * tanP - 0.07;
    const gz = Z_SOUTH + EAVE - 0.02;
    const half = new THREE.CylinderGeometry(0.055, 0.055, LENGTH + 2 * EAVE - 0.1, 12, 1, true, Math.PI / 2, Math.PI);
    half.rotateZ(Math.PI / 2);
    // the cylinder's open half faces down-front: rotate so the opening faces up
    half.rotateX(Math.PI * 0.0);
    half.translate(0, gy, gz);
    const gutterM = fixed('south-facade', mats.zinc, half, 'gutter-south');
    gutterM.material = Object.assign(mats.zinc.clone(), { side: THREE.DoubleSide });
    const parts: THREE.BufferGeometry[] = [];
    for (const sx of [X_WEST + 0.2, X_EAST - 0.2]) {
      const zPipe = Z_SOUTH + EAVE - 0.02;
      const yTopP = gy - 0.03;
      const yBot = groundY(sx, zPipe) + 0.18;
      parts.push(stick(new THREE.Vector3(sx, yTopP, zPipe), new THREE.Vector3(sx, yBot, zPipe), 0.032, 10));
      // an elbow and a short run to a splash block
      parts.push(
        stick(new THREE.Vector3(sx, yBot, zPipe), new THREE.Vector3(sx, yBot - 0.06, zPipe + 0.22), 0.032, 10),
      );
      for (const yy of [yTopP - 0.4, yBot + 0.5, (yTopP + yBot) / 2]) {
        parts.push(bx(sx - 0.05, yy, zPipe - 0.045, sx + 0.05, yy + 0.03, zPipe + 0.01));
      }
      downpipes.push(new THREE.Vector3(sx, yBot - 0.06, zPipe + 0.22));
    }
    fixed('south-facade', mats.zinc, joined(parts), 'downpipes');
  }

  // ---------------------------------------------------------------------------------------------- the window bay
  {
    const x0 = bayX(WINDOW_BAY);
    const w = WINDOW.w;
    const zF = 0;
    const mk: Make = (c) => {
      const lay = elementLayout(c.spec);
      const parts: THREE.BufferGeometry[] = [
        // jambs, full depth, from the foundation's top to the lintel
        bx(x0 - BAY / 2, lay.yBottom, Z_SOUTH + lay.inner, x0 - w / 2, lay.yHeadBottom, Z_SOUTH + zF),
        bx(x0 + w / 2, lay.yBottom, Z_SOUTH + lay.inner, x0 + BAY / 2, lay.yHeadBottom, Z_SOUTH + zF),
        // the wall under the sill
        bx(x0 - w / 2, lay.yBottom, Z_SOUTH + lay.inner, x0 + w / 2, WINDOW.sill, Z_SOUTH + zF),
      ];
      return joined(parts);
    };
    place('south-window', root, mats.concrete, mk, 'window-reveals');
    // the window, in the thickness of the front: a steel frame at the outer face with two sheets
    const frameMk: Make = (c) => {
      const lay = elementLayout(c.spec);
      const f = FRAME.face;
      const y0 = WINDOW.sill;
      const y1 = WINDOW.head - 0.0;
      const zb = Z_SOUTH + lay.frameBack;
      const z0 = Z_SOUTH;
      const parts: THREE.BufferGeometry[] = [
        bx(x0 - w / 2, y0, zb, x0 - w / 2 + f, y1, z0),
        bx(x0 + w / 2 - f, y0, zb, x0 + w / 2, y1, z0),
        bx(x0 - w / 2 + f, y0, zb, x0 + w / 2 - f, y0 + f, z0),
        bx(x0 - w / 2 + f, y1 - f, zb, x0 + w / 2 - f, y1, z0),
      ];
      const n = 3;
      const ph = (y1 - y0 - 2 * f - (n - 1) * f) / n;
      for (let k = 1; k < n; k++)
        parts.push(bx(x0 - w / 2 + f, y0 + f + k * ph + (k - 1) * f, zb, x0 + w / 2 - f, y0 + f + k * ph + k * f, z0));
      return joined(parts);
    };
    place('south-window', root, mats.frame, frameMk, 'window-frame');
    const paneMk =
      (k: number): Make =>
      (c) => {
        const lay = elementLayout(c.spec);
        const f = FRAME.face;
        const y0 = WINDOW.sill;
        const y1 = WINDOW.head;
        const n = 3;
        const ph = (y1 - y0 - 2 * f - (n - 1) * f) / n;
        const zz = Z_SOUTH + lay.sheetFront[Math.min(k, lay.sheetFront.length - 1)]!;
        const parts: THREE.BufferGeometry[] = [];
        for (let j = 0; j < n; j++) {
          const yy = y0 + f + j * (ph + f) - 0.006;
          parts.push(bx(x0 - w / 2 + f - 0.006, yy, zz - c.spec.glass, x0 + w / 2 - f + 0.006, yy + ph + 0.012, zz));
        }
        return joined(parts);
      };
    for (const k of [0, 1]) {
      const m = place('south-window', root, mats.glass, paneMk(k), `window-sheet-${k}`, false);
      m.renderOrder = 2;
    }
  }

  // ---------------------------------------------------------------------------------------------- the entrance recess: a glazed back wall at the room's face, a leaf, a sill
  const stair: { x: number; z: number; y: number }[] = [];
  {
    const xa = bayX(RECESS_BAYS[0]!) - BAY / 2;
    const xb = bayX(RECESS_BAYS[1]!) + BAY / 2;
    const f = 0.045;
    const back: Make = (c) => {
      const zi = c.zInner;
      const zb = zi + 0.07;
      const doorX0 = (xa + xb) / 2 - RECESS.door / 2 + 0.2;
      const doorX1 = doorX0 + RECESS.door;
      const parts: THREE.BufferGeometry[] = [
        // the frame of the glazed wall: head, sill, two jambs, a mullion either side of the door, the transom over it
        bx(xa, 0, zi, xa + f, c.yTop - 0.4, zb),
        bx(xb - f, 0, zi, xb, c.yTop - 0.4, zb),
        bx(xa, c.yTop - 0.4 - f, zi, xb, c.yTop - 0.4, zb),
        bx(xa + f, 0, zi, xb - f, 0.08, zb),
        bx(doorX0 - f, 0.08, zi, doorX0, c.yTop - 0.4 - f, zb),
        bx(doorX1, 0.08, zi, doorX1 + f, c.yTop - 0.4 - f, zb),
        bx(doorX0 - f, RECESS.transom, zi, doorX1 + f, RECESS.transom + f, zb),
        bx(xa + f, RECESS.transom, zi, xb - f, RECESS.transom + f, zb),
      ];
      return joined(parts);
    };
    place('entrance-recess', root, mats.frame, back, 'recess-frame');
    const panes: Make = (c) => {
      const zi = c.zInner;
      const doorX0 = (xa + xb) / 2 - RECESS.door / 2 + 0.2;
      const doorX1 = doorX0 + RECESS.door;
      const zz0 = zi + 0.02;
      const parts: THREE.BufferGeometry[] = [
        bx(xa + f - 0.005, 0.08 + 0.0, zz0, doorX0 - f + 0.005, RECESS.transom, zz0 + 0.004),
        bx(doorX1 + f - 0.005, 0.08, zz0, xb - f + 0.005, RECESS.transom, zz0 + 0.004),
        bx(xa + f - 0.005, RECESS.transom + f, zz0, xb - f + 0.005, c.yTop - 0.4 - f + 0.005, zz0 + 0.004),
        bx(doorX0 - f + 0.0, RECESS.transom + f, zz0, doorX1 + f, RECESS.transom + f + 0.001, zz0 + 0.0041),
      ];
      return joined(parts);
    };
    const pm = place('entrance-recess', root, mats.glass, panes, 'recess-glass', false);
    pm.renderOrder = 2;
    // the door's leaf: timber, a glazed upper panel, brass handle; closed
    const leaf: Make = (c) => {
      const zi = c.zInner;
      const doorX0 = (xa + xb) / 2 - RECESS.door / 2 + 0.2;
      const parts: THREE.BufferGeometry[] = [
        bx(doorX0, 0.08, zi + 0.012, doorX0 + RECESS.door, 0.08 + 1.0, zi + 0.058),
        bx(doorX0, 0.08 + 1.0, zi + 0.012, doorX0 + 0.1, RECESS.doorH, zi + 0.058),
        bx(doorX0 + RECESS.door - 0.1, 0.08 + 1.0, zi + 0.012, doorX0 + RECESS.door, RECESS.doorH, zi + 0.058),
        bx(doorX0, RECESS.doorH - 0.1, zi + 0.012, doorX0 + RECESS.door, RECESS.doorH, zi + 0.058),
        bx(doorX0 + 0.1, 0.08 + 1.0, zi + 0.012, doorX0 + RECESS.door - 0.1, 0.08 + 1.05, zi + 0.058),
      ];
      return joined(parts);
    };
    place('entrance-recess', root, mats.timber, leaf, 'recess-door');
    const doorGlass: Make = (c) => {
      const zi = c.zInner;
      const doorX0 = (xa + xb) / 2 - RECESS.door / 2 + 0.2;
      return bx(
        doorX0 + 0.1 - 0.004,
        0.08 + 1.05,
        zi + 0.028,
        doorX0 + RECESS.door - 0.1 + 0.004,
        RECESS.doorH - 0.1 + 0.004,
        zi + 0.032,
      );
    };
    const dg = place('entrance-recess', root, mats.glass, doorGlass, 'recess-door-glass', false);
    dg.renderOrder = 2;
    const handle: Make = (c) => {
      const zi = c.zInner;
      const doorX0 = (xa + xb) / 2 - RECESS.door / 2 + 0.2;
      const g = new THREE.BoxGeometry(0.02, 0.12, 0.02);
      g.translate(doorX0 + RECESS.door - 0.07, 1.02, zi + 0.07);
      const g2 = new THREE.BoxGeometry(0.02, 0.12, 0.02);
      g2.translate(doorX0 + RECESS.door - 0.07, 1.02, zi - 0.0);
      return joined([g, g2]);
    };
    place('entrance-recess', root, mats.brass, handle, 'recess-handle');
    // a boot-scraper and a mat in the recess: someone lives here
    // the balcony: two posts at the outer corners, a timber rail, a stair down the slope
    const zOut = BZ1 - 0.12;
    const postGeos: THREE.BufferGeometry[] = [];
    for (const sx of [xa + 0.12, xb - 0.12])
      postGeos.push(bx(sx - 0.12, groundY(sx, zOut) - 0.4, zOut - 0.12, sx + 0.12, -SLAB, zOut + 0.12));
    fixed('entrance-balcony', mats.plinth, joined(postGeos), 'balcony-posts');
    // the deck's finish: boards on the slab
    fixed(
      'entrance-balcony',
      mats.timber,
      bx(xa - 0.1, -0.03, Z_SOUTH + 0.0, xb + 0.1, 0.0, BZ1 + 0.02),
      'balcony-deck',
      true,
    );
    // the rail: posts every ~0.9 m, a top rail and two rods, round three sides, open for the stair at the middle of the front
    const R = BALCONY.rail;
    const stW = BALCONY.stairW;
    const sxm = (xa + xb) / 2;
    const rail: THREE.BufferGeometry[] = [];
    const rpost = (x: number, z: number) => rail.push(bx(x - 0.03, 0, z - 0.03, x + 0.03, R, z + 0.03));
    // front, in two runs either side of the stair's opening
    const frontZ = BZ1 + 0.0;
    const runs: [number, number][] = [
      [xa + 0.03, sxm - stW / 2],
      [sxm + stW / 2, xb - 0.03],
    ];
    for (const [a, b] of runs) {
      const n = Math.max(1, Math.round((b - a) / 0.9));
      for (let i = 0; i <= n; i++) rpost(a + ((b - a) * i) / n, frontZ);
      rail.push(bx(a - 0.03, R, frontZ - 0.04, b + 0.03, R + 0.04, frontZ + 0.04));
      for (const yy of [0.35, 0.65]) rail.push(bx(a, yy - 0.006, frontZ - 0.006, b, yy + 0.006, frontZ + 0.006));
    }
    // sides
    for (const sx of [xa + 0.03, xb - 0.03]) {
      const n = Math.max(1, Math.round((BZ1 - Z_SOUTH) / 0.9));
      for (let i = 0; i <= n; i++) rpost(sx, Z_SOUTH + ((BZ1 - Z_SOUTH) * i) / n);
      rail.push(bx(sx - 0.04, R, Z_SOUTH, sx + 0.04, R + 0.04, BZ1 + 0.03));
      for (const yy of [0.35, 0.65]) rail.push(bx(sx - 0.006, yy - 0.006, Z_SOUTH, sx + 0.006, yy + 0.006, BZ1));
    }
    fixed('entrance-balcony', mats.timberDark, joined(rail), 'balcony-rail');
    // the stair: treads from the deck's edge down to the ground, two concrete cheeks
    const treads: THREE.BufferGeometry[] = [];
    const cheeks: THREE.BufferGeometry[] = [];
    let y = 0;
    let z = BZ1;
    let step = 0;
    const x0s = sxm - stW / 2;
    const x1s = sxm + stW / 2;
    while (true) {
      const ground = groundY(sxm, z + BALCONY.tread * 0.5);
      if (y - BALCONY.rise <= ground + 0.02 || step > 40) break;
      y -= BALCONY.rise;
      treads.push(bx(x0s, y - 0.04, z, x1s, y, z + BALCONY.tread));
      stair.push({ x: sxm, z: z + BALCONY.tread / 2, y });
      z += BALCONY.tread;
      step++;
    }
    // the last tread stands on the ground: a footing block under it
    const zEnd = z;
    const gEnd = groundY(sxm, zEnd);
    cheeks.push(bx(x0s - 0.1, gEnd - 0.2, zEnd - 0.4, x1s + 0.1, Math.max(y - 0.04, gEnd), zEnd + 0.05));
    // two stringers: the stepped line under the treads, closed along the ground
    for (const sx of [x0s - 0.07, x1s + 0.0]) {
      const pts: [number, number][] = [[BZ1, -SLAB]];
      let yy = 0;
      let zz = BZ1;
      for (let i = 0; i < step; i++) {
        yy -= BALCONY.rise;
        pts.push([zz, yy - 0.04]);
        zz += BALCONY.tread;
        pts.push([zz, yy - 0.04]);
      }
      pts.push([zz, groundY(sxm, zz) - 0.15]);
      pts.push([BZ1, groundY(sxm, BZ1) - 0.15]);
      cheeks.push(extrudeX(pts, sx, sx + 0.07));
    }
    fixed('entrance-balcony', mats.timber, joined(treads), 'stair-treads');
    fixed('entrance-balcony', mats.plinth, joined(cheeks), 'stair-cheeks');
    // handrail down the stair, on the west side
    const hr: THREE.BufferGeometry[] = [];
    {
      const xs = x0s - 0.04;
      const zA = BZ1;
      const zB = zEnd;
      for (let i = 0; i <= 4; i++) {
        const zz = zA + ((zB - zA) * i) / 4;
        const yy = -BALCONY.rise * ((zz - BZ1) / BALCONY.tread) + 0.0;
        hr.push(bx(xs - 0.025, yy - 0.02, zz - 0.025, xs + 0.025, yy + R * 0.9, zz + 0.025));
      }
      const a = new THREE.Vector3(xs, R * 0.9, zA);
      const b = new THREE.Vector3(xs, -BALCONY.rise * ((zB - BZ1) / BALCONY.tread) + R * 0.9, zB);
      hr.push(stick(a, b, 0.022, 8));
    }
    fixed('entrance-balcony', mats.timberDark, joined(hr), 'stair-handrail');
  }

  // ---------------------------------------------------------------------------------------------- the roof
  {
    const xr0 = X_WEST - EAVE;
    const xr1 = X_EAST + EAVE;
    const tv = (o: number) => o / cosP;
    // one slope, the layer between perpendicular offsets o0 and o1 from the rafters' underside, from the ridge out to the eave's tip
    const slope = (sgn: 1 | -1, o0: number, o1: number): THREE.BufferGeometry => {
      const zE = sgn * (Z_SOUTH + EAVE);
      const under = (z: number, o: number) => [z, roofUnder(z) + tv(o)] as [number, number];
      const pts =
        sgn > 0
          ? [under(0, o0), under(zE, o0), under(zE, o1), under(0, o1)]
          : [under(zE, o0), under(0, o0), under(0, o1), under(zE, o1)];
      return extrudeX(pts, xr0, xr1);
    };
    // rafters every 0.6 m: a beam of 0.06 by 0.14 along each slope, resting on the head band (south) and the north wall (north)
    const raf: THREE.BufferGeometry[] = [];
    const n = Math.round((xr1 - xr0) / 0.6);
    for (let i = 0; i <= n; i++) {
      const x = xr0 + 0.04 + ((xr1 - xr0 - 0.08) * i) / n;
      for (const sgn of [1, -1] as const) {
        const zE = sgn * (Z_SOUTH + EAVE);
        const under = (z: number, o: number) => [z, roofUnder(z) + tv(o)] as [number, number];
        const pts =
          sgn > 0
            ? [under(0, 0), under(zE, 0), under(zE, ROOF.rafter), under(0, ROOF.rafter)]
            : [under(zE, 0), under(0, 0), under(0, ROOF.rafter), under(zE, ROOF.rafter)];
        raf.push(extrudeX(pts, x - 0.03, x + 0.03));
      }
    }
    fixed('pitched-roof', mats.timber, joined(raf), 'rafters');
    // boards over the rafters, then the slate
    fixed(
      'pitched-roof',
      mats.timberDark,
      joined([slope(1, ROOF.rafter, ROOF.rafter + 0.02), slope(-1, ROOF.rafter, ROOF.rafter + 0.02)]),
      'roof-boards',
    );
    fixed(
      'pitched-roof',
      mats.slate,
      joined([
        slope(1, ROOF.rafter + 0.02, ROOF.rafter + 0.02 + ROOF.cover),
        slope(-1, ROOF.rafter + 0.02, ROOF.rafter + 0.02 + ROOF.cover),
      ]),
      'roof-slate',
    );
    // ridge: a zinc roll over the slates; fascia boards at the eaves; verge boards at the gable ends
    const ry = roofTop(0);
    const ridge = new THREE.CylinderGeometry(0.07, 0.07, xr1 - xr0 + 0.02, 10, 1, false, Math.PI * 1.0, Math.PI);
    ridge.rotateZ(Math.PI / 2);
    ridge.rotateX(Math.PI);
    ridge.translate((xr0 + xr1) / 2, ry + 0.0, 0);
    // a half-cylinder with its flat face down, its edge sinking a hand's width into the slates on both sides
    const rm = fixed('pitched-roof', mats.zinc, ridge, 'ridge');
    rm.material = Object.assign(mats.zinc.clone(), { side: THREE.DoubleSide });
    const fas: THREE.BufferGeometry[] = [];
    for (const sgn of [1, -1] as const) {
      const z = sgn * (Z_SOUTH + EAVE);
      fas.push(
        bx(xr0, roofUnder(z) - 0.02, z - 0.0, xr1, roofUnder(z) + tv(ROOF.rafter + 0.02 + ROOF.cover), z + sgn * 0.022),
      );
    }
    fixed('pitched-roof', mats.timberDark, joined(fas), 'fascia');
    const verge: THREE.BufferGeometry[] = [];
    for (const xe of [xr0, xr1]) {
      const sgnx = xe < 0 ? 1 : -1;
      for (const sgn of [1, -1] as const) {
        const zE = sgn * (Z_SOUTH + EAVE);
        const under = (z: number, o: number) => [z, roofUnder(z) + tv(o)] as [number, number];
        const pts =
          sgn > 0
            ? [under(0, 0), under(zE, 0), under(zE, ROOF.rafter + 0.05), under(0, ROOF.rafter + 0.05)]
            : [under(zE, 0), under(0, 0), under(0, ROOF.rafter + 0.05), under(zE, ROOF.rafter + 0.05)];
        verge.push(extrudeX(pts, xe, xe + sgnx * 0.03));
      }
    }
    fixed('pitched-roof', mats.timberDark, joined(verge), 'verge');
  }

  // ---------------------------------------------------------------------------------------------- the chimney: a stack from the ceiling's insulation to above the ridge, a collar of zinc where it crosses the slates, a cap
  {
    const c = CHIMNEY;
    const yBase = CEILING + CEILING_T;
    const yTopStack = Y_RIDGE + c.above;
    const stack = bx(c.x - c.w / 2, yBase, c.z - c.d / 2, c.x + c.w / 2, yTopStack, c.z + c.d / 2);
    fixed('chimney', mats.plinth, stack, 'stack');
    // the collar's two aprons where the stack meets the slope, and a stack's cap slab with a flue pot
    const yAt = roofTop(c.z);
    const collar = [
      bx(c.x - c.w / 2 - 0.1, yAt - 0.04, c.z - c.d / 2 - 0.1, c.x + c.w / 2 + 0.1, yAt + 0.12, c.z + c.d / 2 + 0.1),
    ];
    fixed('chimney', mats.zinc, joined(collar), 'collar');
    fixed(
      'chimney',
      mats.concrete,
      bx(
        c.x - c.w / 2 - 0.05,
        yTopStack,
        c.z - c.d / 2 - 0.05,
        c.x + c.w / 2 + 0.05,
        yTopStack + c.cap,
        c.z + c.d / 2 + 0.05,
      ),
      'stack-cap',
    );
    const pot = new THREE.CylinderGeometry(0.11, 0.13, 0.32, 14);
    pot.translate(c.x, yTopStack + c.cap + 0.16, c.z);
    fixed('chimney', mats.stone, pot, 'flue-pot');
  }

  // ---------------------------------------------------------------------------------------------- the rooms' own pieces
  const ceilingGroup = new THREE.Group();
  ceilingGroup.name = 'ceiling';
  const interior = opts.interior !== false;
  if (interior) {
    scenery.add(ceilingGroup);
    // the ceiling: a plaster slab under the roof void, and the roof's insulation laid over it (the part)
    const cx0 = X_WEST_IN;
    const cx1 = X_EAST_IN;
    fixed(
      ceilingGroup,
      mats.ceiling,
      bx(cx0, CEILING, Z_NORTH_IN, cx1, CEILING + CEILING_T, Z_RUN),
      'ceiling',
      false,
      true,
    );
    fixed(
      'roof-insulation',
      mats.insulation,
      bx(cx0, CEILING + CEILING_T, Z_NORTH_IN, cx1, CEILING + CEILING_T + 0.12, Z_RUN),
      'insulation-quilt',
    );
    // the floor's finish on the slab: tiles through the living room and the hall, oak boards in the side blocks
    const fz1 = Z_RUN;
    fixed(scenery, mats.tile, bx(-2.54, -0.03, Z_NORTH_IN, 2.54, 0, fz1), 'floor-tile', false, true);
    fixed(
      scenery,
      mats.oak,
      joined([bx(cx0, -0.03, Z_NORTH_IN, -2.54, 0, fz1), bx(2.54, -0.03, Z_NORTH_IN, cx1, 0, fz1)]),
      'floor-oak',
      false,
      true,
    );
    // skirting
    const skirt: THREE.BufferGeometry[] = [bx(cx0, 0, Z_NORTH_IN, cx1, 0.09, Z_NORTH_IN + 0.012)];
    fixed(scenery, mats.whitePaint, joined(skirt), 'skirting-north', false, true);

    // partitions: the two cross walls inside the bay lines either side of the living room (the cut of the `room` world runs along their outer faces), and a wall across each side block; doors in each, ajar
    const PT = 0.1;
    const doorH = 2.05;
    const door = 0.9;
    const part: THREE.BufferGeometry[] = [];
    const crossW = extrudeX(
      [
        [Z_NORTH_IN, 0],
        [Z_RUN, 0],
        [Z_RUN, CEILING],
        [Z_NORTH_IN, CEILING],
      ],
      LIVING_X0,
      LIVING_X0 + PT,
      [
        [
          [-2.4, 0],
          [-2.4 + door, 0],
          [-2.4 + door, doorH],
          [-2.4, doorH],
        ],
      ],
    );
    const crossE = extrudeX(
      [
        [Z_NORTH_IN, 0],
        [Z_RUN, 0],
        [Z_RUN, CEILING],
        [Z_NORTH_IN, CEILING],
      ],
      LIVING_X1 - PT,
      LIVING_X1,
      [
        [
          [-2.4, 0],
          [-2.4 + door, 0],
          [-2.4 + door, doorH],
          [-2.4, doorH],
        ],
      ],
    );
    part.push(crossW, crossE);
    // across each side block, at z = -0.3, with a door off the cross wall's side
    const zc = -0.3;
    for (const [xa, xb] of [
      [X_WEST_IN, LIVING_X0],
      [LIVING_X1, X_EAST_IN],
    ] as const) {
      const hx0 = (xa + xb) / 2 - door / 2;
      part.push(
        bx(xa, 0, zc - PT / 2, hx0, CEILING, zc + PT / 2),
        bx(hx0 + door, 0, zc - PT / 2, xb, CEILING, zc + PT / 2),
        bx(hx0, doorH, zc - PT / 2, hx0 + door, CEILING, zc + PT / 2),
      );
    }
    fixed('interior-partitions', mats.plaster, joined(part.slice(2)), 'partitions');
    // the two cross walls are meshes of their own, each with its own plaster: the `room` world lets a wall step aside by the side the camera is on
    for (const [geo, name] of [
      [crossW, 'partition-west'],
      [crossE, 'partition-east'],
    ] as const) {
      const pm = fixed('interior-partitions', mats.plaster.clone(), geo, name);
      (pm.material as THREE.Material).userData = { noShare: true };
    }
    // door leaves, ajar: timber, hinged on the cross walls' north jamb
    const leaves: THREE.BufferGeometry[] = [];
    for (const [xc, sgn] of [
      [LIVING_X0 + PT / 2, 1],
      [LIVING_X1 - PT / 2, -1],
    ] as const) {
      const g = new THREE.BoxGeometry(0.04, doorH - 0.03, door - 0.02);
      g.translate(0, (doorH - 0.03) / 2, (door - 0.02) / 2);
      g.rotateY(sgn * 0.9);
      g.translate(xc, 0.01, -2.4 + 0.0);
      leaves.push(g);
    }
    fixed('interior-partitions', mats.timber, joined(leaves), 'doors');
  }

  // ---------------------------------------------------------------------------------------------- the layout again, when the visitor moves the wall, the gap, the sheets
  const anchors: Record<string, THREE.Vector3> = {};
  const refreshAnchors = (): void => {
    const L = elementLayout(ctx.spec);
    anchors.southFacade = new THREE.Vector3(X_WEST + 1.2, Y_EAVE + 0.04, Z_SOUTH + EAVE);
    anchors.collector = new THREE.Vector3(bayX(SAMPLE_BAY), L.yBottom + 2.2, Z_SOUTH);
    anchors.recess = new THREE.Vector3(0, 2.7, Z_SOUTH + L.inner + 0.1);
    anchors.balcony = new THREE.Vector3(BAY * 0.2, R_ANCHOR, BZ1);
    anchors.window = new THREE.Vector3(bayX(WINDOW_BAY), WINDOW.sill + 1.5, Z_SOUTH);
    anchors.eastGable = new THREE.Vector3(X_EAST, 2.3, 0.0);
    anchors.westGable = new THREE.Vector3(X_WEST, 2.3, 0.0);
    anchors.northWall = new THREE.Vector3(3.6, 2.4, Z_NORTH);
    anchors.northWindow = new THREE.Vector3(-0.6, 1.9, Z_NORTH);
    anchors.roof = new THREE.Vector3(2.0, roofTop(1.5), 1.5);
    anchors.insulation = new THREE.Vector3(3.0, CEILING + CEILING_T + 0.1, -1.0);
    anchors.slab = new THREE.Vector3(2.0, -0.12, 0.8);
    anchors.foundation = new THREE.Vector3(-4.5, (GROUND_SOUTH + L.yBottom) / 2, Z_SOUTH);
    anchors.partitions = new THREE.Vector3(2.54, 2.0, -1.0);
    anchors.chimney = new THREE.Vector3(CHIMNEY.x, Y_RIDGE + CHIMNEY.above, CHIMNEY.z);
  };
  const R_ANCHOR = BALCONY.rail + 0.15;
  let spec = spec0;
  refreshAnchors();

  const windowGlass = (): number => {
    const f = FRAME.face;
    const w = WINDOW.w - 2 * f;
    const h = WINDOW.head - WINDOW.sill - 2 * f - 2 * f;
    const win = w * h;
    const xa = BAY * 2;
    const rec = (xa - 2 * 0.045 - RECESS.door) * (RECESS.transom - 0.08) + RECESS.door * 1.0 + xa * 0.4;
    return win + rec;
  };

  return {
    root,
    groups,
    scenery,
    collector,
    get spec() {
      return spec;
    },
    relayout(next: ElementSpec) {
      collector.relayout(next);
      ctx = ctxOf(next);
      for (const s of slots) {
        const g = s.mesh.geometry;
        s.mesh.geometry = s.make(ctx);
        g.dispose();
      }
      spec = next;
      refreshAnchors();
    },
    anchors,
    stair,
    downpipes,
    windowGlass,
    pieces,
  } as HouseBuild;
}

export { BAY_KINDS };
