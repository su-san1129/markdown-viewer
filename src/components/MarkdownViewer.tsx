import { useCallback, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";
import { watchImmediate } from "@tauri-apps/plugin-fs";
import { FileText } from "lucide-react";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { readFileContent } from "../lib/tauri";
import { EmptyState } from "./EmptyState";
import { FindBar } from "./FindBar";
import { MermaidBlock } from "./MermaidBlock";

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-mermaid/.exec(className || "");
    if (match) {
      return <MermaidBlock>{String(children).replace(/\n$/, "")}</MermaidBlock>;
    }
    return <code className={className} {...props}>{children}</code>;
  },
};

export function MarkdownViewer() {
  const { rootPath, selectedFilePath, fileContent, loading, error } = useAppState();
  const dispatch = useAppDispatch();
  const unwatchRef = useRef<(() => void) | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [findVisible, setFindVisible] = useState(false);

  const closeFindBar = useCallback(() => setFindVisible(false), []);

  useEffect(() => {
    if (!selectedFilePath) return;

    let cancelled = false;

    const setupWatch = async () => {
      if (unwatchRef.current) {
        unwatchRef.current();
        unwatchRef.current = null;
      }

      try {
        const unwatch = await watchImmediate(selectedFilePath, async (event) => {
          if (cancelled) return;
          const kind = event.type;
          if (typeof kind === "object" && "modify" in kind) {
            try {
              const content = await readFileContent(selectedFilePath);
              dispatch({ type: "SET_FILE_CONTENT", payload: content });
            } catch {
              // File may have been deleted
            }
          }
        });
        unwatchRef.current = unwatch;
      } catch {
        // Watching may not be supported
      }
    };

    setupWatch();

    return () => {
      cancelled = true;
      if (unwatchRef.current) {
        unwatchRef.current();
        unwatchRef.current = null;
      }
    };
  }, [selectedFilePath, dispatch]);

  // Cmd+F → open find bar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault();
        setFindVisible(true);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close find bar on file switch
  useEffect(() => {
    setFindVisible(false);
  }, [selectedFilePath]);

  // No folder open → welcome screen
  if (!selectedFilePath && !rootPath) {
    return <EmptyState />;
  }

  // Folder open, no file selected
  if (!selectedFilePath) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          gap: "var(--sp-4)",
          backgroundColor: "var(--bg-main)",
          color: "var(--text-secondary)",
          userSelect: "none",
        }}
      >
        <FileText size={40} strokeWidth={1} />
        <p style={{ fontSize: "var(--font-ui)" }}>Markdownファイルを選択してプレビュー</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          backgroundColor: "var(--bg-main)",
          color: "var(--text-secondary)",
          fontSize: "var(--font-ui)",
        }}
      >
        読み込み中...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          backgroundColor: "var(--bg-main)",
          color: "#f14c4c",
          fontSize: "var(--font-ui)",
        }}
      >
        {error}
      </div>
    );
  }

  const fileName = selectedFilePath.split("/").pop() ?? "";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", backgroundColor: "var(--bg-main)" }}>
      {/* File tab */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "var(--h-tab)",
          padding: "0 var(--sp-4)",
          fontSize: "var(--font-ui)",
          color: "var(--text-secondary)",
          borderBottom: "1px solid var(--border-color)",
          flexShrink: 0,
          userSelect: "none",
        }}
      >
        {fileName}
      </div>
      {findVisible && <FindBar contentRef={contentRef} onClose={closeFindBar} />}
      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto", padding: "var(--sp-6) var(--sp-10)" }}>
        <div ref={contentRef} className="markdown-body" style={{ maxWidth: 900, margin: "0 auto" }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeHighlight]}
            components={markdownComponents}
          >
            {fileContent ?? ""}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
