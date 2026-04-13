import type { RGB } from './types';

/**
 * Median-cut color quantization.
 * Reduces an image's colors to at most `maxColors` representative palette entries,
 * then maps each pixel to the nearest palette color.
 */

interface Bucket {
  pixels: RGB[];
}

/** Euclidean distance squared between two RGB colors */
function distSq(a: RGB, b: RGB): number {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

/** Average color of a set of pixels */
function averageColor(pixels: RGB[]): RGB {
  if (pixels.length === 0) return [0, 0, 0];
  let r = 0, g = 0, b = 0;
  for (const [pr, pg, pb] of pixels) {
    r += pr;
    g += pg;
    b += pb;
  }
  const n = pixels.length;
  return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
}

/** Find the channel (0=R,1=G,2=B) with the widest range in this bucket */
function longestAxis(pixels: RGB[]): 0 | 1 | 2 {
  let minR = 255, maxR = 0;
  let minG = 255, maxG = 0;
  let minB = 255, maxB = 0;
  for (const [r, g, b] of pixels) {
    if (r < minR) minR = r; if (r > maxR) maxR = r;
    if (g < minG) minG = g; if (g > maxG) maxG = g;
    if (b < minB) minB = b; if (b > maxB) maxB = b;
  }
  const rRange = maxR - minR;
  const gRange = maxG - minG;
  const bRange = maxB - minB;
  if (rRange >= gRange && rRange >= bRange) return 0;
  if (gRange >= bRange) return 1;
  return 2;
}

/** Split a bucket along its longest axis at the median */
function splitBucket(bucket: Bucket): [Bucket, Bucket] {
  const axis = longestAxis(bucket.pixels);
  const sorted = [...bucket.pixels].sort((a, b) => a[axis] - b[axis]);
  const mid = Math.floor(sorted.length / 2);
  return [
    { pixels: sorted.slice(0, mid) },
    { pixels: sorted.slice(mid) },
  ];
}

/** Median-cut: recursively split buckets until we have `count` buckets */
function medianCut(pixels: RGB[], count: number): RGB[] {
  if (count <= 1 || pixels.length === 0) {
    return [averageColor(pixels)];
  }

  let buckets: Bucket[] = [{ pixels }];

  while (buckets.length < count) {
    // Find the largest bucket to split
    let largestIdx = 0;
    for (let i = 1; i < buckets.length; i++) {
      if (buckets[i].pixels.length > buckets[largestIdx].pixels.length) {
        largestIdx = i;
      }
    }
    const largest = buckets[largestIdx];
    if (largest.pixels.length <= 1) break; // can't split further

    const [a, b] = splitBucket(largest);
    buckets.splice(largestIdx, 1, a, b);
  }

  return buckets.map((bkt) => averageColor(bkt.pixels));
}

/** Find the index of the nearest palette color for a given pixel */
export function nearestPaletteIndex(pixel: RGB, palette: RGB[]): number {
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < palette.length; i++) {
    const d = distSq(pixel, palette[i]);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = i;
    }
  }
  return bestIdx;
}

export interface QuantizeResult {
  palette: RGB[];
  /** For each pixel (row-major), its palette index */
  indices: Uint8Array;
  width: number;
  height: number;
}

/**
 * Quantize the pixels in an ImageData to at most `maxColors` palette entries.
 * Samples pixels (skipping transparent ones) for palette generation,
 * then assigns each pixel its nearest palette color.
 */
export function quantizeImage(imageData: ImageData, maxColors: number): QuantizeResult {
  const { data, width, height } = imageData;
  const total = width * height;

  // Collect opaque pixels for palette generation (sample for performance)
  const sampleStep = Math.max(1, Math.floor(total / 10000));
  const samplePixels: RGB[] = [];

  for (let i = 0; i < total; i += sampleStep) {
    const offset = i * 4;
    const alpha = data[offset + 3];
    if (alpha > 128) {
      samplePixels.push([data[offset], data[offset + 1], data[offset + 2]]);
    }
  }

  // Fallback if image is fully transparent
  if (samplePixels.length === 0) {
    samplePixels.push([128, 128, 128]);
  }

  const clampedMax = Math.min(maxColors, 8);
  const palette = medianCut(samplePixels, clampedMax);

  // Map every pixel to nearest palette color
  const indices = new Uint8Array(total);
  for (let i = 0; i < total; i++) {
    const offset = i * 4;
    const alpha = data[offset + 3];
    if (alpha <= 128) {
      indices[i] = 0; // treat transparent as first color
      continue;
    }
    const pixel: RGB = [data[offset], data[offset + 1], data[offset + 2]];
    indices[i] = nearestPaletteIndex(pixel, palette);
  }

  return { palette, indices, width, height };
}
