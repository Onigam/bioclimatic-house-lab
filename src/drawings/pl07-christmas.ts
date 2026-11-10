import { COLORS, Drawing, W, type DrawingSheet } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { nEn, nFr } from '../data/units';
import { TABLE_II } from '../sim/climate';
import { axes, px, py, type Plot } from './chart';
import { cat, fig, grid, heading, marksLegend, note, numL } from './draw';
import { DAYS_MODEL } from './model-tables';

// PL-H07: Christmas 1974. The inventors' Table II, the first days: what the sun brought to a square metre of wall, what the wall gave back to the house, and what the model gives back on the same sun. On the 24th the wall gives back almost five times what
// the day brought, and the authors call the figure aberrant. Reported figures carry no mark, the model's carry a dagger.

const DAYS = DAYS_MODEL.map((m) => ({ ...m, row: TABLE_II.find((r) => r.date === m.date)! }));

function chart(d: Drawing, p: Plot): void {
  const v = d.paper();
  axes(d, p, {
    title: l(
      'Le soleil reçu et la chaleur rendue, jour par jour',
      'The sun received and the heat given back, day by day',
    ),
    yUnit: l('kJ par mètre carré de capteur', 'kJ per square metre of collector'),
    xTicks: DAYS.map((x, i) => [i + 0.5, x.date]),
    yTicks: [0, 5000, 10000, 15000, 20000, 25000].map((t) => [t, numL(t, 0, '', '')]),
  });
  const bw = (p.w / DAYS.length) * 0.26;
  DAYS.forEach((x, i) => {
    const cx = px(p, i + 0.5);
    const base = py(p, 0);
    const inc = x.row.incident * 1000;
    v.rect([cx - 1.5 * bw - 0.4, py(p, inc)], [cx - 0.5 * bw - 0.4, base], { w: W.thin, fill: '#e6c067' });
    v.rect([cx - 0.5 * bw, py(p, x.row.sum!)], [cx + 0.5 * bw, base], { w: W.thin, fill: '#9cc3d8' });
    v.rect([cx + 0.5 * bw + 0.4, py(p, x.sum)], [cx + 1.5 * bw + 0.4, base], {
      w: W.thin,
      fill: '#f0b9a0',
      hatch: 'plastic',
    });
  });
  // the 24th, the one that makes the sheet
  const i24 = DAYS.findIndex((x) => x.date === '24/12');
  const cx = px(p, i24 + 0.5);
  v.text([cx, py(p, 8000) - 3], l('478,30 %', '478.30 %'), {
    size: 2.6,
    weight: 'bold',
    anchor: 'middle',
    baseline: 'bottom',
    color: COLORS.red,
  });
  v.text([cx, py(p, 8000) + 0.5], l('« aberrant »', '“aberrant”'), {
    size: 1.8,
    anchor: 'middle',
    baseline: 'top',
    color: COLORS.red,
  });
  // the key
  const k = (y: number, fill: string, hatch: boolean, text: Parameters<typeof v.text>[1]): void => {
    v.rect([p.x + p.w - 62, p.y + y], [p.x + p.w - 58.6, p.y + y + 2.6], {
      w: W.thin,
      fill,
      ...(hatch ? { hatch: 'plastic' as const } : {}),
    });
    v.text([p.x + p.w - 56.5, p.y + y + 1.3], text, { size: 1.7, baseline: 'middle' });
  };
  k(2, '#e6c067', false, l('soleil reçu', 'sun received'));
  k(6, '#9cc3d8', false, l('rendu à la maison, article', 'given back to the house, paper'));
  k(10, '#f0b9a0', true, l('rendu, modèle†', 'given back, model†'));
}

