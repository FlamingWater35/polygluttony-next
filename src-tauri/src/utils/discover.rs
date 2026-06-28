//! Discover source `.ass` files in a folder and detect existing translations.
//! Ported from `utils/file_utils.py`.

use std::path::{Path, PathBuf};

use crate::models::language_pair::{output_filename, warning_filename, LanguagePair};

/// All `.ass` files in `dir` (non-recursive) that are *source* files — not
/// themselves translation outputs. Sorted by path.
pub fn discover_source_files(dir: &Path, pair: &LanguagePair) -> Vec<PathBuf> {
    let mut files: Vec<PathBuf> = Vec::new();
    let Ok(entries) = std::fs::read_dir(dir) else {
        return files;
    };
    let target_suffixes = pair.target_suffixes();
    for entry in entries.flatten() {
        let path = entry.path();
        if !path.is_file() {
            continue;
        }
        let is_ass = path
            .extension()
            .and_then(|e| e.to_str())
            .map(|e| e.eq_ignore_ascii_case("ass"))
            == Some(true);
        if !is_ass {
            continue;
        }
        let stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
        let lower = stem.to_lowercase();
        if lower.contains(".warning.") {
            continue;
        }
        let is_translation = target_suffixes
            .iter()
            .any(|suf| lower.ends_with(&format!(".{}", suf.to_lowercase())));
        if is_translation {
            continue;
        }
        files.push(path);
    }
    files.sort();
    files
}

/// Whether `source` already has a translation (output or warning file present).
pub fn has_existing_translation(source: &Path, pair: &LanguagePair) -> bool {
    let dir = source.parent().unwrap_or_else(|| Path::new("."));
    dir.join(output_filename(source, pair)).exists()
        || dir.join(warning_filename(source, pair)).exists()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::language_pair::LanguagePair;
    use std::fs;

    #[test]
    fn discovers_sources_excluding_translations() {
        let dir = tempfile::tempdir().unwrap();
        let p = dir.path();
        for name in [
            "ep01.ass",
            "ep01.eng.ass",
            "ep02.ass",
            "ep03.ass",
            "ep03.warning.eng.ass",
            "notes.txt",
        ] {
            fs::write(p.join(name), "x").unwrap();
        }
        let pair = LanguagePair::from_codes("zh", "en").unwrap();

        let names: Vec<String> = discover_source_files(p, &pair)
            .iter()
            .map(|f| f.file_name().unwrap().to_string_lossy().into_owned())
            .collect();
        assert_eq!(names, vec!["ep01.ass", "ep02.ass", "ep03.ass"]);

        assert!(has_existing_translation(&p.join("ep01.ass"), &pair));
        assert!(has_existing_translation(&p.join("ep03.ass"), &pair));
        assert!(!has_existing_translation(&p.join("ep02.ass"), &pair));
    }
}
