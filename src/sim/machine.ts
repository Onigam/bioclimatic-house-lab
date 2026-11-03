import { constantMaterial, type Material } from '@onigam/lab-kit/sim/thermal';

// The machine as its builders describe it, and every choice the sources leave to us. The inventors' own paper is the maker's data sheet here: what comes from it lives in the two
// COLLECTOR and the HOUSE tables, once (`src/three/dims.ts` is to import these, never retype them). What comes from nowhere is in ESTIMATE, each with its reason.
// SI, temperatures in °C. Words used: reported, derived, estimate, assumption, as in docs/physics.md.

/** One kilocalorie, J. */
export const KCAL = 4186.8;

/** The element of a collector, as printed. */
export interface CollectorSpec {
  /** Thickness of the store, m. reported */
  wallThickness: number;
  /** Height and width of one element, m. reported */
  elementHeight: number;
  elementWidth: number;
  /** Wall to glazing, m. reported */
  gap: number;
  /** One sheet of glass, m. reported */
  glassThickness: number;
  glassLayers: number;
  /** Section of one duct, m. reported */
  ductWidth: number;
  ductHeight: number;
  /** Between the two ducts, m. reported; taken centre to centre: an assumption. */
  ductSpan: number;
  /** The exchange area the source gives for one element, m². reported */
  exchangeAreaReported: number;
  /** Air at the lower duct, °C, the room being at 20 °C. reported, on the curves' legend. */
  inletAir: number;
}

/** reported: the 1967 prototypes. */
export const COLLECTOR_1967: CollectorSpec = {
  wallThickness: 0.6,
  elementHeight: 4.38,
  elementWidth: 1.27,
  gap: 0.12,
  glassThickness: 0.003,
  glassLayers: 2,
  ductWidth: 0.565,
  ductHeight: 0.11,
  ductSpan: 3.5,
  exchangeAreaReported: 4.5,
  inletAir: 17,
};

/** reported: the houses of 1974. */
export const COLLECTOR_1974: CollectorSpec = {
  wallThickness: 0.37,
  elementHeight: 2.5,
  elementWidth: 1.55,
  gap: 0.12,
  glassThickness: 0.004,
  glassLayers: 2,
  ductWidth: 0.84,
  ductHeight: 0.095,
  ductSpan: 2.2,
  exchangeAreaReported: 3.25,
  inletAir: 18,
};

/** The whole house, as printed. */
export interface HouseSpec {
  storeys: number;
  rooms: number;
  /** Living area, m². */
  floorArea: number;
  /** m³. */
  volume: number;
  /** Mean coefficient, W/m²·K. */
  K: number;
  /** Heat lost per unit of volume and of temperature difference, W/m³·K. */
  G: number;
  /** m². Printed « 48 m³ » for 1967: a misprint. */
  collectorArea: number;
  /** m²/m³, as printed. */
  collectorPerVolume: number;
}

/** reported */
export const HOUSE_1967: HouseSpec = {
  storeys: 1,
  rooms: 4,
  floorArea: 76,
  volume: 300,
  K: 1.34,
  G: 1.63,
  collectorArea: 48,
  collectorPerVolume: 0.16,
};

/** reported: the first of the three 1974 units. */
export const HOUSE_1974: HouseSpec = {
  storeys: 2,
  rooms: 6,
  floorArea: 210,
  volume: 525,
  K: 0.4,
  G: 1.0,
  collectorArea: 55,
  collectorPerVolume: 0.1,
};

/** The place, as the source gives it. reported; the latitude rounded (its last digit is lost in the scan). */
export const ODEILLO = { altitude: 1550, latitude: 42.5, airRhoReported: 1, airCpReported: 1007 };

/** Room air and the thermostat, °C. reported */
export const ROOM_SETPOINT = 20;
export const THERMOSTAT_HEIGHT = 1.5;
/** Air on the lower duct against the room, K. reported: 20 − 17 °C for 1967. */
export const FLOOR_DROP = ROOM_SETPOINT - COLLECTOR_1967.inletAir;

/** The heating period, day of the year (1 October, 20 May). reported */
export const HEATING_START_DAY = 274;
export const HEATING_END_DAY = 140;

export type WallMaterialId = 'concrete' | 'brick' | 'stone' | 'adobe';
export const WALL_MATERIAL_IDS: WallMaterialId[] = ['concrete', 'brick', 'stone', 'adobe'];

