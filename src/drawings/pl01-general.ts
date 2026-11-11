import { COLORS, Drawing, W, type DrawingSheet, type Pt, type View } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import {
  BALCONY,
  BAY,
  BAYS,
  BAY_KINDS,
  CHIMNEY,
  COLLECTOR_BAYS,
  CUT_X,
  DEPTH,
  ELEMENT_1967,
  EAVE,
  FRAME,
  GROUND_NORTH,
  GROUND_SOUTH,
  HEAD_BAND,
  LENGTH,
  LIVING_X0,
  LIVING_X1,
  PARTITION,
  RECESS,
  RECESS_BAYS,
  ROOM,
  WALL,
  WINDOW,
  WINDOW_BAY,
  X_EAST,
  X_WEST,
  Y_EAVE,
  Y_RIDGE,
  Z_NORTH,
  Z_NORTH_IN,
  Z_SOUTH,
  bayX,
  elementLayout,
} from '../three/dims';
import { cat, fig, FILL, grid, heading, marksLegend, mL, mm, note } from './draw';

// PL-H01: the house in plan and in south elevation at 1:110, drawn from dims.ts. Every length that is the 3D's own carries its star; the bay width, the element and the wall are the paper's and carry none. The bays' layout is read from one small photograph.

const L0 = elementLayout(ELEMENT_1967);
const S = 1 / 110;
/** Plan: east to the right, north up; the south front is at the bottom. */
const P = (x: number, z: number): Pt => [mm(x), mm(-z)];
const E = (x: number, y: number): Pt => [mm(x), mm(y)];
const recessC = (bayX(RECESS_BAYS[0]!) + bayX(RECESS_BAYS[1]!)) / 2;
/** Risers of the balcony's stair: the ground's fall over the riser, rounded up. derived from estimates */
const RISERS = Math.ceil(-GROUND_SOUTH / BALCONY.rise);

