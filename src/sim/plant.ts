import {
  airCp,
  airK,
  airMu,
  airPr,
  airRho,
  buildGrid,
  createNetwork,
  FILM_VERTICAL,
  GRAVITY,
  naturalFilm,
  radiationConductance,
  seriesU,
  setLinkConductance,
  setNodeTemperature,
  SIGMA,
  solveLoopFlow,
  stepNetwork,
  totalBoundaryEnergy,
  totalEnthalpy,
  tubeFlow,
  uniformEdges,
  velocityHead,
  type GasProperties,
  type LinkSpec,
  type Material,
  type NodeSpec,
  type RCNetwork,
} from '@onigam/lab-kit/sim/thermal';
import type { SkySample } from './climate';
import { DIFFUSE_ANGLE, readAngle, type Glazing } from './optics';
import { skyTemperature, windFilm } from './solar';

// The machine as a network: the store as a one-dimensional grid of cells (the kit's), one to three sheets of glass, the room's air and the room's mass, three fixed nodes outside. The two faces of the
// wall and the air of the gap hold no heat of their own: they are solved in closed form at each step, which is what lets a step be a minute long. See docs/physics.md §2.
// One column of wall, one gap, one room, the element multiplied by the wall's area: no edges, no rooms.

export type VentMode = 'open' | 'closed' | 'one-way';
export type SeasonMode = 'winter' | 'summer';

/** Everything the network is built from, SI. Made by `specOf` in presets.ts. */
export interface PlantSpec {
  // the store
  material: Material;
  thickness: number;
  /** m² of collector. */
  area: number;
  // one element
  elementHeight: number;
  elementWidth: number;
  gap: number;
  ductSpan: number;
  /** Section of a duct, m², and its hydraulic diameter, m. */
  ductArea: number;
  ductDiameter: number;
  // the glass
  glazing: Glazing;
  glassThickness: number;
  glassSpacing: number;
  plateEmittance: number;
  glassEmittance: number;
  /** Minor losses of the loop, on the duct's velocity head. */
  lossK: number;
  // the house
  /** W/K: the wall's and windows' own loss are physical links of this network: `envelopeG` says what is left for the rest. */
  envelopeG: number;
  airG: number;
  windowG: number;
  windowGlazing: Glazing;
  windowArea: number;
  gains: number;
  roomMass: number;
  roomAirCapacity: number;
  roomSurfaceG: number;
  /** Air on the lower duct against the room, K. */
  floorDrop: number;
  /** Film on the inner face: the source's mean of its two, or the kit's. */
  innerFilm: 'source' | 'kit';
  /** m², K/W: a screen at night; 0 for none. */
  shutterR: number;
  // the control
  setpoint: number;
  backup: boolean;
  /** Hold the room at the setpoint both ways, as the source's balances are computed. */
  holdRoom: boolean;
  heaterMax: number;
  ventLimit: number;
  ventOpenG: number;
  vents: VentMode;
  mode: SeasonMode;
  /** The what-if: fresh air through a pipe. Its share of the temperature gap to the soil, 0 for no tube. */
  tubeTheta: number;
  /** Capacity rate of the fresh air, W/K. */
  freshC: number;
  // the place
  pressure: number;
}

/** Energy book of a run, J. Every joule that enters or leaves the network is in it. */
export interface EnergyBook {
  /** Incident on the collector. */
  sunWall: number;
  /** Absorbed by the plate and the glass. */
  absorbed: number;
  /** Through the windows. */
  sunWindows: number;
  gains: number;
  aux: number;
  /** Taken out by the thermostat, when the room is held both ways. */
  cooled: number;
  /** Through the air loop, to the room. Negative when it runs backward. */
  qt: number;
  /** Radiation and convection off the inner face. */
  qr: number;
  qc: number;
  /** The gap's heat thrown out in the summer position. */
  exhaust: number;
  /** What the summer's draw of outside air takes from the room (positive: cooling). */
  draw: number;
  /** Lost through an open window above the limit. */
  vented: number;
  /** Given by the earth tube to the fresh air (negative in summer). */
  tube: number;
}

