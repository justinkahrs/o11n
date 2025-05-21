use ignore::WalkBuilder;
use notify::{Event, RecommendedWatcher, RecursiveMode, Watcher};
use serde::Serialize;
use std::path::Path;

use std::sync::mpsc::channel;
use std::thread;
use tauri::Emitter;

#[derive(Serialize)]
pub struct TreeItemData {
    pub id: String,
    pub name: String,
    pub path: String,
    #[serde(rename = "isDirectory")]
    pub is_directory: bool,
    pub children: Vec<TreeItemData>,
    #[serde(rename = "loadedChildren")]
    pub loaded_children: bool,
}
#[tauri::command]
pub fn list_directory(
    path: String,
    show_dotfiles: bool,
    use_ignore_file: bool,
) -> Result<Vec<TreeItemData>, String> {
    let mut walker = WalkBuilder::new(&path);
    walker.max_depth(Some(1));
    if show_dotfiles {
        walker.hidden(false);
    }
    if !use_ignore_file {
        walker.git_ignore(false).ignore(false).parents(false);
    }
    let mut out = Vec::new();
    for dent in walker.build() {
        let dent = dent.map_err(|e| e.to_string())?;
        if dent.path() == Path::new(&path) {
            continue;
        }
        let meta = dent.metadata().map_err(|e| e.to_string())?;
        let name = dent.file_name().to_string_lossy().into_owned();
        out.push(TreeItemData {
            id: name.clone(),
            name,
            path: dent.path().to_string_lossy().into_owned(),
            is_directory: meta.is_dir(),
            children: Vec::new(),
            loaded_children: false,
        });
    }
    Ok(out)
}
#[tauri::command]
pub fn search_files(
    root: String,
    needle: String,
    use_ignore_file: bool,
) -> Result<Vec<TreeItemData>, String> {
    let mut builder = WalkBuilder::new(&root);
    if !use_ignore_file {
        builder.git_ignore(false).ignore(false).parents(false);
    }
    let mut hits = Vec::new();
    for dent in builder.build() {
        let dent = dent.map_err(|e| e.to_string())?;
        if !dent
            .file_name()
            .to_string_lossy()
            .to_lowercase()
            .contains(&needle.to_lowercase())
        {
            continue;
        }
        let meta = dent.metadata().map_err(|e| e.to_string())?;
        if meta.is_dir() {
            continue;
        }
        hits.push(TreeItemData {
            id: dent.path().display().to_string(),
            name: dent.file_name().to_string_lossy().into_owned(),
            path: dent.path().display().to_string(),
            is_directory: false,
            children: Vec::new(),
            loaded_children: true,
        });
    }
    Ok(hits)
}
#[tauri::command]
pub fn start_watch(path: String, window: tauri::Window) -> Result<(), String> {
    let (tx, rx) = channel::<Result<Event, notify::Error>>();
    let mut watcher: RecommendedWatcher =
        Watcher::new(tx, notify::Config::default()).map_err(|e| e.to_string())?;
    watcher
        .watch(Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;
    thread::spawn(move || {
        for evt in rx {
            if let Ok(ev) = evt {
                let _ = window.emit("fs_change", ev.paths);
            }
        }
    });
    Ok(())
}
