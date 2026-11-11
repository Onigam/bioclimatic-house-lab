import type { StripAlarm, StripValue } from '@onigam/lab-kit/ui';
import type { HouseSim } from '../sim/engine';
import { SPEEDS } from '../sim/presets';
import { stripData } from '../sim/strip';
import { ALARM_TEXTS } from '../sim/texts';
import { dateText, hourText, num, say, st, STRIP_ALARMS } from './strings';

// What the bottom strip shows: src/sim/strip.ts says what, this says it in the language of the moment. A value's mark follows its unit until the kit's `StripValue` has a tag of its own (docs/kit-requests.md, 4 of the kit's list).

export function stripValues(sim: HouseSim): StripValue[] {
  return stripData(sim.state).map((row) => ({
    label: say(row.label),
    value: num(row.value, row.digits),
    unit: `${row.unit} ${row.tag}`,
  }));
}

/** The solar hour and the day, in few letters: at 768 px the strip has room for the clock, five speeds and four figures only if the date is short. */
export function stripClock(sim: HouseSim): { time: string; sub: string } {
  const s = sim.state;
  return { time: hourText(s.hour), sub: `${dateText(s.dayOfYear)}, ${st('solarShort')}` };
}

/** The pill says the alarm in a few words; the panel's status line, the whole sentence. */
export function stripAlarms(sim: HouseSim): StripAlarm[] {
  return sim.state.alarms.map((key) => ({ key, label: say(STRIP_ALARMS[key]), severe: ALARM_TEXTS[key].severe }));
}

export const STRIP_SPEEDS = SPEEDS;
