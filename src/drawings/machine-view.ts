import { COLORS, W, type Pt, type View } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import {
  BALCONY,
  CEILING,
  CEILING_T,
  DEPTH,
  ELEMENT_1967,
  EAVE,
  FOOTING,
  FRAME,
  GROUND_NORTH,
  GROUND_SOUTH,
  ROOF,
  ROOM,
  SLAB,
  WALL,
  Y_EAVE,
  Y_RIDGE,
  elementLayout,
} from '../three/dims';
import { FILL, mm } from './draw';

// The north–south section of the house through the sample collector bay, drawn from dims.ts for the sheets that need it. The model frame of the view: X from the south front's outer face (the frame's front, X = 0) towards the north wall (X = DEPTH), Y up from
// the top of the floor slab, in millimetres. South is on the left, where the sun comes from. Every size is dims.ts's: the ground falls linearly from the north wall to the south front.

const L0 = elementLayout(ELEMENT_1967);
/** X of a point of the element's frame: `zrel` is the element frame's z (0 at the frame's front, negative into the house). */
export const xOf = (zrel: number): number => mm(-zrel);
/** The ground's height at X metres from the south front, m: linear between the two heights of dims.ts, carried on past the footprint. */
export const ground = (xm: number): number => GROUND_SOUTH + ((GROUND_NORTH - GROUND_SOUTH) * xm) / DEPTH;

export const SECTION_ANCHORS = {
  /** X of the black face, the inner face, the last sheet's back, in mm. */
  face: xOf(L0.face),
  inner: xOf(L0.inner),
  lastBack: xOf(L0.lastBack),
  frameBack: xOf(L0.frameBack),
  /** Heights of the element's ends and of the two duct axes, mm. */
  yTop: mm(L0.yTop),
  yBottom: mm(L0.yBottom),
  yLow: mm(L0.yDuctLow),
  yHigh: mm(L0.yDuctHigh),
  northIn: mm(DEPTH - WALL),
  north: mm(DEPTH),
} as const;

/** An arrow from `a` to `b` in model millimetres, with a head of `h` model millimetres. */
export function arrow(v: View, a: Pt, b: Pt, color: string, h = 110, w = W.medium): void {
  v.line(a, b, { w, color });
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const p = (da: number, r: number): Pt => [b[0] - r * Math.cos(ang + da), b[1] - r * Math.sin(ang + da)];
  v.polyline([b, p(0.42, h), p(-0.42, h)], { w: W.thin, color, fill: color, closed: true });
}

export interface SectionOptions {
  /** The winter loop, the summer draw, or none. */
  air?: 'winter' | 'summer' | 'none';
  /** The ground and its footing. */
  ground?: boolean;
}

