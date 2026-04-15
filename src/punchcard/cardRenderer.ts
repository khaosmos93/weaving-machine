/**
 * Canvas renderer for a CardChain, styled to look like a physical chain of
 * historical punch cards. Each pick becomes one card in a vertical stack --
 * which echoes how Jacquard decks are laced: wide landscape cards strung
 * edge-to-edge into a continuous loop.
 *
 * Historical references honored here:
 *   - Jacquard loom cards (1804): heavy buff cardboard, round holes in a grid,
 *     one column per warp end, cards laced together by twine.
 *   - IBM / Hollerith 80-col cards (1890s-1970s): manila #EBDFC0 stock,
 *     rectangular punched slots, the iconic notched top-left corner,
 *     column numbers printed along the top, thin printed row guides.
 *
 * Layout of a single card row:
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │ · · · · · · · · · · · · sprocket holes · · · · · · · · │
 *   │╲ col 1 2 3 4 5 6 7 8 ...                               │  <- notch + col numbers
 *   │                                                        │
 *   │   ▯   ▯     ▯ ▯       ▯   (rectangular punch holes)    │
 *   │                                                        │
 *   │ · · · · · · · · · · · · · · · · · · · · · · · · · · · ·│
 *   └────────────────────────────────────────────────────────┘
 *     ↕ chain twine connects this card to the next
 */

import type { CardChain, PunchCard } from './types';
import { expandChain } from './encoder';

export interface CardRenderOptions {
  /** Horizontal pitch (px) between column centers. Drives overall scale. */
  cellSize: number;
  /** Gap (px) between consecutive cards -- room for the chain twine. */
  gap: number;
  /** Whether to highlight repeated identical cards with a side bar. */
  highlightRepeats: boolean;
  /** IBM/Hollerith style: rectangular slots + tighter manila palette. */
  hollerithStyle: boolean;
}

const DEFAULT_RENDER_OPTIONS: CardRenderOptions = {
  cellSize: 8,
  gap: 6,
  highlightRepeats: true,
  hollerithStyle: false,
};

/* ------------------------- Physical card geometry ------------------------- */

/**
 * Constants chosen to approximate the proportions of a real IBM card
 * (7 3/8" wide x 3 1/4" tall ~= 2.27:1). We can't hit that exactly at small
 * cell sizes, but we preserve the landscape feel.
 */
const CARD_LEFT_MARGIN = 34;     // gutter for pick# label
const CARD_RIGHT_MARGIN = 14;    // gutter for color swatch
const CARD_TOP_MARGIN = 11;      // space for column-number print line
const CARD_BOTTOM_MARGIN = 7;    // space for bottom sprocket row
const CORNER_NOTCH = 9;          // diagonal cut on top-left corner
const SPROCKET_DOT_RADIUS = 0.9;
const SPROCKET_PITCH = 10;       // horizontal spacing between sprocket dots
const CARD_SHADOW_OFFSET = 1.5;
const TWINE_INSET = 10;          // how far from card edges the chain twine runs
const COLUMN_NUMBER_EVERY = 5;   // print the column number every N columns
const MIN_COLUMN_NUMBER_PITCH = 7; // don't print numbers when cellSize < this

interface ChainLayout {
  rowHeight: number;
  cardWidth: number;
  cardHeight: number;
  holesLeftEdge: number;
  holesTopEdge: number;
  canvasWidth: number;
  canvasHeight: number;
}

interface ChainPalette {
  tableFelt: string;      // surface the card chain sits on
  cardStock: string;      // card face
  cardStockHighlight: string; // top edge highlight for subtle emboss
  cardEdge: string;       // ink-dark edge stroke
  cardShadow: string;     // drop shadow under the card
  holeColor: string;      // punched-through interior (nearly black)
  holeEdge: string;       // crisp slot/hole edge
  blankGuide: string;     // ghost dot on unpunched positions
  gridLine: string;       // printed horizontal guide line
  labelInk: string;       // pick number + column numbers
  twine: string;          // chain lacing between cards
  repeatBar: string;      // reuse-run highlight
  sprocket: string;       // sprocket hole interior
}

