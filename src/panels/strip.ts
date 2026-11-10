import { getLang } from '@onigam/lab-kit/i18n';
import type { StripAlarm, StripValue } from '@onigam/lab-kit/ui';
import type { HouseSim } from '../sim/engine';
import { SPEEDS } from '../sim/presets';
import { stripAlarms as alarmsOf, stripClock as clockOf, stripData } from '../sim/strip';
import { num, say } from './strings';

// What the bottom strip shows: src/sim/strip.ts says what, this says it in the language of the moment. A value's mark follows its unit until the kit's `StripValue` has a tag of its own (docs/kit-requests.md, 4 of the kit's list).

const lang = (): 0 | 1 => (getLang() === 'fr' ? 0 : 1);

export function stripValues(sim: HouseSim): StripValue[] {
  return stripData(sim.state).map((row) => ({
    label: say(row.label),
    value: num(row.value, row.digits),
    unit: `${row.unit} ${row.tag}`,
  }));
}

export function stripClock(sim: HouseSim): { time: string; sub: string } {
  return clockOf(sim.state, lang());
}

export function stripAlarms(sim: HouseSim): StripAlarm[] {
  return alarmsOf(sim.state, lang());
}

export const STRIP_SPEEDS = SPEEDS;
