import { useEffect, useRef } from "react";
import { useAppState, useAppDispatch } from "../context/AppContext";
import { searchFiles } from "./tauri";

export function useSearch() {
  const { rootPath, searchQuery, caseSensitive } = useAppState();
  const dispatch = useAppDispatch();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (!rootPath || !searchQuery.trim()) {
      dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
      return;
    }

    dispatch({ type: "SET_SEARCH_LOADING", payload: true });

    timerRef.current = setTimeout(async () => {
      try {
        const results = await searchFiles(rootPath, searchQuery, caseSensitive);
        dispatch({ type: "SET_SEARCH_RESULTS", payload: results });
      } catch {
        dispatch({ type: "SET_SEARCH_RESULTS", payload: [] });
      }
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [rootPath, searchQuery, caseSensitive, dispatch]);
}