interface RepeatRun {
  startPick: number;
  length: number;
}

/* ------------------------------ Public entry ------------------------------ */

export function renderCardChain(
  canvas: HTMLCanvasElement,
  chain: CardChain,
  opts: Partial<CardRenderOptions> = {},
): void {
  const options: CardRenderOptions = { ...DEFAULT_RENDER_OPTIONS, ...opts };
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const flat = expandChain(chain);
  const layout = computeLayout(chain, flat.length, options);
  const palette = buildPalette(options.hollerithStyle);

  applyCanvasSize(canvas, layout);
  paintTableFelt(ctx, layout, palette);
  drawChainTwine(ctx, flat.length, layout, palette, options);
  drawAllCards(ctx, chain, flat, layout, palette, options);

  if (options.highlightRepeats) {
    drawRepeatRuns(ctx, findRepeatRuns(flat), layout, palette, options);
  }
}

/* ---------------------------- Layout + palette ---------------------------- */

function computeLayout(
  chain: CardChain,
  pickCount: number,
  opts: CardRenderOptions,
): ChainLayout {
  const holesWidth = chain.columns * opts.cellSize;
  const cardWidth = CARD_LEFT_MARGIN + holesWidth + CARD_RIGHT_MARGIN;
  const cardHeight = CARD_TOP_MARGIN + opts.cellSize + CARD_BOTTOM_MARGIN;
  const rowHeight = cardHeight + opts.gap;

  return {
    rowHeight,
    cardWidth,
    cardHeight,
    holesLeftEdge: CARD_LEFT_MARGIN,
    holesTopEdge: CARD_TOP_MARGIN,
    canvasWidth: cardWidth + CARD_SHADOW_OFFSET + 2,
    canvasHeight: pickCount * rowHeight + opts.gap,
  };
}

function buildPalette(hollerithStyle: boolean): ChainPalette {
  if (hollerithStyle) {
    // IBM manila -- what most people picture when they hear "punch card".
    return {
      tableFelt: '#5a4a32',
      cardStock: '#ebdfc0',
      cardStockHighlight: '#f6ecd3',
      cardEdge: '#6a5b3a',
      cardShadow: 'rgba(0,0,0,0.35)',
      holeColor: '#141008',
      holeEdge: '#2a220f',
      blankGuide: 'rgba(80,60,20,0.18)',
      gridLine: 'rgba(140,40,35,0.22)',   // the classic faint red IBM print
      labelInk: '#3a2d10',
      twine: '#8a6a38',
      repeatBar: '#a8762f',
      sprocket: '#2a220f',
    };
  }
  // Jacquard loom deck -- warmer, browner cardboard, laced with dark twine.
  return {
    tableFelt: '#2b221a',
    cardStock: '#d9c091',
    cardStockHighlight: '#e7d5a7',
    cardEdge: '#4a3720',
    cardShadow: 'rgba(0,0,0,0.45)',
    holeColor: '#120a03',
    holeEdge: '#2a1c0c',
    blankGuide: 'rgba(40,25,10,0.18)',
    gridLine: 'rgba(74,55,32,0.22)',
    labelInk: '#2f2412',
    twine: '#6b4a22',
    repeatBar: '#c08a3a',
    sprocket: '#231710',
  };
}

function applyCanvasSize(canvas: HTMLCanvasElement, layout: ChainLayout): void {
  canvas.width = layout.canvasWidth;
  canvas.height = layout.canvasHeight;
}

function paintTableFelt(
  ctx: CanvasRenderingContext2D,
  layout: ChainLayout,
  palette: ChainPalette,
): void {
  ctx.fillStyle = palette.tableFelt;
  ctx.fillRect(0, 0, layout.canvasWidth, layout.canvasHeight);
}

/* ------------------------- Chain twine between cards ---------------------- */

/**
 * The chain twine is what historically laces cards together. We draw it as
 * two vertical threads that run behind all cards, so the gap between cards
 * reveals the thread. Left thread runs through the gutter, right thread
 * runs through the color-bar gutter.
 */
