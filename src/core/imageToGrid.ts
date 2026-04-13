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
 * Resize an HTMLImageElement into an off-screen canvas at warpCount × weftCount,
 * then quantize its colors and produce a grid of palette indices.
 */
export function imageToGrid(
  image: HTMLImageElement,
  warpCount: number,
  weftCount: number,
  maxColors: number
): GridData {
  // Draw image into an off-screen canvas at target resolution
  const offscreen = document.createElement('canvas');
  offscreen.width = warpCount;
  offscreen.height = weftCount;
  const ctx = offscreen.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context for off-screen canvas');

  ctx.drawImage(image, 0, 0, warpCount, weftCount);
  const imageData = ctx.getImageData(0, 0, warpCount, weftCount);

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
 * Build a demo grid from a hardcoded 8×8 pattern, tiled to fill warpCount × weftCount.
 * Used when no image is uploaded.
 */
export function buildDemoGrid(warpCount: number, weftCount: number): GridData {
  // 8 kilim-inspired colors
  const palette: RGB[] = [
    [180, 40, 30],   // deep red
    [220, 160, 20],  // golden yellow
    [30, 80, 140],   // cobalt blue
    [240, 220, 180], // cream
    [80, 130, 60],   // olive green
    [160, 90, 40],   // rust orange
    [100, 50, 120],  // purple
    [220, 200, 170], // warm white
  ];

  // 8×8 tile pattern (indices into palette)
  const tile = [
    [0, 1, 0, 2, 0, 1, 0, 2],
    [1, 3, 1, 3, 1, 3, 1, 3],
    [0, 1, 4, 1, 0, 1, 4, 1],
    [2, 3, 1, 5, 2, 3, 1, 5],
    [0, 1, 0, 2, 6, 1, 0, 2],
    [1, 3, 1, 3, 1, 7, 1, 3],
    [4, 1, 0, 1, 4, 1, 0, 1],
    [2, 3, 5, 3, 2, 3, 5, 3],
  ];

  const colorIndices: number[][] = [];
  for (let weft = 0; weft < weftCount; weft++) {
    const row: number[] = [];
    for (let warp = 0; warp < warpCount; warp++) {
      row.push(tile[weft % 8][warp % 8]);
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
