import * as THREE from 'three';
import { boxAt, joined, polyShape, stick, tubeGeometry, uvMetric } from '../common';
import {
  ELEMENT_1967,
  FRAME,
  THERMOCOUPLE_DEPTHS,
  AIR_PROBE_FRACTIONS,
  elementLayout,
  type ElementLayout,
  type ElementSpec,
} from '../dims';
import type { WallPart } from '../ids';
import { WALL_PARTS } from '../ids';
import type { Mats } from '../materials';

// The collector element, built once from `dims.ts` and used by every world that shows it: `wall` draws one, `house` draws the nine of the south front (the same function, the same dimensions, moved into place by
// the instance matrices). In the order the sun meets it: the steel frame holding two sheets of glass, 12 cm of air, the black face, 60 cm of concrete with a duct at each end, the instruments of 1974–75. Element frame:
// x across the bay from its centre, y up from the floor's top, z = 0 at the outer face of the frame and negative into the house.
//
// Each slot is one mesh, an InstancedMesh with one instance per bay (the nine bays cost the draw calls of one), whose geometry is made from the spec: when the visitor moves the wall's thickness, the gap, the sheets or
// the ducts, `relayout` makes the geometry again and the instances stay. The instruments exist once, in one bay.

export interface Ctx {
  spec: ElementSpec;
  lay: ElementLayout;
}

type Maker = (c: Ctx) => THREE.BufferGeometry;

interface Slot {
  mesh: THREE.Mesh;
  make: Maker;
  /** Hidden when this returns false (the third sheet when there are two). */
  shown?: (c: Ctx) => boolean;
}

export interface ElementBuild {
  /** The element's frame: the world places this. */
  root: THREE.Group;
  /** One group per part of the `wall` world; a world registers them, or shows them as the pieces of a part of its own. */
  groups: Record<WallPart, THREE.Group>;
  /** x of each bay's instance. */
  bays: readonly number[];
  /** Which of the bays carries the instruments (an index into `bays`), or null. */
  instrumented: number | null;
  spec: ElementSpec;
  layout: ElementLayout;
  relayout(spec: ElementSpec): void;
  /** 0: the winter position (the flap closes the pocket above the duct and the air goes into the room), 1: the summer position (the flap closes the upper duct and the air leaves by the head). */
  setFlap(open: number): void;
  flap: number;
  /** The beads and leads inside the concrete: visible only while the section shows them. */
  cutOnly: THREE.Object3D[];
  /** The solid concrete pieces whose cut faces carry the heat: sill, wall and head (for the section's caps). */
  materials: Mats;
  /** Where things are, for labels, caps and dots: recomputed on `relayout`. */
  anchors: Record<string, THREE.Vector3>;
}

const SPAN = (a: number, b: number): [number, number] => (a < b ? [a, b] : [b, a]);

/** A box from ranges on each axis, in any order. */
function B(x: [number, number], y: [number, number], z: [number, number]): THREE.BufferGeometry {
  const [x0, x1] = SPAN(...x);
  const [y0, y1] = SPAN(...y);
  const [z0, z1] = SPAN(...z);
  return boxAt(x0, y0, z0, x1, y1, z1);
}

/** A rectangular ring (a frame round an opening) in the plane z, between two z. */
function ring(x0: number, y0: number, x1: number, y1: number, w: number, z: [number, number]): THREE.BufferGeometry[] {
  return [
    B([x0, x1], [y0, y0 + w], z),
    B([x0, x1], [y1 - w, y1], z),
    B([x0, x0 + w], [y0 + w, y1 - w], z),
    B([x1 - w, x1], [y0 + w, y1 - w], z),
  ];
}

// ------------------------------------------------------------------------------------------------ geometry makers
const paneGeos = (c: Ctx, k: number): THREE.BufferGeometry => {
  const { spec: s, lay: L } = c;
  const f = FRAME.face;
  const n = FRAME.panes;
  const openH = L.yTop - L.yBottom - 2 * f;
  const ph = (openH - (n - 1) * f) / n;
  const z0 = L.sheetFront[Math.min(k, L.sheetFront.length - 1)] ?? L.sheetFront[0]!;
  const parts: THREE.BufferGeometry[] = [];
  const hw = L.openW / 2 + 0.006;
  for (let j = 0; j < n; j++) {
    const y0 = L.yBottom + f + j * (ph + f) - 0.006;
    parts.push(B([-hw, hw], [y0, y0 + ph + 0.012], [z0 - s.glass, z0]));
  }
  return joined(parts);
};