function plan(d: Drawing): View {
  const v = d.view(116, 68, S);
  const zIn = Z_SOUTH + L0.inner;
  const zFace = Z_SOUTH + L0.face;
  const zBack = Z_SOUTH + L0.lastBack;
  // the rooms' floor, the living room lighter
  v.rect(P(X_WEST + WALL, zIn), P(X_EAST - WALL, Z_NORTH_IN), { w: W.thin, fill: FILL.plaster });
  v.rect(P(LIVING_X0, zIn), P(LIVING_X1, Z_NORTH_IN), { w: W.thin, fill: FILL.glass });
  // the walls: north, the two gables
  // the north wall, with the north window's opening in it (its x is `ROOM.northWindow.x`)
  const nwx = ROOM.northWindow;
  v.rect(P(X_WEST, Z_NORTH), P(nwx.x - nwx.w / 2, Z_NORTH_IN), { w: W.medium, fill: FILL.concrete });
  v.rect(P(nwx.x + nwx.w / 2, Z_NORTH), P(X_EAST, Z_NORTH_IN), { w: W.medium, fill: FILL.concrete });
  v.line(P(nwx.x - nwx.w / 2, Z_NORTH + WALL / 2), P(nwx.x + nwx.w / 2, Z_NORTH + WALL / 2), {
    w: W.medium,
    color: '#4a8fb0',
  });
  v.rect(P(X_WEST, Z_NORTH), P(X_WEST + WALL, Z_SOUTH), { w: W.medium, fill: FILL.concrete });
  v.rect(P(X_EAST - WALL, Z_NORTH), P(X_EAST, Z_SOUTH), { w: W.medium, fill: FILL.concrete });
  // the south front, bay by bay
  BAY_KINDS.forEach((k, i) => {
    const x0 = bayX(i) - BAY / 2;
    const x1 = bayX(i) + BAY / 2;
    if (k === 'collector') {
      v.rect(P(x0, zIn), P(x1, zFace), { w: W.medium, fill: FILL.concrete });
      v.rect(P(x0, zFace), P(x1, zBack), { w: W.thin, fill: FILL.air });
      for (const sf of L0.sheetFront)
        v.line(P(x0, Z_SOUTH + sf), P(x1, Z_SOUTH + sf), { w: W.medium, color: '#4a8fb0' });
      v.line(P(x0, Z_SOUTH), P(x1, Z_SOUTH), { w: W.thin });
    } else if (k === 'window') {
      v.rect(P(x0, zIn), P(bayX(i) - WINDOW.w / 2, Z_SOUTH), { w: W.medium, fill: FILL.concrete });
      v.rect(P(bayX(i) + WINDOW.w / 2, zIn), P(x1, Z_SOUTH), { w: W.medium, fill: FILL.concrete });
      v.line(
        P(bayX(i) - WINDOW.w / 2, Z_SOUTH + L0.sheetFront[0]!),
        P(bayX(i) + WINDOW.w / 2, Z_SOUTH + L0.sheetFront[0]!),
        {
          w: W.medium,
          color: '#4a8fb0',
        },
      );
    } else {
      // the recess: nothing but the door in the plane of the inner face
      v.line(P(x0, zIn), P(x1, zIn), { w: W.medium, color: '#4a8fb0' });
    }
  });
  // the balcony and its stair, from the recess out to the south
  v.rect(P(recessC - BALCONY.width / 2, Z_SOUTH), P(recessC + BALCONY.width / 2, Z_SOUTH + BALCONY.depth), {
    w: W.medium,
    fill: FILL.concrete,
  });
  const zStair = Z_SOUTH + BALCONY.depth;
  v.rect(P(recessC - BALCONY.stairW / 2, zStair), P(recessC + BALCONY.stairW / 2, zStair + RISERS * BALCONY.tread), {
    w: W.thin,
    fill: FILL.plaster,
    dash: 'hidden',
  });
  for (let k = 1; k < RISERS; k++)
    v.line(
      P(recessC - BALCONY.stairW / 2, zStair + k * BALCONY.tread),
      P(recessC + BALCONY.stairW / 2, zStair + k * BALCONY.tread),
      {
        w: W.thin,
      },
    );
  // the partitions: two cross walls at the living room, one across each side block
  const xs = [X_WEST + WALL, LIVING_X0, LIVING_X1, X_EAST - WALL];
  for (const x of [LIVING_X0, LIVING_X1])
    v.rect(P(x - PARTITION.t / 2, zIn), P(x + PARTITION.t / 2, Z_NORTH_IN), { w: W.thin, fill: FILL.concrete });
  for (const [a, b] of [
    [xs[0]!, xs[1]!],
    [xs[2]!, xs[3]!],
  ] as const) {
    const xm = (a + b) / 2;
    v.rect(P(xm - PARTITION.t / 2, zIn), P(xm + PARTITION.t / 2, Z_NORTH_IN), { w: W.thin, fill: FILL.concrete });
  }
  // the chimney, above the ceiling
  v.rect(
    P(CHIMNEY.x - CHIMNEY.w / 2, CHIMNEY.z - CHIMNEY.d / 2),
    P(CHIMNEY.x + CHIMNEY.w / 2, CHIMNEY.z + CHIMNEY.d / 2),
    {
      w: W.medium,
      fill: FILL.roof,
    },
  );
  // the section's plane through the sample bay
  v.line(P(CUT_X, Z_SOUTH + 1.9), P(CUT_X, Z_NORTH - 0.7), { w: W.medium, dash: 'center', color: COLORS.red });
  v.text(P(CUT_X, Z_NORTH - 1.15), 'A', { size: 3, weight: 'bold', anchor: 'middle', color: COLORS.red });
  // north
  v.line(P(X_EAST + 0.7, Z_NORTH + 0.2), P(X_EAST + 0.7, Z_NORTH - 1.4), { w: W.medium });
  v.text(P(X_EAST + 0.7, Z_NORTH - 1.9), 'N', { size: 3, weight: 'bold', anchor: 'middle' });
  // dimensions: the length by its twelve bays, the depth
  v.dim(P(X_WEST, Z_NORTH), P(X_EAST, Z_NORTH), -9, { dir: 'h', label: mL(LENGTH, '*', 2), size: 2 });
  v.dim(P(X_EAST, Z_NORTH), P(X_EAST, Z_SOUTH), 7, { dir: 'v', label: mL(DEPTH, '*', 1), size: 2 });
  v.dim(P(X_WEST, Z_SOUTH), P(X_WEST + BAY, Z_SOUTH), 22, { dir: 'h', label: mL(BAY, '', 2), size: 2 });
  // labels
  v.leader(P(bayX(1), zIn - 0.3), 6, 26, l('capteur, 9 travées', 'collector, 9 bays'), { size: 1.9 });
  v.leader(P(bayX(WINDOW_BAY), zIn - 0.1), 6, 22, l('fenêtre', 'window'), { size: 1.9 });
  v.leader(P(recessC, zIn + 0.2), 4, 36, l('entrée en retrait', 'entrance recess'), { size: 1.9 });
  v.leader(P(recessC + BALCONY.width / 2, Z_SOUTH + 0.6), 28, 30, l('balcon, escalier', 'balcony, stair'), {
    size: 1.9,
  });
  v.leader(P(LIVING_X0 + 0.9, Z_NORTH_IN + 1.3), 0, 26, l('salon', 'living room'), { size: 1.9 });
  v.leader(P(CHIMNEY.x, CHIMNEY.z), -8, -16, l('cheminée', 'chimney'), { size: 1.9 });
  // to the left of the length's figure, which sits above the middle of the north wall
  v.leader(P(nwx.x, Z_NORTH + 0.1), -22, -13, l('fenêtre nord', 'north window'), { size: 1.9 });
  v.leader(P(X_WEST + WALL / 2, -0.9), 8, 3, l('pignon', 'gable'), { size: 1.9 });
  v.caption(E(0, -9.0), l('PLAN, AU NIVEAU DE LA DALLE', 'PLAN, AT THE LEVEL OF THE SLAB'), '1:110');
  return v;
}

