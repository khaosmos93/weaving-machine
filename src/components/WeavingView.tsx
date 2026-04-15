import React, { useRef, useState } from 'react';
import type { WeavingDraft } from '../core/types';
import ExportButton from './ExportButton';
import PunchcardView from './PunchcardView';
import TabBar, { TabDefinition } from './ui/TabBar';
import ZoomControl from './ui/ZoomControl';
import PaletteStrip from './ui/PaletteStrip';
import WeavingCanvasPair, { WeavingCanvasKind } from './weaving/WeavingCanvasPair';
import WeavingStats from './weaving/WeavingStats';

interface WeavingViewProps {
  draft: WeavingDraft;
  cellSize?: number;
}

type WeavingTabId = WeavingCanvasKind | 'punchcards';

const DEFAULT_CELL_SIZE = 8;

const WEAVING_TABS: ReadonlyArray<TabDefinition<WeavingTabId>> = [
  { id: 'cloth', label: 'Cloth Simulation' },
  { id: 'draft', label: 'Weaving Draft' },
  { id: 'punchcards', label: 'Punchcards' },
];

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
};

const exportRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
};

function isCanvasTab(tabId: WeavingTabId): tabId is WeavingCanvasKind {
  return tabId === 'cloth' || tabId === 'draft';
}

/**
 * Top-level view for a generated WeavingDraft. Owns:
 *   - The active tab (cloth, draft, punchcards)
 *   - The zoom level for the two canvas tabs
 *   - The cloth canvas ref, so the PNG exporter can snapshot it
 *
 * Delegates rendering of each section to dedicated presentational components.
 */
export default function WeavingView({ draft, cellSize = DEFAULT_CELL_SIZE }: WeavingViewProps) {
  const [activeTabId, setActiveTabId] = useState<WeavingTabId>('cloth');
  const [zoom, setZoom] = useState(1);
  const clothCanvasRef = useRef<HTMLCanvasElement>(null);

  return (
    <div style={containerStyle}>
      <TabBar tabs={WEAVING_TABS} activeTabId={activeTabId} onTabChange={setActiveTabId} />

      {isCanvasTab(activeTabId) && (
        <>
          <ZoomControl zoom={zoom} onZoomChange={setZoom} />
          <WeavingCanvasPair
            draft={draft}
            cellSize={cellSize}
            zoom={zoom}
            visibleCanvas={activeTabId}
            clothCanvasRef={clothCanvasRef}
          />
        </>
      )}

      {activeTabId === 'punchcards' && <PunchcardView draft={draft} />}

      <WeavingStats draft={draft} />
      <PaletteStrip palette={draft.palette} />

      <div style={exportRowStyle}>
        <ExportButton canvasRef={clothCanvasRef} />
      </div>
    </div>
  );
}
