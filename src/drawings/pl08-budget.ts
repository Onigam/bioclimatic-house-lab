import { COLORS, Drawing, W, type DrawingSheet, type View } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { SHARE_CLAIMS } from '../sim/texts';
import { cat, fig, heading, marksLegend, note, numL } from './draw';
import { LADDER, SENSITIVITY } from './model-tables';

// PL-H08: the balance of a heating season, 1 October to 20 May. What the sun and the people give, and what electricity pays, as shares of the house's load; the ladder of the share; who says what; and what moves it. The inventors say 60 to 70 %, a colleague
// 75 to 90 %, a model of 1978 about 40 %: the model's own figures stand beside them, line by line, and it says what it would take to reach the inventors'. The model's results carry a dagger; the claims are reported, said as claims.

const hbar = (v: View, x: number, y: number, w: number, h: number, frac: number, fill: string, hatch = false): void => {
  v.rect([x, y], [x + w * frac, y + h], { w: W.thin, fill, ...(hatch ? { hatch: 'plastic' as const } : {}) });
};

function lines(d: Drawing, x: number, y: number, w: number): number {
  const v = d.paper();
  heading(d, x, y, l('La charge de chauffage de la saison', 'The season’s heating load'), { size: 2.3 });
  const L2 = LADDER.lines;
  const parts: [number, string, L][] = [
    [L2.wallAir, '#e9a85e', l('mur, air', 'wall, air')],
    [L2.wallConduction, '#d9774a', l('mur, béton', 'wall, concrete')],
    [L2.windows, '#e6c067', l('fenêtres', 'windows')],
    [L2.people, '#c9b58f', l('gens', 'people')],
    [L2.electricity, '#9cb0c4', l('électricité', 'electricity')],
  ];
  const total = parts.reduce((a, q) => a + q[0], 0);
  const scale = w / 105;
  let cx = x;
  const by = y + 8;
  for (const [val, fill, name] of parts) {
    v.rect([cx, by], [cx + val * scale, by + 9], { w: W.thin, fill });
    v.text([cx + (val * scale) / 2, by + 4.5], numL(val, 0, '', '†'), {
      size: 1.9,
      weight: 'bold',
      anchor: 'middle',
      baseline: 'middle',
    });
    v.text([cx + (val * scale) / 2, by + 11], name, { size: 1.6, anchor: 'middle', baseline: 'top' });
    cx += val * scale;
  }
  v.line([x + 100 * scale, by - 2], [x + 100 * scale, by + 11], { w: W.medium, dash: 'hidden', color: COLORS.ink });
  v.text([x + 100 * scale, by - 2.5], l('100 % de la charge', '100 % of the load'), {
    size: 1.6,
    anchor: 'middle',
    baseline: 'bottom',
  });
  v.text(
    [x + w, by + 19],
    cat(
      l('Les lignes font ', 'The lines add to '),
      numL(total, 0, ' %', '†'),
      l(
        ' : un peu de ce qui entre est perdu par une maison plus chaude.',
        ': a little of what comes in is lost by a warmer house.',
      ),
    ),
    { size: 1.7, anchor: 'end', baseline: 'top' },
  );
  return by + 24;
}

function ladder(d: Drawing, x: number, y: number, w: number): number {
  const v = d.paper();
  heading(d, x, y, l('La part que l’électricité ne paie pas', 'The share electricity does not pay for'), { size: 2.3 });
  const rows: [number, L, string][] = [
    [LADDER.wall, l('le mur seul', 'the wall alone'), '#d9774a'],
    [LADDER.windows, l('avec les fenêtres', 'with the windows'), '#e6c067'],
    [LADDER.all, l('avec les gens', 'with the people'), '#c9b58f'],
  ];
  rows.forEach(([val, name, fill], i) => {
    const by = y + 8 + i * 8;
    v.text([x, by + 2.7], name, { size: 1.8, baseline: 'middle' });
    hbar(v, x + 38, by, w - 52, 5.4, val / 100, fill);
    v.text([x + 38 + ((w - 52) * val) / 100 + 1.5, by + 2.7], numL(val, val % 1 ? 1 : 0, ' %', '†'), {
      size: 1.8,
      weight: 'bold',
      baseline: 'middle',
    });
  });
  return y + 8 + rows.length * 8 + 2;
}

function claims(d: Drawing, x: number, y: number, w: number): number {
  const v = d.paper();
  heading(d, x, y, l('Qui dit quoi', 'Who says what'), { size: 2.3 });
  const rows: [L, number, number][] = [
    [SHARE_CLAIMS[0]!.who as unknown as L, 60, 70],
    [SHARE_CLAIMS[1]!.who as unknown as L, 35, 45],
    [SHARE_CLAIMS[2]!.who as unknown as L, 75, 90],
    [SHARE_CLAIMS[3]!.who as unknown as L, 38, 42],
    [SHARE_CLAIMS[4]!.who as unknown as L, 69, 71],
    [l('Un architecte, sa maison', 'An architect, his house'), 71, 73],
  ].map(([who, a, b]) => [
    Array.isArray(who) ? l(who[0] as string, who[1] as string) : (who as L),
    a as number,
    b as number,
  ]);
  const x0 = x + 62;
  const ww = w - 66;
  rows.forEach(([who, a, b], i) => {
    const by = y + 8 + i * 6.6;
    v.text([x, by + 2.5], who, { size: 1.6, baseline: 'middle' });
    v.rect([x0 + (ww * a) / 100, by], [x0 + (ww * b) / 100, by + 5], { w: W.thin, fill: '#9cb0c4' });
  });
  // the model's own, across
  const mx = x0 + (ww * LADDER.all) / 100;
  v.line([mx, y + 6], [mx, y + 8 + rows.length * 6.6], { w: W.medium, color: COLORS.red });
  v.text([mx, y + 5], cat(l('le modèle ', 'the model '), numL(LADDER.all, 0, ' %', '†')), {
    size: 1.7,
    anchor: 'middle',
    baseline: 'bottom',
    color: COLORS.red,
  });
  for (const t of [0, 25, 50, 75, 100]) {
    v.line([x0 + (ww * t) / 100, y + 8 + rows.length * 6.6], [x0 + (ww * t) / 100, y + 10 + rows.length * 6.6], {
      w: W.thin,
    });
    v.text([x0 + (ww * t) / 100, y + 11 + rows.length * 6.6], numL(t, 0, '', ''), {
      size: 1.6,
      anchor: 'middle',
      baseline: 'top',
      mono: true,
    });
  }
  return y + 14 + rows.length * 6.6;
}

