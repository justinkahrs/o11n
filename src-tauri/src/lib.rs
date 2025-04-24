mod apply_changes;
mod apply_file_change;
mod change_types;
mod parse_change_protocol;
mod token_utils;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn apply_protocol(xml_input: &str) -> Result<String, String> {
    match crate::apply_changes::apply_changes(xml_input) {
        Ok(_) => Ok("Changes applied successfully!".to_string()),
        Err(e) => Err(format!("Failed to apply changes: {}", e)),
    }
}
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
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
            token_utils::count_tokens_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
