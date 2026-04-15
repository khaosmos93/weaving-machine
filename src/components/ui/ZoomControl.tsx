import React from 'react';
import { uiColors } from './theme';

interface ZoomControlProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  /** Allowed zoom levels; defaults to a sensible set for canvas viewing. */
  levels?: ReadonlyArray<number>;
}

const DEFAULT_ZOOM_LEVELS: ReadonlyArray<number> = [0.5, 1, 1.5, 2, 3];

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  fontSize: '12px',
  color: uiColors.textMuted,
};

const buttonBaseStyle: React.CSSProperties = {
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '11px',
  padding: '2px 8px',
};

function buttonStyleForLevel(isActive: boolean): React.CSSProperties {
  return {
    ...buttonBaseStyle,
    background: isActive ? uiColors.accentBlue : uiColors.borderSubtle,
    color: isActive ? '#fff' : uiColors.textSecondary,
  };
}

/**
 * Horizontal row of zoom-level buttons. Purely presentational — the parent
 * decides how to apply the zoom (CSS transform, canvas rescale, etc.).
 */
export default function ZoomControl({
  zoom,
  onZoomChange,
  levels = DEFAULT_ZOOM_LEVELS,
}: ZoomControlProps) {
  return (
    <div style={rowStyle}>
      <span>Zoom:</span>
      {levels.map((level) => (
        <button
          key={level}
          onClick={() => onZoomChange(level)}
          style={buttonStyleForLevel(zoom === level)}
        >
          {level}×
        </button>
      ))}
    </div>
  );
}