function sensitivity(d: Drawing, x: number, y: number, w: number): number {
  const v = d.paper();
  heading(d, x, y, l('Ce qui bouge la part', 'What moves the share'), { size: 2.3 });
  const rows = [...SENSITIVITY].sort((p, q) => q.share - p.share);
  const x0 = x + 48;
  const ww = w - 54;
  rows.forEach((r, i) => {
    const by = y + 8 + i * 6.6;
    v.text([x, by + 2.5], l(r.fr, r.en), {
      size: 1.7,
      baseline: 'middle',
      weight: r.key === 'base' ? 'bold' : 'normal',
    });
    hbar(v, x0, by, ww, 5, r.share / 100, r.key === 'base' ? '#c9b58f' : '#9cb0c4');
    v.text([x0 + (ww * r.share) / 100 + 1.5, by + 2.5], numL(r.share, 1, ' %', '†'), {
      size: 1.7,
      baseline: 'middle',
      mono: true,
    });
  });
  const mx = x0 + (ww * LADDER.all) / 100;
  v.line([mx, y + 6], [mx, y + 8 + rows.length * 6.6], { w: W.thin, dash: 'hidden', color: COLORS.red });
  return y + 10 + rows.length * 6.6;
}

export const budgetSheet: DrawingSheet = {
  id: 'heat-budget',
  number: 'PL-H08',
  group: 'balance',
  title: l('Le bilan d’une saison', 'The balance of a season'),
  description: l(
    'Où va la charge de chauffage d’une saison, du 1er octobre au 20 mai : le mur par l’air et par le béton, les fenêtres, les gens, et ce que paie l’électricité. Au-dessous, la part que l’électricité ne paie pas, pas à pas, ce que disent les inventeurs, un collègue, un modèle de 1978 et l’architecte d’une autre maison, et ce qui bouge la part. Le modèle atteint le bas de la fourchette des inventeurs si l’air du site est plus chaud de 5 K : il le dit, il ne tranche pas.',
    'Where a heating season’s load goes, from 1 October to 20 May: the wall by air and by concrete, the windows, the people, and what electricity pays. Below it, the share electricity does not pay for, step by step, what the inventors, a colleague, a model of 1978 and the architect of another house say, and what moves the share. The model reaches the bottom of the inventors’ range if the site’s air is 5 K warmer: it says so, and does not settle it.',
  ),
  scene: 'room',
  parts: ['electric-heater', 'thermostat', 'electric-panel'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le bilan d’une saison', 'The balance of a season'),
      subtitle: l('Charge, part du soleil, qui dit quoi', 'Load, the sun’s share, who says what'),
      number: 'PL-H08',
      scale: '—',
    });
    let y = lines(d, 24, 22, 200);
    y = ladder(d, 24, y + 4, 200);
    claims(d, 244, 22, 164);
    const y2 = sensitivity(d, 24, y + 6, 200);
    note(
      d,
      244,
      104,
      164,
      cat(
        l('Le modèle atteint ', 'The model reaches '),
        fig('share5K'),
        l(
          ', le bas de la fourchette des inventeurs, si l’air du site est plus chaud de 5 K que celui du calcul : leurs jours clairs font en moyenne 5 °C, et la grille du calcul lit peut-être froid dans une vallée. Il atteint ',
          ', the bottom of the inventors’ range, if the site’s air is 5 K warmer than the calculation’s: their clear days average 5 °C, and the calculation’s grid may read cold in a valley. It reaches ',
        ),
        fig('share1974'),
        l(' avec l’isolation de 1974, sans un rayon de plus.', ' with the 1974 insulation, without one more ray.'),
      ),
    );
    note(
      d,
      244,
      136,
      164,
      l(
        'Ce qui bouge le plus la part : l’isolation, le climat, l’air, les gens et les fenêtres. Ce qui la bouge à peine : l’épaisseur du mur, le débit, la peinture. Ni le mur seul ni le seul modèle ne tranchent la question.',
        'What moves the share most: insulation, climate, the air, the people and the windows. What hardly moves it: the wall’s thickness, the flow, the paint. Neither the wall alone nor the model alone settles the question.',
      ),
    );
    marksLegend(d, 244, 166, 164);
    note(
      d,
      244,
      190,
      164,
      l(
        'Le soleil et l’air viennent d’un service de données de 2005 à 2023 ; les fenêtres de 16,7 m² et les gens de 500 W sont deux estimations ; le chauffage est une électricité idéale qui tient 20 °C.',
        'The sun and the air come from a data service for 2005 to 2023; the 16.7 m² of windows and the 500 W of people are two estimates; the heating is an ideal electricity that holds 20 °C.',
      ),
      { color: '#5b6878' },
    );
    void y2;
    return d;
  },
};