const frameGeo: Maker = (c) => {
  const { spec: s, lay: L } = c;
  const w = s.width;
  const f = FRAME.face;
  const y0 = L.yBottom;
  const y1 = L.yTop;
  const z: [number, number] = [L.frameBack, 0];
  const n = FRAME.panes;
  const openH = y1 - y0 - 2 * f;
  const ph = (openH - (n - 1) * f) / n;
  const parts: THREE.BufferGeometry[] = [
    B([-w / 2, -w / 2 + f], [y0, y1], z),
    B([w / 2 - f, w / 2], [y0, y1], z),
    B([-w / 2 + f, w / 2 - f], [y0, y0 + f], z),
    B([-w / 2 + f, w / 2 - f], [y1 - f, y1], z),
  ];
  for (let k = 1; k < n; k++) {
    const yb = y0 + f + k * ph + (k - 1) * f;
    parts.push(B([-w / 2 + f, w / 2 - f], [yb, yb + f], z));
  }
  // angle brackets from the rails' backs to the beams' faces: the frame is carried by the concrete, not by the air. Plate along z, a leg on the face, two bolts.
  const face = L.face;
  for (const sx of [-0.4, 0.4]) {
    for (const top of [false, true]) {
      const y = top ? y1 - 0.011 : y0 + 0.011;
      const yLeg: [number, number] = top ? [y - 0.09, y + 0.0055] : [y - 0.0055, y + 0.09];
      parts.push(B([sx - 0.025, sx + 0.025], [y - 0.0055, y + 0.0055], [L.frameBack + 0.03, face + 0.006]));
      parts.push(B([sx - 0.025, sx + 0.025], yLeg, [face + 0.002, face + 0.006]));
      for (const dy of [0.025, 0.065]) {
        const yy = top ? y - dy : y + dy;
        parts.push(stick(new THREE.Vector3(sx, yy, face + 0.006), new THREE.Vector3(sx, yy, face + 0.0105), 0.008, 6));
      }
    }
  }
  void ph;
  return joined(parts);
};

const gasketGeo: Maker = (c) => {
  const { spec: s, lay: L } = c;
  const f = FRAME.face;
  const n = FRAME.panes;
  const openH = L.yTop - L.yBottom - 2 * f;
  const ph = (openH - (n - 1) * f) / n;
  const g = FRAME.gasket;
  const z: [number, number] = [L.sheetFront[0]! - 0.001, L.sheetFront[0]! + 0.003];
  const parts: THREE.BufferGeometry[] = [];
  for (let j = 0; j < n; j++) {
    const y0 = L.yBottom + f + j * (ph + f);
    parts.push(...ring(-L.openW / 2, y0, L.openW / 2, y0 + ph, g, z));
  }
  void s;
  return joined(parts);
};

const paintGeo: Maker = (c) => {
  const { spec: s, lay: L } = c;
  const w = s.width;
  const dw = s.ductWidth;
  const dh = s.ductHeight;
  const outline: [number, number][] = [
    [-w / 2, L.yBottom],
    [w / 2, L.yBottom],
    [w / 2, L.yTop],
    [-w / 2, L.yTop],
  ];
  const hole = (y: number): [number, number][] => [
    [-dw / 2, y],
    [-dw / 2, y + dh],
    [dw / 2, y + dh],
    [dw / 2, y],
  ];
  const shape = polyShape(outline, [hole(L.ySillTop), hole(L.yHeadBottom - dh)]);
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.002, bevelEnabled: false });
  g.translate(0, 0, L.face);
  return uvMetric(g);
};