export const christmasSheet: DrawingSheet = {
  id: 'christmas-1974',
  number: 'PL-H07',
  group: 'balance',
  title: l('Noël 1974 : 478 %', 'Christmas 1974: 478 %'),
  description: l(
    'Le tableau des bilans de l’article, du 23 au 29 décembre 1974 : pour chaque jour, le soleil reçu par mètre carré de capteur, la chaleur rendue à la maison d’après l’article, et celle que le modèle rend sur le même soleil. Le 24, presque pas de soleil et pourtant 5 424 kJ rendus : 478,30 %, que les auteurs appellent « aberrant ». Le modèle retrouve le phénomène, pas le chiffre : 367 %. Les autres jours s’accordent mieux.',
    'The paper’s table of balances, 23 to 29 December 1974: for each day, the sun received per square metre of collector, the heat given back to the house according to the paper, and what the model gives back on the same sun. On the 24th, almost no sun and yet 5,424 kJ given back: 478.30 %, which the authors call “aberrant”. The model finds the phenomenon, not the figure: 367 %. The other days agree better.',
  ),
  scene: 'room',
  parts: ['inner-wall-face', 'chart-recorder'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Noël 1974', 'Christmas 1974'),
      subtitle: l('Tableau des bilans, 23 au 29 décembre', 'Table of balances, 23 to 29 December'),
      number: 'PL-H07',
      scale: '—',
    });
    chart(d, { x: 24, y: 44, w: 232, h: 120, xmin: 0, xmax: DAYS.length, ymin: 0, ymax: 25000 });
    // the table, to the right
    heading(d, 270, 28, l('Les mêmes jours, en chiffres', 'The same days, in figures'), { size: 2.2 });
    grid(
      d,
      270,
      34,
      [
        { label: l('Jour', 'Day'), w: 16 },
        { label: l('Reçu', 'Received'), w: 25, align: 'end', mono: true },
        { label: l('Rendu', 'Given'), w: 25, align: 'end', mono: true },
        { label: l('%', '%'), w: 20, align: 'end', mono: true },
        { label: l('Rendu†', 'Given†'), w: 25, align: 'end', mono: true },
        { label: l('%†', '%†'), w: 27, align: 'end', mono: true },
      ],
      DAYS.map((x) => [
        x.date,
        numL(x.row.incident * 1000, 0, '', ''),
        numL(x.row.sum!, 0, '', ''),
        numL(x.row.eff!, 1, '', ''),
        numL(x.sum, 0, '', '†'),
        numL(x.eff, x.eff > 100 ? 0 : 1, '', '†'),
      ]),
      { size: 1.7 },
    );
    heading(d, 270, 96, l('Ce que dit le 24 décembre', 'What 24 December says'), { size: 2.2 });
    note(
      d,
      270,
      102,
      136,
      l(
        'Le ciel est presque noir : 1 134 kJ reçus par mètre carré. Le mur en rend 5 424 à la pièce. Ce n’est pas une erreur, c’est un rendement sans sens : le mur rend le soleil de la veille, encore dans le béton. L’article l’écrit : un bilan demande 24 heures au moins.',
        'The sky is almost black: 1,134 kJ received per square metre. The wall gives 5,424 back to the room. It is not a mistake, it is an efficiency with no meaning: the wall gives back yesterday’s sun, still in the concrete. The paper says so: a balance takes 24 hours at least.',
      ),
    );
    heading(d, 270, 130, l('Ce que retrouve le modèle', 'What the model finds'), { size: 2.2 });
    note(
      d,
      270,
      136,
      136,
      cat(
        l('Sur ce même soleil, ', 'On that same sun, '),
        fig('christmasKj'),
        l(' et ', ' and '),
        fig('christmasModel'),
        l(
          ' : le phénomène, pas le chiffre, parce que son mur part environ 2 K plus froid. Le 29, 18,88 % contre ',
          ': the phenomenon, not the figure, because its wall starts about 2 K cooler. On the 29th, 18.88 % against ',
        ),
        fig('dec29Model'),
        l('. Sur les 20 jours du tableau, 36,7 % contre ', '. Over the 20 days of the table, 36.7 % against '),
        fig('eff20'),
        l('.', '.'),
      ),
    );
    marksLegend(d, 270, 166, 136);
    note(
      d,
      24,
      176,
      232,
      l(
        'Les barres jaunes et bleues sont celles du tableau II de l’article, refaites d’après ses chiffres : aucune image n’en est reprise. Les barres hachurées sont celles du modèle, jamais réglé pour retrouver ces jours.',
        'The yellow and blue bars are the paper’s Table II, redrawn from its figures: no image of it is reused. The hatched bars are the model’s, never tuned to find these days.',
      ),
      { color: '#5b6878' },
    );
    void nEn;
    void nFr;
    return d;
  },
};
