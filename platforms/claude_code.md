# Platform Guide: Claude Code
# Platform: Claude Code (Anthropic)
# Reference: https://docs.anthropic.com/claude-code

---

## Platform Identity

```yaml
platform:        claude-code
provider:        Anthropic
model_default:   claude-opus-4
model_options:   [claude-opus-4, claude-sonnet-4]
web_search:      WebFetch (specific URLs) + built-in search
file_input:      Direct filesystem read/write
context_window:  200,000 tokens (with prompt caching)
parallelism:     ✅ TRUE — Native subagent spawning
agentic_loop:    ✅ Built-in tool use loop
python:          ✅ Via bash tool (pandas, numpy available)
```

---

## Install & Setup

```bash
npm install -g @anthropic-ai/claude-code
claude auth login
# or set API key:
export ANTHROPIC_API_KEY=sk-ant-...
claude --version
```

---

## Running Audit

### Quick Start (Recommended)
```bash
cd auditbpr
# Edit BPR configuration:
nano platforms/run_audit_claude.sh
# Run:
bash platforms/run_audit_claude.sh
```

### Using CLAUDE.md
```bash
cd auditbpr
# Copy SKILL.md as system prompt (auto-read by Claude Code)
cp SKILL.md CLAUDE.md
# Run audit directly
claude --dangerously-skip-permissions \
  "Start BPR Audit Intelligence System.
   BPR: PT BPR Your Name
   City: Bandung, Period: 2020-2024
   Data in ./data/ folder
   Run all 4 phases per orchestrator/SKILL.md"
```

### Using True Parallelism
```bash
# Claude Code supports subagents — Layer 1 & 2 run truly in parallel
claude --dangerously-skip-permissions "
Run 5 PARALLEL subagents for BPR Audit Layer 1:

Subagent 1: Read agents/01_bpr_profile/SKILL.md → analyze BPR profile
Subagent 2: Read agents/02_neraca/SKILL.md + data/neraca.xlsx → balance sheet
Subagent 3: Read agents/03_laba_rugi/SKILL.md + data/laba_rugi.xlsx → P&L
Subagent 4: Read agents/04_aset_produktif/SKILL.md → productive assets
Subagent 5: Read agents/05_rasio_keuangan/SKILL.md → financial ratios

Wait for all to complete, save each to output/agents/output_0[N]_*.md
Continue to Layer 2 in parallel after Layer 1 completes."
```

---

## Claude Code Advantages for BPR Audit

```bash
# 1. Accurate Python calculations via bash tool
claude "Use Python with pandas to calculate Beneish M-Score
from data in output/agents/parsed_data.json.
Run tools/financial_calculator.py --input output/agents/parsed_data.json"

# 2. Direct Excel file reading
claude "Read data/neraca.xlsx with openpyxl/pandas,
extract all sheets, validate balance sheet"

# 3. Generate and run calculation scripts
claude "Write Python script to reconstruct all 9 OJK ratios
from balance sheet and P&L data, verify vs BPR-reported ratios"

# 4. Auto PDF via pandoc
claude "After markdown report is complete, convert to PDF:
pandoc output/markdown/report.md --pdf-engine=wkhtmltopdf --toc -o output/pdf/report.pdf"
```

---

## Auto-Generated CLAUDE.md

The `run_audit_claude.sh` script creates `CLAUDE.md` containing:
- Role & system instructions
- Target BPR data (name, city, management, shareholders, KAP)
- Data & output folder paths
- Available tools
- Config & template file references

This file is **not committed** to git (listed in .gitignore).

---

## Tips & Optimization

```bash
# --dangerously-skip-permissions: skip confirmation for every tool call
# Use ONLY in safe/isolated environments

# For accurate financial calculations — always use Python:
# Beneish M-Score, NPL, PPKA, adjusted CAR, BMPK
# Do not rely on LLM for sensitive number calculations

# Caching: save parsed_data.json in Phase 0
# All subsequent agents read from this file → save tokens & time

# For long reports: generate per chapter, append to file
for CHAPTER in I II III IV V VI VII VIII IX X; do
  claude "Write Chapter $CHAPTER of the audit report per template..." >> output/markdown/report.md
done
```

---

## Troubleshooting

```
ERROR: Permission denied
  → Add --dangerously-skip-permissions
  → Or answer 'y' to each confirmation

ERROR: Context length exceeded
  → Send data per year, not all 5 years at once
  → Use file references instead of inline content

ERROR: Tool call failed
  → Claude Code retries automatically
  → Check logs in output/logs/

ERROR: PDF conversion failed
  → Install pandoc: sudo apt install pandoc wkhtmltopdf
  → Or use markdown-pdf: npm install -g markdown-pdf
```
