import type { WeavingDraft, RGB } from '../core/types';

export interface ClothRenderOptions {
  cellSize: number;
  showSlits: boolean;
  showFloatWarnings: boolean;
}

const DEFAULT_OPTIONS: ClothRenderOptions = {
  cellSize: 8,
  showSlits: true,
  showFloatWarnings: true,
};

/** Neutral warp linen color */
const WARP_COLOR: RGB = [212, 184, 150];

/**
 * Seeded pseudo-random number generator (mulberry32).
 * Returns a function that yields values in [0, 1).
 */
function seededRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s += 0x6d2b79f5;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Apply a small random variation to a color to simulate fiber texture */
function applyNoise(color: RGB, rng: () => number, amount = 12): RGB {
  const delta = () => Math.round((rng() - 0.5) * amount * 2);
  return [
    clamp(color[0] + delta(), 0, 255),
    clamp(color[1] + delta(), 0, 255),
    clamp(color[2] + delta(), 0, 255),
  ];
}

/**
 * Render the woven cloth simulation onto the provided canvas.
 *
 * Coordinate system: weft rows are Y-axis (top = row 0), warp cols are X-axis.
 * For each cell:
 *   - weft on top: fill with weft (pattern) color + bright top highlight
 *   - warp on top: fill with warp (linen) color + dark bottom shadow
 */
export function renderCloth(
  canvas: HTMLCanvasElement,
  draft: WeavingDraft,
  opts: Partial<ClothRenderOptions> = {}
): void {
  const { warpCount, weftCount, palette, grid, slitMap } = draft;

  // Dynamic cell size based on resolution
  const autoCellSize = warpCount > 200 ? 4 : warpCount > 100 ? 6 : 8;
  const options = { ...DEFAULT_OPTIONS, cellSize: autoCellSize, ...opts };
  const { cellSize, showSlits, showFloatWarnings } = options;

  const width = warpCount * cellSize;
  const height = weftCount * cellSize;

  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, width, height);

  const rng = seededRng(0xdeadbeef);

  for (let j = 0; j < weftCount; j++) {
    for (let i = 0; i < warpCount; i++) {
      const cell = grid[j][i];
      const x = i * cellSize;
      const y = j * cellSize;

      const baseColor = cell.weftOnTop
        ? (palette[cell.colorIndex] ?? WARP_COLOR)
        : WARP_COLOR;

      // Apply noise for fiber texture — reduce intensity at small cell sizes
      const noiseAmount = cellSize <= 4 ? 4 : cellSize <= 6 ? 7 : 10;
      const [r, g, b] = applyNoise(baseColor, rng, noiseAmount);
      ctx.fillStyle = rgbToHex(r, g, b);
      ctx.fillRect(x, y, cellSize, cellSize);

      // Highlight / shadow to create over-under depth
      if (cell.weftOnTop) {
        // Weft on top: bright horizontal highlight along top edge
        const grad = ctx.createLinearGradient(x, y, x, y + cellSize);
        grad.addColorStop(0, 'rgba(255,255,255,0.30)');
        grad.addColorStop(0.35, 'rgba(255,255,255,0.0)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, cellSize, cellSize);
      } else {
        // Warp on top: shadow along bottom edge
        const grad = ctx.createLinearGradient(x, y, x, y + cellSize);
        grad.addColorStop(0.65, 'rgba(0,0,0,0.0)');
        grad.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, cellSize, cellSize);
      }

      // Float warning overlay
      if (showFloatWarnings && cell.floatWarning) {
        ctx.fillStyle = 'rgba(255, 80, 0, 0.20)';
        ctx.fillRect(x, y, cellSize, cellSize);
      }

      // Slit boundary: draw a thin vertical dark line on the left edge of the cell
      if (showSlits && slitMap.has(`${i}:${j}`)) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(x, y, 1, cellSize);
      }
    }
  }
}

/**
 * Export the canvas content as a PNG data URL.
 */
export function exportClothPNG(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}
