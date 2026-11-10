import { COLORS, Drawing, type DrawingSheet, type Pt, type View } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { BALCONY, DEPTH, ELEMENT_1967, ROOM, Y_RIDGE } from '../three/dims';
import { cat, fig, heading, marksLegend, mL, mm, note } from './draw';
import { SECTION_ANCHORS as A, houseSection, rays } from './machine-view';

// PL-H02: the north–south section through the sample bay, twice at 1:50: in winter, where the flap lies flat and the air goes round into the room, and in summer, where the flap hangs over the duct and the air leaves by the head. The sun's rays
// are the noon ones of the model's December and June. Every length is dims.ts's: the element is the paper's, the roof, the slab and the flap are our drawing.

const S = 1 / 50;
const Y0 = 146;

/** A leader from a model point to a label placed at another model point: the offset in paper millimetres is worked out here. */
function call(v: View, at: Pt, lab: Pt, text: L, color?: string): void {
  v.leader(at, (lab[0] - at[0]) * S, -(lab[1] - at[1]) * S, text, { size: 1.9, color });
}

function side(d: Drawing, x0: number, mode: 'winter' | 'summer'): View {
  const v = d.view(x0, Y0, S);
  houseSection(v, { air: mode });
  rays(v, -mm(0.3), mm(1.1), mode === 'winter' ? 24 : 71, mode === 'winter' ? mm(1.1) : mm(0.6), 3, mm(0.9));
  const at = (x: number, y: number): Pt => [mm(x), mm(y)];
  const gapX = (A.lastBack + A.face) / 2;
  const wallX = (A.face + A.inner) / 2;
  const colX = A.inner + mm(1.1);
  const lab = (y: number): Pt => [colX, mm(y)];
  const hDuct = mm(ELEMENT_1967.ductHeight) / 2;
  call(
    v,
    [A.lastBack + 60, A.yHigh + hDuct + 60],
    lab(4.1),
    mode === 'winter' ? l('clapet à plat*', 'flap, flat*') : l('clapet pendant*', 'flap, hanging*'),
    COLORS.copper,
  );
  call(v, [wallX, A.yHigh], lab(3.3), l('conduit haut', 'upper duct'));
  call(v, [wallX, mm(2.4)], lab(2.5), l('mur de stockage', 'storage wall'));
  if (mode === 'winter') {
    call(v, [A.inner + 540, A.yHigh], lab(3.7), l('jet, 40 à 43 °C, à l’œil', 'jet, 40 to 43 °C, by eye'), '#c4552b');
    call(v, [gapX, mm(1.9)], lab(1.8), l('lame d’air', 'air gap'));
    call(v, [mm(0.09), mm(1.2)], lab(1.1), l('vitres', 'sheets'));
    call(v, [wallX, A.yLow], lab(0.5), l('conduit bas', 'lower duct'));
    call(v, [A.inner + 540, A.yLow], lab(0.15), l('air de la pièce, 17 °C', 'room air, 17 °C'), '#3a6f9a');
    v.leader(at(0.3, -2.5), 3, 6, l('fondation', 'foundation'), { size: 1.9 });
    v.leader(at(DEPTH / 2, 0.0), 0, 22, l('dalle', 'slab'), { size: 1.9 });
    v.leader(at(DEPTH / 2, 4.1), 0, -18, l('plafond, isolant', 'ceiling, insulation'), { size: 1.9 });
    v.leader(at(DEPTH / 2, 5.3), 0, -10, l('toit', 'roof'), { size: 1.9 });
    v.leader(
      [A.northIn, mm(ROOM.thermostat)],
      -10,
      16,
      cat(l('thermostat ', 'thermostat '), mL(ROOM.thermostat, '', 2)),
      { size: 1.9 },
    );
    v.leader(at(-BALCONY.depth / 2, 0.0), 1, -9, l('balcon', 'balcony'), { size: 1.9 });
  } else {
    v.leader([mm(0.2), A.yTop + 520], -6, -6, l('l’air sort par la tête', 'the air leaves by the head'), {
      size: 1.9,
      color: '#c4552b',
    });
    call(v, [A.inner + 520, A.yLow], lab(0.5), l('l’air de la pièce est tiré', 'the room’s air is drawn'), '#3a6f9a');
  }
  // dimensions: the paper's wall and gap, below the foot; the span between ducts, the element's height and the ridge, on the north side
  v.dim([A.lastBack, mm(-0.45)], [A.face, mm(-0.45)], 5, { dir: 'h', label: mL(ELEMENT_1967.gap, '', 2), size: 1.8 });
  v.dim([A.face, mm(-0.45)], [A.inner, mm(-0.45)], 12, {
    dir: 'h',
    label: mL(ELEMENT_1967.thickness, '', 2),
    size: 1.8,
  });
  if (mode === 'winter') {
    v.dim([A.north + mm(0.35), A.yLow], [A.north + mm(0.35), A.yHigh], 4, {
      dir: 'v',
      label: mL(ELEMENT_1967.ductSpan, '', 2),
      size: 1.9,
    });
    v.dim([A.north + mm(0.9), A.yBottom], [A.north + mm(0.9), A.yTop], 4, {
      dir: 'v',
      label: mL(ELEMENT_1967.height, '', 2),
      size: 1.9,
    });
    v.dim([A.north + mm(1.4), 0], [A.north + mm(1.4), mm(Y_RIDGE)], 4, {
      dir: 'v',
      label: mL(Y_RIDGE, '*', 1),
      size: 1.9,
    });
  }
  v.caption(
    [mm(DEPTH / 2), mm(-4.3)],
    mode === 'winter'
      ? l('HIVER : LE SOLEIL BAS', 'WINTER: THE LOW SUN')
      : l('ÉTÉ : LE SOLEIL HAUT', 'SUMMER: THE HIGH SUN'),
    '1:50',
  );
  return v;
}

