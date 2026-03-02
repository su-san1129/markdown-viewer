import { type RefObject, useEffect, useMemo, useState } from "react";
import { readSqliteTablePreview, readSqliteTables } from "../../lib/tauri";
import type { SqliteTableInfo, SqliteTablePreviewData } from "../../types";
import type { ViewerPlugin } from "../types";

const INITIAL_VISIBLE_ROWS = 200;

function SqliteViewer(
  { filePath, contentRef }: { filePath: string; contentRef: RefObject<HTMLDivElement | null>; }
) {
  const [tables, setTables] = useState<SqliteTableInfo[]>([]);
  const [activeTable, setActiveTable] = useState<string | null>(null);
  const [visibleRows, setVisibleRows] = useState(INITIAL_VISIBLE_ROWS);
  const [data, setData] = useState<SqliteTablePreviewData | null>(null);
  const [loadingTables, setLoadingTables] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setTables([]);
    setActiveTable(null);
    setVisibleRows(INITIAL_VISIBLE_ROWS);
    setData(null);
    setError(null);
    setLoadingTables(true);

    readSqliteTables(filePath)
      .then((nextTables) => {
        if (cancelled) return;
        setTables(nextTables);
        setActiveTable(nextTables[0]?.tableName ?? null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(`SQLiteテーブル一覧の取得に失敗しました: ${String(err)}`);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingTables(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  useEffect(() => {
    if (!activeTable) return;
    let cancelled = false;
    setLoadingPreview(true);
    setError(null);

    readSqliteTablePreview(filePath, activeTable, visibleRows)
      .then((nextData) => {
        if (cancelled) return;
        setData(nextData);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(`SQLiteプレビュー取得に失敗しました: ${String(err)}`);
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeTable, filePath, visibleRows]);

  const normalizedData = useMemo(() => {
    if (!data) return null;
    const columnCount = Math.max(data.columns.length, ...data.rows.map((row) => row.length), 0);
    const columns = data.columns.length > 0
      ? data.columns
      : Array.from({ length: columnCount }, (_, index) => `Column ${index + 1}`);
    const rows = data.rows.map((row) =>
      row.length >= columns.length ? row : [...row, ...Array(columns.length - row.length).fill("")]
    );
    return { columns, rows };
  }, [data]);

  if (loadingTables) {
    return <p style={{ color: "var(--text-secondary)" }}>SQLiteを読み込み中...</p>;
  }

  if (error && !data) {
    return <p style={{ color: "#f14c4c" }}>{error}</p>;
  }

  if (tables.length === 0) {
    return <p style={{ color: "var(--text-secondary)" }}>表示可能なテーブルがありません。</p>;
  }

  if (!normalizedData) {
    return <p style={{ color: "var(--text-secondary)" }}>テーブルを読み込み中...</p>;
  }

  const hasMore = data?.truncated ?? false;

  return (
    <div ref={contentRef} style={{ maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <label
          style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "var(--font-ui)" }}
        >
          <span style={{ color: "var(--text-secondary)" }}>Table</span>
          <select
            value={activeTable ?? ""}
            onChange={(event) => {
              setActiveTable(event.target.value || null);
              setVisibleRows(INITIAL_VISIBLE_ROWS);
            }}
            className="xlsx-tab"
          >
            {tables.map((table) => (
              <option key={table.tableName} value={table.tableName}>{table.tableName}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="csv-meta">
        Table: {activeTable} / Rows: {data?.rows.length ?? 0}/{data?.totalRows ?? 0} / Columns:{" "}
        {normalizedData.columns.length}
      </p>
      {error && <p style={{ color: "#f14c4c", marginBottom: 8 }}>{error}</p>}
      <div className="csv-table-wrap">
        <table className="csv-table">
          <thead>
            <tr>
              {normalizedData.columns.map((columnName, index) => (
                <th key={`sh-${index}`}>{columnName || `Column ${index + 1}`}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {normalizedData.rows.map((row, rowIndex) => (
              <tr key={`sr-${rowIndex}`}>
                {row.map((cell, colIndex) => <td key={`sc-${rowIndex}-${colIndex}`}>{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div style={{ marginTop: "var(--sp-3)" }}>
          <button
            type="button"
            className="text-wrap-toggle"
            onClick={() => setVisibleRows((prev) => prev + INITIAL_VISIBLE_ROWS)}
            disabled={loadingPreview}
          >
            {loadingPreview
              ? "Loading..."
              : `Load more (${data?.rows.length ?? 0}/${data?.totalRows ?? 0})`}
          </button>
        </div>
      )}
    </div>
  );
}

export const sqliteViewerPlugin: ViewerPlugin = {
  id: "sqlite",
  label: "SQLite",
  extensions: ["sqlite", "sqlite3", "db"],
  supportsFind: false,
  render({ filePath, contentRef }) {
    return <SqliteViewer filePath={filePath} contentRef={contentRef} />;
  }
};
