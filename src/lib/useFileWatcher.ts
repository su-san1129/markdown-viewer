import { type Dispatch, useEffect, useRef } from "react";
import { watchImmediate } from "@tauri-apps/plugin-fs";
import type { AppAction } from "../context/AppContext";
import { readFileContent } from "./tauri";
import { requiresRawTextContent } from "../viewers/fileTypes";

export function useFileWatcher(
  filePath: string | null,
  workspaceId: string | null,
  dispatch: Dispatch<AppAction>
) {
  const unwatchRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!filePath) return;

    let cancelled = false;

    const setupWatch = async () => {
      if (unwatchRef.current) {
        unwatchRef.current();
        unwatchRef.current = null;
      }

      try {
        const unwatch = await watchImmediate(filePath, async (event) => {
          if (cancelled) return;
          const kind = event.type;
          if (typeof kind === "object" && "modify" in kind) {
            try {
              const fileContent = requiresRawTextContent(filePath)
                ? await readFileContent(filePath)
                : { content: "", encoding: null, isUtf8: null };
              if (!workspaceId) return;
              dispatch({
                type: "SET_WORKSPACE_FILE_CONTENT",
                payload: {
                  workspaceId,
                  content: fileContent.content,
                  encoding: fileContent.encoding,
                  isUtf8: fileContent.isUtf8
                }
              });
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
  }, [filePath, dispatch, workspaceId]);
}
