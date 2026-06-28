//! Application configuration model. Persisted on the frontend via the Tauri
//! store plugin; these types define the schema and generate matching TS bindings.

pub mod languages;
pub mod presets;
pub mod projects;
pub mod store;

use std::collections::BTreeMap;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// LLM API driver. Mirrors the original config's `driver` field.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, TS)]
#[serde(rename_all = "kebab-case")]
#[ts(export, export_to = "../../src/types/generated/")]
pub enum Driver {
    /// Anthropic API / Anthropic-compatible (extended thinking).
    Anthropic,
    /// OpenAI Chat Completions / OpenRouter / local (Ollama, LM Studio).
    Openai,
    /// OpenAI Responses API (web search).
    OpenaiResponses,
}

/// A single named LLM connection.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/generated/")]
pub struct Connection {
    pub driver: Driver,
    pub base_url: String,
    #[serde(default)]
    pub api_key: String,
    pub model: String,
    #[serde(default)]
    pub max_tokens: Option<u32>,
    #[serde(default)]
    pub batch_dialogue_limit: Option<u32>,
    #[serde(default)]
    pub timeout: Option<u32>,
    #[serde(default)]
    pub connect_timeout: Option<u32>,
    #[serde(default)]
    pub concurrency: Option<u32>,
    #[serde(default)]
    pub thinking_enabled: Option<bool>,
    #[serde(default)]
    pub thinking_budget: Option<u32>,
    /// Thinking budget for glossary extraction calls (Glossary thinking).
    /// `None` on legacy configs → engine falls back to `thinking_budget`.
    #[serde(default)]
    pub thinking_glossary_budget: Option<u32>,
    /// Thinking budget for glossary normalization calls (Normalization thinking).
    /// `None` on legacy configs → engine falls back to `thinking_budget`.
    #[serde(default)]
    pub thinking_glossary_norm_budget: Option<u32>,
    #[serde(default)]
    pub web_search: Option<bool>,
}

impl Connection {
    /// Clone with `thinking_budget` swapped to `budget` when set. Drivers only
    /// read `thinking_budget`, so a stage clone is how a per-stage budget
    /// reaches the request body. `None` keeps the existing budget (legacy
    /// configs without per-stage fields).
    fn with_thinking_budget(&self, budget: Option<u32>) -> Connection {
        let mut c = self.clone();
        if budget.is_some() {
            c.thinking_budget = budget;
        }
        c
    }

    /// Stage clone for glossary **extraction** calls.
    pub fn for_glossary(&self) -> Connection {
        self.with_thinking_budget(self.thinking_glossary_budget)
    }

    /// Stage clone for glossary **normalization** calls.
    pub fn for_glossary_norm(&self) -> Connection {
        self.with_thinking_budget(self.thinking_glossary_norm_budget)
    }

    /// `Some(message)` when thinking is enabled but no budget is set — the
    /// Anthropic API rejects `thinking` without `budget_tokens`, so runs must
    /// fail fast with a clear message instead of a cryptic provider 400.
    /// Only the Anthropic driver reads the thinking fields; other drivers
    /// ignore them, so stale values on a switched connection are harmless.
    /// (Stage budgets fall back to `thinking_budget`, so only it is checked.)
    pub fn thinking_config_error(&self) -> Option<String> {
        if self.driver == Driver::Anthropic
            && self.thinking_enabled.unwrap_or(false)
            && self.thinking_budget.is_none()
        {
            return Some(
                "thinking is enabled but no thinking budget is set — edit the connection"
                    .to_string(),
            );
        }
        None
    }

    /// Save-time validation mirroring the UI's hard-block rules
    /// (`advanced-sections.tsx::budgetValidate`): when thinking is enabled on
    /// an Anthropic connection, each of the three stage budgets must be
    /// present, at least 1024 tokens (the Anthropic API floor), and below
    /// `max_tokens` (skipped when `max_tokens` is unset). Gated on
    /// `Driver::Anthropic` — thinking values persist across driver switches
    /// by design, so stale values on a non-Anthropic connection must never
    /// block a save. (Integer-ness is structural: the fields are `u32`.)
    pub fn thinking_budget_save_error(&self) -> Option<String> {
        if self.driver != Driver::Anthropic || !self.thinking_enabled.unwrap_or(false) {
            return None;
        }
        const MIN_BUDGET: u32 = 1024;
        let budgets = [
            ("translate thinking", self.thinking_budget),
            ("glossary thinking", self.thinking_glossary_budget),
            ("normalization thinking", self.thinking_glossary_norm_budget),
        ];
        for (label, value) in budgets {
            let Some(v) = value else {
                return Some(format!("{label} budget is required when thinking is enabled"));
            };
            if v < MIN_BUDGET {
                return Some(format!("{label} budget must be at least {MIN_BUDGET} tokens"));
            }
            if let Some(max) = self.max_tokens {
                if v >= max {
                    return Some(format!("{label} budget must be less than max tokens ({max})"));
                }
            }
        }
        None
    }
}

/// Top-level persisted configuration.
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export, export_to = "../../src/types/generated/")]
pub struct AppConfig {
    pub default_source: String,
    pub default_target: String,
    pub active_connection: String,
    #[serde(default)]
    pub personalization_model: Option<String>,
    #[serde(default)]
    pub default_workdir: Option<String>,
    pub connections: BTreeMap<String, Connection>,
}

