import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { COLLECTOR_1967, COLLECTOR_1974, HOUSE_1967, HOUSE_1974, ductArea, elementArea } from '../sim/machine';
import { arrow } from './machine-view';
import { axes, px, py, type Plot } from './chart';
import { cat, fig, FILL, grid, heading, marksLegend, mL, note, numL } from './draw';
import { FLOW_VS_K } from './model-tables';

// PL-H05: the air in the ducts. The loop with its areas and speeds at the recorded 20 L/s, the 1967 element beside the 1974 one, and the flow the model finds against the loop's losses, with the recorded flow across it. The model does not retrieve the flow: it finds
// about twice as much, and the sheet says so. The paper's figures carry no mark; the speeds and areas that follow from them carry a dagger; the model's flows a dagger.

const AIR = '#c4552b';
const COLD = '#3a6f9a';

function loop(d: Drawing): void {
  const v = d.paper();
  const x0 = 64;
  const gw = 12;
  const top = 50;
  const bot = 132;
  // the gap
  v.rect([x0, top], [x0 + gw, bot], { w: W.medium, fill: FILL.air });
  v.text([x0 + gw / 2, bot + 4], l('lame d’air', 'air gap'), {
    size: 1.9,
    anchor: 'middle',
    baseline: 'top',
    weight: 'bold',
  });
  // the two ducts, through the wall, to the room on the right
  v.rect([x0 + gw, top - 2], [x0 + gw + 50, top + 5], { w: W.medium, fill: FILL.concrete });
  v.rect([x0 + gw, bot - 5], [x0 + gw + 50, bot + 2], { w: W.medium, fill: FILL.concrete });
  v.rect([x0 + gw, top], [x0 + gw + 50, top + 3], { w: W.thin, fill: FILL.air });
  v.rect([x0 + gw, bot - 3], [x0 + gw + 50, bot], { w: W.thin, fill: FILL.air });
  // the room, a dashed outline to the right
  v.rect([x0 + gw + 50, top - 12], [x0 + gw + 96, bot + 12], { w: W.thin, dash: 'hidden', color: COLORS.muted });
  v.text([x0 + gw + 73, top - 8], l('la pièce', 'the room'), {
    size: 1.9,
    anchor: 'middle',
    baseline: 'top',
    weight: 'bold',
  });
  // arrows: in at the bottom, up the gap, out at the top
  arrow(v, [x0 + gw + 86, bot - 1.5], [x0 + gw + 2, bot - 1.5], COLD, 2.6);
  arrow(v, [x0 + gw / 2, bot - 2], [x0 + gw / 2, top + 8], AIR, 2.6);
  arrow(v, [x0 + gw - 2, top + 1.5], [x0 + gw + 86, top + 1.5], AIR, 2.6);
  // the numbers, each at its place
  v.text([x0 + gw + 53, bot - 10], cat(l('17 °C, pris au sol', '17 °C, taken at the floor')), {
    size: 1.8,
    color: COLD,
    baseline: 'bottom',
  });
  v.text([x0 + gw + 53, top + 9.5], l('40 à 43 °C, à l’œil', '40 to 43 °C, by eye'), {
    size: 1.8,
    color: AIR,
    baseline: 'top',
  });
  v.text([x0 - 3, (top + bot) / 2 - 6], cat(l('section ', 'section '), fig('gapSection')), {
    size: 1.8,
    anchor: 'end',
    baseline: 'middle',
  });
  v.text([x0 - 3, (top + bot) / 2 - 2], cat(fig('gapSpeed'), l(' à 20 L/s', ' at 20 L/s')), {
    size: 1.8,
    anchor: 'end',
    baseline: 'middle',
  });
  v.text([x0 + gw + 25, bot + 7], cat(l('conduit : 621,5 cm², ', 'duct: 621.5 cm², '), fig('ductSpeed')), {
    size: 1.8,
    anchor: 'middle',
    baseline: 'top',
  });
  v.text([x0 + gw + 25, top - 6], cat(fig('ductsOverGap'), l(' de la section de la lame', ' of the gap’s section')), {
    size: 1.8,
    anchor: 'middle',
    baseline: 'bottom',
  });
}

