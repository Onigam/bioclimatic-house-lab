import {
  COLLECTOR_1967,
  COLLECTOR_1974,
  ESTIMATE,
  HOUSE_1967,
  ODEILLO,
  ROOM_SETPOINT,
  THERMOSTAT_HEIGHT,
} from '../sim/machine';
import { HOUSE_TUBE } from '../sim/earth-tube';

// The one source of the dimensions of the four worlds and the drawings, metres. What the simulation owns is imported from `src/sim/machine.ts` and never retyped; everything else is here. Every constant carries
// its tag and its source in the comment above it:
//   reported    a source of docs/research.md (S1 is the inventors' own paper, the maker's data sheet of this lab; K numbers are its key figures);
//   derived     computed from what is reported, or what the geometry forces, the computation next to it;
//   estimate    no source gives it: a choice, with its reason;
//   assumption  a choice of how to draw.
// Nothing here is a plan to build from: this lab explains, it gives no recipe. Nothing in this file, or in the repository, says where the houses stand beyond « Odeillo ».

export const DEG = Math.PI / 180;

// ------------------------------------------------------------------------------------------------ the frame
// House frame: x east, y up from the TOP OF THE FLOOR SLAB (y = 0), z SOUTH, the origin on the plan's centre. The south front is the plane z = +DEPTH/2, the north wall's outer face z = −DEPTH/2.
// Element frame: x across the bay from its centre, y as in the house, z = 0 on the OUTER FACE OF THE FRAME, negative into the house.

/** One element's width, which is also the bay of the south front. reported, S1 p. 202 (K15). */
export const BAY = COLLECTOR_1967.elementWidth;
/** Bays on the south front. derived, estimate: the IGN's 15.0 m (plan precision 3 m) over 1.27 m is 11.8, the photograph shows « eight or nine collector bays and three for the door and windows » (K83). */
export const BAYS = 12;
/** Length of the house, outer, east to west. derived: 12 × 1.27 = 15.24 m, against 15.0 ± 3 from open data. */
export const LENGTH = BAYS * BAY;
/** Depth of the house, outer, north to south. estimate: open data, plan precision 3 m, « 15.0 × 6.6 m » (research §0.2, point 10). */
export const DEPTH = 6.6;
export const Z_SOUTH = DEPTH / 2;
export const Z_NORTH = -DEPTH / 2;
export const X_EAST = LENGTH / 2;
export const X_WEST = -LENGTH / 2;

export type BayKind = 'collector' | 'window' | 'recess';
/**
 * What each bay of the south front is, from the west. estimate, from one small photograph (S1 Photo 1): nine collector bays, one window, and two bays of recessed entrance in the middle with
 * their balcony. 9 collector bays of net glass make the reported 48 m² (K83, `collectorGlassArea`).
 */
export const BAY_KINDS: readonly BayKind[] = [
  'collector',
  'collector',
  'collector',
  'collector',
  'window',
  'recess',
  'recess',
  'collector',
  'collector',
  'collector',
  'collector',
  'collector',
];
/** Centre of a bay, m. */
export const bayX = (i: number): number => -LENGTH / 2 + BAY * (i + 0.5);
/** The collector bays' indexes. derived from `BAY_KINDS`. */
export const COLLECTOR_BAYS: readonly number[] = BAY_KINDS.flatMap((k, i) => (k === 'collector' ? [i] : []));
/** The window bay's index. derived from `BAY_KINDS`. */
export const WINDOW_BAY = BAY_KINDS.indexOf('window');
/** The two recess bays' indexes. derived from `BAY_KINDS`. */
export const RECESS_BAYS: readonly number[] = BAY_KINDS.flatMap((k, i) => (k === 'recess' ? [i] : []));
/** The bay the section passes through, and the one the sheets and the `wall` world are about: in the living room, east of the recess. assumption */
export const SAMPLE_BAY = 7;
/** Plane of the section, m: the sample bay's centre. */
export const CUT_X = bayX(SAMPLE_BAY);

// ------------------------------------------------------------------------------------------------ the collector element
// What one bay holds, in the order the sun meets it: the frame, two sheets of glass, 12 cm of air, the black face, 60 cm of concrete with two ducts through it.

export interface ElementSpec {
  /** reported */
  width: number;
  height: number;
  /** Store's thickness. reported 0.60 (K10); the model's slider moves it. */
  thickness: number;
  /** From the last sheet to the black face. reported 0.12 (K14). */
  gap: number;
  /** Sheets of glass. reported 2 (K13); the model's slider, 1 to 3. */
  layers: number;
  /** One sheet. reported 3 mm (K13). */
  glass: number;
  /** Between two sheets. estimate, 25 mm, double glazing of the time (the model's too). */
  spacing: number;
  /** Section of one duct. reported 0.565 × 0.110 (K17); the model's slider scales the width. */
  ductWidth: number;
  ductHeight: number;
  /** Between the two ducts, centre to centre. reported 3.50 (K16), taken centre to centre: an assumption. */
  ductSpan: number;
}

