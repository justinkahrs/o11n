use crate::apply_file_change::apply_file_change;
use crate::change_types::{FileError, FileSuccess};
use crate::parse_change_protocol::parse_change_protocol;
use anyhow::{Context, Result};
use sentry;
use std::env;

pub fn apply_changes(xml_protocol: &str) -> Result<(Vec<FileSuccess>, Vec<FileError>)> {
    let cwd = env::current_dir().context("Failed to get current working directory")?;
    log::debug!("Current working directory: {}", cwd.display());

    let parsed = parse_change_protocol(xml_protocol)
        .context("Failed to parse the change management protocol XML")?;
    log::debug!("Parsed {} FileChange entries: {:#?}", parsed.len(), parsed);

    let mut file_success = Vec::new();
    let mut file_errors = Vec::new();

    for fc in parsed {
        log::debug!(
            "Applying FileChange: path={}, action={:?}",
            fc.path.display(),
            fc.action
        );

        // 1) call the file-change fn, 2) if it Errs, wrap it once with your file path
        let result = apply_file_change(&fc)
            .map_err(|e| e.context(format!("While applying change to '{}'", fc.path.display())));

        match result {
            Ok(_) => {
                file_success.push(FileSuccess {
                    path: fc.path.clone(),
                    messages: vec!["Success".to_string()],
                });
            }
            Err(err) => {
                // report to Sentry that root_cause, but keep the full chain for our payload
                sentry::capture_error(err.root_cause());

                // Gather *all* layers of the chain into strings
                let messages: Vec<String> = err.chain().map(|cause| cause.to_string()).collect();

                file_errors.push(FileError {
                    path: fc.path.clone(),
                    messages,
                });
            }
        }
    }

    Ok((file_success, file_errors))
}
