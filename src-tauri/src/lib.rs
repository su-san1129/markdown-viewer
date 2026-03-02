mod commands;

use commands::{
    export_markdown_to_pdf, get_file_meta, get_launch_target, get_supported_file_types,
    open_in_file_manager, prepare_geojson_tiles, read_csv_chunk, read_directory_tree,
    read_docx_text, read_duckdb_table_preview, read_duckdb_tables, read_file_content,
    read_geojson_tile, read_gpx, read_kml, read_parquet, read_sqlite_table_preview,
    read_sqlite_tables, read_xlsx, release_geojson_tiles, search_files, GeoJsonTileStore,
};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(GeoJsonTileStore::default())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            read_directory_tree,
            get_file_meta,
            read_file_content,
            open_in_file_manager,
            read_csv_chunk,
            read_xlsx,
            read_docx_text,
            read_parquet,
            read_duckdb_tables,
            read_duckdb_table_preview,
            read_sqlite_tables,
            read_sqlite_table_preview,
            read_gpx,
            read_kml,
            prepare_geojson_tiles,
            read_geojson_tile,
            release_geojson_tiles,
            export_markdown_to_pdf,
            search_files,
            get_supported_file_types,
            get_launch_target
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
