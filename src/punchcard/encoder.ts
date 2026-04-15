/**
 * WeavingDraft -> CardChain encoder.
 *
 * Modes:
 *
 *   'jacquard'  One card per weft pick. Each card has one column per warp end
 *               (= one hook in a Jacquard head). A hole lifts that warp end on
 *               this pick. Columns are read directly from the drawdown.
 *
 *   'dobby'     One card per weft pick, but each card has one column per
 *               shaft. A hole raises that shaft on this pick. Derived from
 *               treadling + tie-up: shaftRaised[s] = tieUp[s][treadling[pick]-1].
 *
 * After per-pick card generation, two optional compression steps run:
 *   1. Deduplicate identical cards into a shared unique-card deck.
 *   2. Run-length encode consecutive identical cards into the chain.
 */

import type { WeavingDraft } from '../core/types';
import type {
  CardChain,
  CardChainEntry,
  CardMode,
  EncodeOptions,
  PunchCard,
} from './types';

const DEFAULT_ENCODE_OPTIONS: EncodeOptions = {
  mode: 'jacquard',
  deduplicate: true,
  runLengthEncode: true,
};

/* ------------------------ Per-pick hole construction ---------------------- */

/**
 * In a Jacquard head a hole means "lift this warp end". In our drawdown,
 * weftOnTop === true means the weft is showing -- i.e. the warp is DOWN.
 * A hole therefore punches when the warp needs to be raised above the weft:
 *   hole = !weftOnTop  (equivalently, warpOnTop)
 */
function buildJacquardHoles(draft: WeavingDraft, pick: number): boolean[] {
  const holes = new Array<boolean>(draft.warpCount);
  for (let warpCol = 0; warpCol < draft.warpCount; warpCol++) {
    holes[warpCol] = !draft.drawdown[warpCol][pick];
  }
  return holes;
}

/** Dobby: one hole per shaft, driven by the tie-up for this pick's treadle. */
function buildDobbyHoles(draft: WeavingDraft, pick: number): boolean[] {
  const shaftCount = draft.tieUp.length;
  const treadle = draft.treadling[pick]; // 1-indexed
  const holes = new Array<boolean>(shaftCount);
  for (let shaft = 0; shaft < shaftCount; shaft++) {
    holes[shaft] = !!draft.tieUp[shaft][treadle - 1];
  }
  return holes;
}

function buildHolesForPick(draft: WeavingDraft, pick: number, mode: CardMode): boolean[] {
  return mode === 'jacquard'
    ? buildJacquardHoles(draft, pick)
    : buildDobbyHoles(draft, pick);
}

function columnCountForMode(draft: WeavingDraft, mode: CardMode): number {
  return mode === 'jacquard' ? draft.warpCount : draft.tieUp.length;
}

/** CSS color string for the weft on this pick (used as a human label). */
function buildColorLabel(draft: WeavingDraft, pick: number): string {
  const [r, g, b] = draft.weftPicks[pick].color;
  return `rgb(${r},${g},${b})`;
}

/* ------------------------ Fingerprint / deduplication --------------------- */

/** Compact string fingerprint of a hole pattern, used as a Map key. */
function fingerprintHoles(holes: boolean[]): string {
  let out = '';
  let accumulator = 0;
  let bitsInAccumulator = 0;
  for (let i = 0; i < holes.length; i++) {
    accumulator = (accumulator << 1) | (holes[i] ? 1 : 0);
    bitsInAccumulator++;
    if (bitsInAccumulator === 4) {
      out += accumulator.toString(16);
      accumulator = 0;
      bitsInAccumulator = 0;
    }
  }
  if (bitsInAccumulator > 0) {
    out += (accumulator << (4 - bitsInAccumulator)).toString(16);
  }
  return out;
}

interface CardAssignment {
  uniqueCards: PunchCard[];
  perPickCardId: number[];
}

/**
 * Walks all picks in order, producing a unique-card deck and a per-pick id
 * mapping. When deduplicate=false, every pick gets its own unique card.
 */
function assignCardIds(
  draft: WeavingDraft,
  mode: CardMode,
  deduplicate: boolean,
): CardAssignment {
  const columns = columnCountForMode(draft, mode);
  const fingerprintToId = new Map<string, number>();
  const uniqueCards: PunchCard[] = [];
  const perPickCardId: number[] = [];

  for (let pick = 0; pick < draft.weftCount; pick++) {
    const holes = buildHolesForPick(draft, pick, mode);
    const id = deduplicate
      ? resolveExistingOrRegister(holes, fingerprintToId, uniqueCards, {
          columns,
          pickIndex: pick,
          colorLabel: buildColorLabel(draft, pick),
        })
      : registerNewCard(holes, uniqueCards, {
          columns,
          pickIndex: pick,
          colorLabel: buildColorLabel(draft, pick),
        });
    perPickCardId.push(id);
  }

  return { uniqueCards, perPickCardId };
}

interface CardMetadata {
  columns: number;
  pickIndex: number;
  colorLabel: string;
}

function registerNewCard(
  holes: boolean[],
  uniqueCards: PunchCard[],
  meta: CardMetadata,
): number {
  const id = uniqueCards.length;
  uniqueCards.push({ id, holes, ...meta });
  return id;
}

function resolveExistingOrRegister(
  holes: boolean[],
  fingerprintToId: Map<string, number>,
  uniqueCards: PunchCard[],
  meta: CardMetadata,
): number {
  const fp = fingerprintHoles(holes);
  const existingId = fingerprintToId.get(fp);
  if (existingId !== undefined) return existingId;
  const newId = registerNewCard(holes, uniqueCards, meta);
  fingerprintToId.set(fp, newId);
  return newId;
}

/* --------------------------- Run-length encoding -------------------------- */

function runLengthEncodeIds(ids: number[]): CardChainEntry[] {
  const sequence: CardChainEntry[] = [];
  for (const id of ids) {
    const last = sequence[sequence.length - 1];
    if (last && last.cardId === id) {
      last.repeats++;
    } else {
      sequence.push({ cardId: id, repeats: 1 });
    }
  }
  return sequence;
}

function oneEntryPerId(ids: number[]): CardChainEntry[] {
  return ids.map((cardId) => ({ cardId, repeats: 1 }));
}

/* ------------------------------- Public API ------------------------------- */

export function encodeDraftToCards(
  draft: WeavingDraft,
  opts: Partial<EncodeOptions> = {},
): CardChain {
  const options: EncodeOptions = { ...DEFAULT_ENCODE_OPTIONS, ...opts };
  const { uniqueCards, perPickCardId } = assignCardIds(
    draft,
    options.mode,
    options.deduplicate,
  );
  const sequence = options.runLengthEncode
    ? runLengthEncodeIds(perPickCardId)
    : oneEntryPerId(perPickCardId);

  return {
    mode: options.mode,
    columns: columnCountForMode(draft, options.mode),
    totalPicks: draft.weftCount,
    uniqueCards,
    sequence,
  };
}

/** Expand a run-length chain back into a flat array of card ids, one per pick. */
export function expandChain(chain: CardChain): number[] {
  const flat: number[] = [];
  for (const entry of chain.sequence) {
    for (let k = 0; k < entry.repeats; k++) flat.push(entry.cardId);
  }
  return flat;
}
