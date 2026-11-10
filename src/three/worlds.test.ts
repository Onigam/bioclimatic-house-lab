import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { GHOST } from '@onigam/lab-kit/three';
import type { SceneModule } from '@onigam/lab-kit/three';
import { HouseSim } from '../sim/engine';
import { SCENARIO_IDS } from '../sim/presets';
import type { HouseState } from '../sim/types';
import { PART_IDS, WORLD_IDS, ALL_PART_IDS, WHAT_IF_PARTS, type WorldId } from './ids';
import { createHouseScene } from './house/scene';
import { createRoomScene } from './room/scene';
import { createSiteScene } from './site/scene';
import { createWallScene } from './wall/scene';
import { PARTS } from '../data/parts';
import { drawStats, finiteTree, floating, isolateOne, meshBox, sceneBoxes, stateWith, view } from './test-utils';

// What every world owes the kit and the visitor: its frozen ids (research §4), a label for each part, nothing floating, the explode, isolate and X-ray of every part, an animation with no NaN through all the scenarios,
// dt = 0, its budget. `docs/3d.md` holds the measured numbers.

const BUDGET: Record<WorldId, { calls: number; triangles: number }> = {
  site: { calls: 330, triangles: 700_000 },
  house: { calls: 520, triangles: 700_000 },
  wall: { calls: 150, triangles: 120_000 },
  room: { calls: 520, triangles: 520_000 },
};

const timed = <T>(id: string, make: () => T): T => {
  const t0 = performance.now();
  const out = make();
  // eslint-disable-next-line no-console
  console.info(`[build] ${id}: ${Math.round(performance.now() - t0)} ms`);
  return out;
};

const worlds: [WorldId, SceneModule<HouseState>][] = [
  ['wall', timed('wall', () => createWallScene({ params: () => ({ gap: 0.12, glazingLayers: 2 }) }))],
  ['room', timed('room', () => createRoomScene({ params: () => ({ setpoint: 20, gap: 0.12, glazingLayers: 2 }) }))],
  [
    'house',
    timed('house', () =>
      createHouseScene({ params: () => ({ setpoint: 20, gap: 0.12, glazingLayers: 2, earthTube: true }) }),
    ),
  ],
  ['site', timed('site', () => createSiteScene({ params: () => ({ gap: 0.12, glazingLayers: 2 }) }))],
];

it('has four worlds, and a frozen list of 56 parts', () => {
  expect(WORLD_IDS.length).toBe(4);
  expect(ALL_PART_IDS.length).toBe(56);
  expect(new Set(ALL_PART_IDS).size).toBe(56);
  expect(PART_IDS.site.length + PART_IDS.house.length + PART_IDS.wall.length + PART_IDS.room.length).toBe(56);
});

