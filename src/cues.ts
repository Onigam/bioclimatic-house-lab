import type { HouseSim } from './sim/engine';
import { RANGES, PRESET_IDS, SCENARIO_IDS } from './sim/presets';
import type { PresetId, ScenarioId } from './sim/types';

// The lab's own cues of the spoken guide: `[[lab:<name>:<arg>]]` in a segment of narration/<lang>.json, which the kit hands to `LabDefinition.narration.onCue` (docs/narration.md). The kit's cues (`scene`, `home`, `frame`, `select`, `explode`, `xray`,
// `cutaway`, `flows`, `isolate`, `mode`) move the 3D; these move the simulation, so that a voice can say « regardez la nuit » and have the night happen. Each is idempotent: the kit replays the last cue of each name after a seek.
//
//   [[lab:scenario:the-night]]      one of the twelve scenarios (src/sim/presets.ts SCENARIO_IDS)
//   [[lab:preset:building-1974]]    one of the five starting points (PRESET_IDS)
//   [[lab:day:355]]                 the day of the year, 1 to 365 (21 December is 355, 21 June is 172)
//   [[lab:hour:12]]                 the solar hour, 0 to 24
//   [[lab:speed:3600]]              simulated seconds per second: 1, 60, 600, 3600 (an hour a second, the opening speed) or 86400 (a day a second); starts the clock
//   [[lab:pause]]  [[lab:play]]     stops and starts the clock
//   [[lab:thickness:45]]            the wall's thickness in centimetres, 15 to 80
//   [[lab:sheets:1]]                the sheets of glass, 1 to 3
//   [[lab:flap:summer]]             `winter` or `summer`
//   [[lab:vents:closed]]            `open`, `closed` or `one-way`
//   [[lab:setpoint:18]]             the thermostat, °C
//   [[lab:earthtube:on]]            the what-if earth tube, `on` or `off`
//   [[lab:reset]]                   start again from the last starting point or scenario

const range = (arg: string | undefined, min: number, max: number): number | null => {
  if (arg === undefined || arg.trim() === '') return null;
  const v = Number(arg);
  return Number.isFinite(v) && v >= min && v <= max ? v : null;
};

/** The names a segment may use, for a test of the scripts. */
export const LAB_CUE_NAMES = [
  'scenario',
  'preset',
  'day',
  'hour',
  'speed',
  'pause',
  'play',
  'thickness',
  'sheets',
  'flap',
  'vents',
  'setpoint',
  'earthtube',
  'reset',
] as const;

/** What `runCue` would do with a cue, without doing it: a patch of the parameters, a scenario, a preset, a reset, or nothing (unknown). */
export type CuePlan =
  | { kind: 'scenario'; id: ScenarioId }
  | { kind: 'preset'; id: PresetId }
  | { kind: 'reset' }
  | { kind: 'set'; patch: Parameters<HouseSim['set']>[0] }
  | null;

export function planCue(name: string, arg?: string): CuePlan {
  switch (name) {
    case 'scenario':
      return SCENARIO_IDS.includes(arg as ScenarioId) ? { kind: 'scenario', id: arg as ScenarioId } : null;
    case 'preset':
      return PRESET_IDS.includes(arg as PresetId) ? { kind: 'preset', id: arg as PresetId } : null;
    case 'reset':
      return { kind: 'reset' };
    case 'pause':
      return { kind: 'set', patch: { running: false } };
    case 'play':
      return { kind: 'set', patch: { running: true } };
    case 'day': {
      const v = range(arg, RANGES.day.min, RANGES.day.max);
      return v === null ? null : { kind: 'set', patch: { day: Math.round(v) } };
    }
    case 'hour': {
      const v = range(arg, RANGES.hour.min, RANGES.hour.max);
      return v === null ? null : { kind: 'set', patch: { hour: v } };
    }
    case 'speed': {
      const v = range(arg, 1, 86400);
      return v === null ? null : { kind: 'set', patch: { timeScale: v, running: true } };
    }
    case 'thickness': {
      const v = range(arg, RANGES.wallThickness.min * 100, RANGES.wallThickness.max * 100);
      return v === null ? null : { kind: 'set', patch: { wallThickness: v / 100 } };
    }
    case 'sheets': {
      const v = range(arg, RANGES.glazingLayers.min, RANGES.glazingLayers.max);
      return v === null ? null : { kind: 'set', patch: { glazingLayers: Math.round(v) } };
    }
    case 'setpoint': {
      const v = range(arg, RANGES.setpoint.min, RANGES.setpoint.max);
      return v === null ? null : { kind: 'set', patch: { setpoint: v } };
    }
    case 'flap':
      return arg === 'winter' || arg === 'summer' ? { kind: 'set', patch: { mode: arg } } : null;
    case 'vents':
      return arg === 'open' || arg === 'closed' || arg === 'one-way' ? { kind: 'set', patch: { vents: arg } } : null;
    case 'earthtube':
      return arg === 'on' || arg === 'off' ? { kind: 'set', patch: { earthTube: arg === 'on' } } : null;
    default:
      return null;
  }
}

/** Run a cue of the spoken guide on the simulation. Returns false for a cue it does not know (nothing happens). */
export function runCue(sim: HouseSim, name: string, arg?: string): boolean {
  const plan = planCue(name, arg);
  if (!plan) return false;
  if (plan.kind === 'scenario') sim.applyScenario(plan.id);
  else if (plan.kind === 'preset') sim.applyPreset(plan.id);
  else if (plan.kind === 'reset') sim.reset();
  else sim.set(plan.patch);
  return true;
}