export const ELEMENT_1967: ElementSpec = {
  width: COLLECTOR_1967.elementWidth,
  height: COLLECTOR_1967.elementHeight,
  thickness: COLLECTOR_1967.wallThickness,
  gap: COLLECTOR_1967.gap,
  layers: COLLECTOR_1967.glassLayers,
  glass: COLLECTOR_1967.glassThickness,
  spacing: ESTIMATE.glassSpacing,
  ductWidth: COLLECTOR_1967.ductWidth,
  ductHeight: COLLECTOR_1967.ductHeight,
  ductSpan: COLLECTOR_1967.ductSpan,
};

/** reported, S1 p. 202: the houses of 1974 (a preset of the `wall` world). */
export const ELEMENT_1974: ElementSpec = {
  width: COLLECTOR_1974.elementWidth,
  height: COLLECTOR_1974.elementHeight,
  thickness: COLLECTOR_1974.wallThickness,
  gap: COLLECTOR_1974.gap,
  layers: COLLECTOR_1974.glassLayers,
  glass: COLLECTOR_1974.glassThickness,
  spacing: ESTIMATE.glassSpacing,
  ductWidth: COLLECTOR_1974.ductWidth,
  ductHeight: COLLECTOR_1974.ductHeight,
  ductSpan: COLLECTOR_1974.ductSpan,
};

/** The steel frame. estimate: a slim section of the time (the face), stood proud of the outer sheet; the glazing bars are needed by 3 mm glass (a sheet 4.4 m high would not stand). */
export const FRAME = {
  face: 0.022,
  proud: 0.015,
  /** Behind the last sheet, m. */
  behind: 0.015,
  /** Panes in a column of one element. */
  panes: 4,
  /** Rubber gasket's width round a pane. */
  gasket: 0.006,
} as const;

/** Lower duct's underside above the floor. reported « near floor level » (S1 p. 201, Fig. 1), 0.10 m estimate (research §3). */
export const DUCT_ABOVE_FLOOR = 0.1;

export interface ElementLayout {
  /** Element's bottom and top, m above the floor. */
  yBottom: number;
  yTop: number;
  /** Duct axes. */
  yDuctLow: number;
  yDuctHigh: number;
  /** Sill beam's top (the lower duct's underside) and head beam's underside (the upper duct's top). */
  ySillTop: number;
  yHeadBottom: number;
  /** z of each sheet's front face, and the thickness. */
  sheetFront: number[];
  /** z of the last sheet's back face, of the black face, of the room face (inner face). */
  lastBack: number;
  face: number;
  inner: number;
  /** Depth of the frame, from its outer face (z = 0) to its back. */
  frameBack: number;
  /** Net glazed opening: width and height inside the frame. */
  openW: number;
  openH: number;
}

/** Everything the element's geometry stands on, from its spec. derived */
export function elementLayout(s: ElementSpec): ElementLayout {
  const margin = (s.height - s.ductSpan) / 2;
  const yDuctLow = DUCT_ABOVE_FLOOR + s.ductHeight / 2;
  const yBottom = yDuctLow - margin;
  const sheetFront: number[] = [];
  for (let k = 0; k < s.layers; k++) sheetFront.push(-(FRAME.proud + k * (s.glass + s.spacing)));
  const lastBack = sheetFront[s.layers - 1]! - s.glass;
  const face = lastBack - s.gap;
  return {
    yBottom,
    yTop: yBottom + s.height,
    yDuctLow,
    yDuctHigh: yDuctLow + s.ductSpan,
    ySillTop: DUCT_ABOVE_FLOOR,
    yHeadBottom: yDuctLow + s.ductSpan - s.ductHeight / 2 + s.ductHeight,
    sheetFront,
    lastBack,
    face,
    inner: face - s.thickness,
    frameBack: lastBack - FRAME.behind,
    openW: s.width - 2 * FRAME.face,
    openH: s.height - 2 * FRAME.face,
  };
}

/**
 * The element of the sim's state: the thickness, gap, sheets and ducts the visitor has chosen, on the printed element of the chosen build. The 3D takes them from here and never reads the sliders itself.
 */
export function elementSpecOf(p: {
  build?: '1967' | '1974';
  wallThickness: number;
  gap: number;
  glazingLayers: number;
  ductScale?: number;
}): ElementSpec {
  const base = p.build === '1974' ? ELEMENT_1974 : ELEMENT_1967;
  return {
    ...base,
    thickness: p.wallThickness,
    gap: p.gap,
    layers: Math.max(1, Math.min(3, Math.round(p.glazingLayers))),
    ductWidth: base.ductWidth * (p.ductScale ?? 1),
  };
}

