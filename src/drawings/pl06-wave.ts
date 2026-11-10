import { COLORS, Drawing, W, type DrawingSheet, type Pt } from '@onigam/lab-kit/drawings';
import { l, type L } from '@onigam/lab-kit/i18n';
import { ELEMENT_1967 } from '../three/dims';
import { WALL_MATERIALS } from '../sim/machine';
import { penetrationDepth, waveAt, waveDamping, waveLagHours, waveSpeed } from '../sim/wave';
import { axes, px, py, type Plot } from './chart';
import { cat, fig, heading, marksLegend, mL, note, numL } from './draw';

// PL-H06: the wave of heat in the wall, by the textbook's closed form with the inventors' own concrete. Left: the wave through 60 cm at four hours of the day; centre: the lag against the thickness, with what they measured; right: how much of the swing is left
// on the room side. Everything here is the closed form's (derived) except the two bands the paper measured and the model's own swings, said as such.

const concrete = WALL_MATERIALS.concrete;
const T = ELEMENT_1967.thickness;

function snapshots(d: Drawing, p: Plot): void {
  const v = d.paper();
  axes(d, p, {
    title: l('La vague à quatre heures du jour', 'The wave at four hours of the day'),
    yUnit: l(
      'écart à la moyenne, en part de l’écart de la face noire',
      'difference from the mean, as a share of the black face’s',
    ),
    xTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map((t) => [t, String(Math.round(t * 100))]),
    yTicks: [-1, -0.5, 0, 0.5, 1].map((t) => [t, numL(t, t % 1 === 0 ? 0 : 1, '', '')] as [number, L]),
    xUnit: l('profondeur depuis la face noire, cm', 'depth from the black face, cm'),
  });
  const colors = ['#c4552b', '#d18a00', '#3a8f5a', '#3a6f9a'];
  [0, 6, 12, 18].forEach((h, k) => {
    const pts: Pt[] = [];
    for (let i = 0; i <= 60; i++) {
      const x = (T * i) / 60;
      pts.push([px(p, x), py(p, waveAt(x, h * 3600, 1, 0, concrete))]);
    }
    v.polyline(pts, { w: W.medium, color: colors[k] });
    v.text(
      [p.x + 3, p.y + 3.5 + k * 3.4],
      cat(String(h), l(' h après la pointe de la face noire', ' h after the black face’s peak')),
      { size: 1.7, color: colors[k], baseline: 'middle' },
    );
  });
  v.line([px(p, 0), py(p, 0)], [px(p, T), py(p, 0)], { w: W.thin, color: COLORS.muted });
}

function lag(d: Drawing, p: Plot): void {
  const v = d.paper();
  axes(d, p, {
    title: l('Le délai selon l’épaisseur', 'The lag against thickness'),
    yUnit: l('heures', 'hours'),
    xTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((t) => [t, String(Math.round(t * 100))]),
    yTicks: [0, 6, 12, 18, 24].map((t) => [t, String(t)]),
    xUnit: l('épaisseur du mur, cm', 'wall thickness, cm'),
  });
  // the inventors' wish: 40 to 45 cm, and a lag of about 12 h
  v.rect([px(p, 0.4), py(p, 24)], [px(p, 0.45), py(p, 0)], { w: W.thin, fill: '#e6efd9' });
  v.line([px(p, 0), py(p, 12)], [px(p, 0.8), py(p, 12)], { w: W.thin, dash: 'hidden', color: COLORS.muted });
  const pts: Pt[] = [];
  for (let i = 0; i <= 80; i++) pts.push([px(p, i / 100), py(p, waveLagHours(i / 100, concrete))]);
  v.polyline(pts, { w: W.medium, color: COLORS.copper });
  // what they measured: 9–10 h at 37 cm, 14–16 h at 60 cm
  for (const [x, lo, hi] of [
    [0.37, 9, 10],
    [0.6, 14, 16],
  ] as const) {
    v.line([px(p, x), py(p, lo)], [px(p, x), py(p, hi)], { w: W.thick, color: COLORS.ink });
    v.circle([px(p, x), py(p, waveLagHours(x, concrete))], 0.9, { w: W.medium, fill: COLORS.paper, color: COLORS.red });
  }
  v.text([px(p, 0.37) - 2, py(p, 9.6)], cat(l('mesuré 9 à 10 h ; ', 'measured 9 to 10 h; '), fig('lag37')), {
    size: 1.7,
    anchor: 'end',
    baseline: 'middle',
  });
  v.text([px(p, 0.6) - 2, py(p, 15)], cat(l('mesuré 14 à 16 h ; ', 'measured 14 to 16 h; '), fig('lag60')), {
    size: 1.7,
    anchor: 'end',
    baseline: 'middle',
  });
  v.text([px(p, 0.45) + 1.5, py(p, 22.5)], cat(l('souhait 40 à 45 cm : ', 'wish 40 to 45 cm: '), fig('lag45')), {
    size: 1.7,
    anchor: 'start',
    baseline: 'top',
  });
  v.text([px(p, 0.8) - 1, py(p, 12) - 1], l('12 h', '12 h'), {
    size: 1.7,
    anchor: 'end',
    baseline: 'bottom',
    mono: true,
  });
}

