import { FolderOpen, Moon, Sun, X } from "lucide-react";
import { useAppDispatch, useAppState } from "../context/AppContext";
import { useOpenFolder } from "../lib/useOpenFolder";
import { useTheme } from "../lib/useTheme";

export function Toolbar() {
  const dispatch = useAppDispatch();
  const { activeWorkspaceId, workspaceOrder, workspaces } = useAppState();
  const openFolder = useOpenFolder();
  const { theme, toggleTheme } = useTheme();

  const workspaceItems = workspaceOrder
    .map((workspaceId) => workspaces[workspaceId])
    .filter((workspace) => !!workspace);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "var(--h-toolbar)",
        padding: "0 var(--sp-3)",
        gap: "var(--sp-2)",
        backgroundColor: "var(--bg-toolbar)",
        borderBottom: "1px solid var(--border-color)",
        userSelect: "none",
        flexShrink: 0,
        fontSize: "var(--font-ui)"
      }}
    >
      <button
        onClick={() => void openFolder()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--sp-2)",
          height: "var(--h-icon-btn)",
          padding: "0 var(--sp-3)",
          borderRadius: "var(--radius-sm)",
          border: "none",
          cursor: "pointer",
          fontSize: "var(--font-ui)",
          backgroundColor: "var(--bg-hover)",
          color: "var(--text-primary)"
        }}
      >
        <FolderOpen size={14} />
        フォルダを開く
      </button>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          minWidth: 0,
          flex: 1,
          overflowX: "auto",
          padding: "2px 0"
        }}
      >
        {workspaceItems.map((workspace) => (
          <div
            key={workspace.id}
            style={{
              display: "flex",
              alignItems: "center",
              minWidth: 0,
              maxWidth: 220,
              height: "var(--h-icon-btn)",
              borderRadius: "var(--radius-sm)",
              border: "1px solid var(--border-color)",
              backgroundColor: workspace.id === activeWorkspaceId
                ? "var(--bg-main)"
                : "transparent"
            }}
          >
            <button
              onClick={() => void openFolder(workspace.path)}
              style={{
                display: "flex",
                alignItems: "center",
                minWidth: 0,
                height: "100%",
                flex: 1,
                border: "none",
                background: "transparent",
                color: "var(--text-primary)",
                cursor: "pointer",
                padding: "0 8px",
                fontSize: "var(--font-ui)"
              }}
              title={workspace.path}
            >
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap"
                }}
              >
                {workspace.name}
              </span>
            </button>
            <button
              onClick={() => dispatch({ type: "CLOSE_WORKSPACE", payload: workspace.id })}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: "100%",
                border: "none",
                borderLeft: "1px solid var(--border-color)",
                background: "transparent",
                color: "var(--text-secondary)",
                cursor: "pointer"
              }}
              title="閉じる"
              aria-label={`${workspace.name} を閉じる`}
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={toggleTheme}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "var(--h-icon-btn)",
          height: "var(--h-icon-btn)",
          borderRadius: "var(--radius-sm)",
          border: "none",
          cursor: "pointer",
          backgroundColor: "transparent",
          color: "var(--text-secondary)"
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "var(--bg-hover)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
        }}
        title={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      >
        {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
