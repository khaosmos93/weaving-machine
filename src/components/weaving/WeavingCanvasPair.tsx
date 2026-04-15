import React, { useEffect, useRef } from 'react';
import type { WeavingDraft } from '../../core/types';
import { renderCloth } from '../../renderer/clothRenderer';
import { renderDraft } from '../../renderer/draftRenderer';
import { uiColors } from '../ui/theme';

export type WeavingCanvasKind = 'cloth' | 'draft';

interface WeavingCanvasPairProps {
  draft: WeavingDraft;
  cellSize: number;
  zoom: number;
  visibleCanvas: WeavingCanvasKind;
  /** Parent-provided ref to the cloth canvas, so it can be used by exporters. */
  clothCanvasRef: React.RefObject<HTMLCanvasElement | null>;
}

const DRAFT_CELL_SCALE = 0.8;
const DRAFT_MIN_CELL_SIZE = 6;
const DRAFT_SECTION_GAP = 4;

const wrapperStyle: React.CSSProperties = {
  overflow: 'auto',
  border: `1px solid ${uiColors.border}`,
  borderRadius: '6px',
  background: uiColors.surface,
  padding: '4px',
  maxHeight: '500px',
};

const baseCanvasStyle: React.CSSProperties = {
  display: 'block',
  imageRendering: 'pixelated',
};

function canvasStyleForVisibility(
  isVisible: boolean,
  zoom: number,
): React.CSSProperties {
  return {
    ...baseCanvasStyle,
    display: isVisible ? 'block' : 'none',
    transform: `scale(${zoom})`,
    transformOrigin: 'top left',
  };
}

function draftCellSize(clothCellSize: number): number {
  return Math.max(DRAFT_MIN_CELL_SIZE, Math.round(clothCellSize * DRAFT_CELL_SCALE));
}

/**
 * Renders the two canvases (cloth simulation + weaving draft) in a shared
 * scroll container. Both are always mounted so switching tabs is instant;
 * only the active one is visible. The parent controls which tab is shown.
 */
export default function WeavingCanvasPair({
  draft,
  cellSize,
  zoom,
  visibleCanvas,
  clothCanvasRef,
}: WeavingCanvasPairProps) {
  const draftCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = clothCanvasRef.current;
    if (!canvas) return;
    renderCloth(canvas, draft, {
      cellSize,
      showSlits: true,
      showFloatWarnings: true,
    });
  }, [draft, cellSize]);

  useEffect(() => {
    const canvas = draftCanvasRef.current;
    if (!canvas) return;
    renderDraft(canvas, draft, {
      cellSize: draftCellSize(cellSize),
      gap: DRAFT_SECTION_GAP,
    });
  }, [draft, cellSize]);

  return (
    <div style={wrapperStyle}>
      <canvas
        ref={clothCanvasRef}
        style={canvasStyleForVisibility(visibleCanvas === 'cloth', zoom)}
      />
      <canvas
        ref={draftCanvasRef}
        style={canvasStyleForVisibility(visibleCanvas === 'draft', zoom)}
      />
    </div>
  );
}

