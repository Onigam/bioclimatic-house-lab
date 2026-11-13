import { describe, expect, it } from 'vitest';
import { createHouseScene, createRoomScene, createSiteScene, createWallScene } from './index';
import { stateWith, uvReport, view } from './test-utils';

// The maps of this lab are drawn for UVs in metres (`tiled(map, 1 / tile)`): a map is `tile` metres across whatever it is put on. A shape whose UVs run 0..1 stretches the map by the ratio of its size to a metre. These tests
// read the Jacobian of (u, v) against the surface in metres, mesh by mesh (`uvStretch` in test-utils; the sister lab's, which found its liner at 3 times on average and 17 at its worst): a mesh is true when both singular
// values are about one, and the stretch of a triangle is the larger of the largest and the inverse of the smallest. The bounds are the sister lab's: a mean under 1.5 and the worst 1 % of the surface under 2.

/**
 * Maps that were never drawn for metres: the furniture's linen and wool, a bough's bark and a tree's leaves are laid on their own object from 0 to 1 (a cushion, a trunk, a crown). Listed so that a new map is held to
 * metres by default.
 */
const OWN_UV = new Set(['cloth', 'knit', 'wood', 'bark', 'leaf', 'rug']);

/**
 * Meshes that wear a map at another scale than its tile, on purpose or not yet looked at, with the reason. The far road of the plateau is laid with u = x / 3 along and 0 to 2 across, so that its gravel is three times
 * its tile: finer, the plateau's shimmer (the kit's flicker, `docs/qa.md` D5) would rise. A metre-true road is for the next pass.
 */
const EXCUSED = new Set(['gravel|road']);

const worlds = [
  ['site', () => createSiteScene()],
  ['house', () => createHouseScene()],
  ['wall', () => createWallScene()],
  ['room', () => createRoomScene()],
] as const;

describe('every map made for metres is laid in metres', () => {
  for (const [id, make] of worlds) {
    it(`${id}: the mean stretch of each mesh is under 1.5 and its worst 1 % of surface under 2`, () => {
      const mod = make();
      mod.update(stateWith(), 1 / 60, view({ time: 1 }));
      const checked = uvReport(mod).filter((r) => !OWN_UV.has(r.map) && !EXCUSED.has(r.key));
      expect(checked.length).toBeGreaterThan(5);
      const bad = checked.filter((r) => !(r.mean < 1.5 && r.p99 < 2));
      expect(
        bad.map(
          (r) => `${r.key} area ${r.area.toFixed(3)} m2, mean ${r.mean.toFixed(2)}, worst 1 % ${r.p99.toFixed(1)}`,
        ),
      ).toEqual([]);
    });
  }
});
