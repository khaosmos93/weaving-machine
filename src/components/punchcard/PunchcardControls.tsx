import React from 'react';
import type { CardMode } from '../../punchcard/types';
import { uiColors } from '../ui/theme';

export interface PunchcardControlState {
  mode: CardMode;
  deduplicate: boolean;
  runLengthEncode: boolean;
  hollerithStyle: boolean;
}

interface PunchcardControlsProps {
  value: PunchcardControlState;
  onChange: (next: PunchcardControlState) => void;
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  color: uiColors.textMuted,
  letterSpacing: '0.04em',
};

const selectStyle: React.CSSProperties = {
  background: uiColors.surfaceRaised,
  border: `1px solid ${uiColors.border}`,
  color: uiColors.textPrimary,
  borderRadius: '4px',
  padding: '4px 8px',
  fontSize: '12px',
};

const checkboxLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: uiColors.textSecondary,
  display: 'flex',
  gap: '4px',
  alignItems: 'center',
};

/**
 * Top-of-PunchcardView control bar: mode selector + boolean encode/style
 * toggles. Pure presentational component — all state lives in the parent.
 */
export default function PunchcardControls({ value, onChange }: PunchcardControlsProps) {
  const update = <K extends keyof PunchcardControlState>(
    key: K,
    next: PunchcardControlState[K],
  ) => onChange({ ...value, [key]: next });

  return (
    <div style={rowStyle}>
      <span style={labelStyle}>Mode</span>
      <select
        style={selectStyle}
        value={value.mode}
        onChange={(e) => update('mode', e.target.value as CardMode)}
      >
        <option value="jacquard">Jacquard (one hook per warp end)</option>
        <option value="dobby">Dobby (one hook per shaft)</option>
      </select>

      <CheckboxOption
        label="Deduplicate cards"
        checked={value.deduplicate}
        onChange={(next) => update('deduplicate', next)}
      />
      <CheckboxOption
        label="Run-length chain"
        checked={value.runLengthEncode}
        onChange={(next) => update('runLengthEncode', next)}
      />
      <CheckboxOption
        label="Hollerith (IBM) style"
        checked={value.hollerithStyle}
        onChange={(next) => update('hollerithStyle', next)}
      />
    </div>
  );
}

interface CheckboxOptionProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function CheckboxOption({ label, checked, onChange }: CheckboxOptionProps) {
  return (
    <label style={checkboxLabelStyle}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
