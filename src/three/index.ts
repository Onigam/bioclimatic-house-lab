import { lazyModule } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import type { HouseState } from '../sim/types';
import { createHouseScene as buildHouse, type HouseOptions } from './house/scene';
import { createSiteScene as buildSite, type SiteOptions } from './site/scene';
import { createRoomScene as buildRoom, type RoomOptions } from './room/scene';
import { createWallScene as buildWall, type WallOptions } from './wall/scene';

// The four worlds, all `lazyModule`s: nothing is built until the visitor goes there. Use the result as the `module` of a `SceneDef`. They read the simulation's state in `update`; what the state does not carry (the gap,
// the sheets, the ducts, the build, the earth tube and the season's mode) they ask the application for: `createWallScene({ params: () => sim.params })`.

export const createWallScene = (opts: WallOptions = {}): SceneModule<HouseState> =>
  lazyModule<HouseState>('wall', () => buildWall(opts));

export const createSiteScene = (opts: SiteOptions = {}): SceneModule<HouseState> =>
  lazyModule<HouseState>('site', () => buildSite(opts));
export const createHouseScene = (opts: HouseOptions = {}): SceneModule<HouseState> =>
  lazyModule<HouseState>('house', () => buildHouse(opts));
export const createRoomScene = (opts: RoomOptions = {}): SceneModule<HouseState> =>
  lazyModule<HouseState>('room', () => buildRoom(opts));

export type { HouseOptions, RoomOptions, SiteOptions, WallOptions };

/** What `src/lab.ts` needs to know about each world, as `SceneDef` fields: spread it into the definition. */
export const WORLD = {
  site: {
    /** Seen from outside. No section: the house section is the next world. X-ray only makes sense around a selected part in a landscape. */
    cutaway: false,
    xrayNeedsSelection: true,
    /** Heliostats turn and the washing sways: nothing here to slow down. */
    slowMo: false,
    /** The setting does not come apart. */
    explode: false,
    partPadding: 1.15,
    stepFrame: { padding: 1.2, minRadius: 1.5 },
  },
  house: {
    /** The section through the sample collector bay: always offered. */
    cutaway: true,
    partPadding: 2.6,
    stepFrame: { padding: 1.6, minRadius: 1.0 },
    /** X-ray opens the shells: the roof, the walls, the slab and the front glass; the collectors, the ducts, the partitions, the tube stay. */
    xrayShell: (id: string): boolean =>
      id === 'pitched-roof' ||
      id === 'east-gable' ||
      id === 'west-gable' ||
      id === 'north-wall' ||
      id === 'south-facade' ||
      id === 'floor-slab' ||
      id === 'roof-insulation' ||
      id === 'foundation' ||
      id === 'entrance-balcony',
  },
  room: {
    /** No section: it would teach nothing here (the room is open already, its walls step aside). */
    cutaway: false,
    partPadding: 2.4,
    stepFrame: { padding: 1.5, minRadius: 0.4 },
    /** X-ray opens the shells: the floor, the ceiling and the wall's face; the equipment and the streams stay. */
    xrayShell: (id: string): boolean => id === 'room-ceiling' || id === 'room-floor' || id === 'inner-wall-face',
  },
  wall: {
    /** Always cut: the section is the world. */
    cutaway: false,
    partPadding: 2.3,
    stepFrame: { padding: 1.5, minRadius: 0.25 },
    /** X-ray opens the shells: the glazing, the frame, the paint, the concrete. The ducts, the air, the instruments stay. */
    xrayShell: (id: string): boolean =>
      id === 'outer-glazing' ||
      id === 'inner-glazing' ||
      id === 'steel-frame' ||
      id === 'black-paint' ||
      id === 'storage-wall' ||
      id === 'head-beam' ||
      id === 'sill-beam',
  },
} as const;
