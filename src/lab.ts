import { strL } from '@onigam/lab-kit/i18n';
import { h, icon, ICONS, type AppContext, type LabDefinition } from '@onigam/lab-kit/ui';
import { runCue } from './cues';
import { aboutPanel } from './data/about';
import { ASSEMBLY, INSTALL } from './data/guide';
import { LESSONS } from './data/lessons';
import { OVERVIEWS } from './data/overviews';
import { PARTS } from './data/parts';
import { SHEET_GROUPS, SHEETS } from './drawings';
import { t } from './i18n/ui';
import { SimPanel } from './panels/sim';
import { STRIP_SPEEDS, stripAlarms, stripClock, stripValues } from './panels/strip';
import { HouseSim } from './sim/engine';
import { WORLD, createHouseScene, createRoomScene, createSiteScene, createWallScene } from './three';

// The lab described to the kit. Edit the content here and in src/data, src/three, src/sim, src/drawings;
// the kit supplies the whole application frame (see BRIEF.md: the frame is locked).

const sim = new HouseSim();

/** The application's context, kept from the simulation panel's construction (the kit builds it at mount): the house opens cut, once, on its first frame. */
let app: AppContext<HouseSim> | null = null;
let openedCut = false;

/** The earth tube's parts exist only in their scenario (docs/3d.md): their sheets offer to run it. */
const WHAT_IF_PARTS = new Set(['earth-tube-intake', 'earth-tube-pipe', 'earth-tube-drain']);

export const lab: LabDefinition<HouseSim> = {
  id: 'bioclimatic-house-lab',
  brand: { title: strL('labTitle'), tagline: strL('tagline') },
  // a part's envelope is the 3D model's own measure, not a size from a source: the notice on reading the figures says what the mark means
  envelopeMark: '*',
  sim,
  defaultScene: 'house',
  // the house is the inventors' paper, not a film: the lab has no main video (src/data/sources.ts)
  parts: PARTS,
  scenes: [
    {
      // the setting is called `site` so that the kit frames it by its authored home pose and keeps its camera above the ground (docs/kit-requests.md, 7)
      id: 'site',
      label: strL('sceneSite'),
      module: createSiteScene({ params: () => sim.params }),
      ...WORLD.site,
      overview: {
        ...OVERVIEWS.site,
        actions: [{ label: strL('goHouse'), scene: 'house', primary: true }],
      },
    },
    {
      id: 'house',
      label: strL('sceneHouse'),
      module: createHouseScene({ params: () => sim.params }),
      ...WORLD.house,
      overview: {
        ...OVERVIEWS.house,
        actions: [
          { label: strL('goWall'), scene: 'wall', primary: true },
          { label: strL('goRoom'), scene: 'room' },
          { label: strL('goSite'), scene: 'site' },
        ],
      },
    },
    {
      id: 'wall',
      label: strL('sceneWall'),
      module: createWallScene({ params: () => sim.params }),
      ...WORLD.wall,
      overview: {
        ...OVERVIEWS.wall,
        actions: [
          { label: strL('goRoom'), scene: 'room', primary: true },
          { label: strL('goHouse'), scene: 'house' },
        ],
      },
    },
    {
      id: 'room',
      label: strL('sceneRoom'),
      module: createRoomScene({ params: () => sim.params }),
      ...WORLD.room,
      overview: {
        ...OVERVIEWS.room,
        actions: [
          { label: strL('goHouse'), scene: 'house', primary: true },
          { label: strL('goWall'), scene: 'wall' },
        ],
      },
    },
  ],
  partLinks: {
    'prototype-house': { scene: 'house', label: strL('goHouse') },
    'collector-element': { scene: 'wall', label: strL('goWall') },
    'interior-partitions': { scene: 'room', label: strL('goRoom') },
  },
  // the earth tube is drawn only while its scenario runs: its three sheets offer to run it
  partActions: (ctx, info) =>
    WHAT_IF_PARTS.has(info.id)
      ? [
          h(
            'button',
            { class: 'btn btn--primary', onclick: () => ctx.sim.applyScenario('earth-tube') },
            icon(ICONS.bolt, 16),
            t('runScenario'),
          ),
        ]
      : [],
  guides: {
    // each step names its own world: the house is the default of both guides
    assembly: { scene: 'house', steps: ASSEMBLY },
    install: { scene: 'house', steps: INSTALL },
  },
  lessons: { items: LESSONS, intro: strL('lessonsIntro') },
  plans: { sheets: SHEETS, groups: [...SHEET_GROUPS], intro: strL('plansIntro') },
  // spoken guide: audio and subtitles generated from narration/<lang>.json. Until they exist, the manifest answers 404 and nothing of the feature shows.
  // `[[lab:…]]` cues move the simulation: src/cues.ts lists them.
  narration: {
    manifest: 'audio/{lang}/manifest.json',
    onCue: (ctx: AppContext<HouseSim>, name, arg) => {
      runCue(ctx.sim, name, arg);
    },
  },
  simPanel: (ctx: AppContext<HouseSim>) => {
    app = ctx;
    return new SimPanel(ctx);
  },
  // « Ce monde s’ouvre coupé » (the house's overview): the section is the machine, the home pose reads it, and the kit's tool starts off. The first time the visitor is in the house, the cut is on; the tool turns it off and it stays off.
  onFrame: ({ activeScene }) => {
    if (!openedCut && activeScene === 'house' && app) {
      openedCut = true;
      app.store.set({ cutaway: true });
    }
  },
  strip: { values: stripValues, clock: stripClock, alarms: stripAlarms, speeds: STRIP_SPEEDS },
  about: aboutPanel,
};
