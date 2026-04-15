/**
 * Punchcard data model.
 *
 * A single PunchCard represents ONE weft pick in the historical sense:
 * in a Jacquard loom (1804) each card controls which warp ends are lifted for
 * that pick; in a dobby loom each card (or "dobby bar") encodes which shafts
 * are raised for that pick.
 *
 * Hole semantics:
 *   true  = punched hole = mechanism engages (hook lifts warp / shaft raises)
 *   false = blank        = no lift
 *
 * This mirrors the Jacquard convention and, by extension, the Hollerith / IBM
 * tabulating machines that grew out of it (1890 US Census onward).
 */

/** Two physical card layouts we support: Jacquard-style and dobby-style. */
export type CardMode = 'jacquard' | 'dobby';

/** One physical card in the chain. */
export interface PunchCard {
  /**
   * Stable fingerprint id. Cards with identical hole patterns share the same
   * id, which lets the chain be compressed and reused physically.
   */
  id: number;
  /** Hook count (Jacquard: warp ends) or shaft count (dobby). */
  columns: number;
  /** length === columns. true = punched hole. */
  holes: boolean[];
  /** Original weft-row index this card was first generated from. */
  pickIndex: number;
  /** Human-readable CSS color string for the weft on this pick. */
  colorLabel?: string;
}

/** Run-length encoded entry in the card chain. */
export interface CardChainEntry {
  cardId: number;
  /** Number of consecutive picks that use this same card. */
  repeats: number;
}

/** Full woven card chain ready for physical lacing or digital export. */
export interface CardChain {
  mode: CardMode;
  /** Number of columns (holes) per card. */
  columns: number;
  /** Total number of weft picks covered by the chain. */
  totalPicks: number;
  /** Deduplicated deck of unique cards, indexed by their id. */
  uniqueCards: PunchCard[];
  /** Run-length encoded sequence of cards across all picks. */
  sequence: CardChainEntry[];
}

/** Options that control how a WeavingDraft is encoded into cards. */
export interface EncodeOptions {
  mode: CardMode;
  /**
   * If true, the encoder deduplicates identical cards so that one physical
   * card can be reused anywhere it appears. Echoes how Jacquard decks were
   * assembled in practice.
   */
  deduplicate: boolean;
  /**
   * If true, consecutive identical picks are compressed into a single entry
   * with repeats=N. Mirrors physical card lacing, where a repeat is achieved
   * by stitching the card into the chain multiple times.
   */
  runLengthEncode: boolean;
}

/** SVG export options, with a Hollerith-style layout mode. */
export interface SvgExportOptions {
  /** Hole radius in SVG units (for round holes). */
  holeRadius: number;
  /** Horizontal spacing between hole centers. */
  columnPitch: number;
  /** Vertical spacing between cards when laid out in a sheet. */
  cardSpacing: number;
  /** Margin around the whole sheet. */
  margin: number;
  /** If true, renders rectangular holes on IBM-buff stock, IBM-card style. */
  hollerithStyle: boolean;
  /** Cards per row when laid out as a sheet (1 = single column). */
  cardsPerRow: number;
}
