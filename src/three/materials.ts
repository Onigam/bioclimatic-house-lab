import * as THREE from 'three';
import { MAT } from '@onigam/lab-kit/three';
import {
  blackPaintMap,
  blackPaintNormalMap,
  clothMap,
  concreteMap,
  graniteMap,
  gravelMap,
  hardcoreMap,
  masonryMap,
  oakMap,
  plasterMap,
  renderMap,
  renderNormalMap,
  shutteredConcreteMap,
  slateMap,
  strataMap,
  tileMap,
  tileNormalMap,
  tiled,
  woodMap,
} from './textures';
import { SUN_UNIFORMS } from './sun';

// The materials of the house, the collector, the room and the land. One set per world (the section clips a world's materials, never another's); the maps are shared. Procedural, no file. Every UV is in metres
// (`uvMetric` in `common.ts`), so a map's `tiled(map, 1 / size)` keeps its size on a wall, a beam and a plinth alike.

const std = (o: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial => new THREE.MeshStandardMaterial(o);

/**
 * The glass of the collector throws a sky back. Three's reflection of the world's studio is a plain pale wash on a smooth pane; this adds what a pane of glass shows: the more it is seen along its plane the more it is a mirror (Fresnel,
 * to one at the grazing angle the section shows it at), the mirror holds a sky (a horizon of the lab's paper, a blue overhead, a ground a little darker) and the sun's own glint, from the state's sun (`SUN_UNIFORMS`). The
 * sheets' opacity and environment still follow the model's `glassRefuses`.
 */
function glassLook(m: THREE.MeshStandardMaterial): void {
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uSunDir = SUN_UNIFORMS.dir;
    shader.uniforms.uSunK = SUN_UNIFORMS.k;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uSunDir;\nuniform float uSunK;')
      .replace(
        '#include <opaque_fragment>',
        `#include <opaque_fragment>
        {
          vec3 gView = normalize( vViewPosition );
          float gCos = clamp( abs( dot( normal, gView ) ), 0.0, 1.0 );
          float gF = 0.04 + 0.96 * pow( 1.0 - gCos, 5.0 );
          vec3 gR = inverseTransformDirection( reflect( -gView, normal ), viewMatrix );
          vec3 gSky = mix( vec3( 0.80, 0.83, 0.82 ), vec3( 0.50, 0.68, 0.94 ), smoothstep( 0.02, 0.85, gR.y ) );
          gSky = mix( gSky, vec3( 0.42, 0.39, 0.34 ), smoothstep( 0.0, -0.4, gR.y ) );
          float gSun = max( dot( gR, uSunDir ), 0.0 );
          vec3 gGlint = vec3( 1.0, 0.93, 0.8 ) * ( 40.0 * pow( gSun, 1200.0 ) + 0.5 * pow( gSun, 50.0 ) ) * uSunK;
          gl_FragColor.rgb = mix( gl_FragColor.rgb, gSky * 0.8, gF * 0.4 ) + gGlint;
          gl_FragColor.a = clamp( mix( gl_FragColor.a, 1.0, gF * 0.3 ) + max( gGlint.r, max( gGlint.g, gGlint.b ) ), 0.0, 1.0 );
        }`,
      );
  };
  m.customProgramCacheKey = () => 'collector-glass';
}

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

/** What the black paint keeps of the environment's reflection and of its diffuse light (1 is three's own). */
export const BLACK_IBL = { radiance: 0.3, irradiance: 1.0 } as const;

export function makeMaterials(): Mats {
  const shuttered = std({
    color: 0xb2afa8,
    roughness: 0.93,
    map: tiled(shutteredConcreteMap(), 1 / 0.8),
  });
  const plinth = std({ color: 0x8f8a80, roughness: 0.97, map: tiled(concreteMap(), 1 / 1.4) });
  const render = std({
    color: 0xe6dccb,
    roughness: 0.96,
    map: tiled(renderMap(), 1 / 1.5),
    normalMap: tiled(renderNormalMap(), 1 / 1.5),
    normalScale: new THREE.Vector2(0.5, 0.5),
  });
  // a matt black acrylic on board-marked concrete: the planks' imprint, a tie hole, the pits. Matt, with its reflections kept low: the film sees the face along its plane (7 degrees), where a satin paint reflects the whole pale
  // sky and the sun, and the black face read grey-beige by day (round 2: 135 levels at noon against 92 before the pass; now about 40, the aim under 45)
  const black = std({
    color: 0x383a3e,
    roughness: 1,
    metalness: 0.0,
    envMapIntensity: 0.03,
    map: tiled(blackPaintMap(), 1 / 0.8),
    normalMap: tiled(blackPaintNormalMap(), 1 / 0.8),
    normalScale: new THREE.Vector2(0.5, 0.5),
  });
  const glass = std({
    color: 0x8fa8a4,
    roughness: 0.03,
    metalness: 0.0,
    transparent: true,
    opacity: 0.1,
    envMapIntensity: 0.15,
    depthWrite: false,
  });
  glass.userData.glass = true;
  glassLook(glass);
  // The sun's specular on this paint, seen along its plane, was more than half of what the face gained at noon (0.015 of 0.027 in linear light, at roughness 1: Fresnel is small but the geometry term of a view at 7 degrees is not): a
  // matt acrylic holds a fifth of it. And the room's environment, which three reads at `scene.environmentIntensity` and not at the material's own `envMapIntensity` (that one is for a map the material carries), gave the face
  // three quarters of its light at noon, 30 of 40 levels (round 4: the same frame with the environment off reads 9.5): its reflection at a grazing view (a matt paint scatters a fraction of it) and its diffuse share are taken
  // down here, so that the face from the film's camera reads black and not a brown-grey. `customProgramCacheKey` keeps the paint's program its own.
  black.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <aomap_fragment>', 'reflectedLight.directSpecular *= 0.2;\n#include <aomap_fragment>')
      .replace(
        '#include <lights_fragment_maps>',
        `#include <lights_fragment_maps>\n#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )\n  radiance *= ${BLACK_IBL.radiance.toFixed(2)};\n  iblIrradiance *= ${BLACK_IBL.irradiance.toFixed(2)};\n#endif`,
      );
  };
  black.customProgramCacheKey = () => 'black-paint';
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
  const plaster = std({
    color: 0xe9e2d3,
    roughness: 0.96,
    map: tiled(plasterMap(), 1 / 1.5),
    normalMap: tiled(renderNormalMap(), 1 / 1.5),
    normalScale: new THREE.Vector2(0.3, 0.3),
  });
  const tile = std({
    color: 0xffffff,
    roughness: 0.66,
    map: tiled(tileMap(), 1 / 0.8),
    normalMap: tiled(tileNormalMap(), 1 / 0.8),
    normalScale: new THREE.Vector2(0.3, 0.3),
  });
  const ceiling = std({
    color: 0xf0ebe0,
    roughness: 0.97,
    map: tiled(plasterMap(), 1 / 1.5),
    normalMap: tiled(renderNormalMap(), 1 / 1.5),
    normalScale: new THREE.Vector2(0.2, 0.2),
  });
  const stone = std({ color: 0xffffff, roughness: 0.95, map: tiled(masonryMap(), 1 / 1.75) });
  const granite = std({ color: 0xffffff, roughness: 0.93, map: tiled(graniteMap(), 1 / 2) });
  const gravel = std({ color: 0xffffff, roughness: 1, map: tiled(hardcoreMap(), 1 / 1.0) });
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
