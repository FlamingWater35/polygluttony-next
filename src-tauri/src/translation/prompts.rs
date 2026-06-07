//! Prompt assembly from catalog-resolved templates. Port of
//! `core/batch_translator.py:415-484`. Templates live in `src-tauri/prompts/`
//! and are resolved (override-aware) by `crate::prompts` at run start.
//!
//! # Placeholder mapping per template
//!
//! - `translate.zh-en.txt`:        `{GLOSSARY}`, `{TONE}`
//! - `translate.generic.txt`:      `{source_language}`, `{target_language}`, `{localization_style}`

use crate::glossary::model::Glossary;
use crate::models::language_pair::LanguagePair;

/// Fill all known placeholders in `template` via single-pass, case-insensitive
/// substitution (see `crate::prompts::fill`) — inserted values are never
/// re-scanned, and any case variant of a token fills, matching the validator's
/// case tolerance. Tokens a template doesn't use are simply absent.
pub fn system_prompt(
    template: &str,
    pair: &LanguagePair,
    glossary: &Glossary,
    tone_text: &str,
) -> String {
    let glossary_str = glossary.to_formatted_string();
    crate::prompts::fill(
        template,
        &[
            ("glossary", glossary_str.as_str()),
            ("tone", tone_text),
            ("source_language", &pair.source_name),
            ("target_language", &pair.target_name),
            ("localization_style", tone_text),
        ],
    )
}

/// Build the user prompt. `lines` are (id, marked+hinted src). `context` is
/// up to the last 7 carried (src, tgt) pairs
/// (`batch_translator.py:469-484`).
pub fn user_prompt(lines: &[(u32, String)], context: &[(String, String)]) -> String {
    let mut parts: Vec<String> = Vec::new();
    if !context.is_empty() {
        parts.push("Previous translations for context:".into());
        for (src, tgt) in context.iter().rev().take(7).rev() {
            parts.push(format!("  {src} -> {tgt}"));
        }
        parts.push(String::new());
    }
    parts.push("Translate the following lines:".into());
    let arr: Vec<serde_json::Value> = lines
        .iter()
        .map(|(id, src)| serde_json::json!({ "id": id, "src": src }))
        .collect();
    parts.push(serde_json::to_string_pretty(&arr).expect("serializable"));
    parts.join("\n")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::glossary::model::Glossary;
    use crate::models::language_pair::LanguagePair;
    use crate::prompts::{default_text, PromptId};

    fn pair() -> LanguagePair {
        LanguagePair::from_codes("zh", "en").unwrap()
    }

    /// translate.zh-en.txt contains {GLOSSARY} and {TONE} only.
    #[test]
    fn system_prompt_fills_placeholders() {
        let mut g = Glossary::new("xianxia");
        g.characters.insert("星汉".into(), "Xinghan".into());
        let p = system_prompt(
            default_text(PromptId::TranslateZhEn),
            &pair(),
            &g,
            default_text(PromptId::ToneXianxia),
        );
        assert!(!p.contains("{GLOSSARY}"));
        assert!(!p.contains("{TONE}"));
        assert!(p.contains("星汉 → Xinghan"));
    }

    /// translate.generic.txt uses {source_language} / {target_language} (lowercase).
    #[test]
    fn generic_template_fills_language_names() {
        let pair = LanguagePair::from_codes("ko", "en").unwrap();
        let p = system_prompt(
            default_text(PromptId::TranslateGeneric),
            &pair,
            &Glossary::default(),
            default_text(PromptId::ToneStandard),
        );
        assert!(p.contains("Korean"));
        assert!(p.contains("English"));
    }

    /// A custom template using the "wrong" case still gets filled —
    /// the engine honours the case-tolerance the validator promises.
    #[test]
    fn lowercase_custom_tokens_are_filled_too() {
        let p = system_prompt("{glossary} ## {tone}", &pair(), &Glossary::default(), "TONE-TEXT");
        assert!(!p.contains("{glossary}"));
        assert!(p.contains("TONE-TEXT"));
    }

    #[test]
    fn user_prompt_carries_context_and_lines() {
        let ctx = vec![("前文".to_string(), "Earlier line".to_string())];
        let lines = vec![(1u32, "<0001:D> 你好".to_string())];
        let p = user_prompt(&lines, &ctx);
        assert!(p.contains("Previous translations for context:"));
        assert!(p.contains("前文 -> Earlier line"));
        assert!(p.contains("Translate the following lines:"));
        assert!(p.contains(r#""id": 1"#));
        assert!(p.contains("<0001:D> 你好"));
    }

    #[test]
    fn user_prompt_without_context_skips_header() {
        let p = user_prompt(&[(1, "<0001:D> 你好".into())], &[]);
        assert!(!p.contains("Previous translations"));
    }
}