function table(d: Drawing, x: number, y: number): number {
  const a = COLLECTOR_1967;
  const b = COLLECTOR_1974;
  const row = (name: L, f: (c: typeof a) => L): L[] => [name, f(a), f(b)];
  return grid(
    d,
    x,
    y,
    [
      { label: l('L’article, tableau I', 'The paper, Table I'), w: 66 },
      { label: l('1967', '1967'), w: 50, align: 'end', mono: true },
      { label: l('1974', '1974'), w: 50, align: 'end', mono: true },
    ],
    [
      row(l('Épaisseur du mur', 'Wall thickness'), (c) => mL(c.wallThickness, '', 2)),
      row(l('Élément', 'Element'), (c) => cat(mL(c.elementHeight, '', 2), ' × ', mL(c.elementWidth, '', 2))),
      row(l('Entre les conduits', 'Between the ducts'), (c) => mL(c.ductSpan, '', 2)),
      row(l('Conduit', 'Duct'), (c) => cat(mL(c.ductWidth, '', 3), ' × ', mL(c.ductHeight, '', 3))),
      row(l('Section d’un conduit, cm²', 'Duct section, cm²'), (c) => numL(ductArea(c) * 1e4, 1, '', '')),
      row(l('Vitres', 'Sheets'), (c) => cat(String(c.glassLayers), ' × ', mL(c.glassThickness, '', 3))),
      row(l('Échange mur-air, m²', 'Wall–air exchange, m²'), (c) => numL(c.exchangeAreaReported, 2, '', '')),
      row(l('Surface d’un élément, m²', 'Area of an element, m²'), (c) => numL(elementArea(c), 2, '', '†')),
      row(l('Capteur, m², et G', 'Collector, m², and G'), (c) =>
        c === a
          ? cat(String(HOUSE_1967.collectorArea), ' ; ', numL(HOUSE_1967.G, 2, '', ''))
          : cat(String(HOUSE_1974.collectorArea), ' ; ', numL(HOUSE_1974.G, 2, '', '')),
      ),
    ],
    { size: 1.7 },
  );
}

function flowChart(d: Drawing, p: Plot): void {
  const v = d.paper();
  axes(d, p, {
    title: l('Le débit du modèle, selon les pertes du circuit', 'The model’s flow, against the loop’s losses'),
    yUnit: l('L/s, par élément, à la pointe des jours clairs', 'L/s, per element, at the peak of clear days'),
    xTicks: FLOW_VS_K.map((r, i) => [i + 0.5, numL(r.k, 0, '', '')]),
    yTicks: [0, 10, 20, 30, 40, 50, 60].map((t) => [t, numL(t, 0, '', '')]),
    xUnit: l('pertes de charge du circuit, K', 'loop’s pressure losses, K'),
  });
  // the recorded flow, with the authors' margin of 28 %, under the bars
  v.rect([p.x, py(p, 20 * 1.28)], [p.x + p.w, py(p, 20 * 0.72)], { w: W.thin, fill: '#dbe9d5' });
  const bw = (p.w / FLOW_VS_K.length) * 0.5;
  FLOW_VS_K.forEach((r, i) => {
    const cx = px(p, i + 0.5);
    v.rect([cx - bw / 2, py(p, r.flow)], [cx + bw / 2, py(p, 0)], {
      w: W.thin,
      fill: r.k === 4 ? '#e9a85e' : '#d8cdb8',
    });
    v.text([cx, py(p, r.flow) - 1], numL(r.flow, 0, '', '†'), {
      size: 1.7,
      anchor: 'middle',
      baseline: 'bottom',
      mono: true,
    });
    v.text([cx, p.y + p.h + 4.6], numL(r.airOut, 0, ' °C', '†'), {
      size: 1.6,
      anchor: 'middle',
      baseline: 'top',
      mono: true,
      color: AIR,
    });
  });
  v.line([p.x, py(p, 20)], [p.x + p.w, py(p, 20)], { w: W.medium, dash: 'hidden', color: COLORS.ink });
  v.text([p.x + 1.5, py(p, 20) - 1], l('enregistré : environ 20 L/s, ± 28 %', 'recorded: about 20 L/s, ± 28 %'), {
    size: 1.7,
    anchor: 'start',
    baseline: 'bottom',
  });
  v.text([p.x - 1.2, p.y + p.h + 4.6], l('air sortant', 'air out'), {
    size: 1.6,
    anchor: 'end',
    baseline: 'top',
    color: AIR,
  });
  v.text([px(p, 1.5), py(p, FLOW_VS_K[1]!.flow) - 8], l('le modèle', 'the model'), {
    size: 1.7,
    anchor: 'middle',
    baseline: 'bottom',
    weight: 'bold',
  });
}

