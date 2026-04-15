import type { WeavingDraft } from '../../core/types';
import StatBadge, { statsRowStyle } from '../ui/StatBadge';

interface WeavingStatsProps {
  draft: WeavingDraft;
}

/** Stat-badge row summarizing a WeavingDraft's structural counts. */
export default function WeavingStats({ draft }: WeavingStatsProps) {
  const floatWarningCount = draft.floatWarnings.length;
  const slitCount = draft.slitMap.size;
  const hasFloats = floatWarningCount > 0;

  return (
    <div style={statsRowStyle}>
      <StatBadge label="Warp ends" value={draft.warpCount} />
      <StatBadge label="Weft picks" value={draft.weftCount} />
      <StatBadge label="Colors" value={draft.palette.length} />
      <StatBadge label="Slits" value={slitCount} />
      <StatBadge
        label="Float warnings"
        value={floatWarningCount}
        tone={hasFloats ? 'warning' : 'default'}
      />
    </div>
  );
}
