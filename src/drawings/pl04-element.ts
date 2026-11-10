import { COLORS, Drawing, W, type DrawingSheet, type Pt, type View } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import {
  AIR_PROBE_FRACTIONS,
  DUCT_ABOVE_FLOOR,
  ELEMENT_1967,
  FRAME,
  THERMOCOUPLE_DEPTHS,
  elementLayout,
} from '../three/dims';
import { COLLECTOR_1967, ductArea } from '../sim/machine';
import { cat, fig, FILL, grid, heading, marksLegend, mL, mm, note, numL } from './draw';

// PL-H04: the collector element, every official dimension of it. Left, the section at 1:20 over its whole height with the ducts, the instruments and the flap; right, a plan section through the upper duct at 1:8. What the paper gives carries no mark; what
// we add (the frame's section, the gap between the sheets, the instruments' places, the flap) carries a star.

const E = ELEMENT_1967;
const L0 = elementLayout(E);
const S20 = 1 / 20;
const S8 = 1 / 8;
const xs = (z: number): number => mm(-z);

function section(d: Drawing): View {
  const v = d.view(36, 244, S20);
  const duct = mm(E.ductHeight);
  const faceX = xs(L0.face);
  const innerX = xs(L0.inner);
  const backX = xs(L0.lastBack);
  // the wall with its two ducts; the sill beam under the lower duct, the head beam over the upper one
  v.rect([faceX, mm(L0.yBottom)], [innerX, mm(L0.yTop)], { w: W.medium, fill: FILL.concrete });
  for (const y of [mm(L0.yDuctLow), mm(L0.yDuctHigh)])
    v.rect([faceX, y - duct / 2], [innerX, y + duct / 2], { w: W.thin, fill: FILL.air });
  // the gap, the sheets, the frame's rails
  v.rect([backX, mm(L0.yBottom)], [faceX, mm(L0.yTop)], { w: W.thin, fill: FILL.air });
  for (const z of L0.sheetFront)
    v.rect([xs(z), mm(L0.yBottom)], [xs(z) + mm(E.glass), mm(L0.yTop)], { w: W.medium, fill: FILL.glass });
  v.rect([0, mm(L0.yBottom)], [xs(L0.frameBack), mm(L0.yBottom + FRAME.face)], {
    w: W.thin,
    fill: FILL.steel,
    hatch: 'steel',
  });
  v.rect([0, mm(L0.yTop - FRAME.face)], [xs(L0.frameBack), mm(L0.yTop)], {
    w: W.thin,
    fill: FILL.steel,
    hatch: 'steel',
  });
  v.line([faceX, mm(L0.yBottom)], [faceX, mm(L0.yTop)], { w: W.thick, color: COLORS.ink });
  // the flap, flat in winter, over the pocket above the upper duct
  v.line([backX, mm(L0.yDuctHigh) + duct / 2 + 40], [faceX, mm(L0.yDuctHigh) + duct / 2 + 40], {
    w: W.thick,
    color: COLORS.copper,
  });
  // the thermocouples in the concrete at mid-height, the air probes in the gap
  const yMid = (mm(L0.yDuctLow) + mm(L0.yDuctHigh)) / 2;
  const t = E.thickness / 0.6;
  for (const dep of THERMOCOUPLE_DEPTHS)
    v.circle([faceX + mm(dep * t), yMid], 22, { w: W.thin, fill: COLORS.paper, color: COLORS.red });
  for (const f of AIR_PROBE_FRACTIONS)
    v.circle([(backX + faceX) / 2, mm(L0.yDuctLow + f * E.ductSpan)], 28, {
      w: W.thin,
      fill: COLORS.paper,
      color: COLORS.red,
    });
  // dimensions: the element's height, the span between the ducts, the duct, the lower duct's height above the floor, the wall, the gap
  const right = innerX;
  v.dim([right, mm(L0.yBottom)], [right, mm(L0.yTop)], 12, { dir: 'v', label: mL(E.height, '', 2), size: 1.9 });
  v.dim([right, mm(L0.yDuctLow)], [right, mm(L0.yDuctHigh)], 22, { dir: 'v', label: mL(E.ductSpan, '', 2), size: 1.9 });
  v.dim([faceX, mm(L0.yDuctHigh) - duct / 2], [faceX, mm(L0.yDuctHigh) + duct / 2], -8, {
    dir: 'v',
    label: mL(E.ductHeight, '', 3),
    size: 1.9,
  });
  v.dim([0, mm(L0.yBottom)], [0, mm(L0.yBottom) - 1], 0, { dir: 'v', label: '', size: 1.9 });
  v.dim([faceX, mm(-0.3)], [innerX, mm(-0.3)], 0, { dir: 'h', label: mL(E.thickness, '', 2), size: 1.9 });
  // labels, to the left of the section where the sheets and the gap are
  const at = (x: number, y: number): Pt => [x, mm(y)];
  v.leader(at((faceX + innerX) / 2, 1.0), 16, 4, l('mur de stockage', 'storage wall'), { size: 1.9 });
  v.leader(at((backX + faceX) / 2, 2.8), 16, -10, l('lame d’air', 'air gap'), { size: 1.9 });
  v.leader(at(xs(L0.sheetFront[0]!), 3.2), -4, -10, l('vitres', 'sheets'), { size: 1.9 });
  v.leader(at(xs(L0.frameBack) / 2, L0.yTop - 0.01), -4, -8, l('cadre*', 'frame*'), { size: 1.9 });
  v.leader(at((faceX + innerX) / 2, L0.yDuctHigh), 16, -3, l('conduit haut', 'upper duct'), { size: 1.9 });
  v.leader(at((faceX + innerX) / 2, L0.yDuctLow), 16, 5, l('conduit bas', 'lower duct'), { size: 1.9 });
  v.leader(at((faceX + innerX) / 2, 3.97), 16, -8, l('poutre de tête', 'head beam'), { size: 1.9 });
  v.leader(at((faceX + innerX) / 2, -0.12), 16, 6, l('poutre d’appui', 'sill beam'), { size: 1.9 });
  v.leader([faceX + mm(0.3 * t), yMid], 16, -9, l('thermocouples*', 'thermocouples*'), {
    size: 1.9,
    color: COLORS.red,
  });
  v.leader(
    [(backX + faceX) / 2, mm(L0.yDuctLow + AIR_PROBE_FRACTIONS[0]! * E.ductSpan)],
    -3,
    9,
    l('sondes d’air*', 'air probes*'),
    { size: 1.9, color: COLORS.red },
  );
  v.caption([mm(0.5), mm(-0.65)], l('COUPE', 'SECTION'), '1:20');
  return v;
}

