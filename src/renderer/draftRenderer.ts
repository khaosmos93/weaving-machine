import type { WeavingDraft } from '../core/types';

export interface DraftRenderOptions {
  cellSize: number;
  gap: number;
}

const DEFAULT_DRAFT_OPTIONS: DraftRenderOptions = {
  cellSize: 10,
  gap: 4,
};

const SHAFT_COUNT = 2;
const TREADLE_COUNT = 2;

function rgbToStr(r: number, g: number, b: number): string {
  return `rgb(${r},${g},${b})`;
}

/**
 * Render the 4-quadrant weaving draft onto a canvas:
 *
 *   [Threading | Tie-up  ]
 *   [Drawdown  | Treadling]
 *
 * Threading:  warpCount × shaftCount  (top-left)
 * Tie-up:     treadleCount × shaftCount (top-right)
 * Treadling:  treadleCount × weftCount (bottom-right)
 * Drawdown:   warpCount × weftCount (bottom-left, main area)
 */
export function renderDraft(
  canvas: HTMLCanvasElement,
  draft: WeavingDraft,
  opts: Partial<DraftRenderOptions> = {}
): void {
  const options = { ...DEFAULT_DRAFT_OPTIONS, ...opts };
  const { cellSize: cs, gap } = options;
  const { warpCount, weftCount, palette, grid, threading, treadling, tieUp } = draft;

  // Section dimensions
  const threadingW = warpCount * cs;
  const threadingH = SHAFT_COUNT * cs;
  const tieUpW = TREADLE_COUNT * cs;
  const tieUpH = SHAFT_COUNT * cs;
  const treadlingW = TREADLE_COUNT * cs;
  const treadlingH = weftCount * cs;
  const drawdownW = warpCount * cs;
  const drawdownH = weftCount * cs;

  const totalW = drawdownW + gap + tieUpW;
  const totalH = threadingH + gap + drawdownH;

  canvas.width = totalW;
  canvas.height = totalH;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, totalW, totalH);

  // --- Origins ---
  const threadingX = 0;
  const threadingY = 0;
  const tieUpX = threadingW + gap;
  const tieUpY = 0;
  const drawdownX = 0;
  const drawdownY = threadingH + gap;
  const treadlingX = threadingW + gap;
  const treadlingY = threadingH + gap;

  // --- Draw Threading (top-left): which shaft each warp end is on ---
  for (let i = 0; i < warpCount; i++) {
    const shaft = threading[i]; // 1 or 2
    for (let s = 0; s < SHAFT_COUNT; s++) {
      const x = threadingX + i * cs;
      const y = threadingY + s * cs;
      const active = shaft === s + 1;
      ctx.fillStyle = active ? '#e8d090' : '#3a3a3a';
      ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
    }
  }

  // --- Draw Tie-up (top-right) ---
  for (let s = 0; s < SHAFT_COUNT; s++) {
    for (let t = 0; t < TREADLE_COUNT; t++) {
      const x = tieUpX + t * cs;
      const y = tieUpY + s * cs;
      const active = tieUp[s][t];
      ctx.fillStyle = active ? '#80c0e0' : '#3a3a3a';
      ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
    }
  }

  // --- Draw Treadling (bottom-right): which treadle each weft pick uses ---
  for (let j = 0; j < weftCount; j++) {
    const treadle = treadling[j]; // 1 or 2
    for (let t = 0; t < TREADLE_COUNT; t++) {
      const x = treadlingX + t * cs;
      const y = treadlingY + j * cs;
      const active = treadle === t + 1;
      ctx.fillStyle = active ? '#e08080' : '#3a3a3a';
      ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
    }
  }

  // --- Draw Drawdown (bottom-left): colored pattern squares ---
  for (let j = 0; j < weftCount; j++) {
    for (let i = 0; i < warpCount; i++) {
      const cell = grid[j][i];
      const x = drawdownX + i * cs;
      const y = drawdownY + j * cs;

      let color: string;
      if (cell.weftOnTop) {
        const [r, g, b] = palette[cell.colorIndex] ?? [212, 184, 150];
        color = rgbToStr(r, g, b);
      } else {
        color = rgbToStr(212, 184, 150); // warp (linen)
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, y, cs, cs);

      // Subtle grid line
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fillRect(x, y, cs, 1);
      ctx.fillRect(x, y, 1, cs);
    }
  }

  // --- Section labels ---
  ctx.fillStyle = '#888';
  ctx.font = `${Math.max(9, cs - 2)}px monospace`;

  // Label positions (outside the quadrants)
  const labelPad = 2;
  if (threadingY > 12) {
    ctx.fillText('Threading', threadingX, threadingY - labelPad);
  }
  if (tieUpX + tieUpW < totalW) {
    ctx.fillText('Tie-up', tieUpX, tieUpY + cs);
  }

  // Draw section borders
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;

  // Threading border
  ctx.strokeRect(threadingX + 0.5, threadingY + 0.5, threadingW, threadingH);
  // Tie-up border
  ctx.strokeRect(tieUpX + 0.5, tieUpY + 0.5, tieUpW, tieUpH);
  // Drawdown border
  ctx.strokeRect(drawdownX + 0.5, drawdownY + 0.5, drawdownW, drawdownH);
  // Treadling border
  ctx.strokeRect(treadlingX + 0.5, treadlingY + 0.5, treadlingW, treadlingH);

  // Dimension labels (warp count / weft count)
  ctx.fillStyle = '#666';
  ctx.font = '9px monospace';
  ctx.fillText(`${warpCount}w`, drawdownX, drawdownY + drawdownH + 11);
  ctx.fillText(`${weftCount}p`, treadlingX, treadlingY + treadlingH + 11);
}