/** Draws the section into `v` and returns where the loop's arrows ran, for the caller's labels. */
export function houseSection(v: View, o: SectionOptions = {}): void {
  const A = SECTION_ANCHORS;
  const hGlass = mm(ELEMENT_1967.glass);
  const duct = mm(ELEMENT_1967.ductHeight);
  const ductAbove = mm(L0.yDuctHigh);
  const cell = (xm: number): number => mm(ground(xm));
  // ground and foundation
  if (o.ground !== false) {
    const g0: Pt = [mm(-1.2), cell(-1.2)];
    const g1: Pt = [mm(DEPTH + 1.4), cell(DEPTH + 1.4)];
    v.polyline([g0, [mm(-1.2), mm(-3.6)], [mm(DEPTH + 1.4), mm(-3.6)], g1], {
      w: W.thin,
      fill: FILL.earth,
      closed: true,
      hatch: 'earth',
    });
    v.line(g0, g1, { w: W.medium });
    // foundation of the south wall: from the footing to the element's foot, under the frame and the wall
    v.rect([0, mm(GROUND_SOUTH - FOOTING)], [A.inner, A.yBottom], { w: W.medium, fill: FILL.concrete });
    // north wall's foundation
    v.rect([mm(DEPTH - WALL), mm(GROUND_NORTH - FOOTING)], [A.north, 0], { w: W.medium, fill: FILL.concrete });
  }
  // floor slab and its tile, inside, from the wall to the north wall
  v.rect([A.inner, mm(-SLAB)], [A.northIn, 0], { w: W.medium, fill: FILL.concrete });
  // the wall: concrete from the foot to the head, with the two ducts left through it
  v.rect([A.face, A.yBottom], [A.inner, mm(Y_EAVE)], { w: W.medium, fill: FILL.concrete });
  for (const y of [A.yLow, A.yHigh])
    v.rect([A.face, y - duct / 2], [A.inner, y + duct / 2], { w: W.thin, fill: FILL.air });
  // the head band over the front, carrying the roof
  v.rect([0, A.yTop], [A.inner, mm(Y_EAVE)], { w: W.medium, fill: FILL.concrete });
  // the air gap and the sheets
  v.rect([A.lastBack, A.yBottom], [A.face, A.yTop], { w: W.thin, fill: FILL.air });
  for (let k = 0; k < L0.sheetFront.length; k++) {
    const x0 = xOf(L0.sheetFront[k]!);
    v.rect([x0, A.yBottom], [x0 + hGlass, A.yTop], { w: W.medium, fill: FILL.glass });
  }
  // the frame: front rails at the foot and the head, a plate at the face
  v.rect([0, A.yBottom], [A.frameBack, A.yBottom + mm(FRAME.face)], { w: W.thin, fill: FILL.steel, hatch: 'steel' });
  v.rect([0, A.yTop - mm(FRAME.face)], [A.frameBack, A.yTop], { w: W.thin, fill: FILL.steel, hatch: 'steel' });
  // the black face
  v.line([A.face, A.yBottom], [A.face, A.yTop], { w: W.thick, color: COLORS.ink });
  // north wall, the ceiling and the insulation over it
  v.rect([A.northIn, mm(GROUND_NORTH)], [A.north, mm(Y_EAVE)], { w: W.medium, fill: FILL.concrete });
  v.rect([A.inner, mm(CEILING)], [A.northIn, mm(CEILING + CEILING_T)], { w: W.thin, fill: FILL.plaster });
  v.rect([A.inner, mm(CEILING + CEILING_T)], [A.northIn, mm(CEILING + CEILING_T + ROOF.insulation)], {
    w: W.thin,
    fill: FILL.insulation,
  });
  // the pitched roof: two slopes from the eaves to the ridge, one rafter and a covering thick
  const xr = mm(DEPTH / 2);
  const ex0 = mm(-EAVE);
  const ex1 = mm(DEPTH + EAVE);
  const slope = (xe: number): Pt[] => {
    const t = mm(ROOF.rafter + ROOF.cover);
    return [
      [xe, mm(Y_EAVE)],
      [xr, mm(Y_RIDGE)],
      [xr, mm(Y_RIDGE) + t],
      [xe, mm(Y_EAVE) + t * 1.15],
    ];
  };
  v.polyline(slope(ex0), { w: W.medium, fill: FILL.roof, closed: true });
  v.polyline(slope(ex1), { w: W.medium, fill: FILL.roof, closed: true });
  // the thermostat at 1.50 m on the north wall
  v.circle([A.northIn, mm(ROOM.thermostat)], 70, { w: W.medium, fill: COLORS.paper });
  // the balcony: the slab carried out, its rail
  v.rect([-mm(BALCONY.depth), mm(-SLAB)], [0, 0], { w: W.thin, fill: FILL.concrete });
  v.line([-mm(BALCONY.depth), 0], [-mm(BALCONY.depth), mm(BALCONY.rail)], { w: W.thin });
  void ductAbove;
  // the air: winter loop or summer draw
  const air = o.air ?? 'none';
  if (air === 'none') return;
  const gx = (A.lastBack + A.face) / 2;
  const red = '#c4552b';
  const blue = '#3a6f9a';
  if (air === 'winter') {
    arrow(v, [A.inner + 520, A.yLow], [gx + 20, A.yLow], blue);
    arrow(v, [gx, A.yLow], [gx, A.yHigh - 160], red, 120);
    arrow(v, [gx - 20, A.yHigh], [A.inner + 540, A.yHigh], red);
    // the flap, flat over the pocket above the upper duct
    v.line([A.lastBack, A.yHigh + duct / 2 + 40], [A.face, A.yHigh + duct / 2 + 40], {
      w: W.thick,
      color: COLORS.copper,
    });
  } else {
    arrow(v, [A.inner + 520, A.yLow], [gx + 20, A.yLow], blue);
    arrow(v, [gx, A.yLow], [gx, A.yTop + 330], red, 120);
    // the flap hangs over the upper duct's mouth: the air leaves by the head
    v.line([A.face - 20, A.yHigh - duct / 2], [A.face - 20, A.yHigh + duct / 2 + 160], {
      w: W.thick,
      color: COLORS.copper,
    });
    arrow(v, [gx, A.yTop + 330], [-mm(0.6), A.yTop + 520], red, 120);
  }
}

/** Sun's rays as short arrows from the south at a noon angle in degrees above the horizon, in the section's frame. */
export function rays(v: View, atX: number, atY: number, deg: number, len = 1500, n = 3, gap = 380): void {
  const a = (deg * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const tip: Pt = [atX, atY + i * gap];
    const tail: Pt = [atX - len * Math.cos(a), tip[1] + len * Math.sin(a)];
    arrow(v, tail, tip, '#d18a00', 100, W.thin);
  }
}

export const SECTION_LABELS = {
  sun: l('soleil de midi', 'noon sun'),
};
