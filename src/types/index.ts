export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileEntry[];
}

export interface SearchMatch {
  line_number: number;
  line_text: string;
}

export interface SearchFileResult {
  file_path: string;
  file_name: string;
  matches: SearchMatch[];
}

export interface SearchStreamResultData {
  searchId: string;
  result: SearchFileResult;
}

export interface SearchStreamDoneData {
  searchId: string;
  totalFiles: number;
  totalMatches: number;
  cancelled: boolean;
  limitReached: boolean;
}

export interface SupportedFileType {
  id: string;
  label: string;
  extensions: string[];
  searchable: boolean;
}

export interface LaunchTarget {
  workspacePath: string;
  selectedFilePath: string | null;
}

export interface XlsxCellStyle {
  r: number;
  c: number;
  bg?: string;
  fg?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  font_size?: number;
  wrap_text?: boolean;
  border_top?: string;
  border_right?: string;
  border_bottom?: string;
  border_left?: string;
  border_top_color?: string;
  border_right_color?: string;
  border_bottom_color?: string;
  border_left_color?: string;
}

export interface XlsxColWidth {
  min: number;
  max: number;
  width: number;
}

export interface XlsxMerge {
  start_row: number;
  start_col: number;
  end_row: number;
  end_col: number;
}

export interface XlsxRowHeight {
  row: number;
  height: number;
}

export interface XlsxSheetData {
  name: string;
  rows: string[][];
  styles?: XlsxCellStyle[];
  col_widths?: XlsxColWidth[];
  merges?: XlsxMerge[];
  row_heights?: XlsxRowHeight[];
}

export interface XlsxData {
  sheets: XlsxSheetData[];
}

export interface DocxTextData {
  text: string;
}

export interface GeoJsonData {
  geojson: string;
}

export interface FileMetaData {
  sizeBytes: number;
  extension: string;
  mimeGuess: string;
}

export interface GeoJsonTileSessionData {
  datasetId: string;
  bounds: [number, number, number, number] | null;
  minZoom: number;
  maxZoom: number;
  totalFeatures: number;
  maxFeaturesPerTile: number;
}

export interface GeoJsonTileData {
  features: GeoJSON.Feature[];
  totalFeatures: number;
  truncated: boolean;
  simplifiedFeatures: number;
  fallbackFeatures: number;
  lodTolerance: number;
  lodMode: "low" | "medium" | "high";
}

export interface GeoJsonPrepareProgressData {
  requestId: string;
  stage: "reading" | "parsing" | "indexing" | "finalizing" | "done" | "error";
  percent: number;
  message: string;
  totalFeatures?: number;
  processedFeatures?: number;
}

export interface FileContentData {
  content: string;
  encoding: string;
  isUtf8: boolean;
}

export interface CsvChunkData {
  delimiter: string;
  header: string[];
  rows: string[][];
  next_cursor: number | null;
  eof: boolean;
}

export interface ParquetPreviewData {
  columns: string[];
  rows: string[][];
  totalRows: number;
  truncated: boolean;
}

export interface DuckDbTablePreviewData {
  tableName: string;
  columns: string[];
  rows: string[][];
  totalRows: number;
  truncated: boolean;
}

export interface DuckDbTableInfo {
  schemaName: string;
  tableName: string;
  displayName: string;
}

export interface SqliteTableInfo {
  tableName: string;
}

export interface SqliteTablePreviewData {
  tableName: string;
  columns: string[];
  rows: string[][];
  totalRows: number;
  truncated: boolean;
}
