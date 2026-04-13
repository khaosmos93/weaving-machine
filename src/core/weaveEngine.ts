import type {
  RGB,
  Cell,
  PatternGrid,
  WarpEnd,
  WeftPick,
  ThreadingArray,
  TreadlingArray,
  TieUpMatrix,
  DrawdownMatrix,
  SlitMap,
  FloatWarning,
  WeavingDraft,
} from './types';
import type { GridData } from './imageToGrid';

/** Neutral linen warp color used for kilim-style weaving */
const WARP_COLOR: RGB = [212, 184, 150];

/** Maximum consecutive cells before a float warning is raised */
const FLOAT_THRESHOLD = 3;

/**
 * Plain-weave rule: at cell (warpCol, weftRow),
 * weft is on top when (warpCol + weftRow) is even.
 */
function isWeftOnTop(warpCol: number, weftRow: number): boolean {
  return (warpCol + weftRow) % 2 === 0;
}

/**
 * Build the threading array for plain weave:
 * warp ends alternate between shaft 1 and shaft 2.
 */
function buildThreading(warpCount: number): ThreadingArray {
  const threading: ThreadingArray = [];
  for (let i = 0; i < warpCount; i++) {
    threading.push(i % 2 === 0 ? 1 : 2);
  }
  return threading;
}

/**
 * Build the treadling array for plain weave:
 * weft picks alternate between treadle 1 and treadle 2.
 */
function buildTreadling(weftCount: number): TreadlingArray {
  const treadling: TreadlingArray = [];
  for (let j = 0; j < weftCount; j++) {
    treadling.push(j % 2 === 0 ? 1 : 2);
  }
  return treadling;
}

/**
 * Plain-weave tie-up for 2 shafts × 2 treadles:
 *   treadle 1 raises shaft 1
 *   treadle 2 raises shaft 2
 * tieUp[shaft-1][treadle-1] = true means shaft is raised by that treadle
 */
function buildTieUp(): TieUpMatrix {
  return [
    [true, false],  // shaft 1: raised by treadle 1 only
    [false, true],  // shaft 2: raised by treadle 2 only
  ];
}

/**
 * Detect slit boundaries.
 *
 * A vertical slit at column boundary between warp col `c` and col `c+1`
 * on weft row `j` occurs when:
 *  - The color at (j, c) differs from (j, c+1)
 *  - The weft in each region turns around at its own last warp end,
 *    which in a kilim means both sides use their own weft shuttle.
 *
 * In practice: a slit exists wherever adjacent cells in the same weft row
 * have different colors — because kilim wefts turn around at color boundaries.
 *
 * We record the position as the LEFT edge of the right-hand cell: (warpCol=c+1, weftRow=j).
 */
function detectSlits(colorIndices: number[][], warpCount: number, weftCount: number): SlitMap {
  const slitMap: SlitMap = new Set();
  for (let j = 0; j < weftCount; j++) {
    for (let c = 0; c + 1 < warpCount; c++) {
      if (colorIndices[j][c] !== colorIndices[j][c + 1]) {
        slitMap.add(`${c + 1}:${j}`);
      }
    }
  }
  return slitMap;
}

/**
 * Detect float warnings.
 *
 * For each weft row, scan across all warp columns tracking runs where the
 * same thread type (weft or warp) is on top consecutively.
 * If a run exceeds FLOAT_THRESHOLD, record it.
 */
function detectFloats(grid: PatternGrid, warpCount: number, weftCount: number): FloatWarning[] {
  const warnings: FloatWarning[] = [];

  for (let j = 0; j < weftCount; j++) {
    let runStart = 0;
    let runIsWeft = grid[j][0].weftOnTop;
    let runLen = 1;

    for (let i = 1; i < warpCount; i++) {
      const cellIsWeft = grid[j][i].weftOnTop;
      if (cellIsWeft === runIsWeft) {
        runLen++;
      } else {
        if (runLen > FLOAT_THRESHOLD) {
          warnings.push({
            weftRow: j,
            startWarp: runStart,
            endWarp: i - 1,
            isWeft: runIsWeft,
          });
        }
        runStart = i;
        runIsWeft = cellIsWeft;
        runLen = 1;
      }
    }
    // Check the last run
    if (runLen > FLOAT_THRESHOLD) {
      warnings.push({
        weftRow: j,
        startWarp: runStart,
        endWarp: warpCount - 1,
        isWeft: runIsWeft,
      });
    }
  }

  return warnings;
}

/**
 * Main weave engine: takes a GridData and produces a full WeavingDraft.
 */
export function buildWeavingDraft(gridData: GridData): WeavingDraft {
  const { palette, colorIndices, warpCount, weftCount } = gridData;

  // 1. Build threading and treadling
  const threading = buildThreading(warpCount);
  const treadling = buildTreadling(weftCount);
  const tieUp = buildTieUp();

  // 2. Build warp ends (all same neutral linen color for kilim)
  const warpEnds: WarpEnd[] = threading.map((shaft, i) => ({
    index: i,
    shaft,
    color: WARP_COLOR,
  }));

  // 3. Build weft picks (color from dominant color in that weft row)
  const weftPicks: WeftPick[] = treadling.map((treadle, j) => {
    // Use the first color in the row as the pick color (simplified)
    const colorIdx = colorIndices[j][0];
    return {
      index: j,
      treadle,
      color: palette[colorIdx] ?? WARP_COLOR,
    };
  });

  // 4. Build drawdown matrix: [warpCol][weftRow] = weftOnTop
  // Plain weave: weft is on top when (warpCol + weftRow) is even
  const drawdown: DrawdownMatrix = [];
  for (let i = 0; i < warpCount; i++) {
    const col: boolean[] = [];
    for (let j = 0; j < weftCount; j++) {
      col.push(isWeftOnTop(i, j));
    }
    drawdown.push(col);
  }

  // 5. Detect slits
  const slitMap = detectSlits(colorIndices, warpCount, weftCount);

  // 6. Build the grid (weft-row major: grid[j][i])
  const grid: PatternGrid = [];
  for (let j = 0; j < weftCount; j++) {
    const row: Cell[] = [];
    for (let i = 0; i < warpCount; i++) {
      const weftOnTop = isWeftOnTop(i, j);
      const slitLeft = slitMap.has(`${i}:${j}`);
      row.push({
        colorIndex: colorIndices[j][i],
        weftOnTop,
        slitLeft,
        floatWarning: false, // filled in after float detection
      });
    }
    grid.push(row);
  }

  // 7. Detect floats and mark cells
  const floatWarnings = detectFloats(grid, warpCount, weftCount);
  for (const fw of floatWarnings) {
    for (let i = fw.startWarp; i <= fw.endWarp; i++) {
      grid[fw.weftRow][i].floatWarning = true;
    }
  }

  return {
    warpCount,
    weftCount,
    palette,
    grid,
    warpEnds,
    weftPicks,
    threading,
    treadling,
    tieUp,
    drawdown,
    slitMap,
    floatWarnings,
  };
}
