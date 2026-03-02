import { useCallback, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";
import { MermaidBlock } from "../../components/MermaidBlock";
import { exportMarkdownToPdf, savePdfDialog } from "../../lib/tauri";
import type { ToolbarActionContext, ViewerPlugin } from "../types";

const markdownComponents: Components = {
  code({ className, children, ...props }) {
    const match = /language-mermaid/.exec(className || "");
    if (match) {
      return <MermaidBlock>{String(children).replace(/\n$/, "")}</MermaidBlock>;
    }
    return <code className={className} {...props}>{children}</code>;
  }
};

function MarkdownToolbarActions({ filePath, workspaceId, dispatch }: ToolbarActionContext) {
  const [exporting, setExporting] = useState(false);

  const onExportPdf = useCallback(async () => {
    if (exporting) return;
    const defaultPath = filePath.replace(/\.(md|markdown)$/i, ".pdf");
    const selectedPath = await savePdfDialog(defaultPath);
    if (!selectedPath) return;

    try {
      setExporting(true);
      await exportMarkdownToPdf(filePath, selectedPath);
      dispatch({
        type: "SET_WORKSPACE_ERROR",
        payload: { workspaceId, error: null }
      });
    } catch (error) {
      dispatch({
        type: "SET_WORKSPACE_ERROR",
        payload: { workspaceId, error: String(error) }
      });
    } finally {
      setExporting(false);
    }
  }, [dispatch, exporting, filePath, workspaceId]);

  return (
    <button
      type="button"
      onClick={() => void onExportPdf()}
      disabled={exporting}
      style={{
        marginLeft: "auto",
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        padding: "0 10px",
        borderRadius: "var(--radius-sm)",
        border: "1px solid var(--border-color)",
        backgroundColor: exporting ? "transparent" : "var(--bg-hover)",
        color: exporting ? "var(--text-muted)" : "var(--text-primary)",
        cursor: exporting ? "default" : "pointer",
        fontSize: "var(--font-ui)"
      }}
      title="MarkdownをPDFとして書き出し"
    >
      {exporting ? "書き出し中..." : "PDFとして書き出し"}
    </button>
  );
}

export const markdownViewerPlugin: ViewerPlugin = {
  id: "markdown",
  label: "Markdown",
  extensions: ["md", "markdown"],
  supportsFind: true,
  renderToolbarActions(context) {
    return <MarkdownToolbarActions {...context} />;
  },
  render({ content, contentRef }) {
    return (
      <div ref={contentRef} className="markdown-body" style={{ maxWidth: 900, margin: "0 auto" }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={markdownComponents}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }
};
