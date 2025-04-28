use crate::apply_file_change::apply_file_change;
use crate::parse_change_protocol::parse_change_protocol;
use anyhow::{Context, Result};

pub fn apply_changes(xml_protocol: &str) -> Result<()> {
    let cwd = std::env::current_dir().context("Failed to get current working directory")?;
    log::debug!("Current working directory: {}", cwd.display());
    let parsed = parse_change_protocol(xml_protocol)
        .context("Failed to parse the change management protocol XML")?;

    log::debug!("Parsed {} FileChange entries: {:#?}", parsed.len(), parsed);
    for fc in parsed {
        log::debug!(
            "Applying FileChange: path={:?}, action={:?}, changes={:#?}",
            fc.path,
            fc.action,
            fc.changes
        );
        match apply_file_change(&fc).context(format!(
            "Failed applying changes to file: {:?}, action: {:?}, changes: {:#?}",
            fc.path, fc.action, fc.changes
        )) {
            Ok(_) => {}
            Err(e) => {
                sentry::capture_error(&*e);
                return Err(e);
            }
        }
    }

    Ok(())
}
