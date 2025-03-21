use anyhow::{anyhow, Context, Result};
use quick_xml::events::Event;
use quick_xml::Reader;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone)]
struct Change {
    description: String,
    search: Option<String>,
    content: String,
}

#[derive(Clone)]
enum Action {
    Modify,
    Rewrite,
    Create,
    Delete,
}

#[derive(Clone)]
struct FileChange {
    path: PathBuf,
    action: Action,
    changes: Vec<Change>,
}

/// Parse the entire XML protocol to retrieve an ordered list of file changes.
fn parse_change_protocol(xml_input: &str) -> Result<Vec<FileChange>> {
    let mut reader = Reader::from_str(xml_input);
    reader.trim_text(true);

    let mut file_changes = Vec::new();
    let mut current_file_path = None;
    let mut current_action = None;
    let mut current_changes: Vec<Change> = Vec::new();

    let mut current_description = String::new();
    let mut current_search = None;
    let mut current_content = String::new();

    let mut in_description_block = false;
    let mut in_search_block = false;
    let mut in_content_block = false;

    loop {
        let event = reader.read_event()?;
        match event {
            Event::Start(evt) => {
                let e = evt.into_owned();
                let tag_name = String::from_utf8_lossy(e.name().as_ref()).to_string();

                match tag_name.as_str() {
                    "file" => {
                        // Extract path=, action= from attributes
                        let mut path_val = String::new();
                        let mut action_val = String::new();
                        for attr in e.attributes() {
                            let attr = attr?;
                            let key_bytes = attr.key.as_ref();
                            let val_bytes = attr.value.as_ref();
                            let key = String::from_utf8_lossy(key_bytes).to_string();
                            let val = String::from_utf8_lossy(val_bytes).to_string();
                            match key.as_str() {
                                "path" => path_val = val,
                                "action" => action_val = val,
                                _ => {}
                            }
                        }
                        current_file_path = Some(path_val);
                        current_action = Some(match action_val.as_str() {
                            "modify" => Action::Modify,
                            "rewrite" => Action::Rewrite,
                            "create" => Action::Create,
                            "delete" => Action::Delete,
                            other => {
                                return Err(anyhow!("Unknown action: {}", other));
                            }
                        });
                        current_changes.clear();
                    }
                    "change" => {
                        current_description.clear();
                        current_search = None;
                        current_content.clear();
                    }
                    "description" => {
                        in_description_block = true;
                    }
                    "search" => {
                        in_search_block = true;
                        current_search = Some(String::new());
                    }
                    "content" => {
                        in_content_block = true;
                        current_content.clear();
                    }
                    _ => {}
                }
            }
            Event::Text(e) => {
                let txt = e.unescape()?.into_owned();
                if in_description_block {
                    current_description.push_str(&txt);
                } else if in_search_block {
                    if let Some(ref mut s) = current_search {
                        s.push_str(&txt);
                    }
                } else if in_content_block {
                    current_content.push_str(&txt);
                }
                // Start of Selection
            }
            Event::End(evt) => {
                let e = evt.into_owned();
                let end_tag = String::from_utf8_lossy(e.name().as_ref()).to_string();
                match end_tag.as_str() {
                    "file" => {
                        let fc = FileChange {
                            path: PathBuf::from(current_file_path.clone().unwrap()),
                            action: current_action.clone().unwrap(),
                            changes: current_changes.clone(),
                        };
                        file_changes.push(fc);

                        current_file_path = None;
                        current_action = None;
                        current_changes.clear();
                    }
                    "change" => {
                        let ch = Change {
                            description: current_description.clone(),
                            search: current_search.clone(),
                            content: current_content.clone(),
                        };
                        current_changes.push(ch);
                    }
                    "description" => {
                        in_description_block = false;
                    }
                    "search" => {
                        in_search_block = false;
                    }
                    "content" => {
                        in_content_block = false;
                    }
                    _ => {}
                }
            }
            Event::Eof => {
                break;
            }
            _ => {}
        }
    }

    Ok(file_changes)
}

/// Apply one complete FileChange to disk: "modify", "rewrite", "create", or "delete"
fn apply_file_change(file_change: &FileChange) -> Result<()> {
    match file_change.action {
        Action::Modify => {
            let mut original_contents = fs::read_to_string(&file_change.path)
                .context(format!("Could not read file: {:?}", file_change.path))?;

            log::debug!(
                "Current contents of {:?}: \n{}",
                file_change.path,
                original_contents
            );
            for chg in &file_change.changes {
                let search_text = match &chg.search {
                    Some(s) => s,
                    None => return Err(anyhow!("Missing <search> block in modify action")),
                };
                let content_text = &chg.content;

                log::info!(
                    "Applying change: {}. Searching for: '{}'",
                    chg.description,
                    search_text
                );

                let normalized_contents = original_contents.replace("\r\n", "\n");
                let normalized_search = search_text.replace("\r\n", "\n");
                if let Some(pos) = normalized_contents.find(&normalized_search) {
                    log::info!(
                        "Found search text at position {}. Replacing with: '{}'",
                        pos,
                        content_text
                    );
                    original_contents.replace_range(pos..pos + search_text.len(), content_text);
                } else {
                    log::error!(
                        "Search block not found in file {:?}:\n{}",
                        file_change.path,
                        search_text
                    );
                    return Err(anyhow!(
                        "Search block not found in file {:?}:\n{}",
                        file_change.path,
                        search_text
                    ));
                }
            }

            fs::write(&file_change.path, original_contents)
                .context(format!("Could not write file: {:?}", file_change.path))?;
        }
        Action::Rewrite => {
            let mut final_contents = String::new();
            for chg in &file_change.changes {
                final_contents.push_str(&chg.content);
            }
            fs::write(&file_change.path, final_contents)
                .context(format!("Could not rewrite file: {:?}", file_change.path))?;
        }
        Action::Create => {
            if file_change.path.exists() {
                return Err(anyhow!("File already exists: {:?}", file_change.path));
            }
            let mut new_contents = String::new();
            for chg in &file_change.changes {
                new_contents.push_str(&chg.content);
            }
            fs::write(&file_change.path, new_contents)
                .context(format!("Could not create file: {:?}", file_change.path))?;
        }
        Action::Delete => {
            if file_change.path.exists() {
                fs::remove_file(&file_change.path)
                    .context(format!("Could not delete file: {:?}", file_change.path))?;
            } else {
                return Err(anyhow!(
                    "Cannot delete, file does not exist: {:?}",
                    file_change.path
                ));
            }
        }
    }

    Ok(())
}

/// Main entry function to parse an XML protocol and apply each <file> block in sequence.
pub fn apply_changes(xml_protocol: &str) -> Result<()> {
    let parsed = parse_change_protocol(xml_protocol)
        .context("Failed to parse the change management protocol XML")?;

    for fc in parsed {
        apply_file_change(&fc)
            .context(format!("Failed applying changes to file: {:?}", fc.path))?;
    }

    Ok(())
}