export const newBook = (): EnergyBook => ({
  sunWall: 0,
  absorbed: 0,
  sunWindows: 0,
  gains: 0,
  aux: 0,
  cooled: 0,
  qt: 0,
  qr: 0,
  qc: 0,
  exhaust: 0,
  draw: 0,
  vented: 0,
  tube: 0,
});

const CELL = 0.025;
const MIN_CELLS = 8;
const MAX_CELLS = 32;
/** Flow limit per element, kg/s: far above anything this loop reaches. */
const FLOW_MAX = 0.3;
const P_ATM = 101325;
const TINY_CAP = 1e-6;

/**
 * The friction of a smooth passage: the larger of 64/Re and Petukhov's. The kit's `tubeFriction` jumps at Re 2300 (it says so); this loop's flow crosses that in every morning, and a jump in a loop
 * this weak would pin the flow at the jump, which is a false plateau. Continuous on purpose.
 */
const frictionOf = (Re: number): number => {
  const r = Math.max(Re, 1);
  return Math.max(64 / r, Re > 600 ? Math.pow(0.79 * Math.log(r) - 1.64, -2) : 0);
};

/** The draft of a warm column at the site's pressure, Pa. The kit's `stackDraft` calls `airRho` at sea level, a fifth high at 1,550 m (`docs/kit-requests.md`, item 1). */
export const draftAt = (H: number, Tcolumn: number, Tbeside: number, p: number): number =>
  GRAVITY * H * (airRho(Tbeside, p) - airRho(Tcolumn, p));

/** S1's film on the inner face, W/m²·K: the mean of h_min = 5.108·ΔT^¼ and h_max = 6.364·ΔT^⅓ in kJ/h·m²·°C. reported */
export const sourceFilm = (dT: number): number => {
  const d = Math.abs(dT);
  return (((5.108 * Math.pow(d, 0.25) + 6.364 * Math.cbrt(d)) / 2) * 1000) / 3600;
};

/** The effective emittance S1 uses between the inner face and the room: 17.95×10⁻⁸ kJ/h·m²·K⁴. reported */
export const SOURCE_ROOM_EMITTANCE = (17.95e-8 * 1000) / 3600 / SIGMA;

/** Natural convection across a closed vertical slot, W/m²·K: the largest of the three branches of ElSherbiny, Raithby and Hollands (1982), from memory. For the space between the sheets of glass. */
export function slotFilm(T1: number, T2: number, L: number, p: number, height: number): number {
  const Tm = (T1 + T2) / 2;
  const dT = Math.max(Math.abs(T1 - T2), 0.01);
  const rho = airRho(Tm, p);
  const nu = airMu(Tm) / rho;
  const k = airK(Tm);
  const alpha = k / (rho * airCp(Tm));
  const Ra = (GRAVITY * (1 / (Tm + 273.15)) * dT * L * L * L) / (nu * alpha);
  const n1 = 0.0605 * Math.cbrt(Ra);
  const n2 = Math.cbrt(1 + Math.pow((0.104 * Math.pow(Ra, 0.293)) / (1 + Math.pow(6310 / Ra, 1.36)), 3));
  const n3 = 0.242 * Math.pow(Ra * (L / height), 0.273);
  return (Math.max(n1, n2, n3) * k) / L;
}

/** The working values of a step: no allocation. */
interface Work {
  hP: number;
  hG: number;
  hS: number;
  hR: number;
  Sp: number;
  Tg: number;
  Tc0: number;
  Ta: number;
  To: number;
  // results of the last `gapSolve`
  Tf: number;
  Tbar: number;
  Tin: number;
  N: number;
  ex: number;
}