function elevation(d: Drawing): View {
  const v = d.view(116, 221, S);
  // the ground at the south front, and the foundation under the front
  v.line(E(X_WEST - 1.2, GROUND_SOUTH), E(X_EAST + 1.2, GROUND_SOUTH), { w: W.medium });
  v.rect(E(X_WEST, GROUND_SOUTH), E(X_EAST, L0.yBottom), { w: W.thin, fill: FILL.concrete });
  // the south roof plane and the head band under it
  v.rect(E(X_WEST - EAVE, Y_EAVE), E(X_EAST + EAVE, Y_RIDGE), { w: W.medium, fill: FILL.roof });
  v.rect(E(X_WEST, L0.yTop), E(X_EAST, Y_EAVE), { w: W.medium, fill: FILL.concrete });
  // the chimney, through the north slope: its top is `CHIMNEY.above` over the ridge line, as in the 3D
  const top = Y_RIDGE + CHIMNEY.above;
  v.rect(E(CHIMNEY.x - CHIMNEY.w / 2, Y_RIDGE - 0.15), E(CHIMNEY.x + CHIMNEY.w / 2, top), {
    w: W.medium,
    fill: FILL.plaster,
  });
  // the bays
  BAY_KINDS.forEach((k, i) => {
    const x0 = bayX(i) - BAY / 2;
    const x1 = bayX(i) + BAY / 2;
    if (k === 'collector') {
      v.rect(E(x0, L0.yBottom), E(x1, L0.yTop), { w: W.medium, fill: FILL.glass });
      const h = (L0.yTop - L0.yBottom) / FRAME.panes;
      for (let j = 1; j < FRAME.panes; j++) v.line(E(x0, L0.yBottom + j * h), E(x1, L0.yBottom + j * h), { w: W.thin });
    } else if (k === 'window') {
      v.rect(E(x0, L0.yBottom), E(x1, L0.yTop), { w: W.medium, fill: FILL.concrete });
      v.rect(E(bayX(i) - WINDOW.w / 2, WINDOW.sill), E(bayX(i) + WINDOW.w / 2, WINDOW.head), {
        w: W.medium,
        fill: FILL.glass,
      });
      for (let j = 1; j < 3; j++) {
        const y = WINDOW.sill + ((WINDOW.head - WINDOW.sill) * j) / 3;
        v.line(E(bayX(i) - WINDOW.w / 2, y), E(bayX(i) + WINDOW.w / 2, y), { w: W.thin });
      }
    } else {
      v.rect(E(x0, L0.yBottom), E(x1, L0.yTop), { w: W.thin, fill: FILL.plaster });
    }
  });
  // the door, its transom, the balcony, its rail and its stair
  v.rect(E(recessC - RECESS.door / 2, 0), E(recessC + RECESS.door / 2, RECESS.doorH), {
    w: W.medium,
    fill: FILL.glass,
  });
  v.line(E(recessC - BAY, RECESS.transom), E(recessC + BAY, RECESS.transom), { w: W.thin });
  v.rect(E(recessC - BALCONY.width / 2, -0.2), E(recessC + BALCONY.width / 2, 0), { w: W.medium, fill: FILL.concrete });
  v.line(E(recessC - BALCONY.width / 2, BALCONY.rail), E(recessC + BALCONY.width / 2, BALCONY.rail), { w: W.medium });
  v.line(E(recessC - BALCONY.width / 2, 0), E(recessC - BALCONY.width / 2, BALCONY.rail), { w: W.thin });
  v.line(E(recessC + BALCONY.width / 2, 0), E(recessC + BALCONY.width / 2, BALCONY.rail), { w: W.thin });
  for (let k = 1; k <= RISERS; k++)
    v.line(E(recessC - BALCONY.stairW / 2, -k * BALCONY.rise), E(recessC + BALCONY.stairW / 2, -k * BALCONY.rise), {
      w: W.thin,
    });
  // the slab's level and the bay numbers
  v.line(E(X_WEST - 0.6, 0), E(X_WEST, 0), { w: W.thin, dash: 'center' });
  for (let i = 0; i < BAYS; i++)
    v.text(E(bayX(i), GROUND_SOUTH - 0.55), String(i + 1), {
      size: 1.8,
      anchor: 'middle',
      baseline: 'top',
      mono: true,
    });
  // dimensions: the element's height (the paper's), the ridge and the eave (estimates), the ground's drop
  v.dim(E(X_EAST + 0.9, L0.yBottom), E(X_EAST + 0.9, L0.yTop), 3, {
    dir: 'v',
    label: mL(L0.yTop - L0.yBottom, '', 2),
    size: 2,
  });
  v.dim(E(X_EAST + 0.9, 0), E(X_EAST + 0.9, Y_RIDGE), 14, { dir: 'v', label: mL(Y_RIDGE, '*', 1), size: 2 });
  v.dim(E(X_WEST - 1.2, GROUND_SOUTH), E(X_WEST - 1.2, 0), -3, { dir: 'v', label: mL(-GROUND_SOUTH, '*', 1), size: 2 });
  v.dim(E(X_WEST, GROUND_SOUTH - 1.0), E(X_WEST + 4 * BAY, GROUND_SOUTH - 1.0), 4, {
    dir: 'h',
    label: cat(l('4 travées ', '4 bays '), mL(4 * BAY, '†', 2)),
    size: 2,
  });
  v.leader(E(bayX(2), 2.2), -10, -22, l('capteur', 'collector'), { size: 1.9 });
  v.leader(E(CHIMNEY.x, top), 14, -3, l('cheminée', 'chimney'), { size: 1.9 });
  v.caption(E(0, GROUND_SOUTH - 1.9), l('FAÇADE SUD', 'SOUTH ELEVATION'), '1:110');
  return v;
}

