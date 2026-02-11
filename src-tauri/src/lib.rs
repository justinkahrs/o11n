mod apply_changes;
mod apply_file_change;
mod change_types;
mod fs_api;
mod parse_change_protocol;
mod token_utils;
use fs_api::{list_directory, search_config_files, search_files, start_watch};

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

#[tauri::command]
fn get_git_diff(path: &str) -> Result<String, String> {
    use std::path::Path;
    use std::process::Command;

    let file_path = Path::new(path);
    let parent = file_path.parent().unwrap_or(file_path);

    let output = Command::new("git")
        .args(["diff", "--unified=0", "HEAD", "--", path])
        .current_dir(parent)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
    }
}

#[tauri::command]
fn get_git_original_content(path: &str) -> Result<String, String> {
    use std::path::Path;
    use std::process::Command;

    let file_path = Path::new(path);
    let parent = file_path.parent().unwrap_or(file_path);
    // Git show HEAD:./filename
    // We need relative path or just use absolute if git handles it.
    // Git show HEAD:absolute_path usually fails.
    // We can use git show HEAD:<relative_path>
    // Getting relative path in Rust might be tricky if we don't know the root.
    // Easier: git show HEAD:$(git ls-files --full-name path) ?
    // Or just cd to parent and show HEAD:./filename
    let file_name = file_path
        .file_name()
        .ok_or("Invalid path")?
        .to_str()
        .ok_or("Invalid path string")?;

    let output = Command::new("git")
        .args(["show", &format!("HEAD:./{}", file_name)])
        .current_dir(parent)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).to_string())
    } else {
        Err(String::from_utf8_lossy(&output.stderr).to_string())
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
            search_config_files,
            search_files,
            start_watch,
            get_git_diff,
            get_git_original_content,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
