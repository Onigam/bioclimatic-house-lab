import * as THREE from 'three';
import { FRAME, elementLayout, type ElementSpec } from '../dims';
import type { Mats } from '../materials';
import type { HeatStrip } from '../heat';
import { Caps, capMaterialOf } from '../section';

// The cut faces of the element, in the plane of the section (x = `x`), flat rectangles in materials that are never clipped, drawn while the section is on. The concrete's three blocks (sill, wall, head) carry the false
// colour: the model's one-dimensional wall, cell by cell, from the black face to the room's. A thin member cut across (a glazing bar, a sheet of glass, a duct's plate, the paint) gets its own cap, so that nothing
// is left hollow. They are made from the spec and made again when it changes.

type Rect = [number, number, number, number]; // z0, y0, z1, y1

/** A flat rectangle in the plane x = const, facing +x, with `uv` of the caller's choosing. */
function rectGeo(x: number, r: Rect, uv: (z: number, y: number) => [number, number]): THREE.BufferGeometry {
  const [z0, y0, z1, y1] = r;
  const pos = [x, y0, z0, x, y0, z1, x, y1, z1, x, y1, z0];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0], 3));
  const u = [uv(z0, y0), uv(z1, y0), uv(z1, y1), uv(z0, y1)].flat();
  g.setAttribute('uv', new THREE.Float32BufferAttribute(u, 2));
  // z runs from the room (negative) to the sun: seen from +x, with y up, the rectangle's front faces +x when wound as below
  g.setIndex([0, 2, 1, 0, 3, 2]);
  return g;
}

function mergeRects(x: number, rects: Rect[], uv: (z: number, y: number) => [number, number]): THREE.BufferGeometry {
  const pos: number[] = [];
  const nor: number[] = [];
  const uvs: number[] = [];
  const idx: number[] = [];
  for (const r of rects) {
    const g = rectGeo(x, r, uv);
    const base = pos.length / 3;
    pos.push(...(g.attributes.position as THREE.BufferAttribute).array);
    nor.push(...(g.attributes.normal as THREE.BufferAttribute).array);
    uvs.push(...(g.attributes.uv as THREE.BufferAttribute).array);
    for (const i of g.index!.array) idx.push(base + i);
    g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  out.setIndex(idx);
  return out;
}

export interface ElementCaps {
  /** Make the geometry again for a new spec. */
  relayout(spec: ElementSpec): void;
  /** The material of the three concrete blocks' cut: its map is the heat strip. */
  heat: THREE.MeshStandardMaterial;
}

/**
 * Add the element's caps to `caps` under `parent`. `partOf` says which registered part each cap follows (in `wall` each its own; in `house` all `collector-element`). `x` is the section's plane in the frame of `parent`.
 */
export function addElementCaps(
  caps: Caps,
  parent: THREE.Object3D,
  mats: Mats,
  strip: HeatStrip,
  x: number,
  spec0: ElementSpec,
  partOf: (id: string) => string,
): ElementCaps {
  const heat = new THREE.MeshStandardMaterial({
    color: 0x666666,
    map: strip.texture,
    emissive: 0xffffff,
    emissiveMap: strip.texture,
    emissiveIntensity: 0.62,
    roughness: 0.92,
    side: THREE.DoubleSide,
  });
  heat.userData.noShare = true;
  const steel = capMaterialOf(mats.frame);
  const zinc = capMaterialOf(mats.zinc);
  const black = capMaterialOf(mats.black);
  const glass = new THREE.MeshStandardMaterial({
    color: 0xbfe0d8,
    roughness: 0.2,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  glass.userData.noShare = true;

  interface Item {
    mesh: THREE.Mesh;
    make: (s: ElementSpec) => THREE.BufferGeometry;
  }
  const items: Item[] = [];
  const add = (part: string, material: THREE.Material, make: (s: ElementSpec) => THREE.BufferGeometry): void => {
    const mesh = caps.add(partOf(part), parent, make(spec0), material);
    items.push({ mesh, make });
  };
  const depthUv =
    (s: ElementSpec, face: number) =>
    (z: number, y: number): [number, number] => [y * 0.4, Math.min(1, Math.max(0, (face - z) / s.thickness))];
  const flat = (z: number, y: number): [number, number] => [z, y];

  add('storage-wall', heat, (s) => {
    const L = elementLayout(s);
    return mergeRects(
      x,
      [[L.inner, L.ySillTop + s.ductHeight, L.face, L.yHeadBottom - s.ductHeight]],
      depthUv(s, L.face),
    );
  });
  add('sill-beam', heat, (s) => {
    const L = elementLayout(s);
    return mergeRects(x, [[L.inner, L.yBottom, L.face, L.ySillTop]], depthUv(s, L.face));
  });
  add('head-beam', heat, (s) => {
    const L = elementLayout(s);
    return mergeRects(x, [[L.inner, L.yHeadBottom, L.face, L.yTop]], depthUv(s, L.face));
  });
  add('black-paint', black, (s) => {
    const L = elementLayout(s);
    const t = 0.002;
    return mergeRects(
      x,
      [
        [L.face, L.yBottom, L.face + t, L.ySillTop],
        [L.face, L.ySillTop + s.ductHeight, L.face + t, L.yHeadBottom - s.ductHeight],
        [L.face, L.yHeadBottom, L.face + t, L.yTop],
      ],
      flat,
    );
  });
  add('steel-frame', steel, (s) => {
    const L = elementLayout(s);
    const f = FRAME.face;
    const n = FRAME.panes;
    const ph = (L.yTop - L.yBottom - 2 * f - (n - 1) * f) / n;
    const rects: Rect[] = [
      [L.frameBack, L.yBottom, 0, L.yBottom + f],
      [L.frameBack, L.yTop - f, 0, L.yTop],
    ];
    for (let k = 1; k < n; k++) {
      const yb = L.yBottom + f + k * ph + (k - 1) * f;
      rects.push([L.frameBack, yb, 0, yb + f]);
    }
    return mergeRects(x, rects, flat);
  });
  const sheetCap =
    (k: number) =>
    (s: ElementSpec): THREE.BufferGeometry => {
      const L = elementLayout(s);
      const f = FRAME.face;
      const n = FRAME.panes;
      const ph = (L.yTop - L.yBottom - 2 * f - (n - 1) * f) / n;
      const kk = Math.min(k, L.sheetFront.length - 1);
      const rects: Rect[] = [];
      for (let j = 0; j < n; j++) {
        const y0 = L.yBottom + f + j * (ph + f);
        rects.push([L.sheetFront[kk]! - s.glass, y0, L.sheetFront[kk]!, y0 + ph]);
      }
      return mergeRects(x, rects, flat);
    };
  add('outer-glazing', glass, sheetCap(0));
  add('inner-glazing', glass, (s) => sheetCap(Math.max(1, s.layers - 1))(s));
  const sleeve =
    (upper: boolean) =>
    (s: ElementSpec): THREE.BufferGeometry => {
      const L = elementLayout(s);
      const y0 = upper ? L.yHeadBottom - s.ductHeight : L.ySillTop;
      const t = 0.003;
      return mergeRects(
        x,
        [
          [L.inner, y0, L.face, y0 + t],
          [L.inner, y0 + s.ductHeight - t, L.face, y0 + s.ductHeight],
        ],
        flat,
      );
    };
  add('lower-duct', zinc, sleeve(false));
  add('upper-duct', zinc, sleeve(true));

  return {
    heat,
    relayout(s: ElementSpec) {
      for (const it of items) {
        const old = it.mesh.geometry;
        it.mesh.geometry = it.make(s);
        old.dispose();
      }
    },
  };
}
