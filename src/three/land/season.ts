import { SITES, monthlyAir } from '../../sim/climate';
import type { HouseState } from '../../sim/types';

// The season on the land, from the model's own climate (the table of monthly air at the site, ERA5 through PVGIS): snow lies when the month's mean is under about 3 °C, fully under −1. January 1, February 0.94,
// December 0.72, March 0.3, November 0.15, none from April to October. The 3D reads the day of the state, so the same house stands in snow at Christmas and in grass in June.

export const snowOf = (day: number): number => Math.min(1, Math.max(0, (3 - monthlyAir(SITES.odeillo, day)) / 4));

export const snowOfState = (s: Pick<HouseState, 'dayOfYear'>): number => snowOf(s.dayOfYear);
