<div align="center">

<img src="assets/welcome.png" alt="Polygluttony Next" width="860">

# Polygluttony Next

**LLM-powered subtitle translation for donghua & anime — built to protect the things that break.**

![Tauri 2](https://img.shields.io/badge/Tauri-2-FFC131?logo=tauri&logoColor=000)
![Rust](https://img.shields.io/badge/Rust-000?logo=rust&logoColor=fff)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![Tailwind CSS v4](https://img.shields.io/badge/Tailwind-v4-06B6D4?logo=tailwindcss&logoColor=fff)
![TanStack](https://img.shields.io/badge/TanStack-Router%20%7C%20Query-EF4444?logo=reactquery&logoColor=fff)

## Platforms

![macOS](https://img.shields.io/badge/macOS-000000?logo=apple&logoColor=white)
![Windows](https://img.shields.io/badge/Windows-0078D4?logo=windows&logoColor=white)
![Linux](https://img.shields.io/badge/Linux-FCC624?logo=linux&logoColor=black)

## Links

[![Original Repository](https://img.shields.io/badge/Original-Repository-24292E?logo=github&logoColor=white&style=for-the-badge)](https://github.com/blyat-uk/polygluttony)
[![Download](https://img.shields.io/badge/Download-Latest-2EA043?logo=github&logoColor=white&style=for-the-badge)](../../releases/latest)

*Note: This is a fork of the original Polygluttony project. Please support the [original developer](https://github.com/blyat-uk).*

</div>

---

Polygluttony Next translates `.ass` subtitle files with an LLM while guarding against the failure modes that wreck naive machine translation. Point it at a folder, connect a provider (Anthropic, Gemini, Openrouter, OpenAI, or any OpenAI-compatible endpoint), optionally build a glossary, and run — watching live, honest telemetry the whole way.

## ❓ Why Polygluttony Next

- **Line markers & partial-failure recovery** — every line is tracked, so when a model drops, merges, or reorders lines, Polygluttony Next detects exactly where it broke and salvages the correct prefix instead of failing the whole batch.
- **Drift detection** — a five-signal weighted detector catches translations wandering off the source mid-batch and retranslates only the part that drifted.
- **Byte-faithful ASS tags** — `{\pos}`, `{\an8}`, fonts, styles, and metadata come back exactly as they went in; only the dialogue is translated.
- **Cross-episode glossary** — a six-category glossary, with auto-detected world type (xianxia / wuxia / historical / modern), keeps names and terms consistent across a whole season.
- **Verification, not a score** — every file checks its own work and surfaces an actionable issue list, never a number.
- **Mission-control UI** — a single window with live, batched telemetry: watch batches land, terms stream into the glossary, and drift get caught in real time.

## 📥 Download

Grab the latest build for your OS from the [**Releases**](../../releases/latest) page — macOS (Apple Silicon), Windows, and Linux.

> Important: these builds aren't signed with a paid developer certificate, so the OS warns on first launch:
>
> - **macOS** — the first launch is blocked. Open **System Settings → Privacy & Security**, scroll to the bottom, and click **Open Anyway**, then launch again and confirm.
> - **Windows** — on the SmartScreen prompt, choose **More info → Run anyway**.
> - **Linux**: Make the `.AppImage` executable (`chmod +x`) and run it.

---

## 🚀 Usage Guide

Polygluttony Next is designed for batch-translating subtitle files (`.ass`) while maintaining context, formatting, and terminology consistency. To get the best results, follow this workflow:

### 1. Set Up Your Connections

Head to the **Connections** tab to configure your LLM providers.

- Add your API keys for **Anthropic**, **OpenAI**, or a local **Ollama** instance.
- You can set up multiple connections and assign specific ones for different tasks (e.g., a fast model for batch translation, a reasoning model for verification).
- Use the "Test" button to verify your credentials and fetch available models.
- *Tip:* Enable "Web Search" on a connection if you want the app to automatically look up established names from wikis for personalization.

### 2. Prepare Your Workspace

- Go to the **Project** tab and select a folder containing your source `.ass` subtitle files.
- Polygluttony will automatically scan the folder and list all compatible files.
- Set your default source and target languages in the project settings.

### 3. Build a Glossary (Crucial for Consistency)

Before translating, build a glossary to ensure names, locations, and specific terminology (e.g., Wuxia/Xianxia cultivation stages) remain consistent across episodes.

- Navigate to the **Glossary** tab.
- Polygluttony can automatically detect recurring terms and suggest translations.
- You can manually edit, approve, or add new terms. The engine will strictly enforce these terms during translation.
- The app watches your `glossary.json` file for external edits, so you can update it in a text editor while the app is running.

### 4. Customize Prompts & Tones

Visit the **Prompts** tab to tweak how the LLM approaches the translation.

- Choose a **Tone** (Standard, Comedic, Poetic, Wuxia, Xianxia) to guide the stylistic output.
- Edit the system and user prompts to include specific instructions (e.g., "Keep honorifics", "Translate sound effects", "Handle punctuation carefully").
- The `{GLOSSARY}` and `{TONE}` variables are automatically injected into the prompt context.

### 5. Translate & Verify (The Mission Control Experience)

- Head to the **Translate** tab and hit **Start**.
- Watch as batches are processed in real-time.
- **Drift Detection:** If the LLM starts hallucinating, leaving source text in the output, or ignoring formatting tags, the engine catches it and automatically triggers a retranslation of the affected scopes.
- **Verification Pass:** Once the initial translation is done, a secondary LLM pass reviews the output for formatting errors, missing tags, and glossary violations, surfacing an actionable issue list.
- Review any flagged issues in the UI. You can manually approve them or force a retranslation.
- If a file exhausts its retranslation budget, a warning file is generated so you know exactly which lines need human intervention.

### 6. Export

Once the verify pass is clean, your translated `.ass` files are automatically saved in your project folder. A credit line (`; Translated at home with Polygluttony Next`) is automatically injected into the `[Script Info]` header of every output file.

---

## 🛠️ Building from Source

If you want to build the app locally, you'll need [Bun](https://bun.sh/) and [Rust](https://www.rust-lang.org/tools/install). Ensure you also have [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

```bash
# Clone the repository
git clone https://github.com/FlamingWater35/polygluttony-next.git
cd polygluttony-next

# Install frontend dependencies
bun install

# Run in development mode
bun tauri dev

# Build for production
bun tauri build
```

## ⚙️ Development

To run generators:

```bash
bun run gen:routes
bun run gen:bindings
```

## 📜 License

[MIT](LICENSE.md)
