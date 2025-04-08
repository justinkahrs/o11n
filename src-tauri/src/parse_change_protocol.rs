use crate::change_types::{Action, Change, FileChange};
use anyhow::{anyhow, Result};
use std::path::PathBuf;

pub fn parse_change_protocol(xml_protocol: &str) -> Result<Vec<FileChange>> {
    let mut file_changes: Vec<FileChange> = Vec::new();
    let mut current_file_path: Option<String> = None;
    let mut current_action: Option<Action> = None;
    let mut current_changes: Vec<Change> = Vec::new();

    // Variables for the current change block
    let mut current_description = String::new();
    let mut current_search: Option<String> = None;
    let mut current_content = String::new();
    let mut reading_field: Option<String> = None; // "description", "search", "content"
    let mut in_code_block = false;
    let mut code_field: Option<String> = None;
    let mut code_lines: Vec<String> = Vec::new();

    // Remove surrounding <pre> tags if present
    let stripped = xml_protocol.replace("<pre>", "").replace("</pre>", "");
    let lines: Vec<&str> = stripped.lines().collect();
    log::debug!("Stripped {}", stripped);

    for line in lines {
        let line = line.trim_end();
        // Skip empty lines and horizontal rules
        if line.trim().is_empty() || line.trim() == "---" {
            continue;
        }

        // Detect file block header
        if line.starts_with("### File ") {
            // Finalize previous change block if exists
            if !current_description.is_empty()
                || current_search.is_some()
                || !current_content.is_empty()
            {
                current_changes.push(Change {
                    description: current_description.trim().to_string(),
                    search: current_search.clone(),
                    content: current_content.trim().to_string(),
                });
                current_description.clear();
                current_search = None;
                current_content.clear();
                reading_field = None;
            }
            // Finalize previous file block if exists
            if let Some(file_path) = current_file_path.take() {
                if current_action.is_none() {
                    return Err(anyhow!("Missing action for file: {}", file_path));
                }
                file_changes.push(FileChange {
                    path: PathBuf::from(file_path),
                    action: current_action.clone().unwrap(),
                    changes: current_changes.clone(),
                });
                current_changes.clear();
                current_action = None;
            }
            // Set new file path
            let file_path = line.strip_prefix("### File ").unwrap().trim().to_string();
            current_file_path = Some(file_path);
            continue;
        }

        // Detect action header
        if line.starts_with("### Action ") {
            let action_str = line.strip_prefix("### Action ").unwrap().trim();
            current_action = Some(match action_str {
                "modify" => Action::Modify,
                "rewrite" => Action::Rewrite,
                "create" => Action::Create,
                "delete" => Action::Delete,
                other => return Err(anyhow!("Unknown action: {}", other)),
            });
            continue;
        }

        // Detect change block header
        if line.starts_with("#### Change") {
            // Finalize previous change block if exists
            if !current_description.is_empty()
                || current_search.is_some()
                || !current_content.is_empty()
            {
                current_changes.push(Change {
                    description: current_description.trim().to_string(),
                    search: current_search.clone(),
                    content: current_content.trim().to_string(),
                });
                current_description.clear();
                current_search = None;
                current_content.clear();
                reading_field = None;
            }
            continue;
        }

        // Detect field markers
        if line.starts_with("**Description**:") {
            reading_field = Some("description".to_string());
            let desc = line.strip_prefix("**Description**:").unwrap().trim();
            current_description.push_str(desc);
            continue;
        }
        if line.starts_with("**Search**:") {
            reading_field = Some("search".to_string());
            continue;
        }
        if line.starts_with("**Content**:") {
            reading_field = Some("content".to_string());
            continue;
        }

        // Handle code block markers
        if line.starts_with("```") {
            if !in_code_block {
                // Start of a code block
                in_code_block = true;
                code_field = reading_field.clone(); // should be "search" or "content"
                code_lines.clear();
            } else {
                // End of a code block
                in_code_block = false;
                let code = code_lines.join("\n");
                if let Some(field) = code_field.clone() {
                    if field == "search" {
                        current_search = Some(code);
                    } else if field == "content" {
                        current_content = code;
                    }
                }
                code_field = None;
                reading_field = None;
            }
            continue;
        }

        // Accumulate lines within a code block
        if in_code_block {
            code_lines.push(line.to_string());
            continue;
        }

        // Append to description if reading description
        if let Some(field) = reading_field.clone() {
            if field == "description" {
                if !current_description.is_empty() {
                    current_description.push_str("\n");
                }
                current_description.push_str(line);
            }
        }
    }

    // Finalize any pending change block
    if !current_description.is_empty() || current_search.is_some() || !current_content.is_empty() {
        current_changes.push(Change {
            description: current_description.trim().to_string(),
            search: current_search.clone(),
            content: current_content.trim().to_string(),
        });
    }

    // Finalize last file block if exists
    if let Some(file_path) = current_file_path.take() {
        if current_action.is_none() {
            return Err(anyhow!("Missing action for file: {}", file_path));
        }
        file_changes.push(FileChange {
            path: PathBuf::from(file_path),
            action: current_action.clone().unwrap(),
            changes: current_changes.clone(),
        });
    }

    Ok(file_changes)
}