export const sectionSheet: DrawingSheet = {
  id: 'section-winter-summer',
  number: 'PL-H02',
  group: 'house',
  title: l('La coupe, en hiver et en été', 'The section, in winter and in summer'),
  description: l(
    'La même coupe nord-sud, par le milieu d’une travée de capteur, deux fois. En hiver, le soleil bas frappe la vitre presque de face, l’air frais du sol monte derrière elle, et le clapet à plat le renvoie dans la pièce par le conduit haut. En été, le soleil haut arrive de biais, le clapet pend devant le conduit, et l’air s’échappe par la tête en tirant celui de la pièce. Le mur, la lame d’air et l’écart des conduits sont ceux de l’article ; le clapet, le toit et la dalle sont notre dessin.',
    'The same north–south section, through the middle of a collector bay, twice. In winter the low sun strikes the glass almost head on, the cool air from the floor rises behind it, and the flap lying flat sends it back into the room by the upper duct. In summer the high sun arrives at a slant, the flap hangs in front of the duct, and the air escapes by the head, drawing the room’s with it. The wall, the air gap and the span between the ducts are the paper’s; the flap, the roof and the slab are our drawing.',
  ),
  scene: 'house',
  parts: ['collector-element', 'south-facade', 'pitched-roof', 'floor-slab', 'foundation'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Coupe, hiver et été', 'Section, winter and summer'),
      subtitle: l('Coupe A–A, par une travée de capteur', 'Section A–A, through a collector bay'),
      number: 'PL-H02',
      scale: '1:50',
    });
    side(d, 40, 'winter');
    side(d, 246, 'summer');
    // under the two views: the noon sun, said once, and the legend
    marksLegend(d, 14, 252, 120);
    let y = 252;
    y = heading(d, 144, y, l('Le soleil de midi', 'The noon sun'), { size: 2.2 });
    note(
      d,
      144,
      y,
      60,
      cat(
        l('En décembre, ', 'In December, '),
        fig('sunDec'),
        l(' au-dessus de l’horizon ; en juin, ', ' above the horizon; in June, '),
        fig('sunJun'),
        l('.', '.'),
      ),
      { size: 1.8 },
    );
    return d;
  },
};
