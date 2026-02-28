import { type RefObject, useMemo, useState } from "react";
import type { ViewerPlugin } from "../types";

function TextViewer(
  { content, contentRef }: { content: string; contentRef: RefObject<HTMLDivElement | null>; }
) {
  const [wrap, setWrap] = useState(true);
  const lines = useMemo(() => content.split(/\r?\n/), [content]);

  return (
    <div ref={contentRef} className="text-viewer">
      <div className="text-toolbar">
        <button
          type="button"
          className="text-wrap-toggle"
          onClick={() => setWrap((prev) => !prev)}
          title="折り返し切替"
        >
          Wrap: {wrap ? "ON" : "OFF"}
        </button>
        <span className="text-meta">Lines: {lines.length}</span>
      </div>
      <div className={`text-grid ${wrap ? "is-wrap" : "is-no-wrap"}`}>
        {lines.map((line, index) => (
          <div key={index} className="text-line-row">
            <span className="text-line-no">{index + 1}</span>
            <span className="text-line-content">{line.length > 0 ? line : " "}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const textExtensions = [
  "txt",
  "text",
  "log",
  "ini",
  "cfg",
  "conf",
  "yaml",
  "yml",
  "toml",
  "xml",
  "sql",
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "bat",
  "cmd",
  "c",
  "h",
  "cpp",
  "hpp",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "css",
  "scss",
  "less"
];

export const textViewerPlugin: ViewerPlugin = {
  id: "text",
  label: "Text",
  extensions: textExtensions,
  supportsFind: true,
  render({ content, contentRef }) {
    return <TextViewer content={content} contentRef={contentRef} />;
  }
};
