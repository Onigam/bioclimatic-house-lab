import * as THREE from 'three';
import type { HouseState } from '../../sim/types';
import type { Mats } from '../materials';
import { buildCoat, buildMug, buildStool } from '../props';

// The wall's room is a working one: a stool by the wall and a mug on it, a coat on a nail. Scenery, never a part. Positions in the element's frame (the inner face at about z = −0.77).

export interface LivedIn {
  group: THREE.Group;
  /** The coat hangs on the storage wall's inner face: it goes with the wall (hidden with it). The stool and the mug stand on the floor, which stays. */
  coat: THREE.Object3D;
  update(state: HouseState, time: number): void;
  /** The coat hangs on the wall's face: move it when the wall's thickness does. */
  attach(innerZ: number): void;
}

export function buildLivedIn(mats: Mats, innerZ = -0.766): LivedIn {
  const group = new THREE.Group();
  group.name = 'lived-in';
  const stool = buildStool(mats);
  stool.position.set(-0.3, 0, innerZ - 0.62);
  stool.rotation.y = 0.4;
  group.add(stool);
  const mug = buildMug(0xb04a2f);
  mug.position.set(-0.3, 0.46, innerZ - 0.62);
  group.add(mug);
  const coat = buildCoat(mats, 0x44546b);
  coat.position.set(-0.54, 1.98, innerZ - 0.0);
  coat.rotation.y = Math.PI;
  group.add(coat);
  return {
    group,
    coat,
    update() {},
    attach(z) {
      coat.position.z = z;
      stool.position.z = z - 0.62;
      mug.position.z = z - 0.62;
    },
  };
}
