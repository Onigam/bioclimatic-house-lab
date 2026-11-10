import * as THREE from 'three';
import { MAT } from '@onigam/lab-kit/three';
import {
  blackPaintMap,
  clothMap,
  concreteMap,
  graniteMap,
  gravelMap,
  masonryMap,
  oakMap,
  plasterMap,
  renderMap,
  shutteredConcreteMap,
  slateMap,
  strataMap,
  tileMap,
  tiled,
  woodMap,
} from './textures';

// The materials of the house, the collector, the room and the land. One set per world (the section clips a world's materials, never another's); the maps are shared. Procedural, no file. Every UV is in metres
// (`uvMetric` in `common.ts`), so a map's `tiled(map, 1 / size)` keeps its size on a wall, a beam and a plinth alike.

const std = (o: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial(o);

export interface Mats {
  /** Cast concrete from board formwork: the collector's wall, the beams, the head band. */
  concrete: THREE.MeshStandardMaterial;
  /** Foundation and plinth: rougher, darker, a little mossy at the foot. */
  plinth: THREE.MeshStandardMaterial;
  /** Lime render of the gables and the north wall. */
  render: THREE.MeshStandardMaterial;
  /** Black acrylic. */
  black: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  /** Painted steel of the frames. */
  frame: THREE.MeshStandardMaterial;
  rubber: THREE.MeshStandardMaterial;
  zinc: THREE.MeshStandardMaterial;
  alu: THREE.MeshStandardMaterial;
  copper: THREE.MeshStandardMaterial;
  brass: THREE.MeshStandardMaterial;
  steel: THREE.MeshStandardMaterial;
  steelDark: THREE.MeshStandardMaterial;
  timber: THREE.MeshStandardMaterial;
  timberDark: THREE.MeshStandardMaterial;
  oak: THREE.MeshStandardMaterial;
  slate: THREE.MeshStandardMaterial;
  insulation: THREE.MeshStandardMaterial;
  plaster: THREE.MeshStandardMaterial;
  tile: THREE.MeshStandardMaterial;
  ceiling: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  granite: THREE.MeshStandardMaterial;
  gravel: THREE.MeshStandardMaterial;
  strata: THREE.MeshStandardMaterial;
  earth: THREE.MeshStandardMaterial;
  pipe: THREE.MeshStandardMaterial;
  /** Soft-coloured fabrics: the tint is set per use. */
  cloth: THREE.MeshStandardMaterial;
  paper: THREE.MeshStandardMaterial;
  whitePaint: THREE.MeshStandardMaterial;
  plastic: THREE.MeshStandardMaterial;
  led: THREE.MeshStandardMaterial;
}

export function makeMaterials(): Mats {
  const shuttered = std({
    color: 0xb2afa8,
    roughness: 0.93,
    map: tiled(shutteredConcreteMap(), 1 / 0.8),
  });
  const plinth = std({ color: 0x8f8a80, roughness: 0.97, map: tiled(concreteMap(), 1 / 1.4) });
  const render = std({ color: 0xe6dccb, roughness: 0.96, map: tiled(renderMap(), 1 / 1.5) });
  const black = std({ color: 0xffffff, roughness: 0.5, metalness: 0.04, map: tiled(blackPaintMap(), 1 / 1.1) });
  const glass = std({
    color: 0xcfe3e0,
    roughness: 0.03,
    metalness: 0.0,
    transparent: true,
    opacity: 0.16,
    envMapIntensity: 1.6,
    depthWrite: false,
  });
  glass.userData.glass = true;
  const frame = std({ color: 0x4f5c58, roughness: 0.55, metalness: 0.45 });
  const rubber = std({ color: 0x1b1b1d, roughness: 0.9 });
  const zinc = MAT.zinc();
  const alu = MAT.alu();
  const copper = MAT.copper();
  const brass = MAT.brass();
  const steel = MAT.steel();
  const steelDark = MAT.steelBlack();
  const timber = std({ color: 0xb08a5b, roughness: 0.78, map: tiled(woodMap(), 1 / 0.6) });
  const timberDark = std({ color: 0x6a4b30, roughness: 0.8, map: tiled(woodMap(), 1 / 0.6) });
  const oak = std({ color: 0xffffff, roughness: 0.72, map: tiled(oakMap(), 1 / 1.28) });
  const slate = std({ color: 0x5b6068, roughness: 0.88, map: tiled(slateMap(), 1 / 0.9) });
  const insulation = std({ color: 0xe0c56a, roughness: 1, map: tiled(clothMap(), 1 / 0.3) });
  const plaster = std({ color: 0xe9e2d3, roughness: 0.96, map: tiled(plasterMap(), 1 / 1.5) });
  const tile = std({ color: 0xffffff, roughness: 0.62, map: tiled(tileMap(), 1 / 0.8) });
  const ceiling = std({ color: 0xf0ebe0, roughness: 0.97, map: tiled(plasterMap(), 1 / 1.5) });
  const stone = std({ color: 0xffffff, roughness: 0.95, map: tiled(masonryMap(), 1 / 1.75) });
  const granite = std({ color: 0xffffff, roughness: 0.93, map: tiled(graniteMap(), 1 / 2) });
  const gravel = std({ color: 0xffffff, roughness: 1, map: tiled(gravelMap(), 1 / 1.2) });
  const strataTex = tiled(strataMap(), 1, 1);
  strataTex.wrapT = THREE.ClampToEdgeWrapping;
  const strata = std({ color: 0xffffff, roughness: 1, map: strataTex, side: THREE.DoubleSide });
  const earth = std({ color: 0x6b5238, roughness: 1, map: tiled(gravelMap(), 1 / 1.6) });
  const pipe = std({ color: 0x8b8e92, roughness: 0.6, metalness: 0.1 });
  const cloth = std({ color: 0xffffff, roughness: 1, map: tiled(clothMap(), 1 / 0.4) });
  const paper = std({ color: 0xf1ecde, roughness: 0.95 });
  const whitePaint = std({ color: 0xeeebe3, roughness: 0.6 });
  const plastic = std({ color: 0xddd8cb, roughness: 0.55 });
  const led = new THREE.MeshStandardMaterial({
    color: 0x223322,
    emissive: 0x33ff55,
    emissiveIntensity: 0,
    roughness: 0.4,
  });
  return {
    concrete: shuttered,
    plinth,
    render,
    black,
    glass,
    frame,
    rubber,
    zinc,
    alu,
    copper,
    brass,
    steel,
    steelDark,
    timber,
    timberDark,
    oak,
    slate,
    insulation,
    plaster,
    tile,
    ceiling,
    stone,
    granite,
    gravel,
    strata,
    earth,
    pipe,
    cloth,
    paper,
    whitePaint,
    plastic,
    led,
  };
}

/** A plain coloured material (props: a mug, a flowerpot, a bucket); the same colour and roughness share one instance in a set. */
export function plain(color: number, roughness = 0.8, metalness = 0): THREE.MeshStandardMaterial {
  return std({ color, roughness, metalness });
}
