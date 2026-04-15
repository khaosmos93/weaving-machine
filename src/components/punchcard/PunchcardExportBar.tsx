import React from 'react';
import type { CardChain } from '../../punchcard/types';
import { downloadString, toJSON, toSvg, toTextDeck } from '../../punchcard/exporters';
import { uiColors } from '../ui/theme';

interface PunchcardExportBarProps {
  chain: CardChain;
  hollerithStyle: boolean;
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  alignItems: 'center',
  flexWrap: 'wrap',
};

const primaryButtonStyle: React.CSSProperties = {
  background: uiColors.accentBlue,
  border: 'none',
  borderRadius: '4px',
  color: '#fff',
  cursor: 'pointer',
  fontSize: '12px',
  padding: '6px 12px',
};

const historicButtonStyle: React.CSSProperties = {
  ...primaryButtonStyle,
  background: uiColors.accentBrown,
};

const SVG_MIME = 'image/svg+xml';
const JSON_MIME = 'application/json';
const TEXT_MIME = 'text/plain';

function makeTimestampedFilename(prefix: string, extension: string): string {
  return `${prefix}-${Date.now()}.${extension}`;
}

function downloadSvg(chain: CardChain, hollerithStyle: boolean, cardsPerRow: number): void {
  const filename = makeTimestampedFilename(
    cardsPerRow === 1 ? 'punchcards' : 'punchcards-sheet',
    'svg',
  );
  downloadString(filename, toSvg(chain, { hollerithStyle, cardsPerRow }), SVG_MIME);
}

function downloadJson(chain: CardChain): void {
  downloadString(makeTimestampedFilename('punchcards', 'json'), toJSON(chain), JSON_MIME);
}

function downloadText(chain: CardChain): void {
  downloadString(makeTimestampedFilename('punchcards', 'txt'), toTextDeck(chain), TEXT_MIME);
}

/**
 * Row of download buttons for the various punchcard exports. Keeps all of the
 * filename/mime plumbing in one place so the view stays declarative.
 */
export default function PunchcardExportBar({ chain, hollerithStyle }: PunchcardExportBarProps) {
  return (
    <div style={rowStyle}>
      <button style={primaryButtonStyle} onClick={() => downloadSvg(chain, hollerithStyle, 1)}>
        Export SVG (single column)
      </button>
      <button style={primaryButtonStyle} onClick={() => downloadSvg(chain, hollerithStyle, 4)}>
        Export SVG sheet
      </button>
      <button style={historicButtonStyle} onClick={() => downloadJson(chain)}>
        Export JSON
      </button>
      <button style={historicButtonStyle} onClick={() => downloadText(chain)}>
        Export TXT deck
      </button>
    </div>
  );
}