function damping(d: Drawing, p: Plot): void {
  const v = d.paper();
  axes(d, p, {
    title: l('Ce qu’il reste côté pièce', 'What is left on the room side'),
    yUnit: l('% de l’écart de la face noire', '% of the black face’s swing'),
    xTicks: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8].map((t) => [t, String(Math.round(t * 100))]),
    yTicks: [0, 25, 50, 75, 100].map((t) => [t, String(t)]),
    xUnit: l('épaisseur du mur, cm', 'wall thickness, cm'),
  });
  const pts: Pt[] = [];
  for (let i = 0; i <= 80; i++) pts.push([px(p, i / 100), py(p, waveDamping(i / 100, concrete) * 100)]);
  v.polyline(pts, { w: W.medium, color: COLORS.copper });
  for (const [x, name] of [
    [0.37, 'damp37'],
    [0.45, 'damp45'],
    [0.6, 'damp60'],
  ] as const) {
    v.circle([px(p, x), py(p, waveDamping(x, concrete) * 100)], 0.9, {
      w: W.medium,
      fill: COLORS.paper,
      color: COLORS.red,
    });
    v.text([px(p, x) + 1.5, py(p, waveDamping(x, concrete) * 100) - 2], fig(name), { size: 1.7, baseline: 'bottom' });
  }
}

export const waveSheet: DrawingSheet = {
  id: 'heat-wave',
  number: 'PL-H06',
  group: 'wall',
  title: l('La vague de chaleur dans le mur', 'The wave of heat in the wall'),
  description: l(
    'La chaleur d’un jour avance dans le béton comme une vague : à gauche, quatre instants de sa traversée des 60 cm ; au centre, le délai selon l’épaisseur, avec les deux mesures des inventeurs, 14 à 16 h à 60 cm et 9 à 10 h à 37 cm, et leur souhait de 40 à 45 cm ; à droite, ce qui reste de l’écart de la face noire côté pièce. Les courbes sont celles du calcul classique avec le béton de l’article ; les bandes mesurées sont les leurs, lues sur l’article.',
    'A day’s heat advances through the concrete like a wave: on the left, four moments of its crossing of the 60 cm; in the centre, the lag against the thickness, with the inventors’ two measurements, 14 to 16 h at 60 cm and 9 to 10 h at 37 cm, and their wish of 40 to 45 cm; on the right, what is left of the black face’s swing on the room side. The curves are the classical calculation’s, with the paper’s own concrete; the measured bands are theirs, read from the paper.',
  ),
  scene: 'wall',
  parts: ['storage-wall', 'wall-thermocouples', 'black-paint'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('La vague dans le mur', 'The wave in the wall'),
      subtitle: l('Calcul classique, béton de l’article', 'Classical calculation, the paper’s concrete'),
      number: 'PL-H06',
      scale: '—',
    });
    const w = 118;
    const base = { xmin: 0, ymin: 0, y: 44, w, h: 100 };
    snapshots(d, { ...base, x: 24, xmin: 0, xmax: T, ymin: -1, ymax: 1 });
    lag(d, { ...base, x: 154, xmax: 0.8, ymax: 24 });
    damping(d, { ...base, x: 284, xmax: 0.8, ymax: 100 });
    // under the charts: the numbers of the wave and what the model finds inside the wall
    let y = 162;
    heading(d, 24, y, l('Les nombres de la vague', 'The wave’s numbers'), { size: 2.2 });
    y += 6;
    note(
      d,
      24,
      y,
      118,
      cat(
        l('Vitesse ', 'Speed '),
        fig('waveSpeed'),
        l(' ; profondeur où elle n’est plus qu’à un tiers ', '; depth at which it is down to a third '),
        fig('waveDepth'),
        l(' ; masse ', '; mass '),
        fig('massT'),
        l(', ', ', '),
        fig('capKwh'),
        l('.', '.'),
      ),
    );
    heading(d, 154, 162, l('Ce que trouve le modèle', 'What the model finds'), { size: 2.2 });
    note(
      d,
      154,
      168,
      118,
      cat(
        l('Dans le mur numérique, la crête met ', 'In the numerical wall the crest takes '),
        fig('crest60'),
        l(' à 60 cm et ', ' at 60 cm and '),
        fig('crest37'),
        l(' à 37 cm. La face intérieure bouge de ± ', ' at 37 cm. The inner face moves by ± '),
        fig('swing60'),
        l(' à 60 cm, ± ', ' at 60 cm, ± '),
        fig('swing37'),
        l(' à 37, ± ', ' at 37, ± '),
        fig('swing15'),
        l(' à 15, quand la face noire fait ± ', ' at 15, when the black face moves ± '),
        fig('swingOuter'),
        l('.', '.'),
      ),
    );
    heading(d, 284, 162, l('Ce qui est rapporté', 'What is reported'), { size: 2.2 });
    note(
      d,
      284,
      168,
      118,
      cat(
        l(
          'Les inventeurs : 3,7 à 4 cm/h pour la maçonnerie, 14 à 16 h à ',
          'The inventors: 3.7 to 4 cm/h for masonry, 14 to 16 h at ',
        ),
        mL(T, '', 2),
        l(
          ' (« trop long »), 9 à 10 h à 0,37 m (« trop court »), un souhait de 40 à 45 cm.',
          ' (“too long”), 9 to 10 h at 0.37 m (“too short”), a wish of 40 to 45 cm.',
        ),
      ),
    );
    marksLegend(d, 24, 206, 118);
    note(
      d,
      154,
      208,
      200,
      l(
        'La vitesse n’est pas à lire dans la forme des courbes : elle tient dans un nombre, √(2αω), avec α = λ / (ρ·c) pour le béton de l’article, 2 200 kg/m³, 1,75 W/m·K, 0,22 kcal/kg·K, et ω la pulsation d’un jour.',
        'The speed is not to be read in the curves’ shape: it is in a number, √(2αω), with α = λ / (ρ·c) for the paper’s concrete, 2,200 kg/m³, 1.75 W/m·K, 0.22 kcal/kg·K, and ω the angular frequency of a day.',
      ),
      { color: '#5b6878' },
    );
    void waveSpeed;
    void penetrationDepth;
    return d;
  },
};