export class Plant {
  readonly net: RCNetwork;
  readonly book: EnergyBook = newBook();
  readonly cells: number;
  readonly sheets: number;
  readonly iGlassOut: number;
  readonly iGlassIn: number;
  readonly iAir: number;
  readonly iMass: number;
  readonly iOut: number;
  readonly iGlassAir: number;
  readonly iSky: number;
  private readonly linkGlassAir: number;
  private readonly linkGlassSky: number;
  private readonly linkSlots: number[] = [];
  /** Conductance of the half-cell on each face, W/m²·K. */
  readonly faceG: number;
  /** Per element: area, swept share, column height, gap section, hydraulic diameter. */
  readonly elementA: number;
  readonly swept: number;
  readonly gapA: number;
  readonly gapD: number;
  /** m² of collector per element. */
  readonly elements: number;
  private readonly gas: GasProperties;
  private readonly residual: (m: number) => number;
  private readonly filmC: number;
  private readonly dif: { tauAlpha: number; absorbed: Float64Array; tauWindow: number };
  private readonly w: Work = {
    hP: 3,
    hG: 3,
    hS: 1.5,
    hR: 5,
    Sp: 0,
    Tg: 10,
    Tc0: 25,
    Ta: 20,
    To: 5,
    Tf: 25,
    Tbar: 20,
    Tin: 17,
    N: 0,
    ex: 0,
  };
  // the live readings, kept for the engine and the runs
  /** Outer and inner face, °C. */
  Tf = 25;
  Tb = 25;
  /** Air of the gap: mean, out, at mid-height, in, °C. */
  Tbar = 20;
  Tout = 20;
  Tmid = 20;
  Tin = 17;
  /** Per element, kg/s, positive up the gap. */
  flow = 0;
  /** Present powers, W: the whole house. */
  Pabsorbed = 0;
  PqT = 0;
  PqR = 0;
  PqC = 0;
  Pwindows = 0;
  Paux = 0;
  Pdraw = 0;
  /** °C, set by the runner when the day changes. */
  soilT = 7;
  Tenv = 0;

  constructor(
    readonly spec: PlantSpec,
    wallProfile?: ArrayLike<number>,
    temperatures?: { Tair: number; Tmass: number; glass: number },
  ) {
    const s = spec;
    const n = Math.min(MAX_CELLS, Math.max(MIN_CELLS, Math.round(s.thickness / CELL)));
    this.cells = n;
    this.sheets = s.glazing.sheets;
    const grid = buildGrid({
      geometry: 'xy',
      xEdges: uniformEdges(s.thickness, n),
      yEdges: [0, s.area],
      depth: 1,
      material: s.material,
      T: 25,
    });
    const nodes: NodeSpec[] = [...grid.nodes];
    const links: LinkSpec[] = [...grid.links];
    this.iGlassOut = nodes.length;
    const glassC = 2500 * 840 * s.glassThickness * s.area;
    for (let i = 0; i < this.sheets; i++) nodes.push({ T: temperatures?.glass ?? 10, capacity: glassC });
    this.iGlassIn = this.iGlassOut + this.sheets - 1;
    this.iAir = nodes.length;
    nodes.push({ T: temperatures?.Tair ?? s.setpoint, capacity: s.roomAirCapacity });
    this.iMass = nodes.length;
    nodes.push({ T: temperatures?.Tmass ?? s.setpoint - 2, capacity: s.roomMass });
    this.iOut = nodes.length;
    nodes.push({ T: 5, fixed: true });
    this.iGlassAir = nodes.length;
    nodes.push({ T: 5, fixed: true });
    this.iSky = nodes.length;
    nodes.push({ T: 0, fixed: true });
    this.linkGlassAir = links.length;
    links.push({ a: this.iGlassOut, b: this.iGlassAir, G: 1 });
    this.linkGlassSky = links.length;
    links.push({ a: this.iGlassOut, b: this.iSky, G: 1 });
    for (let i = 0; i + 1 < this.sheets; i++) {
      this.linkSlots.push(links.length);
      links.push({ a: this.iGlassOut + i, b: this.iGlassOut + i + 1, G: 1 });
    }
    links.push({ a: this.iAir, b: this.iMass, G: s.roomSurfaceG });
    links.push({ a: this.iAir, b: this.iOut, G: s.airG + s.windowG });
    links.push({ a: this.iMass, b: this.iOut, G: s.envelopeG });
    this.net = createNetwork(nodes, links);
    if (wallProfile) {
      for (let i = 0; i < n; i++) {
        const x = wallProfile.length === n ? i : (i * (wallProfile.length - 1)) / Math.max(1, n - 1);
        const a = Math.floor(x);
        const b = Math.min(wallProfile.length - 1, a + 1);
        setNodeTemperature(this.net, i, wallProfile[a]! + (wallProfile[b]! - wallProfile[a]!) * (x - a));
      }
    }
    const dx = s.thickness / n;
    this.faceG = s.material.k(25) / (dx / 2);
    this.elementA = s.elementHeight * s.elementWidth;
    this.swept = Math.min(1, s.ductSpan / s.elementHeight);
    this.gapA = s.elementWidth * s.gap;
    this.gapD = (2 * s.elementWidth * s.gap) / (s.elementWidth + s.gap);
    this.elements = s.area / this.elementA;
    this.gas = { rho: 1, mu: airMu(25), k: airK(25), Pr: airPr(25) };
    this.filmC = FILM_VERTICAL * Math.pow(s.pressure / P_ATM, 2 / 3);
    this.dif = {
      tauAlpha: readAngle(s.glazing.tauAlpha, DIFFUSE_ANGLE),
      absorbed: new Float64Array(this.sheets),
      tauWindow: readAngle(s.windowGlazing.tau, DIFFUSE_ANGLE),
    };
    for (let j = 0; j < this.sheets; j++) this.dif.absorbed[j] = readAngle(s.glazing.absorbed[j]!, DIFFUSE_ANGLE);
    this.residual = (m: number): number => this.pressureBalance(m);
  }

