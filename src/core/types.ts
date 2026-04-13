/** RGB color as a 3-tuple [r, g, b], each 0–255 */
export type RGB = [number, number, number];

/** A single cell in the pattern grid */
export interface Cell {
  /** Index into the palette (which weft color fills this cell) */
  colorIndex: number;
  /** Whether weft thread is on top at this cell (plain-weave rule) */
  weftOnTop: boolean;
  /** Whether this cell is part of a slit boundary on its left edge */
  slitLeft: boolean;
  /** Whether this cell is flagged as part of a float run */
  floatWarning: boolean;
}

/** The full warp×weft grid of cells */
export type PatternGrid = Cell[][];

/** One warp end definition */
export interface WarpEnd {
  index: number;
  /** Which heddle shaft it is threaded through (1-indexed, plain weave = alternating 1/2) */
  shaft: 1 | 2;
  color: RGB; // warp yarn color (neutral linen for kilim)
}

/** One weft pick (horizontal pass) */
export interface WeftPick {
  index: number;
  /** Which treadle is pressed for this pick */
  treadle: 1 | 2;
  color: RGB;
}

/** Threading array: warpEnd index → shaft number */
export type ThreadingArray = Array<1 | 2>;

/** Treadling array: weftPick index → treadle number */
export type TreadlingArray = Array<1 | 2>;

/** Tie-up matrix: shaft × treadle → boolean (true = shaft raised) */
export type TieUpMatrix = boolean[][];

/** Drawdown matrix: warpEnd × weftPick → boolean (true = weft on top) */
export type DrawdownMatrix = boolean[][];

/** Map of slit positions: key = "warp_i:weft_j" meaning left edge of cell (warp_i, weft_j) is a slit */
export type SlitMap = Set<string>;

/** Float warning: a run of consecutive cells where the same thread stays on top */
export interface FloatWarning {
  weftRow: number;
  startWarp: number;
  endWarp: number;
  isWeft: boolean; // true = weft float, false = warp float
}

/** The complete weaving draft produced by the weave engine */
export interface WeavingDraft {
  warpCount: number;
  weftCount: number;
  palette: RGB[];
  grid: PatternGrid;
  warpEnds: WarpEnd[];
  weftPicks: WeftPick[];
  threading: ThreadingArray;
  treadling: TreadlingArray;
  tieUp: TieUpMatrix;
  drawdown: DrawdownMatrix;
  slitMap: SlitMap;
  floatWarnings: FloatWarning[];
}

/** Settings from the UI */
export interface GridSettings {
  warpCount: number;
  weftCount: number;
  maxColors: number;
}
