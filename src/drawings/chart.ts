import { W, type Drawing, type Text } from '@onigam/lab-kit/drawings';
import { INK_2 } from '@onigam/lab-kit/drawings';
import { PAPER } from './draw';

// A small chart in paper space for the sheets that plot something: a plot area with its grid, its ticks and its labels. The values are the caller's: nothing is typed here.

export interface Plot {
  /** Paper millimetres of the plot area's top-left corner, width and height. */
  x: number;
  y: number;
  w: number;
  h: number;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
}

export const px = (p: Plot, v: number): number => p.x + ((v - p.xmin) / (p.xmax - p.xmin)) * p.w;
export const py = (p: Plot, v: number): number => p.y + p.h - ((v - p.ymin) / (p.ymax - p.ymin)) * p.h;

export interface AxesOptions {
  xTicks: [number, Text][];
  yTicks: [number, Text][];
  title?: Text;
  /** The unit of the vertical axis, written above its top. */
  yUnit?: Text;
  xUnit?: Text;
}

/** The plot area, its horizontal grid, its tick labels, its title above and the vertical unit above the axis. */
export function axes(d: Drawing, p: Plot, o: AxesOptions): void {
  const v = d.paper();
  v.rect([p.x, p.y], [p.x + p.w, p.y + p.h], { w: W.medium, fill: PAPER });
  for (const [t, label] of o.yTicks) {
    const y = py(p, t);
    v.line([p.x, y], [p.x + p.w, y], { w: W.thin, color: '#d4cfc4' });
    v.text([p.x - 1.2, y], label, { size: 1.7, anchor: 'end', baseline: 'middle', mono: true });
  }
  for (const [t, label] of o.xTicks) {
    const x = px(p, t);
    v.line([x, p.y + p.h], [x, p.y + p.h + 1], { w: W.thin });
    v.text([x, p.y + p.h + 1.6], label, { size: 1.7, anchor: 'middle', baseline: 'top', mono: true });
  }
  if (o.title) v.text([p.x, p.y - 8], o.title, { size: 2.3, weight: 'bold', baseline: 'bottom' });
  if (o.yUnit) v.text([p.x, p.y - 2], o.yUnit, { size: 1.7, color: INK_2, baseline: 'bottom' });
  if (o.xUnit) v.text([p.x + p.w, p.y + p.h + 9], o.xUnit, { size: 1.7, color: INK_2, anchor: 'end', baseline: 'top' });
}