function plan(d: Drawing): View {
  const v = d.view(180, 138, S8);
  // across the bay: x from −W/2 to +W/2, depth up: 0 at the frame's front, growing into the house (north)
  const w2 = mm(E.width) / 2;
  const y = (z: number): number => mm(-z);
  const duct = mm(E.ductWidth) / 2;
  const f = mm(FRAME.face);
  // the wall, with the duct opening through it
  v.rect([-w2, y(L0.face)], [-duct, y(L0.inner)], { w: W.medium, fill: FILL.concrete });
  v.rect([duct, y(L0.face)], [w2, y(L0.inner)], { w: W.medium, fill: FILL.concrete });
  v.rect([-duct, y(L0.face)], [duct, y(L0.inner)], { w: W.thin, fill: FILL.air });
  // the air gap and the sheets
  v.rect([-w2, y(L0.lastBack)], [w2, y(L0.face)], { w: W.thin, fill: FILL.air });
  for (const z of L0.sheetFront) v.rect([-w2, y(z) - mm(E.glass)], [w2, y(z)], { w: W.medium, fill: FILL.glass });
  // the frame's uprights, left and right
  for (const sx of [-1, 1] as const) {
    const x0 = sx < 0 ? -w2 : w2 - f;
    v.rect([x0, y(0)], [x0 + f, y(L0.frameBack)], { w: W.thin, fill: FILL.steel, hatch: 'steel' });
  }
  v.line([-w2, y(L0.face)], [w2, y(L0.face)], { w: W.thick, color: COLORS.ink });
  v.dim([-w2, y(L0.inner) + 1], [w2, y(L0.inner) + 1], 8, { dir: 'h', label: mL(E.width, '', 2), size: 1.9 });
  v.dim([-duct, y(L0.face)], [duct, y(L0.face)], -8, { dir: 'h', label: mL(E.ductWidth, '', 3), size: 1.9 });
  v.dim([w2, y(L0.face)], [w2, y(L0.inner)], 8, { dir: 'v', label: mL(E.thickness, '', 2), size: 1.9 });
  v.dim([w2, y(L0.lastBack)], [w2, y(L0.face)], 8, { dir: 'v', label: mL(E.gap, '', 2), size: 1.9 });
  v.leader([-w2 + f / 2, y(0.02)], 6, 9, cat(l('cadre ', 'frame '), mL(FRAME.face, '*', 3)), { size: 1.9 });
  v.leader(
    [w2 / 2, y(L0.sheetFront[1] ?? L0.sheetFront[0]! - E.glass - E.spacing)],
    8,
    8,
    cat(
      l('deux vitres de ', 'two sheets of '),
      mL(E.glass, '', 3),
      l(', ', ', '),
      mL(E.spacing, '*', 3),
      l(' entre elles', ' apart'),
    ),
    { size: 1.9 },
  );
  v.caption([0, y(0) - 440], l('COUPE EN PLAN, AU CONDUIT HAUT', 'PLAN SECTION, AT THE UPPER DUCT'), '1:8');
  return v;
}

