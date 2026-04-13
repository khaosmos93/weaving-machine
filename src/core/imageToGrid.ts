import type { RGB } from './types';
import { quantizeImage, nearestPaletteIndex } from './colorQuantize';

export interface GridData {
  palette: RGB[];
  /** colorIndex per cell: [weftRow][warpCol] */
  colorIndices: number[][];
  warpCount: number;
  weftCount: number;
}

/**
 * Sample a rectangular region from ImageData and return the average RGB.
 * x1/y1 are inclusive start, x2/y2 are exclusive end (clamped to image bounds).
 */
function sampleRegionAverage(data: Uint8ClampedArray, imgWidth: number, imgHeight: number,
  x1: number, y1: number, x2: number, y2: number): RGB {
  const rx1 = Math.max(0, Math.floor(x1));
  const ry1 = Math.max(0, Math.floor(y1));
  const rx2 = Math.min(imgWidth, Math.ceil(x2));
  const ry2 = Math.min(imgHeight, Math.ceil(y2));
  let r = 0, g = 0, b = 0, count = 0;
  for (let py = ry1; py < ry2; py++) {
    for (let px = rx1; px < rx2; px++) {
      const off = (py * imgWidth + px) * 4;
      if (data[off + 3] > 128) {
        r += data[off];
        g += data[off + 1];
        b += data[off + 2];
        count++;
      }
    }
  }
  if (count === 0) return [128, 128, 128];
  return [Math.round(r / count), Math.round(g / count), Math.round(b / count)];
}

/**
 * Resize an HTMLImageElement into a grid of warpCount × weftCount cells using
 * area-averaging (samples a proportional rectangle of the source for each cell),
 * then quantize colors and produce a grid of palette indices.
 */
export function imageToGrid(
  image: HTMLImageElement,
  warpCount: number,
  weftCount: number,
  maxColors: number
): GridData {
  // Draw image at full resolution into an off-screen canvas
  const srcW = image.naturalWidth || image.width;
  const srcH = image.naturalHeight || image.height;
  const offscreen = document.createElement('canvas');
  offscreen.width = srcW;
  offscreen.height = srcH;
  const ctx = offscreen.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context for off-screen canvas');
  ctx.drawImage(image, 0, 0, srcW, srcH);
  const srcData = ctx.getImageData(0, 0, srcW, srcH);

  // Build averaged ImageData at warpCount × weftCount
  const avgData = new Uint8ClampedArray(warpCount * weftCount * 4);
  const scaleX = srcW / warpCount;
  const scaleY = srcH / weftCount;
  for (let weft = 0; weft < weftCount; weft++) {
    for (let warp = 0; warp < warpCount; warp++) {
      const [r, g, b] = sampleRegionAverage(
        srcData.data, srcW, srcH,
        warp * scaleX, weft * scaleY,
        (warp + 1) * scaleX, (weft + 1) * scaleY
      );
      const off = (weft * warpCount + warp) * 4;
      avgData[off] = r;
      avgData[off + 1] = g;
      avgData[off + 2] = b;
      avgData[off + 3] = 255;
    }
  }
  const imageData = new ImageData(avgData, warpCount, weftCount);

  const { palette, indices } = quantizeImage(imageData, maxColors);

  // Build 2D grid: [weftRow][warpCol]
  const colorIndices: number[][] = [];
  for (let weft = 0; weft < weftCount; weft++) {
    const row: number[] = [];
    for (let warp = 0; warp < warpCount; warp++) {
      row.push(indices[weft * warpCount + warp]);
    }
    colorIndices.push(row);
  }

  return { palette, colorIndices, warpCount, weftCount };
}

/**
 * Build a demo grid from a hardcoded 16×16 geometric kilim diamond/medallion tile,
 * tiled to fill warpCount × weftCount.
 * Used when no image is uploaded. Default: 120×160.
 */
