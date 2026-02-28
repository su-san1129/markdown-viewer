import { type RefObject, useEffect, useMemo, useState } from "react";
import { readDocxText } from "../../lib/tauri";
import type { ViewerPlugin } from "../types";

function DocxViewer(
  { filePath, contentRef }: { filePath: string; contentRef: RefObject<HTMLDivElement | null>; }
) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setText("");

    readDocxText(filePath)
      .then((result) => {
        if (cancelled) return;
        setText(result.text);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(`DOCXの読み込みに失敗しました: ${String(err)}`);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filePath]);

  const paragraphs = useMemo(
    () => text.split(/\n+/).map((line) => line.trim()).filter((line) => line.length > 0),
    [text]
  );

  if (loading) {
    return <p style={{ color: "var(--text-secondary)" }}>DOCXを読み込み中...</p>;
  }

  if (error) {
    return <p style={{ color: "#f14c4c" }}>{error}</p>;
  }

  if (paragraphs.length === 0) {
    return <p style={{ color: "var(--text-secondary)" }}>本文テキストを抽出できませんでした。</p>;
  }

  return (
    <div ref={contentRef} className="docx-view" style={{ maxWidth: 900, margin: "0 auto" }}>
      {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
    </div>
  );
}

export const docxViewerPlugin: ViewerPlugin = {
  id: "docx",
  label: "Document",
  extensions: ["docx"],
  supportsFind: true,
  render({ filePath, contentRef }) {
    return <DocxViewer filePath={filePath} contentRef={contentRef} />;
  }
};
