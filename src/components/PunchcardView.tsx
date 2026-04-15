import React, { useMemo, useState } from 'react';
import type { WeavingDraft } from '../core/types';
import type { CardChain } from '../punchcard/types';
import { encodeDraftToCards } from '../punchcard/encoder';
import PunchcardControls, {
  PunchcardControlState,
} from './punchcard/PunchcardControls';
import PunchcardStats from './punchcard/PunchcardStats';
import PunchcardCanvas from './punchcard/PunchcardCanvas';
import PunchcardExportBar from './punchcard/PunchcardExportBar';
import { uiColors } from './ui/theme';

interface PunchcardViewProps {
  draft: WeavingDraft;
}

const DEFAULT_CONTROL_STATE: PunchcardControlState = {
  mode: 'jacquard',
  deduplicate: true,
  runLengthEncode: true,
  hollerithStyle: false,
};

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const historicalNoteStyle: React.CSSProperties = {
  fontSize: '11px',
  color: uiColors.textDim,
  fontStyle: 'italic',
  marginTop: '4px',
  maxWidth: '680px',
  lineHeight: 1.45,
};

const HISTORICAL_NOTE = `Each card = one weft pick. A punched hole commands its mechanism to engage:
in Jacquard mode a hole lifts one warp end; in dobby mode a hole raises one shaft. Identical
cards are reused and consecutive identical picks are chained -- the same trick that Jacquard
used in 1804 and that Hollerith re-applied to tabulate the 1890 US census. Babbage watched
this pipeline and designed the Analytical Engine around it.`;

/**
 * Panel that encodes the current WeavingDraft into a punchcard chain and
 * surfaces controls, stats, a preview canvas, and export buttons around it.
 *
 * All actual rendering, encoding, and export logic lives in dedicated
 * modules; this component just wires them together and owns the control
 * state.
 */
export default function PunchcardView({ draft }: PunchcardViewProps) {
  const [controls, setControls] = useState<PunchcardControlState>(DEFAULT_CONTROL_STATE);

  const chain: CardChain = useMemo(
    () =>
      encodeDraftToCards(draft, {
        mode: controls.mode,
        deduplicate: controls.deduplicate,
        runLengthEncode: controls.runLengthEncode,
      }),
    [draft, controls.mode, controls.deduplicate, controls.runLengthEncode],
  );

  return (
    <div style={containerStyle}>
      <PunchcardControls value={controls} onChange={setControls} />
      <PunchcardStats chain={chain} />
      <PunchcardCanvas chain={chain} hollerithStyle={controls.hollerithStyle} />
      <PunchcardExportBar chain={chain} hollerithStyle={controls.hollerithStyle} />
      <div style={historicalNoteStyle}>{HISTORICAL_NOTE}</div>
    </div>
  );
}
