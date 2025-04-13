use crate::change_types::{Action, Change, FileChange};
use anyhow::{anyhow, Context, Result};
use log::debug;
use regex::escape as regex_escape;
use regex::Regex;
use std::fs;
use std::path::PathBuf;

fn resolve_file_path(path: &PathBuf) -> Result<PathBuf> {
    if path.is_relative() {
        let cwd = std::env::current_dir().context("Failed to get current working directory")?;
        if let Some(project_root) = cwd.parent() {
            Ok(project_root.join(path))
        } else {
            Ok(path.clone())
        }
    } else {
        Ok(path.clone())
    }
}

fn apply_change_to_content(content: &str, find_text: &str, replacement: &str) -> Result<String> {
    debug!("apply_change_to_content - Start");
    debug!("apply_change_to_content - find_text:\n{}\n", find_text);
    debug!("apply_change_to_content - replacement:\n{}\n", replacement);

    if let Some(start) = content.find(find_text) {
        debug!(
            "apply_change_to_content - Found exact substring at index: {}",
            start
        );
        let end = start + find_text.len();
        let mut new_content = content.to_string();
        new_content.replace_range(start..end, replacement);
        debug!("apply_change_to_content - Exact substring replacement succeeded");
        return Ok(new_content);
    } else {
        debug!("apply_change_to_content - Exact substring not found, attempting fallback");
    }

    let tokens: Vec<String> = find_text
        .split_whitespace()
        .map(|t| regex_escape(t))
        .collect();

    let pattern = format!("(?s)\\s*{}\\s*", tokens.join(r"\s+"));
    debug!(
        "apply_change_to_content - Fallback regex pattern: {}",
        pattern
    );

    let re = Regex::new(&pattern)?;
    if let Some(mat) = re.find(content) {
        debug!(
            "apply_change_to_content - Fallback regex match found at {}..{}",
            mat.start(),
            mat.end()
        );
        let start = mat.start();
        let end = mat.end();
        let mut new_content = content.to_string();
        new_content.replace_range(start..end, replacement);
        debug!("apply_change_to_content - Fallback regex replacement succeeded");
        return Ok(new_content);
    }

    debug!("apply_change_to_content - Search block not found via fallback regex");
    Err(anyhow!("Search block not found"))
}

fn apply_modification_changes(original: &str, changes: &[Change]) -> Result<String> {
    let mut content = original.to_owned();
    for (i, chg) in changes.iter().enumerate() {
        debug!("apply_modification_changes - Applying change #{}", i + 1);
        let search_str = match &chg.search {
            Some(s) => s,
            None => return Err(anyhow!("Missing <search> block in modify action")),
        };
        content = apply_change_to_content(&content, search_str, &chg.content)?;
    }
    Ok(content)
}

fn aggregate_changes(changes: &[Change]) -> String {
    changes.iter().map(|chg| chg.content.clone()).collect()
}

pub fn apply_file_change(file_change: &FileChange) -> Result<()> {
    debug!("apply_file_change - Action: {:?}", file_change.action);
    debug!("apply_file_change - Path: {:?}", file_change.path);

    let resolved_path = resolve_file_path(&file_change.path)?;
    debug!(
        "apply_file_change - Resolved path: {}",
        resolved_path.display()
    );

    match file_change.action {
        Action::Modify => {
            let original_contents = fs::read_to_string(&resolved_path)
                .context(format!("Could not read file: {}", resolved_path.display()))?;
            debug!(
                "apply_file_change - Original file contents length: {}",
                original_contents.len()
            );
            let modified_contents =
                apply_modification_changes(&original_contents, &file_change.changes)?;
            fs::write(&resolved_path, modified_contents)
                .context(format!("Could not write file: {}", resolved_path.display()))?;
        }
        Action::Rewrite => {
            let final_contents = aggregate_changes(&file_change.changes);
            if final_contents.trim().is_empty() {
                return Err(anyhow!(
                    "Malformed plan protocol: rewritten file is empty. Change reverted."
                ));
            }
            fs::write(&resolved_path, final_contents).context(format!(
                "Could not rewrite file: {}",
                resolved_path.display()
            ))?;
        }
        Action::Create => {
            if resolved_path.exists() {
                return Err(anyhow!("File already exists: {}", resolved_path.display()));
            }
            if let Some(parent) = resolved_path.parent() {
                fs::create_dir_all(parent).context(format!(
                    "Could not create directories for: {}",
                    resolved_path.display()
                ))?;
            }
            let new_contents = aggregate_changes(&file_change.changes);
            fs::write(&resolved_path, new_contents).context(format!(
                "Could not create file: {}",
                resolved_path.display()
            ))?;
        }
        Action::Delete => {
            if resolved_path.exists() {
                fs::remove_file(&resolved_path).context(format!(
                    "Could not delete file: {}",
                    resolved_path.display()
                ))?;
            } else {
                return Err(anyhow!(
                    "Cannot delete, file does not exist: {}",
                    resolved_path.display()
                ));
            }
        }
    }
    debug!("apply_file_change - Completed successfully");
    Ok(())
}
