//! LLM client layer.
//!
//! Ports the Python `llm/` package: a driver abstraction over the Anthropic,
//! OpenAI Chat Completions, and OpenAI Responses APIs, built on `reqwest` with
//! streaming support for Anthropic extended thinking, plus optional debug
//! request/response logging.
//!
//! Planned submodules: `client`, `base`, `anthropic`, `openai`,
//! `openai_responses`, `debug_logger`.

pub mod error;