function drawChainTwine(
  ctx: CanvasRenderingContext2D,
  pickCount: number,
  layout: ChainLayout,
  palette: ChainPalette,
  opts: CardRenderOptions,
): void {
  if (pickCount === 0) return;
  ctx.strokeStyle = palette.twine;
  ctx.lineWidth = 1.1;
  const leftX = TWINE_INSET;
  const rightX = layout.cardWidth - TWINE_INSET;
  const top = opts.gap / 2;
  const bottom = layout.canvasHeight - opts.gap / 2;
  drawVerticalLine(ctx, leftX, top, bottom);
  drawVerticalLine(ctx, rightX, top, bottom);
}

function drawVerticalLine(
  ctx: CanvasRenderingContext2D,
  x: number,
  yStart: number,
  yEnd: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x, yStart);
  ctx.lineTo(x, yEnd);
  ctx.stroke();
}

/* -------------------------------- Cards ----------------------------------- */

function drawAllCards(
  ctx: CanvasRenderingContext2D,
  chain: CardChain,
  flat: number[],
  layout: ChainLayout,
  palette: ChainPalette,
  opts: CardRenderOptions,
): void {
  for (let pick = 0; pick < flat.length; pick++) {
    const card = chain.uniqueCards[flat[pick]];
    const cardTop = opts.gap + pick * layout.rowHeight;
    drawSingleCard(ctx, card, flat[pick], pick, cardTop, chain.columns, layout, palette, opts);
  }
}

function drawSingleCard(
  ctx: CanvasRenderingContext2D,
  card: PunchCard,
  cardId: number,
  pickIndex: number,
  y: number,
  columns: number,
  layout: ChainLayout,
  palette: ChainPalette,
  opts: CardRenderOptions,
): void {
  drawCardDropShadow(ctx, y, layout, palette);
  drawCardStockWithNotch(ctx, y, layout, palette);
  drawPrintedRowGuides(ctx, y, layout, palette);
  drawSprocketHoles(ctx, y, layout, palette);
  drawColumnNumbers(ctx, y, columns, layout, palette, opts);
  drawPickLabel(ctx, pickIndex, cardId, y, layout, palette);
  drawPunchedHoles(ctx, card, columns, y, layout, palette, opts);
  drawColorSwatch(ctx, card, y, layout, palette);
}

/* --- card stock + iconic notched corner ---------------------------------- */

function drawCardDropShadow(
  ctx: CanvasRenderingContext2D,
  y: number,
  layout: ChainLayout,
  palette: ChainPalette,
): void {
  ctx.fillStyle = palette.cardShadow;
  ctx.fillRect(
    CARD_SHADOW_OFFSET,
    y + CARD_SHADOW_OFFSET,
    layout.cardWidth,
    layout.cardHeight,
  );
}

/**
 * Traces the card outline with the top-left corner cut diagonally --
 * the defining visual signature of an IBM punch card, and the orientation
 * key that prevented operators from feeding a card upside down.
 */
