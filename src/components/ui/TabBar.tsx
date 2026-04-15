import React from 'react';
import { uiColors } from './theme';

export interface TabDefinition<TabId extends string> {
  id: TabId;
  label: string;
}

interface TabBarProps<TabId extends string> {
  tabs: ReadonlyArray<TabDefinition<TabId>>;
  activeTabId: TabId;
  onTabChange: (tabId: TabId) => void;
}

const tabRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  borderBottom: `1px solid ${uiColors.border}`,
};

const tabButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  borderBottom: '2px solid transparent',
  color: uiColors.textMuted,
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: 500,
  padding: '6px 14px',
  marginBottom: '-1px',
  transition: 'color 0.15s, border-color 0.15s',
};

const activeTabButtonStyle: React.CSSProperties = {
  color: uiColors.accentGold,
  borderBottom: `2px solid ${uiColors.accentGold}`,
};

/**
 * Generic top-of-view tab selector. Kept generic over a string-literal union
 * so call sites get exhaustive type-checking on their tab ids.
 */
export default function TabBar<TabId extends string>({
  tabs,
  activeTabId,
  onTabChange,
}: TabBarProps<TabId>) {
  return (
    <div style={tabRowStyle}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        const style = isActive ? { ...tabButtonStyle, ...activeTabButtonStyle } : tabButtonStyle;
        return (
          <button key={tab.id} style={style} onClick={() => onTabChange(tab.id)}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
