# Platform Guide: Gemini CLI
# Platform: Gemini CLI (Official Google)
# Reference: https://github.com/google-gemini/gemini-cli

---

## Platform Identity

```yaml
platform:        gemini-cli
provider:        Google
model_default:   gemini-2.5-pro
model_options:   [gemini-2.5-pro, gemini-2.0-flash, gemini-2.5-flash]
web_search:      Google Search Grounding (built-in, active by default)
file_input:      --file flag (xlsx, csv, pdf, txt, md)
context_window:  1,000,000 tokens
parallelism:     Sequential (single-thread)
agentic_loop:    Manual via shell script
```

---

## Install & Setup

```bash
npm install -g @google/gemini-cli
gemini auth login
gemini --version
# Set default model (optional)
export GEMINI_MODEL=gemini-2.5-pro
```

---

## Running Audit

### Quick Start
```bash
cd auditbpr
# Edit BPR configuration at the top of the script:
nano platforms/run_audit_gemini.sh
# Run:
bash platforms/run_audit_gemini.sh
```

### Manual (single agent)
```bash
gemini \
  --file ./data/neraca.xlsx \
  --file ./data/laba_rugi.xlsx \
  --model gemini-2.5-pro \
  --yolo \
  "$(cat agents/02_neraca/SKILL.md)

BPR: PT BPR Example, Bandung, Period 2020-2024
Run complete balance sheet analysis."
```

### Full Manual (all agents)
```bash
# Phase 0 — Parse data
gemini --file ./data/neraca.xlsx --file ./data/laba_rugi.xlsx \
       --file ./data/aset_produktif.xlsx --file ./data/rasio.xlsx \
       --yolo "$(cat tools/excel_csv_parser.md)
Parse all files to JSON. BPR: [NAME], Period: [YEAR]" \
  > output/agents/phase0.md

# Layer 1 — Run per agent
for AGENT in 01_bpr_profile 02_neraca 03_laba_rugi 04_aset_produktif 05_rasio_keuangan; do
  gemini --file ./data/neraca.xlsx --yolo \
    "$(cat agents/$AGENT/SKILL.md)
BPR: [NAME], Period: [YEAR]
$(cat output/agents/phase0.md)" \
    > output/agents/output_${AGENT}.md
  sleep 5
done

# Layer 2 — Investigation
for AGENT in 06_investigasi_pengurus 07_investigasi_pemegang_saham 08_investigasi_kap; do
  gemini --yolo "$(cat agents/$AGENT/SKILL.md)
$(cat tools/web_search_deepresearch.md)
BPR: [NAME] | Management: [LIST]" \
    > output/agents/output_${AGENT}.md
  sleep 10
done

# Layer 3 — Analytics
for AGENT in 09_cross_reference_redflag 10_forensic_trend 11_regulatory_compliance; do
  gemini --yolo "$(cat agents/$AGENT/SKILL.md)
$(cat output/agents/output_0*.md | head -c 60000)" \
    > output/agents/output_${AGENT}.md
  sleep 5
done

# Phase 4 — Report assembly
gemini --yolo "$(cat orchestrator/SKILL.md)
$(cat templates/laporan_final_template.md)
$(cat output/agents/output_*.md | head -c 80000)" \
  > output/markdown/laporan_audit.md
```

---

## Tips & Optimization

```bash
# 1M token context window → can send all 5 years of data at once
# No need to split files if size is reasonable (<50MB)
# For very deep OSINT: --model gemini-2.5-pro (strongest reasoning)
# Skip confirmation (automation): --yolo
# Save output to file: gemini ... > output/agents/output_02_neraca.md 2>&1
# Convert Excel to CSV if parsing issues:
python3 -c "
import pandas as pd
for n in ['neraca','laba_rugi','aset_produktif','rasio']:
    pd.read_excel(f'data/{n}.xlsx').to_csv(f'data/{n}.csv', index=False)
print('Conversion complete')
"
```

---

## Troubleshooting

```
ERROR: Rate limit exceeded
  → Increase sleep between agents: edit sleep values in run_audit_gemini.sh
  → Default: 5 sec (Layer 1), 10 sec (Layer 2)

ERROR: File too large
  → Convert Excel to CSV first

ERROR: Context window exceeded
  → Limit output sent to Layer 3: | head -c 50000
  → Use per-agent summaries instead of full output

ERROR: Search grounding not working
  → Check internet connection
  → Verify Gemini CLI auth is active: gemini auth status
```
