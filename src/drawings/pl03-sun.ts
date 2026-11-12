import { COLORS, Drawing, W, type DrawingSheet, type Pt } from '@onigam/lab-kit/drawings';
import { l } from '@onigam/lab-kit/i18n';
import { SITES, MONTH_DAYS } from '../sim/climate';
import { ODEILLO } from '../sim/machine';
import { declination } from '../sim/solar';
import { axes, px, py, type Plot } from './chart';
import { cat, fig, heading, marksLegend, note, numL } from './draw';
import { MONTH_EFF_EYE, MONTH_EFF_MODEL } from './model-tables';

// PL-H03: the sun and the seasons. Three charts side by side: the sun on the wall and on a flat roof month by month, the sun's height at noon, the collector's efficiency month by month. The first is a data service's (reported), the second is arithmetic
// (derived), the third sets what the inventors' curve gives, read by eye, beside what the model finds, and says where they part.

const MONTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
const site = SITES.odeillo;
/** The day of the year in the middle of a month. */
const mid = (m: number): number => MONTH_DAYS.slice(0, m).reduce((a, b) => a + b, 0) + Math.round(MONTH_DAYS[m]! / 2);
/** The sun's height at noon on a vertical south wall, which is also its incidence from the wall's normal, degrees. derived */
const noon = (day: number): number => 90 - (ODEILLO.latitude - declination(day));

function bars(d: Drawing, p: Plot): void {
  const v = d.paper();
  axes(d, p, {
    title: l('Le soleil, mois par mois', 'The sun, month by month'),
    yUnit: l('kWh/m² par mois', 'kWh/m² a month'),
    xTicks: MONTHS.map((m, i) => [i + 0.5, m]),
    yTicks: [0, 50, 100, 150, 200].map((t) => [t, String(t)]),
  });
  const bw = (p.w / 12) * 0.36;
  for (let m = 0; m < 12; m++) {
    const cx = px(p, m + 0.5);
    const yv = py(p, site.vertical[m]!);
    const yh = py(p, site.horizontal[m]!);
    v.rect([cx - bw - 0.2, yv], [cx - 0.2, py(p, 0)], { w: W.thin, fill: '#9cc3d8' });
    v.rect([cx + 0.2, yh], [cx + bw + 0.2, py(p, 0)], { w: W.thin, fill: '#d8cdb8' });
  }
  v.text([px(p, 0.5) - bw, py(p, site.vertical[0]!) - 1.5], numL(site.vertical[0]!, 1, '', ''), {
    size: 1.6,
    mono: true,
    anchor: 'middle',
    baseline: 'bottom',
  });
  v.text([px(p, 5.5) - bw, py(p, site.vertical[5]!) - 1.5], numL(site.vertical[5]!, 1, '', ''), {
    size: 1.6,
    mono: true,
    anchor: 'middle',
    baseline: 'bottom',
  });
  // key
  v.rect([p.x + 2, p.y + 2], [p.x + 5, p.y + 4.6], { w: W.thin, fill: '#9cc3d8' });
  v.text([p.x + 6.5, p.y + 3.3], l('mur plein sud', 'wall facing due south'), { size: 1.7, baseline: 'middle' });
  v.rect([p.x + 2, p.y + 6], [p.x + 5, p.y + 8.6], { w: W.thin, fill: '#d8cdb8' });
  v.text([p.x + 6.5, p.y + 7.3], l('toit plat', 'flat roof'), { size: 1.7, baseline: 'middle' });
}

function height(d: Drawing, p: Plot): void {
  const v = d.paper();
  axes(d, p, {
    title: l('Le soleil à midi', 'The sun at noon'),
    yUnit: l('degrés du mur, de sa perpendiculaire', 'degrees from the wall’s perpendicular'),
    xTicks: MONTHS.map((m, i) => [i + 0.5, m]),
    yTicks: [0, 20, 40, 60, 80].map((t) => [t, String(t)]),
  });
  const pts: Pt[] = [];
  for (let m = 0; m < 12; m++) pts.push([px(p, m + 0.5), py(p, noon(mid(m)))]);
  v.polyline(pts, { w: W.medium, color: COLORS.copper });
  for (const q of pts) v.circle(q, 0.7, { w: W.thin, fill: COLORS.copper });
  const dec = noon(355);
  const jun = noon(172);
  v.text([px(p, 11.5), py(p, dec) - 2], fig('sunDec').fr.replace(' ', ''), {
    size: 1.9,
    weight: 'bold',
    anchor: 'end',
    baseline: 'bottom',
  });
  v.text([px(p, 5.5), py(p, jun) + 2], fig('sunJun').fr.replace(' ', ''), {
    size: 1.9,
    weight: 'bold',
    anchor: 'middle',
    baseline: 'top',
  });
}

function efficiency(d: Drawing, p: Plot): void {
  const v = d.paper();
  axes(d, p, {
    title: l('Le rendement du collecteur', 'The collector’s efficiency'),
    yUnit: l('% de l’énergie reçue', '% of the energy received'),
    xTicks: MONTHS.map((m, i) => [i + 0.5, m]),
    yTicks: [0, 10, 20, 30, 40].map((t) => [t, String(t)]),
  });
  const eye: Pt[] = MONTH_EFF_EYE.map((e, m) => [px(p, m + 0.5), py(p, e)] as Pt);
  const model: Pt[] = MONTH_EFF_MODEL.map((e, m) => [px(p, m + 0.5), py(p, e)] as Pt);
  v.polyline(eye, { w: W.medium, color: COLORS.ink });
  for (const q of eye) v.circle(q, 0.7, { w: W.thin, fill: COLORS.ink });
  v.polyline(model, { w: W.medium, color: COLORS.red, dash: 'hidden' });
  for (const q of model) v.circle(q, 0.7, { w: W.thin, fill: COLORS.paper, color: COLORS.red });
  v.line([p.x + 2, p.y + 3], [p.x + 7, p.y + 3], { w: W.medium, color: COLORS.ink });
  v.text([p.x + 8.5, p.y + 3], l('l’article, à l’œil', 'the paper, by eye'), { size: 1.7, baseline: 'middle' });
  v.line([p.x + 2, p.y + 7], [p.x + 7, p.y + 7], { w: W.medium, color: COLORS.red, dash: 'hidden' });
  v.text([p.x + 8.5, p.y + 7], l('le modèle†', 'the model†'), { size: 1.7, baseline: 'middle' });
}

