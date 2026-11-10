import * as THREE from 'three';
import { heatRgb, heatStops } from '@onigam/lab-kit/sim/thermal';

// The false colour of the lab: the kit's ramp, one span fixed in °C, so that a colour means the same in every world and at every moment: the section of the concrete, the air in the gap, the dots, the room's jet. Blue
// is cold and red is hot, the eye's own convention. Concrete at 60 °C does not glow: the world's overview says it is a false colour, once, and the scale bar of the `wall` world says the span.

/** The span of the ramp, °C, held at both ends. The outer face swings from about 20 to 65 °C on a clear winter day, the inner face stays about 25 °C: from 10 °C the wall's own range reads, the air outside (below freezing) is simply the coldest blue. */
export const HEAT_MIN = 10;
export const HEAT_MAX = 70;
export const HEAT = heatStops(HEAT_MIN, HEAT_MAX);

const tmp: [number, number, number] = [0, 0, 0];

/** The colour of a temperature, as linear RGB, written into `out`. */
export function heatColor(T: number, out = new THREE.Color()): THREE.Color {
  const [r, g, b] = heatRgb(HEAT, Number.isFinite(T) ? T : HEAT_MIN, tmp);
  return out.setRGB(r, g, b, THREE.LinearSRGBColorSpace);
}

/**
 * A strip of temperatures as a one-pixel-wide texture, read along V: the cells of the wall from its outer face to its inner one. Written into an 8-bit sRGB texture, as a material expects. No canvas: it builds in
 * Node. `update` rewrites the cells only when one has moved by a visible amount; the wall's thickness changes the number of cells, so the strip resamples whatever it is given to its own `cells`.
 */
export class HeatStrip {
  readonly texture: THREE.DataTexture;
  private readonly data: Uint8Array;
  private readonly last: Float64Array;
  private readonly colour = new THREE.Color();

  constructor(readonly cells = 48) {
    this.data = new Uint8Array(cells * 4);
    this.last = new Float64Array(cells).fill(NaN);
    this.texture = new THREE.DataTexture(this.data, 1, cells, THREE.RGBAFormat);
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.fill(20);
  }

  fill(T: number): void {
    for (let i = 0; i < this.cells; i++) this.set(i, T);
    this.texture.needsUpdate = true;
  }

  private set(i: number, T: number): void {
    heatColor(T, this.colour).convertLinearToSRGB();
    const k = i * 4;
    this.data[k] = Math.round(this.colour.r * 255);
    this.data[k + 1] = Math.round(this.colour.g * 255);
    this.data[k + 2] = Math.round(this.colour.b * 255);
    this.data[k + 3] = 255;
  }

  /**
   * The wall's temperatures from its outer face to its inner one (`layers`, cell centres; `faceOuter` and `faceInner` the two faces), read by linear interpolation at each texel's depth. The texture's V is
   * 0 at the outer face and 1 at the inner face.
   */
  update(layers: ArrayLike<number>, faceOuter: number, faceInner: number): void {
    const n = layers.length;
    let dirty = false;
    for (let i = 0; i < this.cells; i++) {
      const t = (i + 0.5) / this.cells;
      let T: number;
      if (n === 0) T = (faceOuter + faceInner) / 2;
      else {
        // cell centres sit at (k + 0.5) / n; the faces close the ends
        const x = t * n - 0.5;
        if (x <= 0) T = faceOuter + (layers[0]! - faceOuter) * (x + 0.5) * 2;
        else if (x >= n - 1) T = layers[n - 1]! + (faceInner - layers[n - 1]!) * (x - (n - 1)) * 2;
        else {
          const k = Math.floor(x);
          T = layers[k]! + (layers[k + 1]! - layers[k]!) * (x - k);
        }
      }
      if (!(Math.abs(T - this.last[i]!) < 0.05)) {
        this.last[i] = T;
        this.set(i, T);
        dirty = true;
      }
    }
    if (dirty) this.texture.needsUpdate = true;
  }
}