  // -------------------------------------------------------------- the gap: closed form, given a flow

  /**
   * Given a flow, the gap's air and the plate. Over the swept height the air rises with an exponential against the two surfaces, so that its mean is φ·T_in + (1 − φ)·T_eq, with φ = (1 − e^−N)/N and T_eq the
   * weighted mean of plate and glass. The plate's face holds no heat, its balance is linear in T_f and solved exactly. Writes the results in the work record.
   */
  private gapSolve(m: number): void {
    const w = this.w;
    const cap = Math.abs(m) * airCp(w.Tbar);
    const s = this.swept;
    const sum = w.hP + w.hG;
    const b = w.hP / sum;
    let phi = 0;
    let ex = 0;
    let N = Infinity;
    if (cap > TINY_CAP) {
      N = (sum * this.elementA * s) / cap;
      ex = Math.exp(-N);
      phi = (1 - ex) / N;
    }
    const Tin = this.inletOf(m);
    const G = this.faceG;
    const coef = G + w.hR + (1 - s) * w.hS + s * w.hP * (1 - (1 - phi) * b);
    const rhs =
      w.Sp + G * w.Tc0 + w.hR * w.Tg + (1 - s) * w.hS * w.Tg + s * w.hP * (phi * Tin + (1 - phi) * (1 - b) * w.Tg);
    const Tf = rhs / coef;
    w.Tf = Tf;
    w.Tbar = phi * Tin + (1 - phi) * (b * Tf + (1 - b) * w.Tg);
    w.Tin = Tin;
    w.N = N;
    w.ex = ex;
  }

  /** Air entering the gap: from the floor going up, from the ceiling coming down; in the summer position from the room going up, from outside coming down. */
  private inletOf(m: number): number {
    const w = this.w;
    if (this.spec.mode === 'summer') return m >= 0 ? w.Ta : w.To;
    return m >= 0 ? w.Ta - this.spec.floorDrop : w.Ta;
  }

  /** Net pressure at a flow, Pa, positive towards an upward flow. */
  private pressureBalance(m: number): number {
    this.gapSolve(m);
    const w = this.w;
    const s = this.spec;
    const beside = s.mode === 'summer' ? w.To : w.Ta;
    const draft = draftAt(s.ductSpan, w.Tbar, beside, s.pressure);
    const rho = airRho((w.Tbar + beside) / 2, s.pressure);
    const mu = airMu(w.Tbar);
    const a = Math.abs(m);
    const ReD = (a * s.ductDiameter) / (s.ductArea * mu);
    const ReG = (a * this.gapD) / (this.gapA * mu);
    // two ducts, as long as the wall is thick; one gap between them
    const lossD = (s.lossK + (frictionOf(ReD) * 2 * s.thickness) / s.ductDiameter) * velocityHead(a, s.ductArea, rho);
    const lossG = ((frictionOf(ReG) * s.ductSpan) / this.gapD) * velocityHead(a, this.gapA, rho);
    return draft - Math.sign(m) * (lossD + lossG);
  }

