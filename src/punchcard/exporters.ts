/**
 * CardChain exporters.
 *
 *   toJSON        Machine-readable dump of the deck + sequence.
 *   toTextDeck    ASCII rendering, one line per pick, 'O' = hole, '.' = blank.
 *                 Plaintext analogue of a laced card deck.
 *   toSvg         Scalable sheet of cards, punchable / printable.
 *                 Rendered in the style of a historical Jacquard / IBM
 *                 punch card: buff manila stock, notched top-left corner,
 *                 sprocket holes top and bottom, column numbers printed
 *                 along the top edge, and chain twine running between cards.
 *   downloadString  Browser-side helper to save a string as a file.
 */

import type { CardChain, PunchCard, SvgExportOptions } from './types';
import { expandChain } from './encoder';

const DEFAULT_SVG_OPTIONS: SvgExportOptions = {
  holeRadius: 3,
  columnPitch: 10,
  cardSpacing: 14,
  margin: 24,
  hollerithStyle: false,
  cardsPerRow: 1,
};

/* --------------------------------- JSON ---------------------------------- */

export function toJSON(chain: CardChain, pretty = true): string {
  const payload = buildJsonPayload(chain);
  return pretty ? JSON.stringify(payload, null, 2) : JSON.stringify(payload);
}

function buildJsonPayload(chain: CardChain) {
  return {
    mode: chain.mode,
    columns: chain.columns,
    totalPicks: chain.totalPicks,
    uniqueCardCount: chain.uniqueCards.length,
    compressionRatio:
      chain.totalPicks === 0 ? 0 : chain.sequence.length / chain.totalPicks,
    uniqueCards: chain.uniqueCards.map(serializeCardForJson),
    sequence: chain.sequence,
  };
}

function serializeCardForJson(card: PunchCard) {
  return {
    id: card.id,
    pickIndex: card.pickIndex,
    colorLabel: card.colorLabel,
    holes: card.holes.map((h) => (h ? 1 : 0)).join(''),
  };
}

/* ------------------------------- TEXT DECK ------------------------------- */

export function toTextDeck(chain: CardChain): string {
  const flat = expandChain(chain);
  const header = buildTextDeckHeader(chain);
  const body = flat.map((cardId, pick) =>
    formatDeckLine(pick, chain.uniqueCards[cardId]),
  );
  return [header, '# pick | pattern | color', ...body].join('\n');
}

function buildTextDeckHeader(chain: CardChain): string {
  return (
    `# Punchcard deck  mode=${chain.mode}  cols=${chain.columns}  ` +
    `picks=${chain.totalPicks}  unique=${chain.uniqueCards.length}`
  );
}

function formatDeckLine(pickIndex: number, card: PunchCard): string {
  const pattern = card.holes.map((h) => (h ? 'O' : '.')).join('');
  const pickStr = String(pickIndex).padStart(4, '0');
  return `${pickStr} | ${pattern} | ${card.colorLabel ?? ''}`;
}

/* ---------------------------------- SVG ---------------------------------- */

/**
 * Physical geometry knobs for a single SVG card. These are kept in SVG
 * units and should parallel the canvas renderer's CARD_* constants, just
 * scaled up for print-quality output.
 */
const SVG_CARD_LEFT_MARGIN = 28;
const SVG_CARD_RIGHT_MARGIN = 14;
const SVG_CARD_TOP_MARGIN = 18;
const SVG_CARD_BOTTOM_MARGIN = 12;
const SVG_CORNER_NOTCH = 12;
const SVG_SPROCKET_RADIUS = 0.9;
const SVG_SPROCKET_PITCH = 10;
const SVG_COLUMN_NUMBER_EVERY = 5;
const SVG_TWINE_INSET = 8;
const SVG_SHADOW_OFFSET = 1.5;

interface SvgCardDimensions {
  width: number;
  height: number;
}

interface SvgSheetLayout extends SvgCardDimensions {
  perRow: number;
  rows: number;
  totalWidth: number;
  totalHeight: number;
}

interface SvgPalette {
  tableFelt: string;
  cardStock: string;
  cardStockHighlight: string;
  cardEdge: string;
  cardShadow: string;
  holeFill: string;
  holeEdge: string;
  gridLine: string;
  labelInk: string;
  twine: string;
  sprocket: string;
}

