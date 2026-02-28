import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from "react";
import type { FileEntry, SearchFileResult } from "../types";

interface AppState {
  rootPath: string | null;
  fileTree: FileEntry[];
  selectedFilePath: string | null;
  fileContent: string | null;
  loading: boolean;
  error: string | null;
  searchQuery: string;
  searchResults: SearchFileResult[];
  searchLoading: boolean;
  caseSensitive: boolean;
}

type AppAction =
  | { type: "SET_ROOT_PATH"; payload: string }
  | { type: "SET_FILE_TREE"; payload: FileEntry[] }
  | { type: "SET_SELECTED_FILE"; payload: string }
  | { type: "SET_FILE_CONTENT"; payload: string }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_SEARCH_RESULTS"; payload: SearchFileResult[] }
  | { type: "SET_SEARCH_LOADING"; payload: boolean }
  | { type: "TOGGLE_CASE_SENSITIVE" }
  | { type: "CLEAR_SEARCH" };

const initialState: AppState = {
  rootPath: null,
  fileTree: [],
  selectedFilePath: null,
  fileContent: null,
  loading: false,
  error: null,
  searchQuery: "",
  searchResults: [],
  searchLoading: false,
  caseSensitive: false,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_ROOT_PATH":
      return { ...state, rootPath: action.payload, selectedFilePath: null, fileContent: null, error: null, searchQuery: "", searchResults: [], searchLoading: false };
    case "SET_FILE_TREE":
      return { ...state, fileTree: action.payload, loading: false };
    case "SET_SELECTED_FILE":
      return { ...state, selectedFilePath: action.payload, loading: true, error: null };
    case "SET_FILE_CONTENT":
      return { ...state, fileContent: action.payload, loading: false };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    case "RESET":
      return initialState;
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.payload, searchLoading: false };
    case "SET_SEARCH_LOADING":
      return { ...state, searchLoading: action.payload };
    case "TOGGLE_CASE_SENSITIVE":
      return { ...state, caseSensitive: !state.caseSensitive };
    case "CLEAR_SEARCH":
      return { ...state, searchQuery: "", searchResults: [], searchLoading: false };
    default:
      return state;
  }
}

const AppContext = createContext<AppState>(initialState);
const AppDispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <AppContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppContext.Provider>
  );
}

export function useAppState() {
  return useContext(AppContext);
}

export function useAppDispatch() {
  return useContext(AppDispatchContext);
}
