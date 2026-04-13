import React, { useCallback } from 'react';
import type { GridSettings as GridSettingsType } from '../core/types';

interface GridSettingsProps {
  settings: GridSettingsType;
  onChange: (settings: GridSettingsType) => void;
  disabled?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  label: {
    width: '90px',
    fontSize: '12px',
    color: '#aaa',
    flexShrink: 0,
  },
  input: {
    width: '64px',
    background: '#333',
    border: '1px solid #555',
    borderRadius: '4px',
    color: '#e8e0d4',
    padding: '4px 8px',
    fontSize: '13px',
  },
  rangeHint: {
    fontSize: '11px',
    color: '#666',
  },
};

const LIMITS = {
  warpCount: { min: 8, max: 200 },
  weftCount: { min: 8, max: 200 },
  maxColors: { min: 2, max: 8 },
};

export default function GridSettings({ settings, onChange, disabled = false }: GridSettingsProps) {
  const handleChange = useCallback(
    (key: keyof GridSettingsType, raw: string) => {
      const value = parseInt(raw, 10);
      if (isNaN(value)) return;
      const { min, max } = LIMITS[key];
      const clamped = Math.max(min, Math.min(max, value));
      onChange({ ...settings, [key]: clamped });
    },
    [settings, onChange]
  );

  return (
    <div style={styles.container}>
      <div style={styles.row}>
        <span style={styles.label}>Warp ends</span>
        <input
          type="number"
          style={styles.input}
          value={settings.warpCount}
          min={LIMITS.warpCount.min}
          max={LIMITS.warpCount.max}
          disabled={disabled}
          onChange={(e) => handleChange('warpCount', e.target.value)}
        />
        <span style={styles.rangeHint}>8–200</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Weft picks</span>
        <input
          type="number"
          style={styles.input}
          value={settings.weftCount}
          min={LIMITS.weftCount.min}
          max={LIMITS.weftCount.max}
          disabled={disabled}
          onChange={(e) => handleChange('weftCount', e.target.value)}
        />
        <span style={styles.rangeHint}>8–200</span>
      </div>

      <div style={styles.row}>
        <span style={styles.label}>Max colors</span>
        <input
          type="number"
          style={styles.input}
          value={settings.maxColors}
          min={LIMITS.maxColors.min}
          max={LIMITS.maxColors.max}
          disabled={disabled}
          onChange={(e) => handleChange('maxColors', e.target.value)}
        />
        <span style={styles.rangeHint}>2–8</span>
      </div>
    </div>
  );
}
