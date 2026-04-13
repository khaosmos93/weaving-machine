import React, { useCallback, useRef, useState } from 'react';

interface ImageUploadProps {
  onImageLoaded: (img: HTMLImageElement) => void;
}

const styles: Record<string, React.CSSProperties> = {
  zone: {
    border: '2px dashed #555',
    borderRadius: '8px',
    padding: '24px 16px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'border-color 0.2s, background 0.2s',
    background: '#242424',
    userSelect: 'none',
  },
  zoneHover: {
    border: '2px dashed #8ab4d4',
    background: '#2a3040',
  },
  input: {
    display: 'none',
  },
  icon: {
    fontSize: '32px',
    marginBottom: '8px',
    opacity: 0.7,
  },
  label: {
    color: '#aaa',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  hint: {
    color: '#666',
    fontSize: '11px',
    marginTop: '6px',
  },
};

export default function ImageUpload({ onImageLoaded }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const loadFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        onImageLoaded(img);
        URL.revokeObjectURL(url);
      };
      img.src = url;
    },
    [onImageLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) loadFile(file);
    },
    [loadFile]
  );

  return (
    <div
      style={dragging ? { ...styles.zone, ...styles.zoneHover } : styles.zone}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={styles.input}
        onChange={handleChange}
      />
      <div style={styles.icon}>🖼</div>
      <div style={styles.label}>
        Drop an image here, or click to browse
      </div>
      <div style={styles.hint}>PNG, JPG, or WebP — any size</div>
    </div>
  );
}