function drawCardStockWithNotch(
  ctx: CanvasRenderingContext2D,
  y: number,
  layout: ChainLayout,
  palette: ChainPalette,
): void {
  const left = 0;
  const right = layout.cardWidth;
  const top = y;
  const bottom = y + layout.cardHeight;

  ctx.beginPath();
  ctx.moveTo(left + CORNER_NOTCH, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.lineTo(left, bottom);
  ctx.lineTo(left, top + CORNER_NOTCH);
  ctx.closePath();

  ctx.fillStyle = palette.cardStock;
  ctx.fill();

  // Subtle emboss: a 1px highlight along the top edge gives the card a
  // physical "sitting on the table" feel.
  ctx.strokeStyle = palette.cardStockHighlight;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(left + CORNER_NOTCH, top + 0.5);
  ctx.lineTo(right - 0.5, top + 0.5);
  ctx.stroke();

  // Crisp ink-dark outline for the whole card shape.
  ctx.strokeStyle = palette.cardEdge;
  ctx.lineWidth = 0.75;
  ctx.beginPath();
  ctx.moveTo(left + CORNER_NOTCH, top);
  ctx.lineTo(right, top);
  ctx.lineTo(right, bottom);
  ctx.lineTo(left, bottom);
  ctx.lineTo(left, top + CORNER_NOTCH);
  ctx.closePath();
  ctx.stroke();
}

/* --- printed guides: row line + column numbers + sprockets --------------- */

function drawPrintedRowGuides(
  ctx: CanvasRenderingContext2D,
  y: number,
  layout: ChainLayout,
  palette: ChainPalette,
): void {
  // Real IBM cards have a faint red horizontal line separating rows.
  // We have only one row of holes per card, so we print a single guide
  // line under the hole row -- matches the look of a single-row dobby bar.
  const guideY = y + layout.holesTopEdge + layout.cardHeight - layout.holesTopEdge - CARD_BOTTOM_MARGIN + 0.5;
  ctx.strokeStyle = palette.gridLine;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(layout.holesLeftEdge, guideY);
  ctx.lineTo(layout.cardWidth - CARD_RIGHT_MARGIN, guideY);
  ctx.stroke();
}

function drawSprocketHoles(
  ctx: CanvasRenderingContext2D,
  y: number,
  layout: ChainLayout,
  palette: ChainPalette,
): void {
  const topY = y + 2.5;
  const bottomY = y + layout.cardHeight - 2.5;
  const firstX = layout.holesLeftEdge;
  const lastX = layout.cardWidth - CARD_RIGHT_MARGIN;

  ctx.fillStyle = palette.sprocket;
  for (let x = firstX; x <= lastX; x += SPROCKET_PITCH) {
    drawFilledCircle(ctx, x, topY, SPROCKET_DOT_RADIUS);
    drawFilledCircle(ctx, x, bottomY, SPROCKET_DOT_RADIUS);
  }
}

function drawFilledCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawColumnNumbers(
  ctx: CanvasRenderingContext2D,
  y: number,
  columns: number,
  layout: ChainLayout,
  palette: ChainPalette,
  opts: CardRenderOptions,
): void {
  if (opts.cellSize < MIN_COLUMN_NUMBER_PITCH) return;
  ctx.fillStyle = palette.labelInk;
  ctx.font = '6px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';
  const labelY = y + CARD_TOP_MARGIN - 3;
  for (let c = 0; c < columns; c++) {
    const shouldLabel = c === 0 || (c + 1) % COLUMN_NUMBER_EVERY === 0;
    if (!shouldLabel) continue;
    const cx = layout.holesLeftEdge + c * opts.cellSize + opts.cellSize / 2;
    ctx.fillText(String(c + 1), cx, labelY);
  }
  ctx.textAlign = 'start';
}

/* --- labels + punched holes + color swatch ------------------------------- */

function drawPickLabel(
  ctx: CanvasRenderingContext2D,
  pickIndex: number,
  cardId: number,
  y: number,
  layout: ChainLayout,
  palette: ChainPalette,
): void {
  ctx.fillStyle = palette.labelInk;
  ctx.font = '7px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'start';
  const labelY = y + layout.cardHeight / 2 + 1;
  // Pick number: like a handwritten index on the card gutter.
  ctx.fillText(String(pickIndex).padStart(4, '0'), 3, labelY);
  // Card id: stamped further right, below the notch.
  ctx.font = '6px monospace';
  ctx.fillText(`#${cardId}`, 3, y + CARD_TOP_MARGIN - 3);
}

function drawPunchedHoles(
  ctx: CanvasRenderingContext2D,
  card: PunchCard,
  columns: number,
  y: number,
  layout: ChainLayout,
  palette: ChainPalette,
  opts: CardRenderOptions,
): void {
  const rowCenterY = y + layout.holesTopEdge + opts.cellSize / 2;
  for (let c = 0; c < columns; c++) {
    const centerX = layout.holesLeftEdge + c * opts.cellSize + opts.cellSize / 2;
    if (card.holes[c]) {
      drawSinglePunch(ctx, centerX, rowCenterY, palette, opts);
    } else {
      drawUnpunchedGuide(ctx, centerX, rowCenterY, palette);
    }
  }
}

/**
 * Rectangular IBM-style slot when in Hollerith mode, otherwise the round
 * hole used by Jacquard cards. In both cases we stroke the edge to get a
 * crisp "punched through" look against the manila stock.
 */
function drawSinglePunch(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  palette: ChainPalette,
  opts: CardRenderOptions,
): void {
  if (opts.hollerithStyle) {
    drawRectangularSlot(ctx, cx, cy, palette, opts);
    return;
  }
  drawRoundHole(ctx, cx, cy, palette, opts);
}

function drawRectangularSlot(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  palette: ChainPalette,
  opts: CardRenderOptions,
): void {
  const slotWidth = Math.max(1.5, opts.cellSize * 0.38);
  const slotHeight = Math.max(2.5, opts.cellSize * 0.82);
  const x = cx - slotWidth / 2;
  const y = cy - slotHeight / 2;
  ctx.fillStyle = palette.holeColor;
  ctx.fillRect(x, y, slotWidth, slotHeight);
  ctx.strokeStyle = palette.holeEdge;
  ctx.lineWidth = 0.4;
  ctx.strokeRect(x + 0.25, y + 0.25, slotWidth - 0.5, slotHeight - 0.5);
}

function drawRoundHole(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  palette: ChainPalette,
  opts: CardRenderOptions,
): void {
  const radius = Math.max(1.1, opts.cellSize * 0.32);
  ctx.fillStyle = palette.holeColor;
  drawFilledCircle(ctx, cx, cy, radius);
  ctx.strokeStyle = palette.holeEdge;
  ctx.lineWidth = 0.4;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 0.2, 0, Math.PI * 2);
  ctx.stroke();
}

