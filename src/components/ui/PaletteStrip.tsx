import React from 'react';
import type { RGB } from '../../core/types';
import { uiColors } from './theme';

interface PaletteStripProps {
  palette: RGB[];
}

const containerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: uiColors.textDim,
};

const swatchStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  borderRadius: '3px',
  border: '1px solid #555',
};

function rgbToCss([r, g, b]: RGB): string {
  return `rgb(${r},${g},${b})`;
}

/** Horizontal strip of color swatches for the draft's palette. */
export default function PaletteStrip({ palette }: PaletteStripProps) {
  return (
    <div style={containerStyle}>
      <span style={labelStyle}>Palette:</span>
      {palette.map((color, index) => (
        <div
          key={index}
          title={`Color ${index}: ${rgbToCss(color)}`}
          style={{ ...swatchStyle, background: rgbToCss(color) }}
        />
      ))}
    </div>
  );
}