/**
 * The stores. The concrete is the source's own (ρ, λ, c in kcal), `reported`. The three others are usual handbook values, written from memory: `estimate`, none was read for this lab. They
 * are here so that a visitor can compare wave speeds, not to say what a real brick wall does.
 */
export const WALL_MATERIALS: Record<WallMaterialId, Material> = {
  concrete: constantMaterial('gravel concrete', 2200, 0.22 * KCAL, 1.75),
  brick: constantMaterial('dense brick', 1800, 840, 0.8),
  stone: constantMaterial('granite', 2650, 790, 2.8),
  adobe: constantMaterial('adobe', 1500, 1000, 0.6),
};

/** Every number below was chosen before any comparison with the source's results and has not moved since. Range and reason next to each. */
export const ESTIMATE = {
  /** Black acrylic: not given. Research's range 0.90 to 0.95. */
  absorptance: 0.93,
  /** Emittance of the paint: the 0.94 the source uses for every surface. reported */
  plateEmittance: 0.94,
  /** Soda-lime glass, the usual value and the solar lab's. */
  glassEmittance: 0.88,
  /** Extinction of window glass, per metre: 4 for water-white to 32 for green, usual range. A plain glass of the time: not given. */
  glassExtinction: 20,
  /** Refractive index of glass, usual. */
  glassIndex: 1.526,
  /** Between the two sheets, m: double glazing of the time. Not given. */
  glassSpacing: 0.025,
  /** Sum of the minor losses of the loop, on the velocity head of the duct: a sharp entry 0.5, the turn and widening into the gap 1, the narrowing and turn out of it 1.5, the exit 1. Handbook values from memory; sharp-edged. The research's range is 3 to 5. */
  ductLossK: 4,
  /** Glass of the south windows and door, m²: three bays of 5.56 m², read on one small photograph. It drives the share. */
  windowArea: 16.7,
  /** Windows of the time, double, W/m²·K. Single would be near 5. */
  windowU: 3,
  /** Share of a window's opening that is glass. */
  windowGlassShare: 0.85,
  /** Occupants and appliances, W. Nobody publishes it. */
  gains: 500,
  /** Air changes per hour inside the house's G·V: only splits it between air and walls. Not given. */
  airChange: 0.5,
  /** Inner skin, partitions, floor and furniture, J/K: a slab and partitions at a tenth of a metre, about 20 MJ/K. Range 10 to 40. */
  roomMass: 20e6,
  /** Furniture and light things that follow the air, J/K, on top of the air itself. */
  roomAirExtra: 0.2e6,
  /** Inner surfaces that exchange with the room's air, m²: floor and ceiling 152, three outer walls about 105, partitions about 120. */
  roomSurface: 380,
  /** Film from the room's air to those surfaces, W/m²·K: a usual still-air value. */
  roomSurfaceFilm: 3,
  /** Wind on the glass, m/s. The source says it matters and prints none. */
  wind: 2,
  /** Ground reflectance. PVGIS's plane value already carries its own; snow would raise it to about 0.7. */
  albedo: 0.2,
  /** Occupants open a window above this, °C. Nobody says. */
  ventLimit: 26,
  /** What an open window adds, W/K: about 3 air changes an hour in this volume. */
  ventOpenG: 250,
  /** Half the daily swing of the outside air, K: under a clear sky and under cloud. By eye on the recordings. */
  airSwingClear: 4,
  airSwingOvercast: 1.5,
  /** A screen in front of the glass at night, m²·K/W: the source says « insulation screens » and gives nothing. About 4 cm of a foam. */
  shutterR: 1,
  /** The heater's limit, W: enough for this house at about −15 °C. Ideal up to this. */
  heaterMax: 20000,
} as const;

/** Area of one element, m². derived */
export const elementArea = (c: CollectorSpec): number => c.elementHeight * c.elementWidth;
/** Elements on the house. derived; the model multiplies one element and has no edges (an assumption). */
export const elementCount = (c: CollectorSpec, h: HouseSpec): number => h.collectorArea / elementArea(c);
/** Section of one duct, m². derived */
export const ductArea = (c: CollectorSpec): number => c.ductWidth * c.ductHeight;
/** Section of the gap of one element, m². derived */
export const gapArea = (c: CollectorSpec): number => c.elementWidth * c.gap;
/** The share of the plate the moving air sweeps: between the ducts. derived */
export const sweptShare = (c: CollectorSpec): number => c.ductSpan / c.elementHeight;
