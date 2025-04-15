use std::fs;
use tauri::command;
use tiktoken_rs::o200k_base;
#[command]
pub fn count_tokens_path(path: &str) -> Result<String, String> {
    let content = fs::read_to_string(path).map_err(|e| format!("Failed to read file: {}", e))?;
    let bpe = o200k_base().map_err(|e| format!("Failed to load tokenizer: {}", e))?;
    let tokens = bpe.encode_with_special_tokens(&content);
    Ok(format!("{}", tokens.len()))
}
#[command]
pub fn count_tokens(content: &str) -> Result<String, String> {
    let bpe = o200k_base().map_err(|e| format!("Failed to load tokenizer: {}", e))?;
    let tokens = bpe.encode_with_special_tokens(content);
    Ok(format!("{}", tokens.len()))
}
