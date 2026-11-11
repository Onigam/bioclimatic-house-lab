import * as THREE from 'three';
import { l } from '@onigam/lab-kit/i18n';
import type { Hotspot } from '@onigam/lab-kit/three';

// What the worlds share: the hotspot declarations.

export interface HotspotDef {
  /** The part; a suffix `#name` lets a part have several labels. */
  id: string;
  fr: string;
  en: string;
  minor?: boolean;
  /** World to open when the label is clicked. */
  goto?: string;
  /** Left out of « Toutes » on a phone, a tablet or a narrow window (under `WIDE_FROM`: the panel takes half of a tablet's width): with every name on, a world of eighteen parts piles its dots on the few hundred pixels of a house, and the kit can only fold them. The part keeps its chip and its outline. */
  crowd?: boolean;
  /** A main label that only has room in a wide view: at the far edge of a narrow one its name would be cut, and the kit cannot turn it round (`docs/kit-requests.md`, 22). Narrower, it counts as minor. */
  wide?: boolean;
}

/** The window under which a `wide` label steps back. The kit reads `minor` each time it refreshes the labels: on a change of world, of selection, of label mode. */
export const WIDE_FROM = 1100;

export interface LabHotspot extends Hotspot {
  wide?: boolean;
}

/** Where a part is looked at from: `elevation` above the ground and a `bearing` from +z towards +x, in degrees. */
export function viewFrom(elevation: number, bearing: number): THREE.Vector3 {
  const e = (elevation * Math.PI) / 180;
  const b = (bearing * Math.PI) / 180;
  return new THREE.Vector3(Math.sin(b) * Math.cos(e), Math.sin(e), Math.cos(b) * Math.cos(e));
}

/** How a click or the voice frames a part: from which side, and on what, when the part's whole box would keep the camera too far. */
export interface PartFraming {
  viewDir: THREE.Vector3;
  frame?: THREE.Box3;
}

/** A world-space box from its two corners. */
export const box = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): THREE.Box3 =>
  new THREE.Box3(new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1));

/** An empty marker at a position of `parent`: the label follows it, also during the explode. */
export function anchor(parent: THREE.Object3D, x: number, y: number, z: number, name = 'anchor'): THREE.Object3D {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.set(x, y, z);
  o.userData.keep = true;
  parent.add(o);
  return o;
}

export function hotspots(defs: HotspotDef[], anchors: Record<string, THREE.Object3D>): LabHotspot[] {
  return defs.map((d) => ({
    partId: d.id.replace(/#.*$/, ''),
    anchor: anchors[d.id],
    label: l(d.fr, d.en),
    get minor() {
      return d.minor || (!!d.wide && typeof window !== 'undefined' && window.innerWidth < WIDE_FROM);
    },
    wide: d.wide,
    goto: d.goto,
  }));
}

/** The moving things are attached to this: the real bounding box of the meshes under an object. */
export const worldBox = (o: THREE.Object3D): THREE.Box3 => new THREE.Box3().setFromObject(o, true);

/**
 * Put the labels marked `crowd` away on a narrow window: their anchors are hidden (the kit draws a label only where its anchor is shown), and shown again when the window is wide. Call it from the world's `update`; it reads the window's
 * width and touches an anchor only when the answer changes. Without a window (the tests) every label stays.
 */
export function crowdLabels(defs: HotspotDef[], anchors: Record<string, THREE.Object3D>): () => void {
  let narrow: boolean | null = null;
  return () => {
    const now = typeof window !== 'undefined' && window.innerWidth < WIDE_FROM;
    if (now === narrow) return;
    narrow = now;
    for (const d of defs) if (d.crowd && anchors[d.id]) anchors[d.id]!.visible = !now;
  };
}
