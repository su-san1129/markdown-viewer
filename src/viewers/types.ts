import type { Dispatch, ReactNode, RefObject } from "react";
import type { AppAction } from "../context/AppContext";

export interface ViewerContext {
  filePath: string;
  content: string;
  contentRef: RefObject<HTMLDivElement | null>;
}

export interface ViewerLayout {
  overflow?: "auto" | "hidden";
  padding?: boolean;
}

export interface ToolbarActionContext {
  filePath: string;
  content: string;
  workspaceId: string;
  dispatch: Dispatch<AppAction>;
}

export interface ViewerPlugin {
  id: string;
  label: string;
  extensions: string[];
  supportsFind: boolean;
  layout?: ViewerLayout;
  renderToolbarActions?: (context: ToolbarActionContext) => ReactNode;
  render: (context: ViewerContext) => ReactNode;
}
