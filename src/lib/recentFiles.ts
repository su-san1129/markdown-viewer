const STORAGE_KEY = "markdown-viewer:recent-folders";
const MAX_RECENT = 8;

export interface RecentFolder {
  path: string;
  name: string;
  openedAt: number;
}

export function getRecentFolders(): RecentFolder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RecentFolder[];
  } catch {
    return [];
  }
}

export function addRecentFolder(path: string): RecentFolder[] {
  const name = path.split("/").pop() ?? path;
  const folders = getRecentFolders().filter((f) => f.path !== path);
  folders.unshift({ path, name, openedAt: Date.now() });
  const trimmed = folders.slice(0, MAX_RECENT);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}
