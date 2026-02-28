const TEXT_PREVIEW_EXTENSIONS = new Set([
  "md",
  "markdown",
  "html",
  "htm",
  "json",
  "csv",
  "tsv",
  "dxf",
  "txt",
  "text",
  "log",
  "ini",
  "cfg",
  "conf",
  "yaml",
  "yml",
  "toml",
  "xml",
  "sql",
  "sh",
  "bash",
  "zsh",
  "fish",
  "ps1",
  "bat",
  "cmd",
  "c",
  "h",
  "cpp",
  "hpp",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "js",
  "jsx",
  "mjs",
  "cjs",
  "ts",
  "tsx",
  "css",
  "scss",
  "less"
]);

export function getFileExtension(filePath: string): string {
  const fileName = filePath.split("/").pop() ?? "";
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex < 0) return "";
  return fileName.slice(dotIndex + 1).toLowerCase();
}

export function isTextPreviewPath(filePath: string): boolean {
  return TEXT_PREVIEW_EXTENSIONS.has(getFileExtension(filePath));
}