  /** Films of the gap: natural, joined with the forced film of the flow. Read once per step, from the last step's temperatures: they change slowly. */
  private readFilms(m: number): void {
    const w = this.w;
    const s = this.spec;
    const P = s.pressure;
    const Tm = w.Tbar;
    this.gas.rho = airRho(Tm, P);
    this.gas.mu = airMu(Tm);
    this.gas.k = airK(Tm);
    this.gas.Pr = airPr(Tm);
    // the kit's tube thinks in round sections: the flow that gives the gap's own Reynolds number in a tube of its hydraulic diameter. Always the flow's size: 0.6.0 reads a negative flow as laminar.
    const equiv = (Math.abs(m) * Math.PI * this.gapD * this.gapD) / (4 * this.gapA);
    const hF = tubeFlow(equiv, this.gapD, this.gas).h;
    const hNatP = naturalFilm(this.Tf - Tm, this.filmC);
    const hNatG = naturalFilm(w.Tg - Tm, this.filmC);
    // still air across half the gap is the floor
    const floor = this.gas.k / (s.gap / 2);
    const join = (a: number): number => Math.cbrt(a * a * a + hF * hF * hF);
    w.hP = Math.max(join(hNatP), floor);
    w.hG = Math.max(join(hNatG), floor);
    w.hS = (w.hP * w.hG) / (w.hP + w.hG);
    w.hR = radiationConductance(1 / (1 / s.plateEmittance + 1 / s.glassEmittance - 1), 1, this.Tf, w.Tg);
  }

  // -------------------------------------------------------------- one step