export function buildDemoGrid(warpCount = 120, weftCount = 160): GridData {
  // 16 traditional kilim-inspired colors
  const palette: RGB[] = [
    [180, 35, 25],   // 0  deep red
    [220, 155, 15],  // 1  golden yellow
    [25, 75, 140],   // 2  cobalt blue
    [240, 225, 185], // 3  cream
    [75, 125, 55],   // 4  olive green
    [165, 85, 35],   // 5  rust orange
    [95, 45, 115],   // 6  purple
    [215, 195, 160], // 7  warm white
    [190, 110, 30],  // 8  amber
    [35, 110, 100],  // 9  teal
    [205, 60, 50],   // 10 bright red
    [50, 45, 90],    // 11 indigo
    [130, 175, 65],  // 12 lime green
    [200, 140, 100], // 13 sand
    [100, 30, 30],   // 14 dark maroon
    [230, 210, 80],  // 15 light gold
  ];

  // 16×16 geometric kilim diamond/medallion motif
  // Each row is 16 palette indices; the pattern is symmetric and forms a diamond with border
  const tile: number[][] = [
    [ 0,  0,  0,  0,  0,  0,  0,  1,  0,  0,  0,  0,  0,  0,  0,  2],
    [ 0,  3,  3,  3,  3,  3,  1,  4,  1,  3,  3,  3,  3,  3,  2,  0],
    [ 0,  3,  5,  5,  5,  1,  4,  6,  4,  1,  5,  5,  5,  2,  0,  0],
    [ 0,  3,  5,  7,  1,  4,  6,  8,  6,  4,  1,  7,  5,  2,  0,  0],
    [ 0,  3,  5,  1,  9, 10,  8, 15,  8, 10,  9,  1,  5,  2,  0,  0],
    [ 0,  3,  1,  4, 10,  6, 15, 11, 15,  6, 10,  4,  1,  2,  0,  0],
    [ 0,  1,  4,  6,  8, 15, 11, 12, 11, 15,  8,  6,  4,  1,  0,  0],
    [ 1,  4,  6,  8, 15, 11, 12, 13, 12, 11, 15,  8,  6,  4,  1,  0],
    [ 1,  4,  6,  8, 15, 11, 12, 13, 12, 11, 15,  8,  6,  4,  1,  0],
    [ 0,  1,  4,  6,  8, 15, 11, 12, 11, 15,  8,  6,  4,  1,  0,  0],
    [ 0,  3,  1,  4, 10,  6, 15, 11, 15,  6, 10,  4,  1,  2,  0,  0],
    [ 0,  3,  5,  1,  9, 10,  8, 15,  8, 10,  9,  1,  5,  2,  0,  0],
    [ 0,  3,  5,  7,  1,  4,  6,  8,  6,  4,  1,  7,  5,  2,  0,  0],
    [ 0,  3,  5,  5,  5,  1,  4,  6,  4,  1,  5,  5,  5,  2,  0,  0],
    [ 0,  3,  3,  3,  3,  3,  1,  4,  1,  3,  3,  3,  3,  3,  2,  0],
    [ 0,  0,  0,  0,  0,  0,  0,  1,  0,  0,  0,  0,  0,  0,  0,  2],
  ];

  const colorIndices: number[][] = [];
  for (let weft = 0; weft < weftCount; weft++) {
    const row: number[] = [];
    for (let warp = 0; warp < warpCount; warp++) {
      row.push(tile[weft % 16][warp % 16]);
    }
    colorIndices.push(row);
  }

  return { palette, colorIndices, warpCount, weftCount };
}

/**
 * Build a GridData from raw ImageData (for use with FileReader/blob pipelines).
 */
export function imageDataToGrid(
  imageData: ImageData,
  warpCount: number,
  weftCount: number,
  maxColors: number
): GridData {
  // We need to resize: draw onto off-screen canvas first
  const src = document.createElement('canvas');
  src.width = imageData.width;
  src.height = imageData.height;
  const srcCtx = src.getContext('2d');
  if (!srcCtx) throw new Error('Could not get 2D context');
  srcCtx.putImageData(imageData, 0, 0);

  const dst = document.createElement('canvas');
  dst.width = warpCount;
  dst.height = weftCount;
  const dstCtx = dst.getContext('2d');
  if (!dstCtx) throw new Error('Could not get 2D context');
  dstCtx.drawImage(src, 0, 0, warpCount, weftCount);

  const resized = dstCtx.getImageData(0, 0, warpCount, weftCount);
  const { palette, indices } = quantizeImage(resized, maxColors);

  const colorIndices: number[][] = [];
  for (let weft = 0; weft < weftCount; weft++) {
    const row: number[] = [];
    for (let warp = 0; warp < warpCount; warp++) {
      row.push(indices[weft * warpCount + warp]);
    }
    colorIndices.push(row);
  }

  return { palette, colorIndices, warpCount, weftCount };
}

/** Re-quantize a GridData with a different maxColors */
export function requantizeGrid(
  source: GridData,
  maxColors: number
): GridData {
  // Collect all represented palette entries, then re-cluster
  const allPixels: RGB[] = [];
  for (const row of source.colorIndices) {
    for (const idx of row) {
      allPixels.push(source.palette[idx]);
    }
  }

  // Build a temporary ImageData-like structure and re-quantize
  const width = source.warpCount;
  const height = source.weftCount;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let weft = 0; weft < height; weft++) {
    for (let warp = 0; warp < width; warp++) {
      const color = source.palette[source.colorIndices[weft][warp]];
      const offset = (weft * width + warp) * 4;
      data[offset] = color[0];
      data[offset + 1] = color[1];
      data[offset + 2] = color[2];
      data[offset + 3] = 255;
    }
  }
  const imageData = new ImageData(data, width, height);
  const { palette, indices } = quantizeImage(imageData, maxColors);

  const colorIndices: number[][] = [];
  for (let weft = 0; weft < height; weft++) {
    const row: number[] = [];
    for (let warp = 0; warp < width; warp++) {
      row.push(indices[weft * width + warp]);
    }
    colorIndices.push(row);
  }

  return { palette, colorIndices, warpCount: width, weftCount: height };
}

// Re-export nearestPaletteIndex for external use
export { nearestPaletteIndex };
