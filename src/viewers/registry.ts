import { htmlViewerPlugin } from "./plugins/html";
import { jsonViewerPlugin } from "./plugins/json";
import { markdownViewerPlugin } from "./plugins/markdown";
import type { ViewerPlugin } from "./types";

const viewerPlugins: ViewerPlugin[] = [];

export function registerViewer(plugin: ViewerPlugin) {
  if (viewerPlugins.some((entry) => entry.id === plugin.id)) {
    return;
  }
  viewerPlugins.push(plugin);
}

registerViewer(markdownViewerPlugin);
registerViewer(htmlViewerPlugin);
registerViewer(jsonViewerPlugin);

function getExtension(filePath: string): string {
  const fileName = filePath.split("/").pop() ?? "";
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return fileName.slice(dotIndex + 1).toLowerCase();
}

export function resolveViewer(filePath: string): ViewerPlugin | null {
  const extension = getExtension(filePath);
  if (!extension) return null;

  return viewerPlugins.find((plugin) =>
    plugin.extensions.some((ext) => ext.toLowerCase() === extension),
  ) ?? null;
}