function buildSvgPalette(hollerithStyle: boolean): SvgPalette {
  if (hollerithStyle) {
    return {
      tableFelt: '#5a4a32',
      cardStock: '#ebdfc0',
      cardStockHighlight: '#f6ecd3',
      cardEdge: '#6a5b3a',
      cardShadow: 'rgba(0,0,0,0.32)',
      holeFill: '#141008',
      holeEdge: '#2a220f',
      gridLine: 'rgba(140,40,35,0.30)',
      labelInk: '#3a2d10',
      twine: '#8a6a38',
      sprocket: '#2a220f',
    };
  }
  return {
    tableFelt: '#2b221a',
    cardStock: '#d9c091',
    cardStockHighlight: '#e7d5a7',
    cardEdge: '#4a3720',
    cardShadow: 'rgba(0,0,0,0.45)',
    holeFill: '#120a03',
    holeEdge: '#2a1c0c',
    gridLine: 'rgba(74,55,32,0.28)',
    labelInk: '#2f2412',
    twine: '#6b4a22',
    sprocket: '#231710',
  };
}

function cardDimensions(
  chain: CardChain,
  opts: SvgExportOptions,
): SvgCardDimensions {
  return {
    width:
      SVG_CARD_LEFT_MARGIN + chain.columns * opts.columnPitch + SVG_CARD_RIGHT_MARGIN,
    height: SVG_CARD_TOP_MARGIN + opts.columnPitch * 2.2 + SVG_CARD_BOTTOM_MARGIN,
  };
}

function computeSheetLayout(
  chain: CardChain,
  picksCount: number,
  opts: SvgExportOptions,
): SvgSheetLayout {
  const card = cardDimensions(chain, opts);
  const perRow = Math.max(1, opts.cardsPerRow);
  const rows = Math.ceil(picksCount / perRow);
  const totalWidth = opts.margin * 2 + perRow * (card.width + opts.cardSpacing);
  const totalHeight =
    opts.margin * 2 + rows * (card.height + opts.cardSpacing) + 30;
  return { ...card, perRow, rows, totalWidth, totalHeight };
}

/* ------------------------- SVG primitive helpers -------------------------- */

function svgRect(
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  stroke?: string,
  strokeWidth = 0.4,
): string {
  const strokeAttrs = stroke
    ? ` stroke="${stroke}" stroke-width="${strokeWidth}"`
    : '';
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"${strokeAttrs} />`;
}

function svgCircle(cx: number, cy: number, r: number, fill: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" />`;
}

function svgLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  stroke: string,
  strokeWidth = 0.5,
): string {
  return (
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ` +
    `stroke="${stroke}" stroke-width="${strokeWidth}" />`
  );
}

function svgText(
  x: number,
  y: number,
  text: string,
  fill: string,
  fontSize: number,
  anchor: 'start' | 'middle' | 'end' = 'start',
): string {
  return (
    `<text x="${x}" y="${y}" font-family="monospace" font-size="${fontSize}" ` +
    `fill="${fill}" text-anchor="${anchor}">${text}</text>`
  );
}

/* --------------------------- Card body rendering ------------------------- */

/**
 * Builds the SVG path string for a card with its top-left corner notched
 * off diagonally. Points traced clockwise from the top of the notch.
 */
function buildNotchedCardPath(
  x: number,
  y: number,
  dims: SvgCardDimensions,
): string {
  const left = x;
  const right = x + dims.width;
  const top = y;
  const bottom = y + dims.height;
  return (
    `M ${left + SVG_CORNER_NOTCH} ${top} ` +
    `L ${right} ${top} ` +
    `L ${right} ${bottom} ` +
    `L ${left} ${bottom} ` +
    `L ${left} ${top + SVG_CORNER_NOTCH} Z`
  );
}

function renderCardShadow(
  x: number,
  y: number,
  dims: SvgCardDimensions,
  palette: SvgPalette,
): string {
  return svgRect(
    x + SVG_SHADOW_OFFSET,
    y + SVG_SHADOW_OFFSET,
    dims.width,
    dims.height,
    palette.cardShadow,
  );
}

function renderCardStock(
  x: number,
  y: number,
  dims: SvgCardDimensions,
  palette: SvgPalette,
): string {
  const pathData = buildNotchedCardPath(x, y, dims);
  return (
    `<path d="${pathData}" fill="${palette.cardStock}" ` +
    `stroke="${palette.cardEdge}" stroke-width="0.75" />`
  );
}

function renderTopEdgeHighlight(
  x: number,
  y: number,
  dims: SvgCardDimensions,
  palette: SvgPalette,
): string {
  return svgLine(
    x + SVG_CORNER_NOTCH,
    y + 0.5,
    x + dims.width - 0.5,
    y + 0.5,
    palette.cardStockHighlight,
    1,
  );
}

function renderSprocketHoles(
  x: number,
  y: number,
  dims: SvgCardDimensions,
  palette: SvgPalette,
): string[] {
  const topY = y + 4;
  const bottomY = y + dims.height - 4;
  const firstX = x + SVG_CARD_LEFT_MARGIN;
  const lastX = x + dims.width - SVG_CARD_RIGHT_MARGIN;
  const dots: string[] = [];
  for (let cx = firstX; cx <= lastX; cx += SVG_SPROCKET_PITCH) {
    dots.push(svgCircle(cx, topY, SVG_SPROCKET_RADIUS, palette.sprocket));
    dots.push(svgCircle(cx, bottomY, SVG_SPROCKET_RADIUS, palette.sprocket));
  }
  return dots;
}

function renderPrintedRowGuide(
  x: number,
  y: number,
  dims: SvgCardDimensions,
  palette: SvgPalette,
): string {
  const guideY = y + dims.height - SVG_CARD_BOTTOM_MARGIN + 0.5;
  return svgLine(
    x + SVG_CARD_LEFT_MARGIN,
    guideY,
    x + dims.width - SVG_CARD_RIGHT_MARGIN,
    guideY,
    palette.gridLine,
    0.5,
  );
}

function renderColumnNumbers(
  card: PunchCard,
  x: number,
  y: number,
  opts: SvgExportOptions,
  palette: SvgPalette,
): string[] {
  const labels: string[] = [];
  const labelY = y + SVG_CARD_TOP_MARGIN - 4;
  for (let c = 0; c < card.columns; c++) {
    const shouldLabel = c === 0 || (c + 1) % SVG_COLUMN_NUMBER_EVERY === 0;
    if (!shouldLabel) continue;
    const cx = x + SVG_CARD_LEFT_MARGIN + c * opts.columnPitch + opts.columnPitch / 2;
    labels.push(svgText(cx, labelY, String(c + 1), palette.labelInk, 5, 'middle'));
  }
  return labels;
}

function renderPickAndCardLabels(
  card: PunchCard,
  pickIndex: number,
  x: number,
  y: number,
  dims: SvgCardDimensions,
  palette: SvgPalette,
): string[] {
  return [
    svgText(x + 3, y + SVG_CARD_TOP_MARGIN - 4, `#${card.id}`, palette.labelInk, 5),
    svgText(
      x + 3,
      y + dims.height / 2 + 2,
      String(pickIndex).padStart(4, '0'),
      palette.labelInk,
      6,
    ),
  ];
}

/* ----------------------------- Holes + swatch ---------------------------- */

function renderSinglePunch(
  cx: number,
  cy: number,
  opts: SvgExportOptions,
  palette: SvgPalette,
): string {
  if (opts.hollerithStyle) {
    const slotWidth = opts.holeRadius * 1.3;
    const slotHeight = opts.holeRadius * 2.6;
    return svgRect(
      cx - slotWidth / 2,
      cy - slotHeight / 2,
      slotWidth,
      slotHeight,
      palette.holeFill,
      palette.holeEdge,
      0.3,
    );
  }
  return svgCircle(cx, cy, opts.holeRadius, palette.holeFill);
}

function renderAllHoles(
  card: PunchCard,
  cardX: number,
  cardY: number,
  dims: SvgCardDimensions,
  opts: SvgExportOptions,
  palette: SvgPalette,
): string[] {
  const rowCenterY = cardY + SVG_CARD_TOP_MARGIN + (dims.height - SVG_CARD_TOP_MARGIN - SVG_CARD_BOTTOM_MARGIN) / 2;
  const holes: string[] = [];
  for (let c = 0; c < card.columns; c++) {
    if (!card.holes[c]) continue;
    const cx = cardX + SVG_CARD_LEFT_MARGIN + c * opts.columnPitch + opts.columnPitch / 2;
    holes.push(renderSinglePunch(cx, rowCenterY, opts, palette));
  }
  return holes;
}