const wallGeo: Maker = (c) => {
  const { spec: s, lay: L } = c;
  const w = s.width / 2;
  const d = s.ductWidth / 2;
  const dh = s.ductHeight;
  const ya = L.ySillTop;
  const yb = L.yHeadBottom;
  const pts: [number, number][] = [
    [-w, ya],
    [-d, ya],
    [-d, ya + dh],
    [d, ya + dh],
    [d, ya],
    [w, ya],
    [w, yb],
    [d, yb],
    [d, yb - dh],
    [-d, yb - dh],
    [-d, yb],
    [-w, yb],
  ];
  const g = new THREE.ExtrudeGeometry(polyShape(pts), { depth: s.thickness, bevelEnabled: false });
  g.translate(0, 0, L.inner);
  return uvMetric(g);
};

const sillGeo: Maker = (c) =>
  B([-c.spec.width / 2, c.spec.width / 2], [c.lay.yBottom, c.lay.ySillTop], [c.lay.inner, c.lay.face]);
const headGeo: Maker = (c) =>
  B([-c.spec.width / 2, c.spec.width / 2], [c.lay.yHeadBottom, c.lay.yTop], [c.lay.inner, c.lay.face]);

/** The sheet-metal sleeve of a duct, its flange on the black face and its grille on the room face. */
const ductSleeve =
  (upper: boolean): Maker =>
  (c) => {
    const { spec: s, lay: L } = c;
    const dw = s.ductWidth;
    const dh = s.ductHeight;
    const y0 = upper ? L.yHeadBottom - dh : L.ySillTop;
    const y1 = y0 + dh;
    const t = 0.003;
    const z: [number, number] = [L.inner, L.face];
    const parts: THREE.BufferGeometry[] = [
      B([-dw / 2, dw / 2], [y0, y0 + t], z),
      B([-dw / 2, dw / 2], [y1 - t, y1], z),
      B([-dw / 2, -dw / 2 + t], [y0 + t, y1 - t], z),
      B([dw / 2 - t, dw / 2], [y0 + t, y1 - t], z),
    ];
    // flange on the face, in front of the paint
    parts.push(
      ...ring(-dw / 2 - 0.022, y0 - 0.022, dw / 2 + 0.022, y1 + 0.022, 0.022 + 0.004, [L.face + 0.002, L.face + 0.007]),
    );
    return joined(parts);
  };

const ductGrille =
  (upper: boolean): Maker =>
  (c) => {
    const { spec: s, lay: L } = c;
    const dw = s.ductWidth;
    const dh = s.ductHeight;
    const y0 = upper ? L.yHeadBottom - dh : L.ySillTop;
    const y1 = y0 + dh;
    const zr: [number, number] = [L.inner - 0.014, L.inner + 0.002];
    const parts: THREE.BufferGeometry[] = ring(-dw / 2 - 0.03, y0 - 0.03, dw / 2 + 0.03, y1 + 0.03, 0.03 + 0.003, zr);
    // slats, off the opening's middle so the probe's rod passes between them
    for (const fy of upper ? [0.14, 0.3, 0.7, 0.86] : [0.2, 0.4, 0.6, 0.8]) {
      const g = new THREE.BoxGeometry(dw - 0.006, 0.004, 0.026);
      g.rotateX(upper ? 0.5 : -0.5);
      g.translate(0, y0 + fy * dh, L.inner - 0.006);
      parts.push(uvMetric(g));
    }
    return joined(parts);
  };

const gapGeo: Maker = (c) => {
  const { lay: L } = c;
  return B([-L.openW / 2, L.openW / 2], [L.yBottom + FRAME.face, L.yTop - FRAME.face], [L.lastBack, L.face + 0.002]);
};

/** The flap's plate, hanging from its hinge at the top of the upper duct's mouth (the plate's own frame: origin on the hinge axis, the plate going down). */
const flapLength = (s: ElementSpec): number => Math.max(0.05, Math.min(s.ductHeight + 0.01, s.gap - 0.015));
const flapPlate: Maker = (c) => {
  const { spec: s } = c;
  const L = flapLength(s);
  const w = s.ductWidth + 0.05;
  return B([-w / 2, w / 2], [-L, 0], [-0.002, 0.002]);
};
/** The hinge rod, its two brackets on the face and the crank at the east end, in the plate's frame at rest. */
const flapHinge: Maker = (c) => {
  const { spec: s, lay: L } = c;
  const w = s.ductWidth + 0.05;
  const parts: THREE.BufferGeometry[] = [
    stick(new THREE.Vector3(-w / 2 - 0.05, 0, 0), new THREE.Vector3(w / 2 + 0.08, 0, 0), 0.0045, 8),
  ];
  // two brackets, a small plate on the face with an eye round the rod: they stand from the face to the rod's axis
  for (const sx of [-w / 2 - 0.035, w / 2 + 0.03]) {
    parts.push(B([sx - 0.012, sx + 0.012], [-0.012, 0.012], [-0.012, 0.0]));
    parts.push(B([sx - 0.012, sx + 0.012], [-0.02, 0.02], [-0.012, -0.008]));
  }
  void L;
  return joined(parts);
};

