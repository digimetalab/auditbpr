# Platform Guide — BPR Audit Intelligence System
# Covers: Gemini CLI | Claude Code | Codex | OpenCode

---

## Platform Comparison

```
┌──────────────────────┬─────────────┬─────────────┬─────────────┬─────────────┐
│ FEATURE              │ Gemini CLI  │ Claude Code │ Codex/GPT   │ OpenCode    │
├──────────────────────┼─────────────┼─────────────┼─────────────┼─────────────┤
│ True Parallelism     │ ❌ Sequence │ ✅ Subagent │ ✅ AsyncIO  │ ⚠️ Limited  │
│ Google Search Native │ ✅ Built-in │ WebFetch    │ ✅ Tool      │ Plugin      │
│ Python Execution     │ Via bash    │ ✅ Bash      │ ✅ CodeInterp│ ✅ Terminal │
│ Context Window       │ ✅ 1M token │ ✅ 200K      │ 128K-200K   │ Model dep.  │
│ File Read/Write      │ ✅ --file   │ ✅ Native    │ ✅ Native    │ ✅ Native   │
│ PDF Generation       │ Via pandoc  │ ✅ Via bash  │ Via pandoc  │ Via pandoc  │
│ Multi-model Support  │ ❌ Google   │ ❌ Anthropic │ ❌ OpenAI   │ ✅ All      │
│ Setup Difficulty     │ 🟢 Easy     │ 🟢 Easy     │ 🟡 Medium   │ 🟢 Easy    │
│ Best For             │ OSINT       │ Calculations│ SDK/API dev │ Flexible    │
│ Estimated Time       │ 45-75 min   │ 25-40 min   │ 20-35 min   │ 30-60 min  │
└──────────────────────┴─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## Gemini CLI

### Install & Setup
```bash
npm install -g @google/gemini-cli
gemini auth login
gemini --version
```

### Run Audit
```bash
cd auditbpr
# Edit BPR configuration at the top of the file first:
nano platforms/run_audit_gemini.sh
# Run:
bash platforms/run_audit_gemini.sh
```

### Optimization Tips
```bash
# Strongest model
--model gemini-2.5-pro
# Skip confirmation (for automation)
--yolo
# 1M token context window → enough for 5 years of data at once
# If rate limited: increase sleep values in script (default: 5-10 sec between agents)
# If file too large: convert Excel to CSV first
python3 -c "import pandas as pd; pd.read_excel('data/neraca.xlsx').to_csv('data/neraca.csv', index=False)"
```

### Troubleshooting
```
ERROR: "File too large"
  → Convert xlsx to csv

ERROR: "Rate limit exceeded"
  → Increase sleep between agents in run_audit_gemini.sh

ERROR: "Context window exceeded"
  → Reduce data passed to layer 3 agents
  → Use summaries instead of full output

ERROR: "Search grounding unavailable"
  → Check internet connection → retry
```

---

## Claude Code

### Install & Setup
```bash
npm install -g @anthropic-ai/claude-code
claude auth login
# or: export ANTHROPIC_API_KEY=sk-ant-...
claude --version
```

### Run Audit
```bash
cd auditbpr
# Edit BPR configuration at the top of the file:
nano platforms/run_audit_claude.sh
# Run:
bash platforms/run_audit_claude.sh
```

### Claude Code Advantages
```bash
# True parallelism via subagents — Layers 1 & 2 run concurrently
# Python/bash tool built-in → accurate Beneish M-Score calculations
# 200K context window with caching
# WebFetch for specific URLs
```

### CLAUDE.md (Auto-generated)
The `run_audit_claude.sh` script auto-generates `CLAUDE.md` as the system prompt.
This file contains BPR context and work instructions for Claude Code.

---

## Codex (OpenAI)

### Install & Setup
```bash
pip install openai
export OPENAI_API_KEY=sk-...
python --version  # Requires Python 3.9+
```

### Run Audit
```bash
cd auditbpr
# Edit configuration in DEFAULT_CONFIG section:
nano platforms/run_audit_codex.py
# Run with arguments:
python platforms/run_audit_codex.py \
  --bpr "PT BPR Your Name" \
  --kota "City" \
  --provinsi "Province" \
  --periode "2020-2024" \
  --model "gpt-4.1"
# Model options: gpt-4.1 | o3 | codex-1
```

### Codex Advantages
```
- AsyncIO true parallelism → Layer 1 (5 agents) and Layer 2 (3 agents) in parallel
- Code Interpreter for complex calculations
- Automatic retry on API errors
- CLI arguments for easy configuration
- Automatic PDF export via pandoc
```

### Python Requirements
```bash
pip install openai pandas openpyxl
# Optional for PDF:
sudo apt install pandoc wkhtmltopdf  # Linux
brew install pandoc wkhtmltopdf      # macOS
```

---

## OpenCode

### Install & Setup
```bash
# Via npm
npm install -g opencode-ai
# Via curl
curl -fsSL https://opencode.ai/install | bash
opencode --version
```

### Run Audit
```bash
cd auditbpr
# Edit BPR configuration in "bpr_config" section:
nano platforms/opencode.config.json
# Run:
opencode run --config platforms/opencode.config.json
# Or interactive mode:
opencode
# Paste SKILL.md contents and follow instructions
```

### Model Configuration in OpenCode
```bash
opencode config set model anthropic/claude-opus-4
# or: google/gemini-2.5-pro
# or: openai/gpt-4.1
# Local models: opencode config set model ollama/llama3
```

---

## Universal Workflow (All Platforms)

```
STEP 1: Prepare data
  → Place Excel/CSV files in data/ folder
  → Rename accordingly: neraca.xlsx, laba_rugi.xlsx, aset_produktif.xlsx, rasio.xlsx

STEP 2: Fill in BPR data
  → Gemini CLI : edit run_audit_gemini.sh (BPR CONFIG section)
  → Claude Code: edit run_audit_claude.sh (BPR CONFIG section)
  → Codex      : edit DEFAULT_CONFIG in run_audit_codex.py
  → OpenCode   : edit bpr_config in opencode.config.json

STEP 3: Run
  → Gemini CLI : bash platforms/run_audit_gemini.sh
  → Claude Code: bash platforms/run_audit_claude.sh
  → Codex      : python platforms/run_audit_codex.py
  → OpenCode   : opencode run --config platforms/opencode.config.json

STEP 4: Check output
  → output/markdown/laporan_audit_[BPR]_[PERIOD].md
  → output/pdf/laporan_audit_[BPR]_[PERIOD].pdf
  → output/agents/output_01_*.md through output_11_*.md
```

---

## PDF Generator Installation (All Platforms)

```bash
# Linux (Ubuntu/Debian):
sudo apt-get update && sudo apt-get install -y pandoc wkhtmltopdf

# macOS:
brew install pandoc wkhtmltopdf

# Windows:
# Download pandoc: https://pandoc.org/installing.html
# Download wkhtmltopdf: https://wkhtmltopdf.org/downloads.html

# Test:
pandoc --version
wkhtmltopdf --version
```
