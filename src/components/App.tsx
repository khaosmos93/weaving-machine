import React, { useState, useCallback, useEffect } from 'react';
import type { WeavingDraft, GridSettings as GridSettingsType } from '../core/types';
import { buildDemoGrid, imageToGrid } from '../core/imageToGrid';
import { buildWeavingDraft } from '../core/weaveEngine';
import ImageUpload from './ImageUpload';
import GridSettings from './GridSettings';
import WeavingView from './WeavingView';

const DEFAULT_SETTINGS: GridSettingsType = {
  warpCount: 60,
  weftCount: 80,
  maxColors: 6,
};

const styles: Record<string, React.CSSProperties> = {
  app: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: '#1a1a1a',
    color: '#e8e0d4',
  },
  header: {
    background: '#111',
    borderBottom: '1px solid #333',
    padding: '12px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#e8d090',
    letterSpacing: '0.04em',
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#666',
  },
  body: {
    display: 'flex',
    flex: 1,
    gap: '0',
    overflow: 'hidden',
  },
  sidebar: {
    width: '260px',
    flexShrink: 0,
    background: '#1e1e1e',
    borderRight: '1px solid #333',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    overflowY: 'auto',
  },
  sectionTitle: {
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: '10px',
  },
  main: {
    flex: 1,
    padding: '20px 24px',
    overflowY: 'auto',
  },
  generateBtn: {
    background: '#4a7a40',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 700,
    padding: '9px 20px',
    width: '100%',
    letterSpacing: '0.03em',
    transition: 'background 0.15s',
  },
  statusBadge: {
    fontSize: '11px',
    borderRadius: '4px',
    padding: '4px 10px',
    background: '#2a2a2a',
    color: '#aaa',
    display: 'inline-block',
  },
  demoNote: {
    fontSize: '11px',
    color: '#666',
    fontStyle: 'italic',
    marginTop: '6px',
  },
  imagePreview: {
    width: '100%',
    borderRadius: '4px',
    border: '1px solid #444',
    marginTop: '8px',
    maxHeight: '120px',
    objectFit: 'cover',
  },
};

export default function App() {
  const [settings, setSettings] = useState<GridSettingsType>(DEFAULT_SETTINGS);
  const [uploadedImage, setUploadedImage] = useState<HTMLImageElement | null>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);
  const [draft, setDraft] = useState<WeavingDraft | null>(null);
  const [isDemo, setIsDemo] = useState(true);
  const [status, setStatus] = useState<string>('Demo pattern loaded');

  // Build demo draft on first render
  useEffect(() => {
    const gridData = buildDemoGrid(DEFAULT_SETTINGS.warpCount, DEFAULT_SETTINGS.weftCount);
    const d = buildWeavingDraft(gridData);
    setDraft(d);
    setStatus('Demo pattern — upload an image to use your own');
  }, []);

  const handleImageLoaded = useCallback((img: HTMLImageElement) => {
    setUploadedImage(img);
    setUploadedImageSrc(img.src);
    setIsDemo(false);
    setStatus('Image loaded — click Generate to weave');
  }, []);

  const handleGenerate = useCallback(() => {
    try {
      setStatus('Processing…');
      let gridData;
      if (uploadedImage) {
        gridData = imageToGrid(uploadedImage, settings.warpCount, settings.weftCount, settings.maxColors);
      } else {
        gridData = buildDemoGrid(settings.warpCount, settings.weftCount);
        setIsDemo(true);
      }
      const d = buildWeavingDraft(gridData);
      setDraft(d);
      setStatus(
        isDemo
          ? 'Demo pattern generated'
          : `Woven from image — ${d.warpCount}×${d.weftCount}, ${d.palette.length} colors`
      );
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [uploadedImage, settings, isDemo]);

  const handleSettingsChange = useCallback((s: GridSettingsType) => {
    setSettings(s);
  }, []);

  return (
    <div style={styles.app}>
      {/* Header */}
      <header style={styles.header}>
        <div>
          <div style={styles.headerTitle}>Kilim Weaving Machine</div>
          <div style={styles.headerSubtitle}>Virtual flat-weave cloth simulator</div>
        </div>
      </header>

      <div style={styles.body}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          {/* Image upload */}
          <div>
            <div style={styles.sectionTitle}>Source Image</div>
            <ImageUpload onImageLoaded={handleImageLoaded} />
            {uploadedImageSrc && (
              <img src={uploadedImageSrc} alt="Uploaded" style={styles.imagePreview} />
            )}
            {isDemo && (
              <div style={styles.demoNote}>Using built-in demo pattern</div>
            )}
          </div>

          {/* Grid settings */}
          <div>
            <div style={styles.sectionTitle}>Grid Settings</div>
            <GridSettings settings={settings} onChange={handleSettingsChange} />
          </div>

          {/* Generate */}
          <div>
            <button style={styles.generateBtn} onClick={handleGenerate}>
              Weave
            </button>
            <div style={{ marginTop: '8px' }}>
              <span style={styles.statusBadge}>{status}</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={styles.main}>
          {draft ? (
            <WeavingView draft={draft} cellSize={8} />
          ) : (
            <div style={{ color: '#555', marginTop: '40px', textAlign: 'center' }}>
              Click <strong>Weave</strong> to generate the cloth simulation.
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