export const elementSheet: DrawingSheet = {
  id: 'collector-element',
  number: 'PL-H04',
  group: 'wall',
  title: l('L’élément de captage', 'The collector element'),
  description: l(
    'Une travée du mur, avec toutes les cotes de l’article : 4,38 sur 1,27 m, 60 cm de béton, 12 cm d’air, deux vitres de 3 mm, des conduits de 0,565 sur 0,110 m à 3,50 m l’un de l’autre. À gauche, la coupe sur toute la hauteur ; à droite, la coupe en plan au conduit haut. Le cadre, l’écart entre les vitres, la place des thermocouples et des sondes, et le clapet sont notre dessin, marqués d’une étoile.',
    'One bay of the wall, with all the paper’s dimensions: 4.38 by 1.27 m, 60 cm of concrete, 12 cm of air, two sheets of 3 mm, ducts of 0.565 by 0.110 m, 3.50 m from each other. On the left, the section over its whole height; on the right, the plan section at the upper duct. The frame, the gap between the sheets, the places of the thermocouples and the probes, and the flap are our drawing, marked with a star.',
  ),
  scene: 'wall',
  parts: [
    'outer-glazing',
    'inner-glazing',
    'steel-frame',
    'air-gap',
    'storage-wall',
    'upper-duct',
    'lower-duct',
    'head-beam',
    'sill-beam',
  ],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('L’élément de captage', 'The collector element'),
      subtitle: l('Coupe et plan, toutes les cotes de l’article', 'Section and plan, all the paper’s dimensions'),
      number: 'PL-H04',
      scale: '1:20, 1:8',
    });
    section(d);
    plan(d);
    // what the paper gives, and what we add
    heading(d, 232, 168, l('Ce que donne l’article, ce que nous ajoutons', 'What the paper gives, what we add'), {
      size: 2.2,
    });
    grid(
      d,
      232,
      174,
      [
        { label: l('Grandeur', 'Quantity'), w: 84 },
        { label: l('Valeur', 'Value'), w: 56, align: 'end', mono: true },
        { label: l('Qui', 'From'), w: 36 },
      ],
      [
        [
          l('Élément, hauteur × largeur', 'Element, height × width'),
          cat(mL(E.height, '', 2), ' × ', mL(E.width, '', 2)),
          l('article', 'paper'),
        ],
        [l('Mur de stockage', 'Storage wall'), mL(E.thickness, '', 2), l('article', 'paper')],
        [l('Lame d’air', 'Air gap'), mL(E.gap, '', 2), l('article', 'paper')],
        [l('Vitres, chacune', 'Sheets, each'), mL(E.glass, '', 3), l('article', 'paper')],
        [l('Conduit', 'Duct'), cat(mL(E.ductWidth, '', 3), ' × ', mL(E.ductHeight, '', 3)), l('article', 'paper')],
        [
          l('Section d’un conduit', 'Section of a duct'),
          numL(ductArea(COLLECTOR_1967) * 1e4, 1, ' cm²', ''),
          l('article', 'paper'),
        ],
        [l('Entre les conduits', 'Between the ducts'), mL(E.ductSpan, '', 2), l('article', 'paper')],
        [
          l('Conduit bas, au-dessus du sol', 'Lower duct, above the floor'),
          mL(DUCT_ABOVE_FLOOR, '*', 2),
          l('estimé', 'estimated'),
        ],
        [l('Entre les deux vitres', 'Between the two sheets'), mL(E.spacing, '*', 3), l('estimé', 'estimated')],
        [l('Profil du cadre', 'Frame section'), mL(FRAME.face, '*', 3), l('estimé', 'estimated')],
      ],
      { size: 1.7 },
    );
    note(
      d,
      104,
      204,
      122,
      cat(
        l(
          'Le mur et la lame d’air sont dessinés tels que la Simulation les règle : la coupe suit ses curseurs, l’élément de 1967 est celui qu’on voit ici. Un élément fait ',
          'The wall and the air gap are drawn as the Simulation sets them: the section follows its sliders, the 1967 element is the one seen here. An element is ',
        ),
        fig('elemArea'),
        l(' ; il en faut ', '; it takes '),
        fig('elemCount'),
        l(' pour les 48 m² de l’article.', ' to make the paper’s 48 m².'),
      ),
    );
    marksLegend(d, 104, 226, 122);
    return d;
  },
};