  step(sky: SkySample, dt: number): void {
    const s = this.spec;
    const net = this.net;
    const T = net.T;
    const Q = net.Q;
    const A = s.area;
    const w = this.w;
    const To = sky.air;
    const n = this.cells;

    // ---- the sun
    const beam = sky.beam;
    const dif = sky.diffuse;
    const theta = beam > 0 ? (Math.acos(Math.min(1, Math.max(0, sky.cosTheta))) * 180) / Math.PI : 0;
    const glazing = s.glazing;
    // the plate stands a gap behind the glass: a high sun puts the top of it in the shadow of the head
    const shaded =
      beam > 0
        ? (s.gap * Math.tan((Math.max(0, sky.sunAlt) * Math.PI) / 180)) /
          Math.max(0.2, Math.cos((sky.sunAz * Math.PI) / 180))
        : 0;
    const lit = Math.max(0, 1 - shaded / s.elementHeight);
    const Sp = beam * lit * readAngle(glazing.tauAlpha, theta) + dif * this.dif.tauAlpha;
    const sunOn = beam + dif;
    let absorbedGlass = 0;
    for (let j = 0; j < this.sheets; j++) {
      const a = beam * readAngle(glazing.absorbed[j]!, theta) + dif * this.dif.absorbed[j]!;
      Q[this.iGlassOut + j] = A * a;
      absorbedGlass += a;
    }

    // ---- outside: wind on the glass, half a sky and half a ground for a vertical plane
    const Tsky = To + (skyTemperature(To) - To) * sky.clear;
    const TskyK = Tsky + 273.15;
    const TgK = To + 273.15;
    const Tenv = Math.sqrt(Math.sqrt((TskyK * TskyK * TskyK * TskyK + TgK * TgK * TgK * TgK) / 2)) - 273.15;
    this.Tenv = Tenv;
    T[this.iOut] = To;
    T[this.iGlassAir] = To;
    T[this.iSky] = Tenv;
    const hWind = windFilm(sky.wind);
    let hRad = radiationConductance(s.glassEmittance, 1, T[this.iGlassOut]!, Tenv);
    let hConv = hWind;
    if (s.shutterR > 0 && sunOn < 5) {
      hConv = 1 / (1 / hConv + s.shutterR);
      hRad = 1 / (1 / hRad + s.shutterR);
    }
    setLinkConductance(net, this.linkGlassAir, A * hConv);
    setLinkConductance(net, this.linkGlassSky, A * hRad);
    for (let i = 0; i < this.linkSlots.length; i++) {
      const Ta1 = T[this.iGlassOut + i]!;
      const Ta2 = T[this.iGlassOut + i + 1]!;
      const hSlot =
        slotFilm(Ta1, Ta2, s.glassSpacing, s.pressure, s.elementHeight) +
        radiationConductance(1 / (2 / s.glassEmittance - 1), 1, Ta1, Ta2);
      setLinkConductance(net, this.linkSlots[i]!, A * hSlot);
    }

    // ---- the gap and the flow
    w.Sp = Sp;
    w.Tg = T[this.iGlassIn]!;
    w.Tc0 = T[0]!;
    w.Ta = T[this.iAir]!;
    w.To = To;
    this.readFilms(this.flow);
    let m = 0;
    if (s.vents !== 'closed') {
      m = solveLoopFlow(this.residual, this.flow, FLOW_MAX, 1e-5, 1e-4);
      if (s.vents === 'one-way' && m < 0) m = 0;
    }
    this.flow = m;
    this.gapSolve(m);
    const Tf = w.Tf;
    const Tbar = w.Tbar;
    const Tg = w.Tg;
    const swept = this.swept;
    const qAirP = swept * w.hP * (Tf - Tbar);
    const qAirG = swept * w.hG * (Tg - Tbar);
    const qRad = (w.hR + (1 - swept) * w.hS) * (Tf - Tg);
    const q0 = this.faceG * (Tf - w.Tc0);
    const Qair = A * (qAirP + qAirG);
    Q[0] = A * q0;
    Q[this.iGlassIn] = Q[this.iGlassIn]! + A * (qRad - qAirG);

    this.Tf = Tf;
    this.Tbar = Tbar;
    this.Tin = w.Tin;
    const Teq = (w.hP * Tf + w.hG * Tg) / (w.hP + w.hG);
    this.Tout = w.N === Infinity ? Teq : Teq + (w.Tin - Teq) * w.ex;
    this.Tmid = w.N === Infinity ? Teq : Teq + (w.Tin - Teq) * Math.exp(-w.N / 2);

    // ---- the inner face: same treatment
    const TcN = T[n - 1]!;
    const Ta = w.Ta;
    const Tm = T[this.iMass]!;
    const hC = s.innerFilm === 'source' ? sourceFilm(this.Tb - Ta) : naturalFilm(this.Tb - Ta, this.filmC);
    const hR2 = radiationConductance(SOURCE_ROOM_EMITTANCE, 1, this.Tb, Tm);
    const Tb = (this.faceG * TcN + hC * Ta + hR2 * Tm) / (this.faceG + hC + hR2);
    this.Tb = Tb;
    const Pc = A * hC * (Tb - Ta);
    const Pr = A * hR2 * (Tb - Tm);
    Q[n - 1] = -A * this.faceG * (TcN - Tb);

    // ---- the room
    const Pwin = s.windowArea * (beam * readAngle(s.windowGlazing.tau, theta) + dif * this.dif.tauWindow);
    const capTotal = Math.abs(m) * this.elements * airCp(Tbar);
    let PqT = 0;
    let Pexhaust = 0;
    let Pdraw = 0;
    if (s.mode === 'summer') {
      // the outside air comes in through the house and leaves through the wall; coming down, it enters at the bottom
      Pdraw = capTotal * (Ta - To);
      if (m >= 0) Pexhaust = Qair;
      else PqT = Qair;
    } else {
      PqT = Qair;
    }
    const Ptube = s.tubeTheta > 0 ? s.freshC * s.tubeTheta * (this.soilT - To) : 0;
    const Pvent = Ta > s.ventLimit && !s.holdRoom ? s.ventOpenG * Math.min(1, Ta - s.ventLimit) * (Ta - To) : 0;
    Q[this.iAir] = Pc + PqT - Pdraw + s.gains / 2 + Ptube - Pvent;
    Q[this.iMass] = Pr + Pwin + s.gains / 2;

    stepNetwork(net, dt);

    // ---- the thermostat: ideal, up to its limit
    let Paux = 0;
    let Pcool = 0;
    const after = T[this.iAir]!;
    const C = s.roomAirCapacity;
    // nobody heats in the summer position
    if (s.backup && s.mode !== 'summer' && after < s.setpoint) {
      Paux = Math.min(s.heaterMax, (C * (s.setpoint - after)) / dt);
      setNodeTemperature(net, this.iAir, after + (Paux * dt) / C);
    } else if (s.holdRoom && after > s.setpoint) {
      Pcool = (C * (after - s.setpoint)) / dt;
      setNodeTemperature(net, this.iAir, s.setpoint);
    }

    // ---- the book
    const b = this.book;
    const absorbed = A * (Sp + absorbedGlass);
    b.sunWall += A * sunOn * dt;
    b.absorbed += absorbed * dt;
    b.sunWindows += Pwin * dt;
    b.gains += s.gains * dt;
    b.aux += Paux * dt;
    b.cooled += Pcool * dt;
    b.qt += PqT * dt;
    b.qr += Pr * dt;
    b.qc += Pc * dt;
    b.exhaust += Pexhaust * dt;
    b.draw += Pdraw * dt;
    b.vented += Pvent * dt;
    b.tube += Ptube * dt;

    this.Pabsorbed = absorbed;
    this.PqT = PqT;
    this.PqR = Pr;
    this.PqC = Pc;
    this.Pwindows = Pwin;
    this.Paux = Paux;
    this.Pdraw = Pdraw;
  }