export const airSheet: DrawingSheet = {
  id: 'ducts-and-air',
  number: 'PL-H05',
  group: 'wall',
  title: l('L’air dans les conduits', 'The air in the ducts'),
  description: l(
    'Le chemin de l’air dans un élément, avec ses sections et ses vitesses au débit enregistré de 20 L/s : 13 cm/s dans la lame, 32 cm/s dans le conduit, qui fait 41 % de la section de la lame. À côté, l’élément de 1967 et celui de 1974, d’après le tableau I de l’article. En dessous, le débit que trouve le modèle selon les pertes du circuit : environ le double de l’enregistrement. Le modèle ne retrouve pas ce chiffre, et le dit.',
    'The air’s path in an element, with its sections and its speeds at the recorded flow of 20 L/s: 13 cm/s in the gap, 32 cm/s in the duct, which is 41 % of the gap’s section. Beside it, the 1967 element and the 1974 one, from the paper’s Table I. Below, the flow the model finds against the loop’s losses: about twice the recording. The model does not retrieve this figure, and says so.',
  ),
  scene: 'wall',
  parts: ['air-gap', 'upper-duct', 'lower-duct', 'hot-wire-anemometer', 'summer-flap'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('L’air dans les conduits', 'The air in the ducts'),
      subtitle: l(
        'Sections, vitesses, deux éléments, le débit du modèle',
        'Sections, speeds, two elements, the model’s flow',
      ),
      number: 'PL-H05',
      scale: '—',
    });
    heading(
      d,
      24,
      28,
      l('Le circuit d’un élément, au débit enregistré', 'An element’s circuit, at the recorded flow'),
      { size: 2.3 },
    );
    loop(d);
    heading(d, 232, 28, l('Deux éléments', 'Two elements'), { size: 2.3 });
    const h = table(d, 232, 34);
    note(
      d,
      232,
      34 + h + 4,
      176,
      cat(
        l(
          'Les 1,63 et 1,00 W/m³·K sont les pertes G des deux maisons. Un élément de 1967 fait ',
          'The 1.63 and 1.00 W/m³·K are the two houses’ losses G. A 1967 element is ',
        ),
        fig('elemArea'),
        l(' : il en faut ', ': it takes '),
        fig('elemCount'),
        l(' pour les 48 m².', ' for the 48 m².'),
      ),
    );
    flowChart(d, { x: 36, y: 176, w: 160, h: 56, xmin: 0, xmax: FLOW_VS_K.length, ymin: 0, ymax: 60 });
    heading(d, 232, 130, l('Ce que dit le débit', 'What the flow says'), { size: 2.3 });
    note(
      d,
      232,
      136,
      176,
      cat(
        l('Le modèle trouve ', 'The model finds '),
        fig('flowRange'),
        l(
          ' à la pointe des jours clairs, pour environ 20 L/s enregistrés : presque le double. Avec des conduits de moitié moins larges il trouve ',
          ' at the peak of clear days, for about 20 L/s recorded: almost twice as much. With ducts half as wide it finds ',
        ),
        fig('flowHalfDuct'),
        l(
          ' et 45 °C, au bord des marges de l’article. Un grillage, un angle vif ou un volet dans le conduit feraient la même chose.',
          ' and 45 °C, at the edge of the paper’s margins. A grille, a sharp edge or a shutter in the duct would do the same.',
        ),
      ),
    );
    note(
      d,
      232,
      170,
      176,
      cat(
        l(
          'Les courbes de l’article restent plates à 20 L/s de décembre à juin, quand le tirage devrait varier du simple au triple : un soupçon, que l’anémomètre ait atteint sa limite, et le modèle ne le tranche pas. Entre ',
          'The paper’s curves stay flat at 20 L/s from December to June, when the draught should vary from one to three: a suspicion that the anemometer reached its limit, and the model does not settle it. Between ',
        ),
        fig('flowHigh50'),
        l(' et ', ' and '),
        fig('flowLow19'),
        l(', la part de la saison ne bouge que de ', ', the season’s share moves only '),
        fig('shareMoves'),
        l('.', '.'),
      ),
    );
    marksLegend(d, 232, 206, 176);
    void Number;
    return d;
  },
};