export const generalSheet: DrawingSheet = {
  id: 'general-arrangement',
  number: 'PL-H01',
  group: 'house',
  title: l('La maison en plan et en élévation', 'The house in plan and elevation'),
  description: l(
    'La maison de 1967 vue de dessus au niveau de la dalle, puis la façade sud : douze travées de 1,27 m, neuf de capteur, une de fenêtre, deux d’entrée en retrait avec le balcon. Le plan de A à A est celui de la coupe. Les cotes de l’élément et de la travée sont celles de l’article ; la longueur, la profondeur, le toit, les pièces et le balcon sont nos estimations, marquées d’une étoile. La répartition des travées est lue sur une seule petite photographie.',
    '1967 house seen from above at the level of the slab, then the south front: twelve bays of 1.27 m, nine of collector, one of window, two of recessed entrance with the balcony. The plane from A to A is the section’s. The element’s and the bay’s dimensions are the paper’s; the length, the depth, the roof, the rooms and the balcony are our estimates, marked with a star. The bays’ layout is read from one small photograph.',
  ),
  scene: 'house',
  parts: [
    'south-facade',
    'collector-element',
    'entrance-recess',
    'entrance-balcony',
    'south-window',
    'interior-partitions',
  ],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Maison de 1967 — plan et façade', '1967 house — plan and front'),
      subtitle: l('Plan à la dalle, élévation sud', 'Plan at the slab, south elevation'),
      number: 'PL-H01',
      scale: '1:110',
    });
    plan(d);
    elevation(d);
    // right column: the legend, then what each figure is
    const x = 244;
    let y = 22;
    y = heading(d, x, y, l('Lire les chiffres', 'Reading the figures'));
    y = marksLegend(d, x, y, 160);
    y = heading(d, x, y + 3, l('Les travées, de l’ouest à l’est', 'The bays, west to east'));
    const kinds = BAY_KINDS.map((k, i) => (k === 'collector' ? `${i + 1}` : '')).filter(Boolean);
    y = note(
      d,
      x,
      y,
      160,
      cat(
        l('Capteur : travées ', 'Collector: bays '),
        kinds.join(', '),
        l(`, soit ${COLLECTOR_BAYS.length} fois `, `, that is ${COLLECTOR_BAYS.length} times `),
        fig('elemArea'),
        l(
          ` de mur ; fenêtre : travée ${WINDOW_BAY + 1} ; entrée : ${RECESS_BAYS.map((b) => b + 1).join(' et ')}.`,
          ` of wall; window: bay ${WINDOW_BAY + 1}; entrance: ${RECESS_BAYS.map((b) => b + 1).join(' and ')}.`,
        ),
      ),
    );
    y = heading(d, x, y + 2, l('Ce que la 3D dessine', 'What the 3D draws'));
    y += grid(
      d,
      x,
      y,
      [
        { label: l('Grandeur', 'Quantity'), w: 84 },
        { label: l('Valeur', 'Value'), w: 76, align: 'end', mono: true },
      ],
      [
        [
          l('Élément, hauteur × largeur', 'Element, height × width'),
          cat(mL(L0.yTop - L0.yBottom, '', 2), ' × ', mL(BAY, '', 2)),
        ],
        [l('Mur de stockage', 'Storage wall'), mL(ELEMENT_1967.thickness, '', 2)],
        [l('Verre net, neuf travées', 'Net glass, nine bays'), fig('glassNet')],
        [l('Autres murs', 'Other walls'), mL(WALL, '*', 2)],
        [l('Faîtage, au-dessus de la dalle', 'Ridge, above the slab'), mL(Y_RIDGE, '*', 1)],
        [l('Débord du toit', 'Roof overhang'), mL(EAVE, '*', 2)],
        [l('Bandeau', 'Head band'), cat(mL(HEAD_BAND.h, '*', 2), ' × ', mL(HEAD_BAND.d, '*', 2))],
        [l('Salon, largeur', 'Living room, width'), mL(LIVING_X1 - LIVING_X0, '*', 2)],
        [
          l('Balcon, profondeur × largeur', 'Balcony, depth × width'),
          cat(mL(BALCONY.depth, '*', 1), ' × ', mL(BALCONY.width, '*', 1)),
        ],
        [l('Escalier, nombre de marches', 'Stair, number of steps'), cat(String(RISERS), '*')],
        [l('Sol sous la dalle, façade sud', 'Ground below the slab, south front'), mL(-GROUND_SOUTH, '*', 1)],
        [
          l('Chute du terrain sur l’emprise', 'Fall of the ground over the footprint'),
          mL(GROUND_NORTH - GROUND_SOUTH, '*', 1),
        ],
      ],
      { size: 1.8 },
    );
    y = note(
      d,
      x,
      y + 3,
      160,
      l(
        'Le plan et la façade sont refaits d’après nos dimensions : aucune image de l’article n’est reprise.',
        'The plan and the front are redrawn from our own dimensions: no image of the paper is reused.',
      ),
      { color: '#5b6878' },
    );
    return d;
  },
};