#[cfg(test)]
mod tests {
    use super::*;

    fn thinking_conn() -> Connection {
        Connection {
            driver: Driver::Anthropic, base_url: "https://x".into(), api_key: "k".into(),
            model: "m".into(), max_tokens: Some(16000), batch_dialogue_limit: None,
            timeout: None, connect_timeout: None, concurrency: None,
            thinking_enabled: Some(true), thinking_budget: Some(6000),
            thinking_glossary_budget: Some(12000),
            thinking_glossary_norm_budget: Some(24000), web_search: None,
        }
    }

    #[test]
    fn stage_clones_swap_the_thinking_budget() {
        let c = thinking_conn();
        assert_eq!(c.for_glossary().thinking_budget, Some(12000));
        assert_eq!(c.for_glossary_norm().thinking_budget, Some(24000));
        // Everything else is untouched, original included.
        assert_eq!(c.for_glossary().max_tokens, Some(16000));
        assert_eq!(c.thinking_budget, Some(6000));
    }

    #[test]
    fn stage_clones_fall_back_to_translate_budget_for_legacy_configs() {
        // Stored configs predating the per-stage fields lack them; the clone
        // must keep thinking_budget rather than blanking it (legacy tolerance,
        // NOT a user-facing fallback — the UI writes all three on save).
        let mut c = thinking_conn();
        c.thinking_glossary_budget = None;
        c.thinking_glossary_norm_budget = None;
        assert_eq!(c.for_glossary().thinking_budget, Some(6000));
        assert_eq!(c.for_glossary_norm().thinking_budget, Some(6000));
    }

    #[test]
    fn thinking_config_error_fires_only_when_enabled_without_budget() {
        let mut c = thinking_conn();
        assert_eq!(c.thinking_config_error(), None);
        c.thinking_budget = None;
        assert!(c.thinking_config_error().unwrap().contains("no thinking budget"));
        c.thinking_enabled = Some(false);
        assert_eq!(c.thinking_config_error(), None);
        c.thinking_enabled = None;
        assert_eq!(c.thinking_config_error(), None);

        // Other drivers ignore the thinking fields entirely — stale values on
        // a connection whose provider was switched must not block runs.
        let mut other = thinking_conn();
        other.driver = Driver::Openai;
        other.thinking_budget = None;
        assert_eq!(other.thinking_config_error(), None);
    }

    #[test]
    fn thinking_budget_save_error_enforces_ui_hard_block_rules() {
        // The shared fixture's norm budget (24000) exceeds max_tokens (16000) —
        // exactly the kind of config this validation must reject.
        assert!(thinking_conn()
            .thinking_budget_save_error()
            .unwrap()
            .contains("less than max tokens"));

        // A fully valid Anthropic thinking config passes.
        let mut ok = thinking_conn();
        ok.thinking_glossary_norm_budget = Some(8000);
        assert_eq!(ok.thinking_budget_save_error(), None);

        // Missing stage budget.
        let mut c = ok.clone();
        c.thinking_glossary_budget = None;
        assert!(c.thinking_budget_save_error().unwrap().contains("glossary thinking"));

        // Below the 1024 API floor.
        let mut c = ok.clone();
        c.thinking_budget = Some(512);
        assert!(c.thinking_budget_save_error().unwrap().contains("1024"));

        // No max_tokens → upper-bound check skipped.
        let mut c = ok.clone();
        c.max_tokens = None;
        c.thinking_budget = Some(999_999);
        assert_eq!(c.thinking_budget_save_error(), None);

        // Non-Anthropic drivers skip validation (stale values persist by design).
        let mut c = thinking_conn();
        c.driver = Driver::Openai;
        assert_eq!(c.thinking_budget_save_error(), None);

        // Thinking disabled (or unset) skips validation.
        let mut c = thinking_conn();
        c.thinking_enabled = Some(false);
        assert_eq!(c.thinking_budget_save_error(), None);
        c.thinking_enabled = None;
        assert_eq!(c.thinking_budget_save_error(), None);
    }

    #[test]
    fn glossary_budget_field_roundtrips_and_defaults_none() {
        // Present in JSON → parsed.
        let json = r#"{
            "driver":"anthropic","base_url":"https://x","model":"m",
            "thinking_glossary_budget":12000
        }"#;
        let c: Connection = serde_json::from_str(json).unwrap();
        assert_eq!(c.thinking_glossary_budget, Some(12000));
        // Absent (every pre-existing stored config) → None, not an error.
        let legacy: Connection =
            serde_json::from_str(r#"{"driver":"openai","base_url":"u","model":"m"}"#).unwrap();
        assert_eq!(legacy.thinking_glossary_budget, None);
    }

    #[test]
    fn connection_tolerates_removed_prompt_template_field() {
        // Stored configs may still carry `prompt_template` from older versions;
        // serde must ignore it rather than fail the load.
        let json = r#"{
            "driver":"anthropic","base_url":"https://x","api_key":"k","model":"m",
            "prompt_template":"qwen","thinking_glossary_norm_budget":4096
        }"#;
        let c: Connection = serde_json::from_str(json).unwrap();
        assert_eq!(c.thinking_glossary_norm_budget, Some(4096));
        // Optional fields default to None when absent.
        let minimal: Connection =
            serde_json::from_str(r#"{"driver":"openai","base_url":"u","model":"m"}"#).unwrap();
        assert_eq!(minimal.api_key, "");
    }
}
