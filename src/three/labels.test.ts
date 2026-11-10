import { describe, expect, it } from 'vitest';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { HouseState } from '../sim/types';
import { labelBoxes, type LabelBox } from './framing';
import { createHouseScene } from './house/scene';
import { createRoomScene } from './room/scene';
import { createSiteScene } from './site/scene';
import { stateWith, view } from './test-utils';
import { createWallScene } from './wall/scene';

// The labels of the default views, without a browser: the camera of the kit's overview and the box of a label are replicated (framing.ts). For the labels shown in « Principales » mode: at most six, none over another, none outside
// the view on any of its four sides, none under the toolbar, at the sizes of the review. From Mill Lab, by way of the mass heater lab.

/** The 3D view and what floats over it, in the view's pixels: name, width, height, the room the kit keeps at the bottom, where the toolbar lies (x0, y0, x1, y1), the lowest line a label may reach, whether a sheet lies over the view. */
const SIZES: [string, number, number, number, [number, number, number, number], number, boolean][] = [
  ['1280×800 (view 842×678)', 842, 678, 96, [160, 616, 682, 664], 678, false],
  ['768×1024 (view 380×902)', 380, 902, 130, [12, 804, 368, 888], 902, false],
  ['390×844 (view 390×632)', 390, 632, 92, [12, 524, 378, 588], 598, false],
];

function check(name: string, mod: SceneModule<HouseState>) {
  describe(`labels of ${name}`, () => {
    mod.update(stateWith(), 1 / 60, view({ time: 1 }));
    for (const lang of ['fr', 'en'] as const)
      for (const [label, w, h, toolbar, bar, floor, covered] of SIZES) {
        it(`keep apart and inside the view: ${label}, ${lang}`, () => {
          const boxes = labelBoxes(mod, { w, h }, lang, toolbar, covered).filter((b) => !b.minor);
          expect(boxes.length).toBeLessThanOrEqual(6);
          const over = (a: LabelBox, b: LabelBox) =>
            a.x0 < b.x1 + 3 && b.x0 < a.x1 + 3 && a.y0 < b.y1 + 3 && b.y0 < a.y1 + 3;
          const clash: string[] = [];
          boxes.forEach((a, i) => boxes.slice(i + 1).forEach((b) => over(a, b) && clash.push(`${a.text} / ${b.text}`)));
          expect(clash).toEqual([]);
          for (const b of boxes) {
            expect(b.inFront, b.text).toBe(true);
            expect(b.x0, `${b.text} left`).toBeGreaterThanOrEqual(0);
            expect(b.x1, `${b.text} right`).toBeLessThanOrEqual(w);
            expect(b.y0, `${b.text} top`).toBeGreaterThanOrEqual(0);
            expect(b.y1, `${b.text} bottom`).toBeLessThanOrEqual(floor);
            const underBar = b.x0 < bar[2] && bar[0] < b.x1 && b.y0 < bar[3] && bar[1] < b.y1;
            expect(underBar, `${b.text} under the toolbar`).toBe(false);
          }
        });
      }
  });
}

const params = () => ({ setpoint: 20, gap: 0.12, glazingLayers: 2, earthTube: false });
check('site', createSiteScene({ params }));
check('house', createHouseScene({ params }));
check('wall', createWallScene({ params }));
check('room', createRoomScene({ params }));
