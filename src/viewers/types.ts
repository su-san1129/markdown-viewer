import type { ReactNode, RefObject } from "react";

export interface ViewerContext {
  filePath: string;
  content: string;
  contentRef: RefObject<HTMLDivElement | null>;
}

export interface ViewerPlugin {
  id: string;
  label: string;
  extensions: string[];
  supportsFind: boolean;
  render: (context: ViewerContext) => ReactNode;
}
