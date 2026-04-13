import React, { useEffect, useRef, useState } from 'react';
import type { WeavingDraft } from '../core/types';
import { renderCloth } from '../renderer/clothRenderer';
import { renderDraft } from '../renderer/draftRenderer';
import ExportButton from './ExportButton';

interface WeavingViewProps {
  draft: WeavingDraft;
  cellSize?: number;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  tabRow: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #444',
    paddingBottom: '0',
  },
  tab: {
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#888',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    padding: '6px 14px',
    marginBottom: '-1px',
    borderRadius: '0',
    transition: 'color 0.15s, border-color 0.15s',
  },
  tabActive: {
    color: '#e8d090',
    borderBottom: '2px solid #e8d090',
  },
  canvasWrap: {
    overflow: 'auto',
    border: '1px solid #444',
    borderRadius: '6px',
    background: '#1e1e1e',
    padding: '4px',
    maxHeight: '500px',
  },
  canvas: {
    display: 'block',
    imageRendering: 'pixelated',
  },
  statsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    fontSize: '11px',
    color: '#777',
  },
  stat: {
    background: '#2a2a2a',
    borderRadius: '4px',
    padding: '4px 10px',
  },
  statVal: {
    color: '#e8d090',
    fontWeight: 600,
    marginLeft: '4px',
  },
  zoomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '12px',
    color: '#888',
  },
  exportRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
};

type TabName = 'cloth' | 'draft';

export default function WeavingView({ draft, cellSize = 8 }: WeavingViewProps) {
  const clothCanvasRef = useRef<HTMLCanvasElement>(null);
  const draftCanvasRef = useRef<HTMLCanvasElement>(null);
  const [activeTab, setActiveTab] = useState<TabName>('cloth');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const canvas = clothCanvasRef.current;
    if (!canvas) return;
    renderCloth(canvas, draft, { cellSize, showSlits: true, showFloatWarnings: true });
  }, [draft, cellSize]);

  useEffect(() => {
    const canvas = draftCanvasRef.current;
    if (!canvas) return;
    renderDraft(canvas, draft, { cellSize: Math.max(6, Math.round(cellSize * 0.8)), gap: 4 });
  }, [draft, cellSize]);

  const floatCount = draft.floatWarnings.length;
  const slitCount = draft.slitMap.size;

  return (
    <div style={styles.container}>
      {/* Tab selector */}
      <div style={styles.tabRow}>
        <button
          style={activeTab === 'cloth' ? { ...styles.tab, ...styles.tabActive } : styles.tab}
          onClick={() => setActiveTab('cloth')}
        >
          Cloth Simulation
        </button>
        <button
          style={activeTab === 'draft' ? { ...styles.tab, ...styles.tabActive } : styles.tab}
          onClick={() => setActiveTab('draft')}
        >
          Weaving Draft
        </button>
      </div>

      {/* Zoom control */}
      <div style={styles.zoomRow}>
        <span>Zoom:</span>
        {[0.5, 1, 1.5, 2, 3].map((z) => (
          <button
            key={z}
            onClick={() => setZoom(z)}
            style={{
              background: zoom === z ? '#3a6ea8' : '#333',
              border: 'none',
              borderRadius: '4px',
              color: zoom === z ? '#fff' : '#aaa',
              cursor: 'pointer',
              fontSize: '11px',
              padding: '2px 8px',
            }}
          >
            {z}×
          </button>
        ))}
      </div>

      {/* Canvas display */}
      <div style={styles.canvasWrap}>
        <canvas
          ref={clothCanvasRef}
          style={{
            ...styles.canvas,
            display: activeTab === 'cloth' ? 'block' : 'none',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        />
        <canvas
          ref={draftCanvasRef}
          style={{
            ...styles.canvas,
            display: activeTab === 'draft' ? 'block' : 'none',
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
          }}
        />
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          Warp ends <span style={styles.statVal}>{draft.warpCount}</span>
        </div>
        <div style={styles.stat}>
          Weft picks <span style={styles.statVal}>{draft.weftCount}</span>
        </div>
        <div style={styles.stat}>
          Colors <span style={styles.statVal}>{draft.palette.length}</span>
        </div>
        <div style={styles.stat}>
          Slits <span style={styles.statVal}>{slitCount}</span>
        </div>
        <div style={{ ...styles.stat, color: floatCount > 0 ? '#e08060' : '#777' }}>
          Float warnings <span style={{ ...styles.statVal, color: floatCount > 0 ? '#e08060' : '#e8d090' }}>{floatCount}</span>
        </div>
      </div>

      {/* Palette swatches */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '11px', color: '#666' }}>Palette:</span>
        {draft.palette.map(([r, g, b], i) => (
          <div
            key={i}
            title={`Color ${i}: rgb(${r},${g},${b})`}
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '3px',
              background: `rgb(${r},${g},${b})`,
              border: '1px solid #555',
            }}
          />
        ))}
      </div>

      {/* Export */}
      <div style={styles.exportRow}>
        <ExportButton canvasRef={clothCanvasRef} />
      </div>
    </div>
  );
}
