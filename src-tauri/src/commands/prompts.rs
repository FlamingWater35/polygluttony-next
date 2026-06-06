//! Prompt customization commands (Settings view). Thin wrappers over
//! `crate::prompts` — validation and resolution live there.

use std::path::PathBuf;

use tauri::AppHandle;

use crate::error::{AppError, AppResult};
use crate::prompts::{self, PromptId, PromptMeta};

#[tauri::command]
pub fn list_prompts(app: AppHandle) -> AppResult<Vec<PromptMeta>> {
    Ok(prompts::list_meta(&prompts::overrides_dir(&app)?))
}

#[tauri::command]
pub fn get_prompt(app: AppHandle, id: PromptId) -> AppResult<String> {
    prompts::resolve(id, &prompts::overrides_dir(&app)?)
}

#[tauri::command]
pub fn save_prompt(app: AppHandle, id: PromptId, text: String) -> AppResult<()> {
    save_prompt_in(&prompts::overrides_dir(&app)?, id, &text)
}

#[tauri::command]
pub fn reset_prompt(app: AppHandle, id: PromptId) -> AppResult<String> {
    reset_prompt_in(&prompts::overrides_dir(&app)?, id)
}

/// Imports are plain-text prompt files; anything bigger than this is a mis-pick.
const MAX_IMPORT_BYTES: u64 = 1024 * 1024;

#[tauri::command]
pub fn read_prompt_file(path: String) -> AppResult<String> {
    let p = PathBuf::from(&path);
    let meta = std::fs::metadata(&p)?;
    if meta.len() > MAX_IMPORT_BYTES {
        return Err(AppError::Other(
            "that file is larger than 1 MB — prompts are small plain-text files".into(),
        ));
    }
    std::fs::read_to_string(&p)
        .map_err(|e| AppError::Other(format!("couldn't read the file as UTF-8 text ({e})")))
}

// ---- pure helpers (unit-tested without an AppHandle) ------------------------

fn save_prompt_in(dir: &std::path::Path, id: PromptId, text: &str) -> AppResult<()> {
    prompts::validate(id, text)?;
    let path = dir.join(prompts::entry(id).file);
    if let Some(parent) = path.parent() {
        std::fs::create_dir_all(parent)?;
    }
    std::fs::write(path, text)?;
    Ok(())
}

fn reset_prompt_in(dir: &std::path::Path, id: PromptId) -> AppResult<String> {
    let path = dir.join(prompts::entry(id).file);
    if path.is_file() {
        std::fs::remove_file(&path)?;
    }
    Ok(prompts::default_text(id).to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn save_validates_writes_and_marks_modified() {
        let dir = tempfile::tempdir().unwrap();
        // Invalid: missing {GLOSSARY} → rejected, nothing written.
        let err = save_prompt_in(dir.path(), PromptId::TranslateZhEn, "only {TONE}").unwrap_err();
        assert!(err.to_string().contains("{GLOSSARY}"));
        assert!(!dir.path().join("translate.zh-en.txt").exists());
        // Valid: written; list_meta flips `modified`; resolve returns it.
        save_prompt_in(dir.path(), PromptId::TranslateZhEn, "{GLOSSARY} … {TONE}").unwrap();
        let meta = prompts::list_meta(dir.path());
        let m = meta.iter().find(|m| m.id == PromptId::TranslateZhEn).unwrap();
        assert!(m.modified);
        assert_eq!(
            prompts::resolve(PromptId::TranslateZhEn, dir.path()).unwrap(),
            "{GLOSSARY} … {TONE}"
        );
    }

    #[test]
    fn save_creates_nested_tone_dirs() {
        let dir = tempfile::tempdir().unwrap();
        save_prompt_in(dir.path(), PromptId::ToneXianxia, "custom tone text").unwrap();
        assert!(dir.path().join("tones/xianxia.txt").is_file());
    }

    #[test]
    fn reset_deletes_override_and_returns_default_idempotently() {
        let dir = tempfile::tempdir().unwrap();
        save_prompt_in(dir.path(), PromptId::Verify, "custom verify").unwrap();
        let d1 = reset_prompt_in(dir.path(), PromptId::Verify).unwrap();
        assert_eq!(d1, prompts::default_text(PromptId::Verify));
        assert!(!dir.path().join("verify.txt").exists());
        // No override → still Ok, still the default.
        let d2 = reset_prompt_in(dir.path(), PromptId::Verify).unwrap();
        assert_eq!(d2, d1);
    }

    #[test]
    fn read_prompt_file_rejects_big_and_non_utf8() {
        let dir = tempfile::tempdir().unwrap();
        let big = dir.path().join("big.txt");
        std::fs::write(&big, vec![b'a'; 2 * 1024 * 1024]).unwrap();
        assert!(read_prompt_file(big.to_string_lossy().into_owned())
            .unwrap_err()
            .to_string()
            .contains("1 MB"));
        let bin = dir.path().join("bin.txt");
        std::fs::write(&bin, [0xff, 0xfe]).unwrap();
        assert!(read_prompt_file(bin.to_string_lossy().into_owned())
            .unwrap_err()
            .to_string()
            .contains("UTF-8"));
        let ok = dir.path().join("ok.txt");
        std::fs::write(&ok, "fine").unwrap();
        assert_eq!(read_prompt_file(ok.to_string_lossy().into_owned()).unwrap(), "fine");
    }
}
