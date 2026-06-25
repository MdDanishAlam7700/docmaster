'use client';

/**
 * SpreadsheetRenderer
 *
 * Renders a SpreadsheetModel as a pixel-accurate HTML table layout.
 * All dynamic values (colors, widths, borders, font sizes) use inline
 * styles.  Tailwind classes are used only for static structural utilities.
 *
 * Key fidelity features:
 *  - <colgroup> pins each column to its exact ExcelJS-derived pixel width
 *  - border-collapse: collapse — no double borders between adjacent cells
 *  - Merged cells use colspan/rowspan; occupied cells render nothing
 *  - Cell backgrounds, font styles, borders all come from the typed model
 */

import React from 'react';
import type { SpreadsheetModel, CellModel } from '@/lib/document-model';

// ── Cell style computation ─────────────────────────────────────────────────────

function toCellStyle(cell: CellModel, rowHeightPx?: number): React.CSSProperties {
  const td: React.CSSProperties = {
    // Dimensions
    width: cell.widthPx,
    minWidth: cell.widthPx,
    maxWidth: cell.widthPx,
    height: rowHeightPx ?? undefined,
    // Spacing
    padding: '3px 6px',
    boxSizing: 'border-box',
    overflow: 'hidden',
    // Text
    fontFamily: cell.fontFamily ? `${cell.fontFamily}, Arial, sans-serif` : 'Arial, sans-serif',
    fontSize: cell.fontSize ? `${cell.fontSize}pt` : '10pt',
    fontWeight: cell.bold ? 'bold' : 'normal',
    fontStyle: cell.italic ? 'italic' : 'normal',
    // Underline and strike can coexist
    textDecoration: [cell.underline && 'underline', cell.strike && 'line-through']
      .filter(Boolean).join(' ') || 'none',
    color: cell.color || '#000000',
    // Alignment
    textAlign: (cell.textAlign || 'left') as React.CSSProperties['textAlign'],
    verticalAlign: (cell.vertAlign || 'middle') as React.CSSProperties['verticalAlign'],
    whiteSpace: cell.wrapText ? 'normal' : 'nowrap',
    // Indent
    paddingLeft: cell.indentPx ? `${cell.indentPx + 6}px` : undefined,
  };

  // Background
  if (cell.bgColor) td.backgroundColor = cell.bgColor;

  // Borders — only add when the cell has an explicit border defined
  if (cell.borderTop) td.borderTop = cell.borderTop;
  if (cell.borderRight) td.borderRight = cell.borderRight;
  if (cell.borderBottom) td.borderBottom = cell.borderBottom;
  if (cell.borderLeft) td.borderLeft = cell.borderLeft;

  return td;
}

// ── Component ─────────────────────────────────────────────────────────────────

export interface SpreadsheetRendererProps {
  model: SpreadsheetModel;
  /** Padding around the entire render surface.  Default: 20 */
  padPx?: number;
}

export function SpreadsheetRenderer({ model, padPx = 20 }: SpreadsheetRendererProps) {
  return (
    <div
      style={{
        fontFamily: 'Arial, sans-serif',
        background: '#f8fafc',
        padding: padPx,
        display: 'inline-block',
        minWidth: Math.max(...model.sheets.map((s) => s.totalWidthPx)) + padPx * 2,
      }}
    >
      {model.sheets.map((sheet, si) => (
        <div key={si} style={{ marginBottom: si < model.sheets.length - 1 ? 32 : 0 }}>
          {/* Sheet tab label */}
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#334155',
              marginBottom: 6,
              fontFamily: 'Arial, sans-serif',
            }}
          >
            {sheet.name}
          </div>

          {/* Table */}
          <table
            style={{
              borderCollapse: 'collapse',
              tableLayout: 'fixed',
              width: sheet.totalWidthPx,
              background: '#ffffff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
              // Show gridlines when the sheet has them enabled
              outline: sheet.showGridlines ? '1px solid #cbd5e1' : 'none',
            }}
          >
            <colgroup>
              {sheet.colWidthsPx.map((w, ci) => (
                <col key={ci} style={{ width: w }} />
              ))}
            </colgroup>
            <tbody>
              {sheet.rows.map((row, ri) => {
                const rowH = sheet.rowHeightsPx[ri];
                return (
                  <tr key={ri} style={rowH ? { height: rowH } : undefined}>
                    {row.map((cell, ci) => {
                      // Occupied cells (covered by a rowspan/colspan) — skip
                      if (cell.isOccupied) return null;

                      // Use <th> for the first row to help with accessibility
                      const Tag = ri === 0 ? 'th' : 'td';

                      return (
                        <Tag
                          key={ci}
                          colSpan={cell.colspan > 1 ? cell.colspan : undefined}
                          rowSpan={cell.rowspan > 1 ? cell.rowspan : undefined}
                          style={{
                            ...toCellStyle(cell, rowH),
                            // Gridline fallback: add a light border even if no explicit border
                            border: sheet.showGridlines && !cell.borderTop
                              ? '1px solid #e2e8f0'
                              : undefined,
                          }}
                        >
                          {cell.value}
                        </Tag>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
