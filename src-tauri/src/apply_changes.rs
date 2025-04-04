use anyhow::{Context, Result};
use crate::parse_change_protocol::parse_change_protocol;
use crate::apply_file_change::apply_file_change;

pub fn apply_changes(xml_protocol: &str, reverse: bool) -> Result<()> {
    let cwd = std::env::current_dir().context("Failed to get current working directory")?;
    log::debug!("Current working directory: {}", cwd.display());
    let parsed = parse_change_protocol(xml_protocol)
        .context("Failed to parse the change management protocol XML")?;

    for fc in parsed {
        apply_file_change(&fc, reverse)
            .context(format!("Failed applying changes to file: {:?}", fc.path))?;
    }

    Ok(())
}