import React, { useCallback } from 'react';

interface ExportButtonProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  disabled?: boolean;
}

const styles: Record<string, React.CSSProperties> = {
  button: {
    background: '#3a6ea8',
    border: 'none',
    borderRadius: '6px',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    padding: '8px 18px',
    transition: 'background 0.15s',
    letterSpacing: '0.02em',
  },
  disabled: {
    background: '#3a3a3a',
    color: '#666',
    cursor: 'not-allowed',
  },
};

export default function ExportButton({ canvasRef, disabled = false }: ExportButtonProps) {
  const handleExport = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `kilim-cloth-${Date.now()}.png`;
    a.click();
  }, [canvasRef]);

  return (
    <button
      style={disabled ? { ...styles.button, ...styles.disabled } : styles.button}
      onClick={handleExport}
      disabled={disabled}
      title={disabled ? 'Generate a draft first' : 'Download cloth render as PNG'}
    >
      Download PNG
    </button>
  );
}