// ------------------------------------------------------------------------------------------------ the build
export function buildElement(
  mats: Mats,
  spec0: ElementSpec = ELEMENT_1967,
  bays: readonly number[] = [0],
  instrumented: number | null = null,
): ElementBuild {
  const root = new THREE.Group();
  root.name = 'collector';
  const groups = {} as Record<WallPart, THREE.Group>;
  for (const id of WALL_PARTS) {
    const g = new THREE.Group();
    g.name = id;
    groups[id] = g;
    root.add(g);
  }
  const slots: Slot[] = [];
  let ctx: Ctx = { spec: spec0, lay: elementLayout(spec0) };

  const inst = (
    part: WallPart,
    material: THREE.Material,
    make: Maker,
    o: { cast?: boolean; receive?: boolean; name?: string; shown?: (c: Ctx) => boolean } = {},
  ): THREE.InstancedMesh => {
    const m = new THREE.InstancedMesh(make(ctx), material, bays.length);
    const mat4 = new THREE.Matrix4();
    bays.forEach((x, i) => m.setMatrixAt(i, mat4.makeTranslation(x, 0, 0)));
    m.instanceMatrix.needsUpdate = true;
    m.frustumCulled = false;
    m.castShadow = o.cast ?? true;
    m.receiveShadow = o.receive ?? true;
    m.name = o.name ?? `${part}-${slots.length}`;
    m.userData.dynamic = true;
    groups[part].add(m);
    slots.push({ mesh: m, make, shown: o.shown });
    return m;
  };
  const single = (
    part: WallPart,
    material: THREE.Material,
    make: Maker,
    o: { cast?: boolean; name?: string; x?: number } = {},
  ): THREE.Mesh => {
    const m = new THREE.Mesh(make(ctx), material);
    m.castShadow = o.cast ?? true;
    m.receiveShadow = true;
    m.position.x = o.x ?? 0;
    m.name = o.name ?? `${part}-${slots.length}`;
    m.userData.dynamic = true;
    groups[part].add(m);
    slots.push({ mesh: m, make });
    return m;
  };

  const glass = mats.glass;
  // sheets: the first is the outer glazing, the last (and the middle one of three) the inner glazing
  const outer = inst('outer-glazing', glass, (c) => paneGeos(c, 0), {
    cast: false,
    receive: false,
    name: 'outer-sheet',
  });
  const inner = inst('inner-glazing', glass, (c) => paneGeos(c, c.lay.sheetFront.length - 1), {
    cast: false,
    receive: false,
    name: 'inner-sheet',
    shown: (c) => c.lay.sheetFront.length >= 2,
  });
  const middle = inst('inner-glazing', glass, (c) => paneGeos(c, 1), {
    cast: false,
    receive: false,
    name: 'middle-sheet',
    shown: (c) => c.lay.sheetFront.length >= 3,
  });
  outer.renderOrder = 3;
  inner.renderOrder = 2;
  middle.renderOrder = 2;

  inst('steel-frame', mats.frame, frameGeo, { name: 'frame' });
  inst('steel-frame', mats.rubber, gasketGeo, { cast: false, name: 'gaskets' });

  const airMat = new THREE.MeshBasicMaterial({
    color: 0xcfe6ff,
    transparent: true,
    opacity: 0.045,
    depthWrite: false,
    fog: false,
    // the volume's faces lie in the planes of what bounds it (the paint's front at `face + 0.002`, the frame's jambs and rails, the last sheet's back): against an opaque face in the same plane a translucent one
    // fought for the depth test, in a checkerboard that changed with every frame. Pushed back, it always loses to the face it lies on.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 4,
  });
  const air = inst('air-gap', airMat, gapGeo, { cast: false, receive: false, name: 'air' });
  air.renderOrder = 1;

  inst('black-paint', mats.black, paintGeo, { name: 'paint' });
  inst('storage-wall', mats.concrete, wallGeo, { name: 'wall' });
  inst('sill-beam', mats.concrete, sillGeo, { name: 'sill' });
  inst('head-beam', mats.concrete, headGeo, { name: 'head' });
  inst('lower-duct', mats.zinc, ductSleeve(false), { name: 'lower-sleeve' });
  inst('lower-duct', mats.steel, ductGrille(false), { name: 'lower-grille' });
  inst('upper-duct', mats.zinc, ductSleeve(true), { name: 'upper-sleeve' });
  inst('upper-duct', mats.steel, ductGrille(true), { name: 'upper-grille' });

  // ---- the flap: a plate on a hinge, driven by `setFlap`. One matrix per bay, set again when it moves.
  const plate = new THREE.InstancedMesh(flapPlate(ctx), mats.zinc, bays.length);
  plate.name = 'flap-plate';
  plate.frustumCulled = false;
  plate.castShadow = true;
  plate.userData.dynamic = true;
  groups['summer-flap'].add(plate);
  slots.push({ mesh: plate, make: flapPlate });
  const hinge = new THREE.InstancedMesh(flapHinge(ctx), mats.steelDark, bays.length);
  hinge.name = 'flap-hinge';
  hinge.frustumCulled = false;
  hinge.castShadow = true;
  hinge.userData.dynamic = true;
  groups['summer-flap'].add(hinge);
  slots.push({ mesh: hinge, make: flapHinge });

  let flap = 0;
  const hingeY = (): number => ctx.lay.yHeadBottom;
  const hingeZ = (): number => ctx.lay.face + 0.012;
  const placeFlap = (): void => {
    const theta = -(Math.PI / 2) * (1 - flap);
    const m = new THREE.Matrix4();
    const r = new THREE.Matrix4();
    bays.forEach((x, i) => {
      m.makeTranslation(x, hingeY(), hingeZ());
      plate.setMatrixAt(i, m.clone().multiply(r.makeRotationX(theta)));
      hinge.setMatrixAt(i, m);
    });
    plate.instanceMatrix.needsUpdate = true;
    hinge.instanceMatrix.needsUpdate = true;
    plate.boundingBox = null;
    plate.boundingSphere = null;
    hinge.boundingBox = null;
    hinge.boundingSphere = null;
    placeCrank();
  };

  // ---- the instruments of 1974-75, in one bay
  const cutOnly: THREE.Object3D[] = [];
  const anchors: Record<string, THREE.Vector3> = {};
  const x0 = instrumented === null ? 0 : bays[instrumented]!;
  let crank: THREE.Mesh | null = null;
  let cord: THREE.Mesh | null = null;
  let placeCrank = (): void => {};

  if (instrumented !== null) {
    // thermocouples: beads at depths, leads to the room face, a bundle to a junction box
    const jBox = single(
      'wall-thermocouples',
      mats.steelDark,
      (c) => B([-0.38, -0.26], [1.45, 1.54], [c.lay.inner - 0.04, c.lay.inner - 0.002]),
      {
        name: 'junction-box',
        x: x0,
      },
    );
    const beads = single(
      'wall-thermocouples',
      mats.copper,
      (c) => {
        const parts = THERMOCOUPLE_DEPTHS.map((d, k) => {
          const depth = d * (c.spec.thickness / ELEMENT_1967.thickness);
          const g = new THREE.SphereGeometry(0.0085, 10, 8);
          g.translate(0, 1.6 + k * 0.045, c.lay.face - depth);
          return g;
        });
        return joined(parts);
      },
      { name: 'beads', cast: false, x: x0 },
    );
    const leads = single(
      'wall-thermocouples',
      mats.steel,
      (c) => {
        const parts = THERMOCOUPLE_DEPTHS.map((d, k) => {
          const depth = d * (c.spec.thickness / ELEMENT_1967.thickness);
          return stick(
            new THREE.Vector3(0, 1.6 + k * 0.045, c.lay.face - depth),
            new THREE.Vector3(0, 1.6 + k * 0.045, c.lay.inner),
            0.0018,
            6,
          );
        });
        return joined(parts);
      },
      { name: 'leads', cast: false, x: x0 },
    );
    const bundle = single(
      'wall-thermocouples',
      mats.rubber,
      (c) =>
        tubeGeometry(
          [
            new THREE.Vector3(0, 1.6, c.lay.inner),
            new THREE.Vector3(0.0, 1.62, c.lay.inner - 0.03),
            new THREE.Vector3(-0.1, 1.6, c.lay.inner - 0.045),
            new THREE.Vector3(-0.28, 1.56, c.lay.inner - 0.042),
            new THREE.Vector3(-0.32, 1.544, c.lay.inner - 0.03),
          ],
          0.0045,
          24,
          6,
        ),
      { name: 'bundle', cast: false, x: x0 },
    );
    // the beads and the leads lie in the section's plane, inside the concrete: seen only while the world cuts it
    for (const m of [beads, leads]) {
      m.userData.cutOnly = true;
      m.userData.notClipped = true;
      cutOnly.push(m);
    }
    void jBox;
    void bundle;

    // air thermocouples: a stem hung from the head beam, three radiation screens of aluminium on short arms
    single(
      'air-thermocouples',
      mats.alu,
      (c) => {
        const { lay: L, spec: s } = c;
        const zc = (L.lastBack + L.face) / 2;
        const sx = -0.25;
        const top = L.yHeadBottom;
        const span = s.ductSpan;
        const lowest = L.yDuctLow + span * AIR_PROBE_FRACTIONS[0]!;
        const parts: THREE.BufferGeometry[] = [
          // the clip under the head beam
          B([sx - 0.02, sx + 0.02], [top - 0.012, top], [zc - 0.02, zc + 0.02]),
          stick(new THREE.Vector3(sx, top - 0.012, zc), new THREE.Vector3(sx, lowest - 0.12, zc), 0.0025, 6),
        ];
        for (const fr of AIR_PROBE_FRACTIONS) {
          const y = L.yDuctLow + span * fr;
          // the arm, then the screen: a vented sleeve round the junction, open at both ends
          parts.push(stick(new THREE.Vector3(sx, y, zc), new THREE.Vector3(sx + 0.035, y, zc), 0.0022, 6));
          const sleeve = new THREE.CylinderGeometry(0.02, 0.02, 0.075, 14, 1, true);
          sleeve.translate(sx + 0.055, y, zc);
          parts.push(sleeve);
          const cap = new THREE.CylinderGeometry(0.023, 0.023, 0.006, 14);
          cap.translate(sx + 0.055, y + 0.0405, zc);
          parts.push(cap);
        }
        return joined(parts);
      },
      { name: 'air-probes', x: x0 },
    );
    // the wire up the stem, into the head beam: drawn as a thin dark line beside the stem
    single(
      'air-thermocouples',
      mats.rubber,
      (c) => {
        const { lay: L, spec: s } = c;
        const zc = (L.lastBack + L.face) / 2;
        const sx = -0.25 + 0.006;
        const lowest = L.yDuctLow + s.ductSpan * AIR_PROBE_FRACTIONS[0]!;
        return stick(
          new THREE.Vector3(sx, lowest - 0.1, zc),
          new THREE.Vector3(sx, L.yHeadBottom - 0.002, zc),
          0.0014,
          5,
        );
      },
      { name: 'air-probe-wire', cast: false, x: x0 },
    );

    // the hot-wire anemometer: a probe through the lower duct's grille, its tip in the middle of the tunnel (the paper's « centre of the lower duct », S1 p. 203), a cable up the wall's face to the junction box
    single(
      'hot-wire-anemometer',
      mats.steel,
      (c) => {
        const { lay: L } = c;
        const y = L.yDuctLow;
        const px = -0.05;
        const zTip = (L.face + L.inner) / 2;
        const zGrip = L.inner - 0.2;
        const parts: THREE.BufferGeometry[] = [
          stick(new THREE.Vector3(px, y, zGrip), new THREE.Vector3(px, y, zTip), 0.003, 8),
        ];
        // the two prongs, and the hot wire across them
        for (const dx of [-0.006, 0.006])
          parts.push(stick(new THREE.Vector3(px + dx, y, zTip), new THREE.Vector3(px + dx, y, zTip - 0.02), 0.0012, 5));
        parts.push(
          stick(
            new THREE.Vector3(px - 0.006, y, zTip - 0.02),
            new THREE.Vector3(px + 0.006, y, zTip - 0.02),
            0.0006,
            4,
          ),
        );
        return joined(parts);
      },
      { name: 'anemometer-probe', x: x0 },
    );
    single(
      'hot-wire-anemometer',
      mats.rubber,
      (c) => {
        const { lay: L } = c;
        const y = L.yDuctLow;
        // the grip, a cylinder on the probe's rear, then the cable up the wall's face to the junction box's underside
        const grip = new THREE.CylinderGeometry(0.014, 0.014, 0.11, 12);
        grip.rotateX(Math.PI / 2);
        grip.translate(-0.05, y, L.inner - 0.255);
        const cable = tubeGeometry(
          [
            new THREE.Vector3(-0.05, y, L.inner - 0.31),
            new THREE.Vector3(-0.06, y + 0.12, L.inner - 0.2),
            new THREE.Vector3(-0.2, y + 0.6, L.inner - 0.06),
            new THREE.Vector3(-0.32, 1.2, L.inner - 0.03),
            new THREE.Vector3(-0.32, 1.451, L.inner - 0.03),
          ],
          0.0035,
          30,
          6,
        );
        return joined([grip, cable]);
      },
      { name: 'anemometer-cable', cast: false, x: x0 },
    );
    // the flap's cord: from the crank's tip to an eye under the head beam, and on through the beam to a knob on its room face
    crank = single('summer-flap', mats.steelDark, () => new THREE.BoxGeometry(0.012, 0.05, 0.012), {
      name: 'crank',
      x: x0,
    });
    cord = single('summer-flap', mats.rubber, () => new THREE.CylinderGeometry(0.0016, 0.0016, 1, 5), {
      name: 'cord',
      cast: false,
      x: x0,
    });
    single(
      'summer-flap',
      mats.brass,
      (c) => {
        const { lay: L } = c;
        const parts: THREE.BufferGeometry[] = [];
        // the eye under the head beam, and a small knob and its plate on the beam's room face
        const eye = new THREE.TorusGeometry(0.008, 0.002, 6, 12);
        eye.rotateX(Math.PI / 2);
        eye.translate(-0.41, L.yHeadBottom - 0.002, L.face + 0.03);
        parts.push(eye);
        const knob = new THREE.SphereGeometry(0.014, 10, 8);
        knob.translate(-0.41, L.yTop - 0.06, L.inner - 0.03);
        parts.push(knob);
        parts.push(
          stick(
            new THREE.Vector3(-0.41, L.yTop - 0.06, L.inner),
            new THREE.Vector3(-0.41, L.yTop - 0.06, L.inner - 0.025),
            0.004,
            6,
          ),
        );
        return joined(parts);
      },
      { name: 'cord-fittings', x: x0 },
    );
    placeCrank = (): void => {
      if (!crank || !cord) return;
      const { lay: L } = ctx;
      // the crank hangs from the rod at the east end and turns with the plate
      const theta = -(Math.PI / 2) * (1 - flap);
      const hy = L.yHeadBottom;
      const hz = L.face + 0.012;
      const cx = x0 - 0.322;
      // crank points away from the plate: when the plate hangs (theta 0) it points up and back, when the plate is horizontal it points back and up
      const along = new THREE.Vector3(0, 0.025, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), theta + Math.PI);
      crank.position.set(cx, hy + along.y, hz + along.z);
      crank.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), theta + Math.PI);
      const tip = new THREE.Vector3(cx, hy + along.y * 2, hz + along.z * 2);
      const eye = new THREE.Vector3(x0 - 0.41, hy - 0.002, L.face + 0.03);
      const mid = tip.clone().add(eye).multiplyScalar(0.5);
      const len = tip.distanceTo(eye);
      cord.position.copy(mid);
      cord.scale.set(1, len, 1);
      cord.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), eye.clone().sub(tip).normalize());
    };
  }

  const refreshAnchors = (): void => {
    const L = ctx.lay;
    const zMid = (L.lastBack + L.face) / 2;
    // the labels' heights are set on the 1967 element (4.38 m); a shorter one (the 1974 preset, 2.5 m) keeps them at the same shares of its height, so that each stays on its part
    const k = ctx.spec.height / ELEMENT_1967.height;
    anchors.outerGlazing = new THREE.Vector3(x0, L.yBottom + 3.25 * k, L.sheetFront[0]!);
    anchors.innerGlazing = new THREE.Vector3(
      x0 - 0.5,
      L.yBottom + 1.4 * k,
      L.sheetFront[L.sheetFront.length - 1]! - ctx.spec.glass,
    );
    anchors.steelFrame = new THREE.Vector3(x0 + ctx.spec.width / 2, L.yTop - 0.02, -0.03);
    anchors.airGap = new THREE.Vector3(x0 + 0.3, L.yDuctLow + 0.8 * k, zMid);
    anchors.blackPaint = new THREE.Vector3(x0 + 0.3, L.yDuctLow + 2.35 * k, L.face);
    anchors.storageWall = new THREE.Vector3(x0, L.yDuctLow + 1.55 * k, (L.face + L.inner) / 2);
    anchors.upperDuct = new THREE.Vector3(x0, L.yDuctHigh, L.inner);
    anchors.lowerDuct = new THREE.Vector3(x0, L.yDuctLow, L.inner);
    anchors.summerFlap = new THREE.Vector3(x0, L.yHeadBottom - 0.01, L.face + 0.06);
    anchors.headBeam = new THREE.Vector3(x0 - 0.45, (L.yHeadBottom + L.yTop) / 2, L.inner);
    anchors.sillBeam = new THREE.Vector3(x0 - 0.45, (L.yBottom + L.ySillTop) / 2, L.inner);
    anchors.wallThermocouples = new THREE.Vector3(x0 - 0.32, Math.min(1.5, L.yTop - 0.5), L.inner - 0.04);
    anchors.airThermocouples = new THREE.Vector3(x0 - 0.25 + 0.055, L.yDuctLow + ctx.spec.ductSpan * 0.5, zMid);
    anchors.anemometer = new THREE.Vector3(x0 - 0.05, L.yDuctLow, L.inner - 0.255);
  };

  const apply = (): void => {
    for (const s of slots) {
      const g = s.mesh.geometry;
      s.mesh.geometry = s.make(ctx);
      g.dispose();
      const im = s.mesh as THREE.InstancedMesh;
      if (im.isInstancedMesh) {
        // the cached bounds belong to the old geometry
        im.boundingBox = null;
        im.boundingSphere = null;
      }
      if (s.shown) s.mesh.visible = s.shown(ctx);
    }
    refreshAnchors();
    placeFlap();
  };
  for (const s of slots) if (s.shown) s.mesh.visible = s.shown(ctx);
  refreshAnchors();
  placeFlap();

  return {
    root,
    groups,
    bays,
    instrumented,
    get spec() {
      return ctx.spec;
    },
    get layout() {
      return ctx.lay;
    },
    get flap() {
      return flap;
    },
    cutOnly,
    materials: mats,
    anchors,
    relayout(spec: ElementSpec) {
      const a = ctx.spec;
      if (
        Math.abs(spec.thickness - a.thickness) < 1e-4 &&
        Math.abs(spec.gap - a.gap) < 1e-4 &&
        spec.layers === a.layers &&
        Math.abs(spec.ductWidth - a.ductWidth) < 1e-4 &&
        Math.abs(spec.height - a.height) < 1e-4 &&
        Math.abs(spec.width - a.width) < 1e-4
      )
        return;
      ctx = { spec, lay: elementLayout(spec) };
      apply();
    },
    setFlap(open: number) {
      const v = Math.min(1, Math.max(0, open));
      if (Math.abs(v - flap) < 1e-4) return;
      flap = v;
      placeFlap();
    },
  } as ElementBuild;
}
