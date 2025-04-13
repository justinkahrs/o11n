mod apply_changes;
mod apply_file_change;
mod change_types;
mod parse_change_protocol;

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
fn apply_protocol(xml_input: &str) -> Result<String, String> {
    match crate::apply_changes::apply_changes(xml_input) {
        Ok(_) => Ok("Changes applied successfully!".to_string()),
        Err(e) => Err(format!("Failed to apply changes: {}", e)),
    }
}

#[tauri::command]
fn count_tokens_path(path: &str) -> Result<String, String> {
    use std::fs;
    use tiktoken_rs::o200k_base;
    let content = fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;
    let bpe = o200k_base().map_err(|e| format!("Failed to load tokenizer: {}", e))?;
    let tokens = bpe.encode_with_special_tokens(&content);
    Ok(format!("{}", tokens.len()))
}

#[tauri::command]
fn count_tokens(content: &str) -> Result<String, String> {
    use tiktoken_rs::o200k_base;
    let bpe = o200k_base().map_err(|e| format!("Failed to load tokenizer: {}", e))?;
    let tokens = bpe.encode_with_special_tokens(&content);
    Ok(format!("{}", tokens.len()))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            apply_protocol,
            count_tokens,
            count_tokens_path
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