for (const [id, mod] of worlds) {
  describe(`world ${id}`, () => {
    const reg = mod.registry;
    const go = (over: Partial<HouseState> = {}, v = {}, frames = 2) => {
      const s = stateWith(over);
      for (let i = 0; i < frames; i++) mod.update(s, 1 / 60, view({ time: 1 + i, ...v }));
      mod.scene.updateMatrixWorld(true);
      return s;
    };

    it('registers exactly the frozen ids (research §4), each with meshes of its own', () => {
      go();
      expect([...reg.ids()].sort()).toEqual([...PART_IDS[id]].sort());
      for (const pid of PART_IDS[id]) expect(reg.get(pid)!.meshes.length, pid).toBeGreaterThan(0);
    });

    it('has a sheet in the catalogue for each part, once the author has written it', () => {
      // `src/data/parts.ts` is the author's: until it holds this lab's parts it is the template's, and the check waits
      const written = PARTS.some((p) => ALL_PART_IDS.includes(p.id));
      if (!written) return;
      for (const pid of reg.ids()) {
        const p = PARTS.find((x) => x.id === pid);
        expect(p, pid).toBeDefined();
        expect(p!.scene, pid).toBe(id);
      }
    });

    it('has a label per part, anchors in the scene, at most six main labels', () => {
      for (const pid of reg.ids())
        expect(
          mod.hotspots.some((h) => h.partId === pid),
          `label of ${pid}`,
        ).toBe(true);
      for (const h of mod.hotspots) {
        let o: THREE.Object3D | null = h.anchor;
        while (o && o !== mod.scene) o = o.parent;
        expect(o, h.partId).toBe(mod.scene);
        expect(h.label.fr.length).toBeGreaterThan(1);
        expect(h.label.en.length).toBeGreaterThan(1);
        expect(reg.get(h.partId), h.partId).toBeDefined();
      }
      expect(mod.hotspots.filter((h) => !h.minor).length).toBeLessThanOrEqual(6);
    });

    it('has a home camera outside the machine, within its limits', () => {
      const d = mod.home.position.distanceTo(mod.home.target);
      expect(d).toBeGreaterThan(mod.minDistance);
      expect(d).toBeLessThan(mod.maxDistance);
    });

    it('has no floating part: every part touches another or what carries it', () => {
      go();
      reg.setAllFactors(0);
      const supports: THREE.Box3[] = [];
      const carrier = (mod as unknown as { scenery?: () => THREE.Object3D[] }).scenery;
      if (carrier) for (const o of carrier()) supports.push(meshBox(o));
      supports.push(new THREE.Box3(new THREE.Vector3(-4000, -1.4, -4000), new THREE.Vector3(4000, -1.2, 4000)));
      const bad = floating(sceneBoxes(mod), 0.02, supports).filter((p) => !WHAT_IF_PARTS.includes(p));
      expect(bad).toEqual([]);
    });

    it('explodes along sensible lines: every part moves by its own offset and comes back', () => {
      go();
      const before = new Map(reg.ids().map((pid) => [pid, reg.get(pid)!.object.position.clone()]));
      reg.setAllFactors(1);
      for (const pid of reg.ids()) {
        const e = reg.get(pid)!;
        expect(e.object.position.distanceTo(before.get(pid)!.clone().add(e.explode)), pid).toBeLessThan(1e-9);
      }
      go();
      expect(finiteTree(mod.scene)).toBe(true);
      reg.setAllFactors(0);
      go();
      for (const pid of reg.ids())
        expect(reg.get(pid)!.object.position.distanceTo(before.get(pid)!), pid).toBeLessThan(1e-9);
    });

    it('isolates and ghosts every part', () => {
      go();
      for (const pid of reg.ids()) {
        isolateOne(reg, pid, 'hidden');
        go();
        const others = reg.ids().filter((o) => o !== pid);
        for (const o of others) expect(reg.get(o)!.display).toBe('hidden');
        isolateOne(reg, pid, 'ghost');
        go();
        for (const o of others) for (const m of reg.get(o)!.meshes) expect(m.material).toBe(GHOST);
      }
      reg.setAllDisplay('solid');
      go();
      for (const pid of reg.ids())
        for (const m of reg.get(pid)!.meshes) expect(m.material).toBe(m.userData.solidMaterial);
    });

    it('animates with no NaN through every scenario of the simulation', () => {
      const sim = new HouseSim();
      for (const name of SCENARIO_IDS) {
        sim.applyScenario(name);
        sim.set({ timeScale: 600 });
        for (let i = 0; i < 4; i++) {
          sim.step(1 / 10);
          mod.update(sim.state, 1 / 30, view({ time: i, schematic: i % 2 === 0, cutaway: i % 3 === 0 }));
        }
      }
      expect(finiteTree(mod.scene)).toBe(true);
    });

    it('accepts dt = 0 without moving anything', () => {
      const s = stateWith();
      mod.update(s, 1 / 60, view({ schematic: true }));
      mod.scene.updateMatrixWorld(true);
      const snap = () => {
        const out: number[] = [];
        mod.scene.traverse((o) => {
          out.push(o.matrixWorld.elements[12]!, o.matrixWorld.elements[13]!, o.matrixWorld.elements[14]!);
        });
        return out;
      };
      const a = snap();
      mod.update(s, 0, view({ schematic: true }));
      mod.scene.updateMatrixWorld(true);
      expect(snap()).toEqual(a);
    });

    it('keeps to its budget', () => {
      go();
      reg.setAllDisplay('solid');
      go();
      const st = drawStats(mod.scene);
      // eslint-disable-next-line no-console
      console.info(`[budget] ${id}: ${st.calls} calls, ${Math.round(st.triangles)} triangles`);
      expect(st.calls).toBeLessThan(BUDGET[id].calls);
      expect(st.triangles).toBeLessThan(BUDGET[id].triangles);
    });
  });
}

describe('the rules of the source', () => {
  const src = Object.entries(
    import.meta.glob(['./**/*.ts', '!./**/*.test.ts', '!./test-utils.ts', '!./dev/**'], {
      query: '?raw',
      import: 'default',
      eager: true,
    }) as Record<string, string>,
  );
  const code = (t: string) => t.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  it('reads the whole of its source', () => {
    expect(src.length).toBeGreaterThan(30);
  });
  it('has no text in any texture and no canvas: a film is captured with no interface', () => {
    for (const [p, c] of src) {
      expect(c.includes('canvasTexture'), p).toBe(false);
      expect(c.includes('fillText'), p).toBe(false);
      expect(c.includes('createElement'), p).toBe(false);
    }
  });
  it('has no timer and no wall clock: the same inputs give the same picture', () => {
    for (const [p, c] of src) {
      expect(/\bDate\.now\b|performance\.now|setTimeout|setInterval|Math\.random/.test(code(c)), p).toBe(false);
    }
  });
});

describe('the prototypes’ position stays in the private cache', () => {
  const files = Object.entries(
    import.meta.glob(
      ['./**/*.ts', '!./**/*.test.ts', '../../docs/3d.md', '../../docs/scenery.md', '../../docs/water.md'],
      { query: '?raw', import: 'default', eager: true },
    ) as Record<string, string>,
  );
  for (const [file, text] of files) {
    it(`${file} says no more than « Odeillo »`, () => {
      expect(text).not.toMatch(/42[.,]49\d?/);
      expect(text).not.toMatch(/\b2[.,]03\d?\b/);
      expect(text).not.toMatch(/Cami-del-Sol|Cami del Sol/i);
      expect(text).not.toMatch(/BATIMENT\d+/i);
    });
  }
});