function renderColorSwatch(
  card: PunchCard,
  x: number,
  y: number,
  dims: SvgCardDimensions,
  palette: SvgPalette,
): string {
  if (!card.colorLabel) return '';
  const swatchWidth = 5;
  const swatchX = x + dims.width - SVG_CARD_RIGHT_MARGIN + 2;
  const swatchY = y + SVG_CARD_TOP_MARGIN;
  const swatchHeight = dims.height - SVG_CARD_TOP_MARGIN - SVG_CARD_BOTTOM_MARGIN;
  return svgRect(
    swatchX,
    swatchY,
    swatchWidth,
    swatchHeight,
    card.colorLabel,
    palette.cardEdge,
    0.3,
  );
}

/* ------------------------- Card assembly + sheet ------------------------- */

function renderCardSvg(
  card: PunchCard,
  pickIndex: number,
  x: number,
  y: number,
  dims: SvgCardDimensions,
  opts: SvgExportOptions,
  palette: SvgPalette,
): string {
  return [
    renderCardShadow(x, y, dims, palette),
    renderCardStock(x, y, dims, palette),
    renderTopEdgeHighlight(x, y, dims, palette),
    renderPrintedRowGuide(x, y, dims, palette),
    ...renderSprocketHoles(x, y, dims, palette),
    ...renderColumnNumbers(card, x, y, opts, palette),
    ...renderPickAndCardLabels(card, pickIndex, x, y, dims, palette),
    ...renderAllHoles(card, x, y, dims, opts, palette),
    renderColorSwatch(card, x, y, dims, palette),
  ]
    .filter(Boolean)
    .join('\n  ');
}

function renderChainTwine(
  layout: SvgSheetLayout,
  opts: SvgExportOptions,
  picksCount: number,
  palette: SvgPalette,
): string {
  // Twine only draws when the sheet is a single column -- that's the layout
  // that matches a physically laced deck.
  if (opts.cardsPerRow !== 1 || picksCount === 0) return '';
  const cardX = opts.margin;
  const leftX = cardX + SVG_TWINE_INSET;
  const rightX = cardX + layout.width - SVG_TWINE_INSET;
  const top = opts.margin + 10 - opts.cardSpacing / 2;
  const bottom =
    opts.margin + 10 + picksCount * (layout.height + opts.cardSpacing) - opts.cardSpacing / 2;
  return [
    svgLine(leftX, top, leftX, bottom, palette.twine, 1.1),
    svgLine(rightX, top, rightX, bottom, palette.twine, 1.1),
  ].join('\n  ');
}

function renderSvgHeader(
  chain: CardChain,
  layout: SvgSheetLayout,
  opts: SvgExportOptions,
  palette: SvgPalette,
): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="0 0 ${layout.totalWidth} ${layout.totalHeight}" ` +
    `width="${layout.totalWidth}" height="${layout.totalHeight}">\n` +
    `<rect width="100%" height="100%" fill="${palette.tableFelt}" />\n` +
    svgText(
      opts.margin,
      opts.margin - 6,
      `Punchcard chain -- mode=${chain.mode}, ${chain.totalPicks} picks, ` +
        `${chain.uniqueCards.length} unique cards`,
      '#e7d5a7',
      11,
    )
  );
}

function positionForCardIndex(
  index: number,
  layout: SvgSheetLayout,
  opts: SvgExportOptions,
): { x: number; y: number } {
  const row = Math.floor(index / layout.perRow);
  const col = index % layout.perRow;
  return {
    x: opts.margin + col * (layout.width + opts.cardSpacing),
    y: opts.margin + 10 + row * (layout.height + opts.cardSpacing),
  };
}

export function toSvg(chain: CardChain, opts: Partial<SvgExportOptions> = {}): string {
  const options: SvgExportOptions = { ...DEFAULT_SVG_OPTIONS, ...opts };
  const flat = expandChain(chain);
  const layout = computeSheetLayout(chain, flat.length, options);
  const dims: SvgCardDimensions = { width: layout.width, height: layout.height };
  const palette = buildSvgPalette(options.hollerithStyle);

  const parts: string[] = [renderSvgHeader(chain, layout, options, palette)];
  const twine = renderChainTwine(layout, options, flat.length, palette);
  if (twine) parts.push(twine);

  for (let i = 0; i < flat.length; i++) {
    const card = chain.uniqueCards[flat[i]];
    const { x, y } = positionForCardIndex(i, layout, options);
    parts.push(renderCardSvg(card, i, x, y, dims, options, palette));
  }
  parts.push('</svg>');
  return parts.join('\n');
}

/* -------------------------- Browser download helper ----------------------- */

const REVOKE_DELAY_MS = 500;

export function downloadString(filename: string, contents: string, mime: string): void {
  const blob = new Blob([contents], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
