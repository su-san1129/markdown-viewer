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

export interface SupportedFileType {
  id: string;
  label: string;
  extensions: string[];
  searchable: boolean;
}