export const sunSheet: DrawingSheet = {
  id: 'sun-and-seasons',
  number: 'PL-H03',
  group: 'house',
  title: l('Le soleil et les saisons', 'The sun and the seasons'),
  description: l(
    'Trois courbes sur douze mois. À gauche, le soleil reçu par le mur et par un toit plat, d’après un service de données satellite : le mur en reçoit plus en janvier qu’en juin, le toit presque trois fois moins. Au centre, la hauteur du soleil à midi, par un calcul : 24° de la perpendiculaire du mur en décembre, 71° en juin. À droite, le rendement du collecteur : ce que l’article lit à l’œil sur sa courbe, et ce que le modèle trouve, plus bas l’hiver, plus haut l’été.',
    'Three curves over twelve months. On the left, the sun received by the wall and by a flat roof, from a satellite data service: the wall receives more in January than in June, the roof almost three times less. In the centre, the sun’s height at noon, by calculation: 24° from the wall’s perpendicular in December, 71° in June. On the right, the collector’s efficiency: what the paper reads by eye on its curve, and what the model finds, lower in winter, higher in summer.',
  ),
  scene: 'house',
  parts: ['south-facade', 'collector-element', 'pitched-roof'],
  render() {
    const d = new Drawing();
    d.frame({
      title: l('Le soleil et les saisons', 'The sun and the seasons'),
      subtitle: l(
        'Odeillo, 1 550 m : le soleil, sa hauteur, le rendement',
        'Odeillo, 1,550 m: the sun, its height, the efficiency',
      ),
      number: 'PL-H03',
      scale: '—',
    });
    const w = 118;
    const plots: Plot[] = [0, 1, 2].map((i) => ({
      x: 24 + i * 130,
      y: 40,
      w,
      h: 108,
      xmin: 0,
      xmax: 12,
      ymin: 0,
      ymax: [220, 90, 50][i]!,
    }));
    bars(d, plots[0]!);
    height(d, plots[1]!);
    efficiency(d, plots[2]!);
    // what each chart says
    const col = (i: number) => 24 + i * 130;
    let y = 164;
    note(
      d,
      col(0),
      y,
      w,
      cat(
        l('Le mur reçoit ', 'The wall receives '),
        numL(site.vertical[0]!, 1, '', ''),
        l(' kWh/m² en janvier et ', ' kWh/m² in January and '),
        numL(site.vertical[5]!, 1, '', ''),
        l(' en juin : ', ' in June: '),
        fig('janJun'),
        l(' plus. En décembre, un toit plat reçoit ', ' more. In December a flat roof receives '),
        numL(site.horizontal[11]!, 1, '', ''),
        l(' contre ', ' against '),
        numL(site.vertical[11]!, 1, '', ''),
        l(' au mur : le mur gagne ', ' for the wall: the wall wins '),
        fig('decRoof'),
        l('. En juin, c’est le toit qui gagne.', '. In June it is the roof that wins.'),
      ),
    );
    note(
      d,
      col(1),
      y,
      w,
      cat(
        l('À midi, le soleil frappe le mur à ', 'At noon the sun strikes the wall at '),
        fig('sunDec'),
        l(' de sa perpendiculaire en décembre, à ', ' from its perpendicular in December, at '),
        fig('sunJun'),
        l(' en juin. La double vitre laisse passer ', ' in June. The double glazing lets '),
        fig('glassDec'),
        l(' du soleil à l’un, ', ' of the sun through at the one, '),
        fig('glassJun'),
        l(' à l’autre (modèle).', ' at the other (model).'),
      ),
    );
    note(
      d,
      col(2),
      y,
      w,
      cat(
        l(
          'L’article donne environ 36 % l’hiver et 15 % en juin. Le modèle retrouve la baisse de l’hiver à mai-juin, ',
          'The paper gives about 36 % in winter and 15 % in June. The model finds the fall from winter to May–June, ',
        ),
        fig('monthFall'),
        l(' contre 18 lus ; il est trop bas de ', ' against 18 read; it is too low by '),
        fig('winterLowPts'),
        l(', et ses mois d’été sont trop hauts de ', ', and its summer months are too high by '),
        fig('summerHighPts'),
        l(', sans que l’on sache pourquoi.', ', and we do not know why.'),
      ),
    );
    marksLegend(d, 24, 206, 118);
    heading(d, 156, 206, l('D’où viennent les courbes', 'Where the curves come from'), { size: 2.2 });
    note(
      d,
      156,
      214,
      190,
      l(
        'Gauche : PVGIS, 2005 à 2023, plan vertical plein sud et plan horizontal, lus par nous. Centre : la formule du soleil à midi, avec la déclinaison au milieu de chaque mois. Droite : la courbe de l’article lue à l’œil à quelques pour cent près, et le modèle sur la série de PVGIS.',
        'Left: PVGIS, 2005 to 2023, a vertical plane facing due south and a horizontal plane, queried by us. Centre: the formula for the sun at noon, with the declination in the middle of each month. Right: the paper’s curve read by eye to within a few per cent, and the model on the PVGIS series.',
      ),
    );
    return d;
  },
};
