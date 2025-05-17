use crate::apply_file_change::apply_file_change;
use crate::change_types::FileError;
use crate::change_types::FileSuccess;
use crate::parse_change_protocol::parse_change_protocol;
use anyhow::{Context, Result};

pub fn apply_changes(xml_protocol: &str) -> Result<(Vec<FileSuccess>, Vec<FileError>)> {
    let cwd = std::env::current_dir().context("Failed to get current working directory")?;
    log::debug!("Current working directory: {}", cwd.display());
    let parsed = parse_change_protocol(xml_protocol)
        .context("Failed to parse the change management protocol XML")?;
    let mut file_errors: Vec<FileError> = Vec::new();
    let mut file_success: Vec<FileSuccess> = Vec::new();

    log::debug!("Parsed {} FileChange entries: {:#?}", parsed.len(), parsed);
    for fc in parsed {
        log::debug!(
            "Applying FileChange: path={:?}, action={:?}, changes={:#?}",
            fc.path,
            fc.action,
            fc.changes
        );
        match apply_file_change(&fc).context(format!("{:?}", fc.path)) {
            Ok(_) => {
                file_success.push(FileSuccess {
                    path: fc.path.clone(),
                    messages: vec!["Success".to_string()],
                });
            }
            Err(e) => {
                sentry::capture_error(&*e);
                let msg: String = e
                    .to_string()
                    .chars()
                    .filter(|c| !c.is_whitespace())
                    .collect();
                file_errors.push(FileError {
                    path: fc.path.clone(),
                    messages: vec![msg],
                });
            }
        }
    }

    Ok((file_success, file_errors))
}
