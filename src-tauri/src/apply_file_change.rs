use crate::change_types::{Action, FileChange};
use anyhow::{anyhow, Context, Result};
use std::fs;

pub fn apply_file_change(file_change: &FileChange, reverse: bool) -> Result<()> {
    let resolved_path = if file_change.path.is_relative() {
        let cwd = std::env::current_dir().context("Failed to get current working directory")?;
        if let Some(project_root) = cwd.parent() {
            project_root.join(&file_change.path)
        } else {
            file_change.path.clone()
        }
    } else {
        file_change.path.clone()
    };
    match file_change.action {
        Action::Modify => {
            log::debug!("Attempting to read file: {}", resolved_path.display());
            let mut original_contents = match fs::read_to_string(&resolved_path) {
                Ok(contents) => {
                    log::debug!(
                        "Successfully read file: {} ({} bytes)",
                        resolved_path.display(),
                        contents.len()
                    );
                    contents
                }
                Err(e) => {
                    log::error!(
                        "Could not read file: {}. Error: {}",
                        resolved_path.display(),
                        e
                    );
                    return Err(e)
                        .context(format!("Could not read file: {}", resolved_path.display()));
                }
            };

            log::debug!(
                "Current contents of {}: \n{}",
                resolved_path.display(),
                original_contents
            );
            for chg in &file_change.changes {
                let (find_text, replace_text) = if reverse {
                    match &chg.search {
                        Some(s) => (chg.content.clone(), s.clone()),
                        None => {
                            return Err(anyhow!(
                                "Missing <search> block in modify action for reversal"
                            ))
                        }
                    }
                } else {
                    match &chg.search {
                        Some(s) => (s.clone(), chg.content.clone()),
                        None => return Err(anyhow!("Missing <search> block in modify action")),
                    }
                };

                log::info!(
                    "Applying change: {}. Searching for: '{}'",
                    chg.description,
                    find_text
                );

                let normalized_contents = original_contents.replace("\r\n", "\n");
                let normalized_find = find_text.replace("\r\n", "\n");
                if let Some(pos) = normalized_contents.find(&normalized_find) {
                    log::info!(
                        "Found search text at position {}. Replacing with: '{}'",
                        pos,
                        replace_text
                    );
                    original_contents.replace_range(pos..pos + find_text.len(), &replace_text);
                } else {
                    log::error!(
                        "Search block not found in file {}:\n{}",
                        resolved_path.display(),
                        find_text
                    );
                    return Err(anyhow!(
                        "Search block not found in file {}:\n{}",
                        resolved_path.display(),
                        find_text
                    ));
                }
            }

            log::debug!(
                "Attempting to write file: {} (new content length: {})",
                resolved_path.display(),
                original_contents.len()
            );
            fs::write(&resolved_path, original_contents)
                .context(format!("Could not write file: {}", resolved_path.display()))?;
            log::info!(
                "Successfully wrote changes to file: {}",
                resolved_path.display()
            );
        }
        Action::Rewrite => {
            let mut final_contents = String::new();
            for chg in &file_change.changes {
                let part = if reverse {
                    match &chg.search {
                        Some(s) if !s.is_empty() => s.clone(),
                        _ => chg.content.clone(),
                    }
                } else {
                    chg.content.clone()
                };
                final_contents.push_str(&part);
            }
            log::debug!(
                "Attempting to rewrite file: {} (new content length: {})",
                resolved_path.display(),
                final_contents.len()
            );
            fs::write(&resolved_path, final_contents).context(format!(
                "Could not rewrite file: {}",
                resolved_path.display()
            ))?;
            log::info!("Successfully rewrote file: {}", resolved_path.display());
        }
        Action::Create => {
            if reverse {
                if resolved_path.exists() {
                    fs::remove_file(&resolved_path).context(format!(
                        "Could not delete file: {}",
                        resolved_path.display()
                    ))?;
                    log::info!(
                        "Successfully reverted creation by deleting file: {}",
                        resolved_path.display()
                    );
                }
            } else {
                if resolved_path.exists() {
                    return Err(anyhow!("File already exists: {}", resolved_path.display()));
                }
                let mut new_contents = String::new();
                for chg in &file_change.changes {
                    new_contents.push_str(&chg.content);
                }
                log::debug!(
                    "Attempting to create file: {} (content length: {})",
                    resolved_path.display(),
                    new_contents.len()
                );
                fs::write(&resolved_path, new_contents).context(format!(
                    "Could not create file: {}",
                    resolved_path.display()
                ))?;
                log::info!("Successfully created file: {}", resolved_path.display());
            }
        }
        Action::Delete => {
            if reverse {
                let mut new_contents = String::new();
                for chg in &file_change.changes {
                    new_contents.push_str(&chg.content);
                }
                fs::write(&resolved_path, new_contents).context(format!(
                    "Could not recreate file: {}",
                    resolved_path.display()
                ))?;
                log::info!(
                    "Successfully reverted deletion by recreating file: {}",
                    resolved_path.display()
                );
            } else {
                if resolved_path.exists() {
                    log::debug!("Attempting to delete file: {}", resolved_path.display());
                    fs::remove_file(&resolved_path).context(format!(
                        "Could not delete file: {}",
                        resolved_path.display()
                    ))?;
                    log::info!("Successfully deleted file: {}", resolved_path.display());
                } else {
                    return Err(anyhow!(
                        "Cannot delete, file does not exist: {}",
                        resolved_path.display()
                    ));
                }
            }
        }
    }

    Ok(())
}
