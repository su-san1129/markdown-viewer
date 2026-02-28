mod commands;

use commands::{read_directory_tree, read_file_content, search_files};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![read_directory_tree, read_file_content, search_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
