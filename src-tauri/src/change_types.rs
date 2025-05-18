use serde::Serialize;
use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct Change {
    pub description: String,
    pub search: Option<String>,
    pub content: String,
}

#[derive(Debug, Clone)]
pub enum Action {
    Modify,
    Rewrite,
    Create,
    Delete,
}

#[derive(Debug, Clone)]
pub struct FileChange {
    pub path: PathBuf,
    pub action: Action,
    pub changes: Vec<Change>,
}
#[derive(Debug, Clone, Serialize)]
pub struct FileError {
    pub path: PathBuf,
    pub messages: Vec<String>,
}
#[derive(Debug, Clone, Serialize)]
pub struct FileSuccess {
    pub path: PathBuf,
    pub messages: Vec<String>,
}