/** Net glass of one element, m²: the opening less the glazing bars. derived */
export function elementGlassArea(s: ElementSpec = ELEMENT_1967): number {
  const w = s.width - 2 * FRAME.face;
  const h = s.height - 2 * FRAME.face;
  return w * h - (FRAME.panes - 1) * FRAME.face * w;
}

/** The nine collector bays' net glass, m². derived; against the reported 48 m² (K7, `HOUSE_1967.collectorArea`). */
export const collectorGlassArea = (): number => COLLECTOR_BAYS.length * elementGlassArea();

// ------------------------------------------------------------------------------------------------ the house
/** Ceiling height. derived: 300 m³ / 76 m² = 3.95 m (K84, S1 Table I). The research reads a sloped ceiling up to the collector; the 3D draws it flat, under a roof void. assumption */
export const CEILING = HOUSE_1967.volume / HOUSE_1967.floorArea;
/** Other walls' thickness. estimate (K85). */
export const WALL = 0.3;
/** Floor slab's thickness. estimate */
export const SLAB = 0.2;
/** Ceiling's thickness. estimate: a slab of board and plaster on joists, thin. */
export const CEILING_T = 0.06;
/** Ground at the north wall and at the south front, m under the floor: the ground falls to the south. estimate: open data says about 2–3.5 m over the footprint, plan precision 3 m (research §3); the low end. */
export const GROUND_NORTH = -0.3;
export const GROUND_SOUTH = -2.0;
/** Footing under the foundation walls, below the ground. estimate */
export const FOOTING = 0.5;
/** Steps of the gables' foundation. estimate: five steps of the slope's fall over 6.6 m. */
export const GABLE_STEPS = 5;
/** Roof pitch. derived: ridge about 1.45 m over the eaves at half-depth 3.3 m, atan(1.45 / 3.3) = 23.7° (K86, rough). */
export const ROOF_PITCH = 24 * DEG;
/** Eave overhang at the south and the north. estimate: the photograph shows none deep, and the model counts no shade but the frame's head (physics §2). */
export const EAVE = 0.15;
/** Wall plate: the roof's feet stand here, above the elements' top. estimate */
export const Y_EAVE = elementLayout(ELEMENT_1967).yTop + 0.08;
/** Ridge height. derived */
export const Y_RIDGE = Y_EAVE + Z_SOUTH * Math.tan(ROOF_PITCH);
/** Roof's build-up, from the rafters up: rafters and boards, insulation, battens and covering. estimate (research §3: roof build-up unknown; G·V stands for the whole). */
export const ROOF = { rafter: 0.14, insulation: 0.1, cover: 0.03 } as const;
/** The chimney: one stack on the roof (research: « the use of the chimney is unknown »). Its place on the plan is an estimate. */
export const CHIMNEY = { x: -4.4, z: -0.9, w: 0.5, d: 0.5, above: 0.9, cap: 0.08 } as const;

/** Where a gable's foundation steps, m: the fall in `GABLE_STEPS` equal steps from the north to the south. derived */
export const gableStepTops = (): number[] => {
  const out: number[] = [];
  for (let k = 0; k < GABLE_STEPS; k++) {
    const t = (k + 0.5) / GABLE_STEPS;
    out.push(GROUND_NORTH + (GROUND_SOUTH - GROUND_NORTH) * t);
  }
  return out;
};

/** The floor plan's walls: two cross partitions at the bay lines either side of the living room, and the rooms' own divisions. estimate (research §2.11: « the plan of the rooms »: unknown). */
export const PARTITION = { t: 0.1, door: 0.9, doorH: 2.05 } as const;
export const LIVING_BAYS: readonly [number, number] = [4, 7];
export const LIVING_X0 = -LENGTH / 2 + LIVING_BAYS[0] * BAY;
export const LIVING_X1 = -LENGTH / 2 + (LIVING_BAYS[1] + 1) * BAY;
/** The north wall's inside face. */
export const Z_NORTH_IN = Z_NORTH + WALL;
/** The gables' inside faces. derived: the outer faces less the walls' 0.30 m. */
export const X_WEST_IN = X_WEST + WALL;
export const X_EAST_IN = X_EAST - WALL;
/** The south wall's inside face for a spec. */
export const zInnerFace = (s: ElementSpec = ELEMENT_1967): number => Z_SOUTH + elementLayout(s).inner;
export const zBlackFace = (s: ElementSpec = ELEMENT_1967): number => Z_SOUTH + elementLayout(s).face;

/** Interior floor area and volume from the drawing, before partitions, m² and m³. derived */
export const interiorArea = (s: ElementSpec = ELEMENT_1967): number =>
  (X_EAST_IN - X_WEST_IN) * (zInnerFace(s) - Z_NORTH_IN);

