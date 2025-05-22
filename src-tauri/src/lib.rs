mod apply_changes;
mod apply_file_change;
mod change_types;
mod fs_api;
mod parse_change_protocol;
mod token_utils;
use fs_api::{list_directory, search_files, start_watch};

use serde_json::{json, Value};

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn apply_protocol(xml_input: &str) -> Result<Value, String> {
    match crate::apply_changes::apply_changes(xml_input) {
        Ok((successes, errors)) => Ok(json!({ "success": successes, "errors": errors })),
        Err(e) => {
            sentry::capture_error(&*e);
            Err(format!("Failed to apply changes: {}", e))
        }
    }
}
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            #[cfg(desktop)]
            let _ = app
                .handle()
                .plugin(tauri_plugin_window_state::Builder::default().build());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            apply_protocol,
            token_utils::count_tokens,
            token_utils::count_tokens_path,
            list_directory,
            search_files,
            start_watch
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
