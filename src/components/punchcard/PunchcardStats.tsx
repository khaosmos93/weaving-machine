import type { CardChain } from '../../punchcard/types';
import StatBadge, { statsRowStyle } from '../ui/StatBadge';

interface PunchcardStatsProps {
  chain: CardChain;
}

function calculateDeckSavingsPercent(chain: CardChain): string {
  if (chain.totalPicks === 0) return '0.0';
  const savings = 1 - chain.uniqueCards.length / chain.totalPicks;
  return (savings * 100).toFixed(1);
}

/** Stat-badge row summarizing a CardChain's size and compression ratios. */
export default function PunchcardStats({ chain }: PunchcardStatsProps) {
  const deckSavings = calculateDeckSavingsPercent(chain);
  return (
    <div style={statsRowStyle}>
      <StatBadge label="Total picks" value={chain.totalPicks} />
      <StatBadge label="Columns / card" value={chain.columns} />
      <StatBadge label="Unique cards" value={chain.uniqueCards.length} />
      <StatBadge label="Chain entries (RLE)" value={chain.sequence.length} />
      <StatBadge label="Deck savings" value={`${deckSavings}%`} />
    </div>
  );
}
