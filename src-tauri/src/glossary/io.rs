//! Load and save `glossary.json` from/to a work folder (written by the Python
//! tool or by our Glossary step). Missing/invalid file ⇒ `None` on load —
//! glossaries are optional everywhere.

use std::path::Path;

use super::model::Glossary;
use crate::error::{AppError, AppResult};

pub fn load_folder_glossary(folder: &Path) -> Option<Glossary> {
    let path = folder.join("glossary.json");
    let text = std::fs::read_to_string(path).ok()?;
    Glossary::from_json(&text)
}

/// Crash-safe write: temp file in the same dir + rename, pretty JSON (the
/// file is user-editable via "Open in editor"). rename is atomic against
/// process crashes; we deliberately skip fsync — a power-loss-torn glossary
/// is recoverable by rebuilding.
pub fn save_folder_glossary(folder: &Path, glossary: &Glossary) -> AppResult<()> {
    let tmp = folder.join(".glossary.json.tmp");
    std::fs::write(&tmp, glossary.to_json_pretty())?;
    std::fs::rename(&tmp, folder.join("glossary.json"))?;
    Ok(())
}

/// Copy `glossary.json` to `glossary.prev.json` — a single undo slot, taken
/// before any destructive operation (Regenerate, Import-over-existing).
/// `Ok(false)` = there was no glossary to back up.
///
/// Not atomic, and deliberately so: the destination is a throwaway safety net,
/// not the file the app reads. A torn backup is no worse than no backup, and a
/// temp-and-rename dance here would just add a failure mode to the guard rail.
#[allow(dead_code)] // wired to a Tauri command in a later step
pub fn backup_folder_glossary(folder: &Path) -> AppResult<bool> {
    let src = folder.join("glossary.json");
    if !src.is_file() {
        return Ok(false);
    }
    std::fs::copy(&src, folder.join("glossary.prev.json"))?;
    Ok(true)
}