function drawUnpunchedGuide(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  palette: ChainPalette,
): void {
  ctx.fillStyle = palette.blankGuide;
  ctx.fillRect(cx - 0.5, cy - 0.5, 1, 1);
}

function drawColorSwatch(
  ctx: CanvasRenderingContext2D,
  card: PunchCard,
  y: number,
  layout: ChainLayout,
  palette: ChainPalette,
): void {
  if (!card.colorLabel) return;
  const swatchWidth = 5;
  const swatchX = layout.cardWidth - CARD_RIGHT_MARGIN + 2;
  const swatchY = y + CARD_TOP_MARGIN;
  const swatchHeight = layout.cardHeight - CARD_TOP_MARGIN - CARD_BOTTOM_MARGIN;
  ctx.fillStyle = card.colorLabel;
  ctx.fillRect(swatchX, swatchY, swatchWidth, swatchHeight);
  ctx.strokeStyle = palette.cardEdge;
  ctx.lineWidth = 0.4;
  ctx.strokeRect(
    swatchX + 0.25,
    swatchY + 0.25,
    swatchWidth - 0.5,
    swatchHeight - 0.5,
  );
}

/* ------------------------ Repeat-run side highlights ---------------------- */

function findRepeatRuns(flat: number[]): RepeatRun[] {
  const runs: RepeatRun[] = [];
  if (flat.length === 0) return runs;

  let runStart = 0;
  for (let i = 1; i <= flat.length; i++) {
    const endOfRun = i === flat.length || flat[i] !== flat[runStart];
    if (!endOfRun) continue;
    const length = i - runStart;
    if (length > 1) runs.push({ startPick: runStart, length });
    runStart = i;
  }
  return runs;
}

function drawRepeatRuns(
  ctx: CanvasRenderingContext2D,
  runs: RepeatRun[],
  layout: ChainLayout,
  palette: ChainPalette,
  opts: CardRenderOptions,
): void {
  ctx.fillStyle = palette.repeatBar;
  const barX = layout.cardWidth + CARD_SHADOW_OFFSET - 0.5;
  const barWidth = 2;
  for (const run of runs) {
    const barY = opts.gap + run.startPick * layout.rowHeight;
    const barHeight = run.length * layout.rowHeight - opts.gap;
    ctx.fillRect(barX, barY, barWidth, barHeight);
  }
}
