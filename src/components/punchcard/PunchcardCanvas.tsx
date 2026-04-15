import React, { useEffect, useRef } from 'react';
import type { CardChain } from '../../punchcard/types';
import { renderCardChain } from '../../punchcard/cardRenderer';
import { uiColors } from '../ui/theme';

interface PunchcardCanvasProps {
  chain: CardChain;
  hollerithStyle: boolean;
}

const WIDE_CHAIN_THRESHOLD = 200;
const MEDIUM_CHAIN_THRESHOLD = 100;

const SMALL_CELL_SIZE = 3;
const MEDIUM_CELL_SIZE = 4;
const LARGE_CELL_SIZE = 6;

const wrapperStyle: React.CSSProperties = {
  overflow: 'auto',
  border: `1px solid ${uiColors.border}`,
  borderRadius: '6px',
  background: uiColors.surfaceSunken,
  padding: '4px',
  maxHeight: '540px',
};

const canvasStyle: React.CSSProperties = {
  display: 'block',
  imageRendering: 'pixelated',
};

/**
 * Chooses a cell size that keeps very wide card chains from overflowing the
 * viewport while still rendering small chains at a readable size.
 */
function pickCellSizeForColumns(columnCount: number): number {
  if (columnCount > WIDE_CHAIN_THRESHOLD) return SMALL_CELL_SIZE;
  if (columnCount > MEDIUM_CHAIN_THRESHOLD) return MEDIUM_CELL_SIZE;
  return LARGE_CELL_SIZE;
}

/** Scroll-wrapped canvas that renders the provided card chain. */
export default function PunchcardCanvas({ chain, hollerithStyle }: PunchcardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderCardChain(canvas, chain, {
      cellSize: pickCellSizeForColumns(chain.columns),
      gap: 1,
      highlightRepeats: true,
      hollerithStyle,
    });
  }, [chain, hollerithStyle]);

  return (
    <div style={wrapperStyle}>
      <canvas ref={canvasRef} style={canvasStyle} />
    </div>
  );
}
