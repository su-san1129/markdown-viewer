import { useEffect, useRef } from "react";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { useActiveWorkspace, useAppDispatch, useAppState } from "../context/AppContext";
import { cancelSearch, searchFilesStream } from "./tauri";
import type { SearchStreamDoneData, SearchStreamResultData } from "../types";

export function useSearch() {
  const { activeWorkspaceId } = useAppState();
  const activeWorkspace = useActiveWorkspace();
  const dispatch = useAppDispatch();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSearchIdRef = useRef<string | null>(null);
  const unlistenResultRef = useRef<UnlistenFn | null>(null);
  const unlistenDoneRef = useRef<UnlistenFn | null>(null);
  const rootPath = activeWorkspace?.path ?? null;
  const searchQuery = activeWorkspace?.searchQuery ?? "";
  const caseSensitive = activeWorkspace?.caseSensitive ?? false;
  const searchFileType = activeWorkspace?.searchFileType ?? "all";

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!activeWorkspaceId || !rootPath || !searchQuery.trim()) {
      // Cancel any active search and clear results
      if (activeSearchIdRef.current) {
        cancelSearch(activeSearchIdRef.current).catch(() => {});
        activeSearchIdRef.current = null;
      }
      if (activeWorkspaceId) {
        dispatch({
          type: "SET_WORKSPACE_SEARCH_RESULTS",
          payload: { workspaceId: activeWorkspaceId, results: [] }
        });
      }
      return;
    }

    dispatch({
      type: "SET_WORKSPACE_SEARCH_LOADING",
      payload: { workspaceId: activeWorkspaceId, loading: true }
    });

    timerRef.current = setTimeout(async () => {
      // Cancel previous search
      if (activeSearchIdRef.current) {
        cancelSearch(activeSearchIdRef.current).catch(() => {});
      }
      // Clean up previous listeners
      if (unlistenResultRef.current) {
        unlistenResultRef.current();
        unlistenResultRef.current = null;
      }
      if (unlistenDoneRef.current) {
        unlistenDoneRef.current();
        unlistenDoneRef.current = null;
      }

      const searchId = crypto.randomUUID();
      activeSearchIdRef.current = searchId;

      // Clear previous results
      dispatch({
        type: "SET_WORKSPACE_SEARCH_RESULTS",
        payload: { workspaceId: activeWorkspaceId, results: [] }
      });
      dispatch({
        type: "SET_WORKSPACE_SEARCH_LOADING",
        payload: { workspaceId: activeWorkspaceId, loading: true }
      });

      // Set up event listeners
      unlistenResultRef.current = await listen<SearchStreamResultData>(
        "search_stream_result",
        (event) => {
          if (event.payload.searchId !== activeSearchIdRef.current) return;
          dispatch({
            type: "APPEND_WORKSPACE_SEARCH_RESULT",
            payload: {
              workspaceId: activeWorkspaceId,
              result: event.payload.result
            }
          });
        }
      );

      unlistenDoneRef.current = await listen<SearchStreamDoneData>(
        "search_stream_done",
        (event) => {
          if (event.payload.searchId !== activeSearchIdRef.current) return;
          dispatch({
            type: "SET_WORKSPACE_SEARCH_LOADING",
            payload: {
              workspaceId: activeWorkspaceId,
              loading: false,
              limitReached: event.payload.limitReached
            }
          });
        }
      );

      // Start the streaming search
      try {
        await searchFilesStream(
          rootPath,
          searchQuery,
          caseSensitive,
          searchFileType,
          searchId
        );
      } catch {
        dispatch({
          type: "SET_WORKSPACE_SEARCH_LOADING",
          payload: { workspaceId: activeWorkspaceId, loading: false }
        });
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [
    activeWorkspaceId,
    rootPath,
    searchQuery,
    caseSensitive,
    searchFileType,
    dispatch
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeSearchIdRef.current) {
        cancelSearch(activeSearchIdRef.current).catch(() => {});
        activeSearchIdRef.current = null;
      }
      if (unlistenResultRef.current) {
        unlistenResultRef.current();
        unlistenResultRef.current = null;
      }
      if (unlistenDoneRef.current) {
        unlistenDoneRef.current();
        unlistenDoneRef.current = null;
      }
    };
  }, []);
}
