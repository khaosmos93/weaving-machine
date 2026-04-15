import React from 'react';
import { uiColors } from './theme';

interface StatBadgeProps {
  label: string;
  value: React.ReactNode;
  /** Optional override for both label and value color (e.g. warning state). */
  tone?: 'default' | 'warning';
}

const baseStyle: React.CSSProperties = {
  background: uiColors.surfaceRaised,
  borderRadius: '4px',
  padding: '4px 10px',
};

const valueStyle: React.CSSProperties = {
  fontWeight: 600,
  marginLeft: '4px',
};

/**
 * Small pill badge used across the UI to surface a labelled numeric stat,
 * e.g. "Warp ends 120" or "Unique cards 42".
 */
export default function StatBadge({ label, value, tone = 'default' }: StatBadgeProps) {
  const labelColor = tone === 'warning' ? uiColors.warning : undefined;
  const valueColor = tone === 'warning' ? uiColors.warning : uiColors.accentGold;
  return (
    <div style={{ ...baseStyle, color: labelColor }}>
      {label} <span style={{ ...valueStyle, color: valueColor }}>{value}</span>
    </div>
  );
}

export const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '12px',
  fontSize: '11px',
  color: uiColors.textDim,
};
