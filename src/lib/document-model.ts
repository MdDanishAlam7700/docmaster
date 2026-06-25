/**
 * Typed data models that bridge file parsers (ExcelJS, mammoth) to
 * React renderer components.  No HTML strings — pure data.
 */

// ── Spreadsheet (Excel) ───────────────────────────────────────────────────────

export interface CellModel {
  /** Formatted display value */
  value: string;
  colspan: number;
  rowspan: number;
  /** True when this cell position is covered by a spanning neighbour */
  isOccupied: boolean;

  // ── Font ──────────────────────────────────────────────────────────────────
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  /** pt */
  fontSize: number;
  fontFamily: string;
  /** Hex string #rrggbb or empty */
  color: string;

  // ── Background ────────────────────────────────────────────────────────────
  bgColor: string;

  // ── Alignment ─────────────────────────────────────────────────────────────
  textAlign: 'left' | 'center' | 'right' | 'justify' | '';
  vertAlign: 'top' | 'middle' | 'bottom' | '';
  wrapText: boolean;
  /** Extra left padding in px (Excel indent) */
  indentPx: number;

  // ── Borders (CSS shorthand, e.g. "1px solid #ccc") ───────────────────────
  borderTop: string;
  borderRight: string;
  borderBottom: string;
  borderLeft: string;

  // ── Dimensions ────────────────────────────────────────────────────────────
  widthPx: number;
}

export interface SheetModel {
  name: string;
  /** rows[rowIndex][colIndex] */
  rows: CellModel[][];
  colWidthsPx: number[];
  /** Per-row heights; undefined means use natural height */
  rowHeightsPx: (number | undefined)[];
  totalWidthPx: number;
  showGridlines: boolean;
}

export interface SpreadsheetModel {
  sheets: SheetModel[];
  filename: string;
}

// ── Document (Word) ───────────────────────────────────────────────────────────

/** An inline styled text segment within a paragraph */
export interface RunModel {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  /** Hex or empty */
  color: string;
  /** pt; 0 = inherit */
  fontSize: number;
  fontFamily: string;
}

export type BlockType =
  | 'p'
  | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
  | 'table'
  | 'ul' | 'ol' | 'li'
  | 'img'
  | 'hr'
  | 'pre';

export interface BlockModel {
  type: BlockType;
  /** Text runs for paragraph/heading/list-item */
  runs?: RunModel[];
  /** Nested blocks (list items, etc.) */
  children?: BlockModel[];
  /** Table data: rows of cell arrays */
  rows?: Array<Array<{ text: string; colSpan?: number; rowSpan?: number; isHeader?: boolean }>>;
  /** Image src (data URL or URL) */
  src?: string;
  alt?: string;
  textAlign?: string;
}

export interface DocumentModel {
  blocks: BlockModel[];
  filename: string;
}