  /** Temperature of the room's air, of its mass and of the two sheets of glass, °C. */
  get Tair(): number {
    return this.net.T[this.iAir]!;
  }
  get Tmass(): number {
    return this.net.T[this.iMass]!;
  }
  get TglassOut(): number {
    return this.net.T[this.iGlassOut]!;
  }
  get TglassIn(): number {
    return this.net.T[this.iGlassIn]!;
  }

  /** Air flow of one element, L/s, signed: the volume at the inlet's density, as the source computes it. */
  get flowLs(): number {
    return (this.flow / airRho(this.Tin, this.spec.pressure)) * 1000;
  }

  /** What the wall's cells hold, J above 0 °C, for the tests. */
  energy(): number {
    return totalEnthalpy(this.net);
  }

  /** The energy gone to the three fixed nodes, J. */
  boundary(): number {
    return totalBoundaryEnergy(this.net);
  }
}

/**
 * The balance of the energy book, J: what came in minus what went out minus what is now stored. Zero to rounding when `start` is the enthalpy at the start of the book and `boundary0` the energy of the
 * fixed nodes then.
 */
export function bookResidual(p: Plant, start: number, boundary0: number): number {
  const b = p.book;
  const inflow = b.absorbed + b.sunWindows + b.gains + b.aux + b.tube;
  const outflow = p.boundary() - boundary0 + b.cooled + b.exhaust + b.draw + b.vented;
  return inflow - outflow - (p.energy() - start);
}

/** The steady U of the collector wall at usual films, W/m²·K: the part of a whole-house G·V that the wall stands for at night. A reference, not used by the network. */
export function wallU(thickness: number, lambda: number, sheets: number): number {
  const layers = [
    { thickness, lambda },
    // plate to first sheet: radiation about 5 and convection about 2, written as a layer of 1 m
    { thickness: 1, lambda: 7 },
  ];
  // between sheets: conduction and radiation about 5.5, written the same way
  for (let i = 1; i < sheets; i++) layers.push({ thickness: 1, lambda: 5.5 });
  return seriesU(layers, 8, 13);
}
