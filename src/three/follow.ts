import * as THREE from 'three';
import type { PartRegistry } from '@onigam/lab-kit/three';

// Things that are not parts follow the part that carries them. The kit hides, ghosts and explodes parts, never the props round them: a coat on a nail, the furniture on a floor, the pots on a balcony would hang in the void
// when their carrier is isolated away, or stay behind when it explodes. A follower reads its carrier's display and explode offset each frame (`update`, called from the world's own `update`) and does the same: hidden or wire
// (an unbuilt step of the guide) hides it, an explode moves it with the carrier, a ghost leaves it in place (an X-ray looks through the shell at what stands inside).

export interface Follower {
  object: THREE.Object3D;
  /** The part that carries it: what it rests on or hangs from. */
  carrier: string;
  /** Where it stands when assembled, in its parent's frame. */
  base: THREE.Vector3;
  /** The part ids that must all be drawn for it to be drawn (the carrier is always among them). */
  needs: string[];
  /** Anything else that must hold for it to be drawn (the wall it hangs on is not seen from its far side). */
  when?: () => boolean;
  /** Whether it moves with its carrier's explode (a coat on a wall does, a window cut into the ground does not). */
  moves: boolean;
}

export class Followers {
  readonly list: Follower[] = [];
  private readonly offset = new THREE.Vector3();

  /** Make `object` follow `carrier` (and need `also` to be drawn); its position now is where it stands assembled. Its parent must not move, turn or scale. */
  add(
    object: THREE.Object3D,
    carrier: string,
    o: { also?: string[]; when?: () => boolean; moves?: boolean } = {},
  ): Follower {
    const f: Follower = {
      object,
      carrier,
      base: object.position.clone(),
      needs: [carrier, ...(o.also ?? [])],
      when: o.when,
      moves: o.moves ?? true,
    };
    this.list.push(f);
    return f;
  }

  /** Whether a part is drawn at all: hidden is not, and neither is the wireframe of a step not yet built. */
  static drawn(reg: PartRegistry, id: string): boolean {
    const e = reg.get(id);
    return !e || (e.display !== 'hidden' && e.display !== 'wire');
  }

  update(reg: PartRegistry): void {
    for (const f of this.list) {
      const e = reg.get(f.carrier);
      if (!e) continue;
      f.object.visible = f.needs.every((id) => Followers.drawn(reg, id)) && (f.when?.() ?? true);
      if (f.moves) {
        this.offset.copy(e.explode).multiplyScalar(e.factor);
        f.object.position.copy(f.base).add(this.offset);
      }
    }
  }
}
