import type { PartInfo } from '@onigam/lab-kit/content';
import { DIM_SPECS } from './parts/dim-specs';
import { HOUSE_PARTS } from './parts/house';
import { ROOM_PARTS } from './parts/room';
import { SITE_PARTS } from './parts/site';
import { WALL_PARTS } from './parts/wall';

// The parts catalogue: one entry per selectable 3D part, one file per world in ./parts, in the order of src/three/ids.ts: `site` 11 (« Le plateau »), `house` 18, `wall` 14, `room` 13, 56 in all. The ids are the contract with the 3D role:
// data.test.ts holds them against that list. The few drawn sizes that no row of a sheet already gives are read from src/three/dims.ts in ./parts/dim-specs.ts and appended here, so that no length is typed twice.
export const PARTS: PartInfo[] = [...SITE_PARTS, ...HOUSE_PARTS, ...WALL_PARTS, ...ROOM_PARTS].map((p) => ({
  ...p,
  specs: [...p.specs, ...(DIM_SPECS[p.id] ?? [])],
}));
