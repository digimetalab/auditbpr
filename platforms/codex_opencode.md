# Platform Guide: Codex (OpenAI) & OpenCode
# Codex Reference: https://platform.openai.com/docs
# OpenCode Reference: https://opencode.ai

---

## PART 1 — CODEX / GPT (OpenAI)

### Platform Identity

```yaml
platform:        openai-codex
provider:        OpenAI
model_options:   [codex-1, gpt-4.1, o3, gpt-4o]
web_search:      ✅ Built-in web_search tool
file_input:      Code Interpreter + file upload
context_window:  128K (gpt-4.1) / 200K (o3)
parallelism:     ✅ TRUE — Python AsyncIO
agentic_loop:    ✅ OpenAI Agents SDK
```

### Install & Setup

```bash
pip install openai pandas openpyxl
export OPENAI_API_KEY=sk-...
python -c "import openai; print(openai.__version__)"
# PDF dependencies (optional)
sudo apt install pandoc wkhtmltopdf   # Linux
brew install pandoc wkhtmltopdf       # macOS
```

### Running Audit

```bash
cd auditbpr
# Edit DEFAULT_CONFIG at the top of the file:
nano platforms/run_audit_codex.py
# Run with arguments:
python platforms/run_audit_codex.py \
  --bpr "PT BPR Your Name" \
  --kota "City" \
  --provinsi "Province" \
  --periode "2020-2024" \
  --model "gpt-4.1"
# Model options:
#   gpt-4.1   → Recommended (balanced price/performance)
#   o3        → Best for deep analysis, more expensive
#   codex-1   → Best for coding/calculations
```

### How run_audit_codex.py Works

```
Phase 0: Parse Excel/CSV data → Markdown summary
Phase 1: 5 Layer 1 agents → asyncio.gather() → PARALLEL
Phase 2: 3 Layer 2 agents → asyncio.gather() → PARALLEL
Phase 3: 3 Layer 3 agents → sequential (waits for Phases 1+2)
Phase 4: Orchestrator → report assembly → PDF
```

### Codex Optimization

```python
# Change model in DEFAULT_CONFIG for price vs quality tradeoff:
"model": "gpt-4.1"    # Recommended: balanced
"model": "o3"         # Best quality, 5-10x more expensive
"model": "gpt-4o"     # Fast, good for OSINT agents

# Debug a single agent:
python -c "
import asyncio
from platforms.run_audit_codex import *
cfg = {**DEFAULT_CONFIG}
client = AsyncOpenAI(api_key=os.environ['OPENAI_API_KEY'])
result = asyncio.run(run_layer1_agent(client, cfg, '02_neraca', ''))
print(result[1][:500])
"

# Limit tokens to save cost:
# Edit max_tokens in DEFAULT_CONFIG (default: 16000)
```

---

## PART 2 — OPENCODE

### Platform Identity

```yaml
platform:        opencode
provider:        Community (open source)
website:         https://opencode.ai
model:           Configurable (Anthropic/OpenAI/Google/Local LLM)
tool_use:        Terminal, filesystem, web search (pluggable)
file_input:      Direct terminal reference
parallelism:     Session-based sequential
interface:       TUI (Terminal User Interface) + headless
```

### Install & Setup

```bash
npm install -g opencode-ai
# or: curl -fsSL https://opencode.ai/install | bash
# Set preferred model
opencode config set model anthropic/claude-opus-4
# or: google/gemini-2.5-pro | openai/gpt-4.1 | ollama/llama3.3
opencode --version
```

### Running Audit

```bash
cd auditbpr
# Step 1: Edit BPR configuration in config file
nano platforms/opencode.config.json
# → Edit the "bpr_config" section with target BPR data

# Step 2: Run headless
opencode run --config platforms/opencode.config.json

# Or interactive TUI mode
opencode
# → In TUI:
#    [Ctrl+O] to open file
#    Paste SKILL.md contents
#    Type audit instructions
```

### opencode.config.json Configuration

The `platforms/opencode.config.json` file contains:
- `model`: model to use
- `system_prompt`: role and basic instructions
- `context_files`: files auto-loaded at start
- `bpr_config`: target BPR data **(EDIT THIS)**
- `data_files`: Excel/CSV file paths
- `tools`: enabled tools
- `initial_prompt`: auto-start prompt

### OpenCode Tips

```bash
# Use the strongest model for best results:
opencode config set model anthropic/claude-opus-4

# For OSINT: ensure web search plugin is active
opencode plugins list
opencode plugins enable web-search

# For accurate calculations: enable Python/bash tools
opencode config set tools.bash true
opencode config set tools.python true

# Multi-model workflow (advanced):
# Use Claude for OSINT Layer 2
# Use GPT/Codex for Layer 1 calculations
# OpenCode supports model switching per session
```

---

## Complete Platform Comparison

```
┌──────────────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
│ FEATURE              │ Gemini CLI   │ Claude Code  │ Codex/GPT    │ OpenCode     │
├──────────────────────┼──────────────┼──────────────┼──────────────┼──────────────┤
│ True Parallelism     │ ❌ Sequential│ ✅ Subagents │ ✅ AsyncIO   │ ⚠️ Limited   │
│ Web Search Native    │ ✅ Google    │ WebFetch     │ ✅ Tool       │ ✅ Plugin    │
│ Python Execution     │ Via bash     │ ✅ Bash tool  │ ✅ CodeInterp│ ✅ Terminal  │
│ Context Window       │ ✅ 1M token  │ ✅ 200K       │ 128-200K     │ Model-dep.  │
│ File Read/Write      │ ✅ --file    │ ✅ Native     │ ✅ Native     │ ✅ Native    │
│ PDF Generation       │ Via pandoc   │ ✅ Via bash   │ Via pandoc   │ Via pandoc  │
│ Multi-model          │ ❌ Google    │ ❌ Anthropic  │ ❌ OpenAI    │ ✅ All      │
│ Setup                │ 🟢 Easy     │ 🟢 Easy      │ 🟡 Medium    │ 🟢 Easy     │
│ Best For             │ Strong OSINT │ Calculations │ SDK dev      │ Flexible    │
│ Est. Audit Time      │ 45-75 min    │ 25-40 min    │ 20-35 min    │ 30-60 min   │
│ Key Strength         │ Google Search│ Subagent +   │ AsyncIO +    │ Any LLM +   │
│                      │ 1M context   │ Python tools │ mature SDK   │ open source │
└──────────────────────┴──────────────┴──────────────┴──────────────┴──────────────┘
```

---

## Usage Recommendations

```
OSINT-heavy audit (deep investigation):
  → Use Gemini CLI (strongest Google Search)

Complex financial audit (calculations, Python):
  → Use Claude Code (subagent + bash tool)

Development & API integration:
  → Use Codex (most mature AsyncIO SDK)

Limited budget / local models:
  → Use OpenCode with open source models

Fastest audit (time-critical):
  → Codex with o3 model + AsyncIO parallelism
```