/// Install `src` as the folder's `glossary.json`, backing up any existing one.
/// Returns the imported term count.
///
/// The empty-terms check is load-bearing, not defensive: `Glossary::from_json`
/// is lenient by design and drops unknown keys, so ANY valid JSON document
/// parses into an empty glossary. Without this, importing an unrelated `.json`
/// would silently succeed and wipe the folder's terms.
#[allow(dead_code)] // wired to a Tauri command in a later step
pub fn import_glossary_file(folder: &Path, src: &Path) -> AppResult<u32> {
    let dest = folder.join("glossary.json");
    // canonicalize fails for a non-existent path — fine: a missing dest can't
    // be src. Mirrors the guard in `commands::export_glossary`.
    if let (Ok(s), Ok(d)) = (src.canonicalize(), dest.canonicalize()) {
        if s == d {
            return Err(AppError::Other(
                "that glossary is already this folder's glossary".into(),
            ));
        }
    }
    let text = std::fs::read_to_string(src)?;
    let glossary = Glossary::from_json(&text)
        .ok_or_else(|| AppError::Other("that file isn't valid JSON".into()))?;
    if glossary.is_empty() {
        return Err(AppError::Other("that file has no glossary terms".into()));
    }
    backup_folder_glossary(folder)?;
    save_folder_glossary(folder, &glossary)?;
    Ok(glossary.count() as u32)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn loads_when_present_none_when_absent() {
        let dir = tempfile::tempdir().unwrap();
        assert!(load_folder_glossary(dir.path()).is_none());
        std::fs::write(
            dir.path().join("glossary.json"),
            r#"{"world_type":"wuxia","terms":{"characters":{"张三":"Zhang San"}}}"#,
        )
        .unwrap();
        let g = load_folder_glossary(dir.path()).unwrap();
        assert_eq!(g.world_type, "wuxia");
        assert_eq!(g.characters.get("张三").unwrap(), "Zhang San");
    }

    #[test]
    fn save_is_atomic_and_pretty() {
        let dir = tempfile::tempdir().unwrap();
        let mut g = Glossary::new("wuxia");
        g.characters.insert("张三".into(), "Zhang San".into());
        save_folder_glossary(dir.path(), &g).unwrap();
        // No temp file left behind.
        assert!(!dir.path().join(".glossary.json.tmp").exists());
        let text = std::fs::read_to_string(dir.path().join("glossary.json")).unwrap();
        assert!(text.contains("\n  ")); // pretty
        let back = load_folder_glossary(dir.path()).unwrap();
        assert_eq!(back.characters.get("张三").unwrap(), "Zhang San");
    }

    #[test]
    fn backup_copies_glossary_to_prev() {
        let dir = tempfile::tempdir().unwrap();
        let mut g = Glossary::new("xianxia");
        g.characters.insert("林动".into(), "Lin Dong".into());
        save_folder_glossary(dir.path(), &g).unwrap();

        assert!(backup_folder_glossary(dir.path()).unwrap());
        let prev = std::fs::read_to_string(dir.path().join("glossary.prev.json")).unwrap();
        let back = Glossary::from_json(&prev).unwrap();
        assert_eq!(back.characters.get("林动").unwrap(), "Lin Dong");
        // The original is untouched — a backup is a copy, not a move.
        assert!(load_folder_glossary(dir.path()).is_some());
    }

    #[test]
    fn backup_returns_false_when_no_glossary() {
        let dir = tempfile::tempdir().unwrap();
        assert!(!backup_folder_glossary(dir.path()).unwrap());
        assert!(!dir.path().join("glossary.prev.json").exists());
    }

    #[test]
    fn import_writes_terms_and_returns_count() {
        let dir = tempfile::tempdir().unwrap();
        let src = dir.path().join("other.json");
        std::fs::write(
            &src,
            r#"{"world_type":"wuxia","terms":{"characters":{"张三":"Zhang San"},"locations":{"青阳镇":"Qingyang Town"}}}"#,
        )
        .unwrap();

        assert_eq!(import_glossary_file(dir.path(), &src).unwrap(), 2);
        let g = load_folder_glossary(dir.path()).unwrap();
        assert_eq!(g.characters.get("张三").unwrap(), "Zhang San");
        assert_eq!(g.locations.get("青阳镇").unwrap(), "Qingyang Town");
        assert_eq!(g.world_type, "wuxia", "the file's own world_type is preserved");
    }

    #[test]
    fn import_rejects_non_json() {
        let dir = tempfile::tempdir().unwrap();
        let src = dir.path().join("nope.json");
        std::fs::write(&src, "definitely not json").unwrap();
        let err = import_glossary_file(dir.path(), &src).unwrap_err().to_string();
        assert!(err.contains("isn't valid JSON"), "got: {err}");
        assert!(load_folder_glossary(dir.path()).is_none());
    }

    /// `Glossary::from_json` is deliberately lenient, so a valid-but-unrelated
    /// JSON document parses into an EMPTY glossary. Without this check an
    /// import of nothing would look like a success.
    #[test]
    fn import_rejects_empty_terms() {
        let dir = tempfile::tempdir().unwrap();
        let src = dir.path().join("unrelated.json");
        std::fs::write(&src, r#"{"name":"some other config","version":3}"#).unwrap();
        let err = import_glossary_file(dir.path(), &src).unwrap_err().to_string();
        assert!(err.contains("no glossary terms"), "got: {err}");
        assert!(load_folder_glossary(dir.path()).is_none());
    }

    #[test]
    fn import_rejects_self() {
        let dir = tempfile::tempdir().unwrap();
        let mut g = Glossary::new("xianxia");
        g.characters.insert("林动".into(), "Lin Dong".into());
        save_folder_glossary(dir.path(), &g).unwrap();

        let src = dir.path().join("glossary.json");
        let err = import_glossary_file(dir.path(), &src).unwrap_err().to_string();
        assert!(err.contains("already this folder"), "got: {err}");
        // Still intact.
        assert_eq!(load_folder_glossary(dir.path()).unwrap().count(), 1);
    }

    #[test]
    fn import_backs_up_existing_glossary() {
        let dir = tempfile::tempdir().unwrap();
        let mut old = Glossary::new("xianxia");
        old.characters.insert("应欢欢".into(), "Ying Huanhuan".into());
        save_folder_glossary(dir.path(), &old).unwrap();

        let src = dir.path().join("new.json");
        std::fs::write(&src, r#"{"world_type":"xianxia","terms":{"characters":{"林动":"Lin Dong"}}}"#)
            .unwrap();
        assert_eq!(import_glossary_file(dir.path(), &src).unwrap(), 1);

        let g = load_folder_glossary(dir.path()).unwrap();
        assert_eq!(g.count(), 1);
        assert!(g.characters.contains_key("林动"));

        let prev = std::fs::read_to_string(dir.path().join("glossary.prev.json")).unwrap();
        let back = Glossary::from_json(&prev).unwrap();
        assert_eq!(back.characters.get("应欢欢").unwrap(), "Ying Huanhuan");
    }
}
