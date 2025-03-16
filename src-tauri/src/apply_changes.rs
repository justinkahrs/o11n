use anyhow::{Context, Result};
use quick_xml::Reader;
use quick_xml::events::{BytesStart, Event};
use std::fs;
use std::path::PathBuf;

/// A single edit request inside a <change> element
#[derive(Debug)]
struct Change {
    description: String,
    search: Option<String>,
    content: String,
}

/// The type of action: "modify", "rewrite", "create", or "delete"
#[derive(Debug)]
enum Action {
    Modify,
    Rewrite,
    Create,
    Delete,
}

/// A file-level instruction from the protocol, e.g. <file path=".." action="..">
#[derive(Debug)]
struct FileChange {
    path: PathBuf,
    action: Action,
    changes: Vec<Change>,
}

/// Parse the entire XML protocol to retrieve an ordered list of file changes.
fn parse_change_protocol(xml_input: &str) -> Result<Vec<FileChange>> {
    let mut reader = Reader::from_str(xml_input);
    reader.trim_text(true);

    let mut buf = Vec::new();
    let mut file_changes = Vec::new();

    let mut current_file_path = None;
    let mut current_action = None;
    let mut current_changes = Vec::new();

    let mut current_description = String::new();
    let mut current_search = None;
    let mut current_content = String::new();

    let mut in_change_block = false;
    let mut in_description_block = false;
    let mut in_search_block = false;
    let mut in_content_block = false;

    while let Ok(event) = reader.read_event(&mut buf) {
        match event {
            Event::Start(e) => {
                let tag_name = String::from_utf8_lossy(e.name()).to_string();
                match tag_name.as_str() {
                    "file" => {
                        // Extract path=, action= from attributes
                        let mut path_val = String::new();
                        let mut action_val = String::new();
                        for attr in e.attributes() {
                            let attr = attr?;
                            let key = String::from_utf8_lossy(attr.key.as_ref()).to_string();
                            let val = String::from_utf8_lossy(&attr.value).to_string();
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
                            _ => return Err(anyhow::anyhow!("Unknown action: {}", action_val))
                        });
                        current_changes.clear();
                    }
                    "change" => {
                        in_change_block = true;
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
                let txt = e.unescape_and_decode(&reader)?;
                if in_description_block {
                    current_description.push_str(&txt);
                } else if in_search_block {
                    if let Some(ref mut s) = current_search {
                        s.push_str(&txt);
                    }
                } else if in_content_block {
                    current_content.push_str(&txt);
                }
            }
            Event::End(e) => {
                let tag_name = String::from_utf8_lossy(e.name()).to_string();
                match tag_name.as_str() {
                    "file" => {
                        // End of file block
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
                        in_change_block = false;
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
            Event::Eof => break,
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
                .with_context(|| format!("Could not read file: {:?}", file_change.path))?;

            for chg in &file_change.changes {
                let search_text = match &chg.search {
                    Some(s) => s,
                    None => return Err(anyhow::anyhow!("Missing <search> block in modify action")),
                };
                let content_text = &chg.content;

                if let Some(pos) = original_contents.find(search_text) {
                    original_contents.replace_range(pos..pos + search_text.len(), content_text);
                } else {
                    return Err(anyhow::anyhow!(
                        "Search block not found in file {:?}:\n{}",
                        file_change.path, search_text
                    ));
                }
            }
            fs::write(&file_change.path, original_contents)
                .with_context(|| format!("Could not write file: {:?}", file_change.path))?;
        }
        Action::Rewrite => {
            let mut final_contents = String::new();
            for chg in &file_change.changes {
                final_contents.push_str(&chg.content);
            }
            fs::write(&file_change.path, final_contents)
                .with_context(|| format!("Could not rewrite file: {:?}", file_change.path))?;
        }
        Action::Create => {
            if file_change.path.exists() {
                return Err(anyhow::anyhow!("File already exists: {:?}", file_change.path));
            }
            let mut new_contents = String::new();
            for chg in &file_change.changes {
                new_contents.push_str(&chg.content);
            }
            fs::write(&file_change.path, new_contents)
                .with_context(|| format!("Could not create file: {:?}", file_change.path))?;
        }
        Action::Delete => {
            if file_change.path.exists() {
                fs::remove_file(&file_change.path)
                    .with_context(|| format!("Could not delete file: {:?}", file_change.path))?;
            } else {
                return Err(anyhow::anyhow!(
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
            .with_context(|| format!("Failed applying changes to file: {:?}", fc.path))?;
    }

    Ok(())
}