// ------------------------------------------------------------------------------------------------ the south front, apart from the collectors
/** The window bay's opening: width, sill, head. estimate, Photo 1 */
export const WINDOW = { w: BAY - 0.2, sill: 0.35, head: 3.71 } as const;
/** The recess: two bays wide, the door's leaf and its glazing. The back wall of the recess is the inner face of the wall. estimate, Photo 1 */
export const RECESS = { door: 0.95, doorH: 2.2, head: 3.71, transom: 2.35 } as const;
/** The balcony: the slab continued out from the floor, its depth beyond the front, the width, the rail, the stair. estimate */
export const BALCONY = { depth: 1.3, width: 3.4, rail: 1.0, rise: 0.19, tread: 0.28, stairW: 1.1 } as const;
/** Head band along the whole front: ring beam and fascia. estimate */
export const HEAD_BAND = { h: 0.08, d: 0.2 } as const;

// ------------------------------------------------------------------------------------------------ the earth tube (what-if)
/** The pipe: length, diameter, depth of its axis, from the model. reported by way of the model (an architect's illustration: 25–50 m, 1.5–2 m, K89). */
export const TUBE = { length: HOUSE_TUBE.length, diameter: HOUSE_TUBE.diameter, depth: HOUSE_TUBE.depth } as const;
/** Slope of the pipe, towards the drain. estimate: 1 to 2 % is the usual advice (the lesson says condensate must run out). */
export const TUBE_FALL = 0.015;

// ------------------------------------------------------------------------------------------------ the room
export const ROOM = {
  /** reported, S1 p. 203: thermostat at 1.50 m. */
  thermostat: THERMOSTAT_HEIGHT,
  /** reported, S1 Table I: thermostated at 20 °C. */
  setpoint: ROOM_SETPOINT,
  /** estimate: electric convector, under the north window. */
  heater: { w: 0.9, h: 0.5, d: 0.1, y: 0.12 },
  /** estimate: the panel on the partition; a recorder on its desk, instruments of 1974–75. */
  panel: { w: 0.32, h: 0.42, d: 0.1, y: 1.4 },
  recorder: { w: 0.42, h: 0.2, d: 0.34 },
  /** estimate: a north window, small and few (S2 on the principle). */
  northWindow: { w: 0.9, sill: 1.0, head: 2.0 },
  /** estimate: the fresh-air vent, low on the north wall. Where fresh air comes in is unknown (research §2.11). */
  freshVent: { w: 0.3, h: 0.15, y: 0.2 },
} as const;

/** Depths of the thermocouples in the wall from its outer face, m, at the 0.60 m wall: the drawn wall scales them with its thickness. estimate: S1 gives 0.1 mm copper-constantan « at depths » (no list); a spread that shows the wave, the first and last a bead's radius and more from the faces. */
export const THERMOCOUPLE_DEPTHS: readonly number[] = [0.014, 0.05, 0.15, 0.3, 0.45, 0.585];
/** Where the air thermocouples hang in the gap, as fractions of the span between the ducts. estimate */
export const AIR_PROBE_FRACTIONS: readonly number[] = [0.15, 0.5, 0.85];

// ------------------------------------------------------------------------------------------------ the setting
export const SITE = {
  altitude: ODEILLO.altitude,
  /** The solar furnace's building: reported, S11. The mirror's area is reported (1,830 m²), its outline is an estimate. */
  furnace: { width: 54, height: 48, depth: 34, mirrorHeight: 40, mirrorArea: 1830, focal: 18 },
  /** Heliostats: reported 63 of 2,835 m² in all (S12); 6 × 7.5 m is derived (2,835 / 63 = 45 m²) and the shape an estimate; eight terraces an estimate. */
  heliostat: { count: 63, area: 2835 / 63, w: 6, h: 7.5, terraces: 8 },
  /** The 1974 building: footprint and height from open data (K61), reported with the plan precision of 3 m. */
  monument: { length: 37, depth: 14, height: 12.9 },
  /** The twin house stands beside the prototype, same function, moved. estimate */
  twinAt: 38,
  /** The solar furnace: a few hundred metres away, composed, never mapped (research §3): the plateau's composition puts it where it reads best. */
  furnaceAt: [250, -120] as const,
  /** The field of heliostats in front of it, on eight terraces: the first terrace's centre, the terraces' depth, the spacing along a terrace. estimate: composed. */
  field: { z0: -75, dz: 12, dx: 11 },
  /** The 1974 building, up the slope. estimate: composed. */
  monumentAt: [-72, -58] as const,
  /** The pyranometer of S1: « at the laboratory ». estimate: a stand with a Kipp sensor. */
  pyranometerAt: [-18, 0, -14] as const,
} as const;
