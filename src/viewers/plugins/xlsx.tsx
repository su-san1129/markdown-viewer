import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { readXlsx } from "../../lib/tauri";
import type { XlsxCellStyle, XlsxData } from "../../types";
import {
  borderStyleToCss,
  cellAddress,
  charWidthToPx,
  columnIndexToLetter,
  isNumericValue,
  ptToPx
} from "../xlsxUtils";
import type { ViewerPlugin } from "../types";

const INITIAL_VISIBLE_ROWS = 1000;

function XlsxViewer({
  filePath,
  contentRef
}: {
  filePath: string;
  contentRef: RefObject<HTMLDivElement | null>;
}) {
  const [data, setData] = useState<XlsxData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);
  const [visibleRows, setVisibleRows] = useState(INITIAL_VISIBLE_ROWS);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; } | null>(null);
  const [customColWidths, setCustomColWidths] = useState<Map<number, number>>(new Map());
  const [customRowHeights, setCustomRowHeights] = useState<Map<number, number>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setData(null);
    setActiveSheetIndex(0);
    setVisibleRows(INITIAL_VISIBLE_ROWS);
    setSelectedCell(null);

    readXlsx(filePath)
      .then((result) => {
        if (cancelled) return;
        setData(result);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(`Failed to load XLSX: ${String(err)}`);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  const sheet = useMemo(() => {
    if (!data || data.sheets.length === 0) return null;
    return data.sheets[Math.min(activeSheetIndex, data.sheets.length - 1)];
  }, [activeSheetIndex, data]);

  // Reset custom sizes on sheet change
  useEffect(() => {
    setCustomColWidths(new Map());
    setCustomRowHeights(new Map());
  }, [activeSheetIndex]);

  const rows = sheet?.rows ?? [];
  const colCount = useMemo(() => {
    let max = 0;
    for (const row of rows) {
      if (row.length > max) max = row.length;
    }
    return max;
  }, [rows]);

  const hasMore = rows.length > visibleRows;
  const visibleBody = hasMore ? rows.slice(0, visibleRows) : rows;

  const selectedValue = useMemo(() => {
    if (!selectedCell) return "";
    const row = rows[selectedCell.row];
    if (!row) return "";
    return row[selectedCell.col] ?? "";
  }, [selectedCell, rows]);

  const styleMap = useMemo(() => {
    const map = new Map<string, XlsxCellStyle>();
    for (const s of sheet?.styles ?? []) {
      map.set(`${s.r},${s.c}`, s);
    }
    return map;
  }, [sheet?.styles]);

  const mergeMap = useMemo(() => {
    const map = new Map<string, { colSpan?: number; rowSpan?: number; hidden: boolean; }>();
    for (const m of sheet?.merges ?? []) {
      map.set(`${m.start_row},${m.start_col}`, {
        colSpan: m.end_col - m.start_col + 1,
        rowSpan: m.end_row - m.start_row + 1,
        hidden: false
      });
      for (let r = m.start_row; r <= m.end_row; r++) {
        for (let c = m.start_col; c <= m.end_col; c++) {
          if (r !== m.start_row || c !== m.start_col) {
            map.set(`${r},${c}`, { hidden: true });
          }
        }
      }
    }
    return map;
  }, [sheet?.merges]);

  const colWidthsPx = useMemo(() => {
    if (!sheet?.col_widths?.length) return null;
    const widths = new Map<number, number>();
    for (const cw of sheet.col_widths) {
      const px = charWidthToPx(cw.width);
      for (let col = cw.min; col <= cw.max; col++) {
        widths.set(col - 1, px); // convert 1-based to 0-based
      }
    }
    return widths;
  }, [sheet?.col_widths]);

  const rowHeightMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const rh of sheet?.row_heights ?? []) {
      map.set(rh.row, ptToPx(rh.height));
    }
    return map;
  }, [sheet?.row_heights]);

  // Effective column widths: customColWidths > XLSX col_widths > undefined
  const effectiveColWidths = useMemo(() => {
    const widths = new Map<number, number>();
    if (colWidthsPx) {
      for (const [col, px] of colWidthsPx) widths.set(col, px);
    }
    for (const [col, px] of customColWidths) widths.set(col, px);
    return widths;
  }, [colWidthsPx, customColWidths]);

  // --- Column resize ---
  const colResizeRef = useRef<{ col: number; startX: number; startW: number; } | null>(null);

  const handleColResizeStart = useCallback(
    (e: React.MouseEvent, colIdx: number) => {
      e.preventDefault();
      e.stopPropagation();
      const startW = effectiveColWidths.get(colIdx) ?? 64;
      colResizeRef.current = { col: colIdx, startX: e.clientX, startW };

      const onMove = (ev: MouseEvent) => {
        if (!colResizeRef.current) return;
        const delta = ev.clientX - colResizeRef.current.startX;
        const newW = Math.max(30, colResizeRef.current.startW + delta);
        setCustomColWidths((prev) => {
          const next = new Map(prev);
          next.set(colResizeRef.current!.col, newW);
          return next;
        });
      };
      const onUp = () => {
        colResizeRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [effectiveColWidths]
  );

  // --- Row resize ---
  const rowResizeRef = useRef<{ row: number; startY: number; startH: number; } | null>(null);

  const handleRowResizeStart = useCallback(
    (e: React.MouseEvent, rowIdx: number) => {
      e.preventDefault();
      e.stopPropagation();
      const startH = customRowHeights.get(rowIdx) ?? rowHeightMap.get(rowIdx) ?? 22;
      rowResizeRef.current = { row: rowIdx, startY: e.clientY, startH };

      const onMove = (ev: MouseEvent) => {
        if (!rowResizeRef.current) return;
        const delta = ev.clientY - rowResizeRef.current.startY;
        const newH = Math.max(14, rowResizeRef.current.startH + delta);
        setCustomRowHeights((prev) => {
          const next = new Map(prev);
          next.set(rowResizeRef.current!.row, newH);
          return next;
        });
      };
      const onUp = () => {
        rowResizeRef.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [customRowHeights, rowHeightMap]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!selectedCell) return;

      let { row, col } = selectedCell;
      let handled = true;

      switch (e.key) {
        case "ArrowUp":
          row = Math.max(0, row - 1);
          break;
        case "ArrowDown":
          row = Math.min(visibleBody.length - 1, row + 1);
          break;
        case "ArrowLeft":
          col = Math.max(0, col - 1);
          break;
        case "ArrowRight":
          col = Math.min(colCount - 1, col + 1);
          break;
        case "Tab":
          e.preventDefault();
          if (e.shiftKey) {
            col = col > 0 ? col - 1 : col;
          } else {
            col = col < colCount - 1 ? col + 1 : col;
          }
          break;
        case "Escape":
          setSelectedCell(null);
          return;
        default:
          handled = false;
      }

      if (handled) {
        e.preventDefault();
        setSelectedCell({ row, col });
      }
    },
    [selectedCell, visibleBody.length, colCount]
  );

  if (loading) {
    return <p style={{ color: "var(--text-secondary)" }}>Loading spreadsheet...</p>;
  }

  if (error) {
    return <p style={{ color: "#f14c4c" }}>{error}</p>;
  }

  if (!sheet) {
    return <p style={{ color: "var(--text-secondary)" }}>No sheets available.</p>;
  }

  return (
    <div
      ref={contentRef}
      className="xlsx-viewer"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Formula bar */}
      <div className="xlsx-formula-bar">
        <div className="xlsx-formula-addr">
          {selectedCell ? cellAddress(selectedCell.row, selectedCell.col) : ""}
        </div>
        <div className="xlsx-formula-content">{selectedValue}</div>
      </div>

      {/* Grid */}
      <div className="xlsx-grid-wrap">
        <table className="xlsx-grid">
          <colgroup>
            <col style={{ width: 40 }} />
            {Array.from({ length: colCount }, (_, i) => {
              const w = effectiveColWidths.get(i);
              return (
                <col
                  key={`cg-${i}`}
                  style={w ? { width: w, minWidth: w, maxWidth: w } : undefined}
                />
              );
            })}
          </colgroup>
          <thead>
            <tr>
              <th className="xlsx-corner" />
              {Array.from({ length: colCount }, (_, i) => {
                const w = effectiveColWidths.get(i);
                const thStyle: React.CSSProperties | undefined = w
                  ? { width: w, minWidth: w, maxWidth: w }
                  : undefined;
                return (
                  <th key={`col-${i}`} style={thStyle}>
                    {columnIndexToLetter(i)}
                    <div
                      className="xlsx-col-resize-handle"
                      onMouseDown={(e) => handleColResizeStart(e, i)}
                    />
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleBody.map((row, ri) => {
              const rowH = customRowHeights.get(ri) ?? rowHeightMap.get(ri);
              return (
                <tr key={`r-${ri}`} style={rowH ? { height: rowH } : undefined}>
                  <td className="xlsx-row-header">
                    {ri + 1}
                    <div
                      className="xlsx-row-resize-handle"
                      onMouseDown={(e) => handleRowResizeStart(e, ri)}
                    />
                  </td>
                  {Array.from({ length: colCount }, (_, ci) => {
                    const merge = mergeMap.get(`${ri},${ci}`);
                    if (merge?.hidden) return null;

                    const value = row[ci] ?? "";
                    const isSelected = selectedCell?.row === ri && selectedCell?.col === ci;
                    const numeric = isNumericValue(value);
                    const cellStyle = styleMap.get(`${ri},${ci}`);
                    const inlineStyle: React.CSSProperties = {};
                    if (cellStyle?.bg) inlineStyle.backgroundColor = cellStyle.bg;
                    if (cellStyle?.fg) inlineStyle.color = cellStyle.fg;
                    if (cellStyle?.bold) inlineStyle.fontWeight = 600;
                    if (cellStyle?.italic) inlineStyle.fontStyle = "italic";
                    if (cellStyle?.underline) inlineStyle.textDecoration = "underline";
                    if (cellStyle?.font_size) inlineStyle.fontSize = `${cellStyle.font_size}pt`;
                    if (cellStyle?.wrap_text) {
                      inlineStyle.whiteSpace = "pre-wrap";
                      inlineStyle.wordBreak = "break-word";
                      inlineStyle.overflow = "visible";
                    }
                    if (cellStyle?.border_top) {
                      inlineStyle.borderTop = borderStyleToCss(
                        cellStyle.border_top,
                        cellStyle.border_top_color
                      );
                    }
                    if (cellStyle?.border_right) {
                      inlineStyle.borderRight = borderStyleToCss(
                        cellStyle.border_right,
                        cellStyle.border_right_color
                      );
                    }
                    if (cellStyle?.border_bottom) {
                      inlineStyle.borderBottom = borderStyleToCss(
                        cellStyle.border_bottom,
                        cellStyle.border_bottom_color
                      );
                    }
                    if (cellStyle?.border_left) {
                      inlineStyle.borderLeft = borderStyleToCss(
                        cellStyle.border_left,
                        cellStyle.border_left_color
                      );
                    }

                    return (
                      <td
                        key={`c-${ri}-${ci}`}
                        className={(isSelected ? "xlsx-cell-selected " : "")
                          + (numeric ? "xlsx-cell-numeric" : "")}
                        style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
                        colSpan={merge?.colSpan}
                        rowSpan={merge?.rowSpan}
                        onClick={() => setSelectedCell({ row: ri, col: ci })}
                      >
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="xlsx-meta" style={{ textAlign: "center" }}>
          <button
            type="button"
            className="text-wrap-toggle"
            onClick={() => setVisibleRows((prev) => prev + INITIAL_VISIBLE_ROWS)}
          >
            Load more ({visibleBody.length}/{rows.length})
          </button>
        </div>
      )}

      {/* Meta */}
      <div className="xlsx-meta">
        Rows: {rows.length} / Columns: {colCount}
      </div>

      {/* Sheet tabs */}
      {data && data.sheets.length > 1 && (
        <div className="xlsx-sheet-tabs">
          {data.sheets.map((entry, index) => (
            <button
              key={entry.name}
              type="button"
              className={`xlsx-sheet-tab ${index === activeSheetIndex ? "is-active" : ""}`}
              onClick={() => {
                setActiveSheetIndex(index);
                setVisibleRows(INITIAL_VISIBLE_ROWS);
                setSelectedCell(null);
              }}
            >
              {entry.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const xlsxViewerPlugin: ViewerPlugin = {
  id: "xlsx",
  label: "Spreadsheet",
  extensions: ["xlsx", "xlsm", "xls", "ods"],
  supportsFind: true,
  layout: { padding: false, overflow: "hidden" },
  render({ filePath, contentRef }) {
    return <XlsxViewer filePath={filePath} contentRef={contentRef} />;
  }
};
