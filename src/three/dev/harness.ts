import '@onigam/lab-kit/styles.css';
import { l } from '@onigam/lab-kit/i18n';
import type { PartInfo } from '@onigam/lab-kit/content';
import { mountLab, type LabDefinition } from '@onigam/lab-kit/ui';
import { HouseSim } from '../../sim/engine';
import { ALL_PART_IDS, PART_IDS, type WorldId } from '../ids';
import * as worlds from '../index';

// The modeler's review page: the kit's real frame around the real worlds, with a stub catalogue made from the registry's ids, the real simulation and no guides. It is not the lab: `src/lab.ts` is the lead's, and the catalogue
// the author's. Served by the dev server at /src/three/dev/harness.html, never built. `window.__sim` is the simulation, for scripted views.

const sim = new HouseSim();
(window as unknown as { __sim: HouseSim }).__sim = sim;
const params = () => sim.params;

const title = (id: string): string => id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
const category = (w: WorldId): PartInfo['category'] => (w === 'site' ? 'site' : 'structure');
const parts: PartInfo[] = [];
for (const w of Object.keys(PART_IDS) as WorldId[])
  for (const id of PART_IDS[w]) {
    if (!ALL_PART_IDS.includes(id)) continue;
    parts.push({
      id,
      scene: w,
      category: category(w),
      name: l(title(id), title(id)),
      short: l('Pièce de remplacement du catalogue.', 'Stub of the catalogue.'),
      description: l('Fiche à écrire par l’auteur.', 'Sheet to be written by the author.'),
      material: l('—', '—'),
      specs: [],
    });
  }

const lab: LabDefinition<HouseSim> = {
  id: 'bioclimatic-house-lab-3d',
  brand: { title: 'BIOCLIMATIC HOUSE LAB · 3D', tagline: l('Page de revue du modéliste', 'Modeler’s review page') },
  sim,
  defaultScene: 'site',
  parts,
  scenes: [
    {
      id: 'site',
      label: l('Le plateau', 'The plateau'),
      module: worlds.createSiteScene({ params }),
      ...worlds.WORLD.site,
    },
    {
      id: 'house',
      label: l('La maison', 'The house'),
      module: worlds.createHouseScene({ params }),
      ...worlds.WORLD.house,
    },
    { id: 'wall', label: l('Le mur', 'The wall'), module: worlds.createWallScene({ params }), ...worlds.WORLD.wall },
    { id: 'room', label: l('La pièce', 'The room'), module: worlds.createRoomScene({ params }), ...worlds.WORLD.room },
  ],
  strip: {
    values: (s) => [{ label: 'Room', value: s.state.tRoom.toFixed(1), unit: '°C' }],
    clock: (s) => ({ time: `${s.state.hour.toFixed(1)} h`, sub: `day ${s.state.dayOfYear}` }),
    alarms: () => [],
  },
  about: () => [],
};

mountLab(lab, { app: document.getElementById('app')!, viewport: document.getElementById('viewport')!, expose: true });
