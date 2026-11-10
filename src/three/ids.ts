// The part ids of the four worlds, frozen in `docs/research.md` §4 (kebab-case, stable, unique across worlds). The 3D registers exactly these; the catalogue, both guides, the
// lessons and the drawings use the same ids. Each id lives in one world: a world shows the pieces of another as scenery, never as a part.

// The research (§0.4) calls the setting `plateau`. In the kit a world called `site` is framed by its authored home pose, gets its camera planes (0.1 to 4000 m) and a camera that stays above the ground, and the setting is
// a landscape with a furnace a few hundred metres off: so its id is `site` and its label « Le plateau » / « The plateau ». The parts keep the research's list.
export type WorldId = 'site' | 'house' | 'wall' | 'room';

export const WORLD_IDS: readonly WorldId[] = ['site', 'house', 'wall', 'room'];

export const PLATEAU_PARTS = [
  'prototype-house',
  'twin-house',
  'granite-slope',
  'meadow-clearing',
  'tree-clumps',
  'access-road',
  'solar-furnace',
  'heliostat-terraces',
  'solar-houses-1974',
  'pyranometer',
  'far-ridge',
] as const;

export const HOUSE_PARTS = [
  'south-facade',
  'collector-element',
  'entrance-recess',
  'entrance-balcony',
  'south-window',
  'east-gable',
  'west-gable',
  'north-wall',
  'north-window',
  'pitched-roof',
  'roof-insulation',
  'floor-slab',
  'foundation',
  'interior-partitions',
  'chimney',
  'earth-tube-intake',
  'earth-tube-pipe',
  'earth-tube-drain',
] as const;

export const WALL_PARTS = [
  'outer-glazing',
  'inner-glazing',
  'steel-frame',
  'air-gap',
  'black-paint',
  'storage-wall',
  'upper-duct',
  'lower-duct',
  'summer-flap',
  'head-beam',
  'sill-beam',
  'wall-thermocouples',
  'air-thermocouples',
  'hot-wire-anemometer',
] as const;

export const ROOM_PARTS = [
  'inner-wall-face',
  'warm-air-jet',
  'floor-return',
  'thermostat',
  'electric-heater',
  'electric-panel',
  'room-air-probe',
  'room-surface-probes',
  'chart-recorder',
  'fresh-air-vent',
  'room-floor',
  'room-ceiling',
  'armchair',
] as const;

export type PlateauPart = (typeof PLATEAU_PARTS)[number];
export type HousePart = (typeof HOUSE_PARTS)[number];
export type WallPart = (typeof WALL_PARTS)[number];
export type RoomPart = (typeof ROOM_PARTS)[number];

export const PART_IDS: Record<WorldId, readonly string[]> = {
  site: PLATEAU_PARTS,
  house: HOUSE_PARTS,
  wall: WALL_PARTS,
  room: ROOM_PARTS,
};

/** What only exists in the earth tube's scenario: translucent, labelled a what-if. */
export const WHAT_IF_PARTS: readonly string[] = ['earth-tube-intake', 'earth-tube-pipe', 'earth-tube-drain'];

export const ALL_PART_IDS: readonly string[] = [...PLATEAU_PARTS, ...HOUSE_PARTS, ...WALL_PARTS, ...ROOM_PARTS];
