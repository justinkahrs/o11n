use anyhow::{anyhow, Context, Result};
use quick_xml::events::Event;
use quick_xml::name::QName;
use quick_xml::Reader;
use crate::change_types::{Change, Action, FileChange};

pub fn parse_change_protocol(xml_input: &str) -> Result<Vec<FileChange>> {
    log::debug!("Starting parse_change_protocol");
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
        
        // Skip any <Plan> elements entirely
        if let Event::Start(ref evt) = event {
            if evt.name() == QName(b"Plan") {
                log::debug!("Skipping <Plan> block");
                reader.read_to_end(QName(b"Plan"))?;
                continue;
            }
        }
        if let Event::End(ref evt) = event {
            if evt.name() == QName(b"Plan") {
                log::debug!("Skipping </Plan> block");
                continue;
            }
        }
        
        log::debug!("Event: {:?}", event);
        match event {
            Event::Start(evt) => {
                let e = evt.into_owned();
                let tag_name = String::from_utf8_lossy(e.name().as_ref()).to_string();
                log::debug!("Start tag: {}", tag_name);
                match tag_name.as_str() {
                    "file" => {
                        let mut path_val = String::new();
                        let mut action_val = String::new();
                        for attr in e.attributes() {
                            let attr = attr?;
                            let key = String::from_utf8_lossy(attr.key.as_ref()).to_string();
                            let val = String::from_utf8_lossy(attr.value.as_ref()).to_string();
                            log::debug!("Attribute: {} = {}", key, val);
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
                        log::debug!("Starting a new change block");
                        current_description.clear();
                        current_search = None;
                        current_content.clear();
                    }
                    "description" => {
                        log::debug!("Entering description block");
                        in_description_block = true;
                    }
                    "search" => {
                        log::debug!("Entering search block");
                        in_search_block = true;
                        current_search = Some(String::new());
                    }
                    "content" => {
                        log::debug!("Entering content block");
                        in_content_block = true;
                        current_content.clear();
                    }
                    other_tag => {
                        log::debug!("Encountered unknown start tag: {}", other_tag);
                    }
                }
            }
            Event::Text(e) => {
                let txt = e.unescape()?.into_owned();
                log::debug!("Text event: {}", txt);
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
            Event::End(evt) => {
                let e = evt.into_owned();
                let end_tag = String::from_utf8_lossy(e.name().as_ref()).to_string();
                log::debug!("End tag: {}", end_tag);
                match end_tag.as_str() {
                    "file" => {
                        let fc = FileChange {
                            path: std::path::PathBuf::from(current_file_path.clone().unwrap()),
                            action: current_action.clone().unwrap(),
                            changes: current_changes.clone(),
                        };
                        log::debug!("Completed file change for path: {:?}", fc.path);
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
                        log::debug!("Completed change: {}", ch.description);
                        current_changes.push(ch);
                    }
                    "description" => {
                        log::debug!("Exiting description block");
                        in_description_block = false;
                    }
                    "search" => {
                        log::debug!("Exiting search block");
                        in_search_block = false;
                        if let Some(ref mut s) = current_search {
                            *s = s
                                .lines()
                                .filter(|l| l.trim() != "===")
                                .collect::<Vec<&str>>()
                                .join("\n");
                        }
                    }
                    "content" => {
                        log::debug!("Exiting content block");
                        in_content_block = false;
                        current_content = current_content
                            .lines()
                            .filter(|l| l.trim() != "===")
                            .collect::<Vec<&str>>()
                            .join("\n");
                    }
                    other_end => {
                        log::debug!("Encountered unknown end tag: {}", other_end);
                    }
                }
            }
            Event::Eof => {
                log::debug!("Reached end of XML input");
                break;
            }
            other => {
                log::debug!("Other event: {:?}", other);
            }
        }
    }

    log::debug!("Finished parsing XML. Total file changes: {}", file_changes.len());
    if file_changes.is_empty() {
        log::warn!("No file changes were found in the XML input. Parsed file changes: {:?}", file_changes);
    } else {
        log::debug!("Parsed file changes: {:?}", file_changes);
    }
    Ok(file_changes)
}