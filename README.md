# 🏦 BPR Audit Intelligence System

> Comprehensive audit, investigation, and analysis system for Indonesian Rural Banks
> (Bank Perkreditan Rakyat / BPR) powered by multi-agent AI — supporting Gemini CLI,
> Claude Code, Codex, and OpenCode.

---

## 📋 Overview

This system orchestrates **12 AI agents** (11 specialists + 1 orchestrator) to
produce comprehensive, incisive, and OJK/BI regulation-compliant BPR audit reports
— based on 5-year financial data and in-depth OSINT investigations.

| Layer | Agent | Function | Mode |
|-------|-------|----------|------|
| Orchestrator | Master | Coordination & final report | — |
| Layer 1 | 01–05 | Financial analysis | **Parallel** |
| Layer 2 | 06–08 | KYC/OSINT investigation | **Parallel** |
| Layer 3 | 09–11 | Synthesis & forensics | Sequential |

---

## 🚀 Quick Start

### 1. Prepare Data
Place your Excel/CSV files in the `data/` folder:
```
data/neraca.xlsx
data/laba_rugi.xlsx
data/aset_produktif.xlsx
data/rasio.xlsx
```

### 2. Choose a Platform & Run

**Gemini CLI** (Recommended for OSINT)
```bash
bash platforms/run_audit_gemini.sh
```

**Claude Code** (Recommended for complex calculations)
```bash
bash platforms/run_audit_claude.sh
```

**Codex (OpenAI)**
```bash
python platforms/run_audit_codex.py
```

**OpenCode**
```bash
opencode run --config platforms/opencode.config.json
```

---

## 📁 Project Structure

```
auditbpr/
├── SKILL.md                           ← Entry point (all platforms)
├── README.md                          ← This documentation
│
├── orchestrator/
│   └── SKILL.md                       ← Master coordinator (4 phases)
│
├── agents/
│   ├── 01_bpr_profile/SKILL.md        ← BPR profile, license, reputation
│   ├── 02_neraca/SKILL.md             ← Balance sheet analysis (5 years)
│   ├── 03_laba_rugi/SKILL.md          ← P&L analysis (5 years)
│   ├── 04_aset_produktif/SKILL.md     ← Asset quality & NPL
│   ├── 05_rasio_keuangan/SKILL.md     ← 9 OJK ratios + benchmarks
│   ├── 06_investigasi_pengurus/       ← KYC Directors & Commissioners
│   │   └── SKILL.md
│   ├── 07_investigasi_pemegang_saham/ ← KYC & beneficial owner
│   │   └── SKILL.md
│   ├── 08_investigasi_kap/            ← Auditor independence
│   │   └── SKILL.md
│   ├── 09_cross_reference_redflag/    ← Pattern & red flag detection
│   │   └── SKILL.md
│   ├── 10_forensic_trend/             ← Beneish M-Score & projections
│   │   └── SKILL.md
│   └── 11_regulatory_compliance/      ← OJK/BI compliance audit
│       └── SKILL.md
│
├── tools/
│   ├── excel_csv_parser.md            ← Excel/CSV parsing schema
│   ├── web_search_deepresearch.md     ← 3-layer OSINT protocol
│   ├── pdf_generator.md               ← Markdown → PDF conversion
│   ├── markdown_renderer.md           ← Formatting standards
│   └── financial_calculator.py        ← Python: BPR financial calculations
│
├── templates/
│   ├── laporan_final_template.md      ← OJK-style report template
│   ├── risk_scoring_matrix.md         ← CAMELS-BPR scoring
│   └── red_flag_taxonomy.md           ← 15 red flags (Tier 1/2/3)
│
├── config/
│   ├── regulatory_thresholds.md       ← Complete OJK/BI thresholds
│   └── industry_benchmarks.md         ← National BPR benchmarks
│
├── platforms/
│   ├── gemini_cli.md                  ← Gemini CLI guide
│   ├── claude_code.md                 ← Claude Code guide
│   ├── codex_opencode.md              ← Codex & OpenCode guide
│   ├── run_audit_gemini.sh            ← Gemini CLI shell script
│   ├── run_audit_claude.sh            ← Claude Code shell script
│   ├── run_audit_codex.py             ← Codex Python script
│   └── opencode.config.json           ← OpenCode config
│
├── data/                              ← Place input files here
│   └── .gitkeep
│
└── output/                            ← Report output (auto-generated)
    ├── markdown/
    ├── pdf/
    ├── agents/
    └── logs/
```

---

## 📊 Report Output

```
Final Report Structure (80–150 A4 pages):

I.    Executive Summary
II.   BPR Profile & Reputation
III.  5-Year Financial Analysis
      A. Balance Sheet (Financial Position)
      B. Profit & Loss (Performance)
      C. Productive Asset Quality
      D. Financial Ratios (9 OJK ratios)
IV.   Governance Investigation
      A. Directors & Commissioners (KYC OSINT)
      B. Shareholders (Beneficial Owner)
      C. External Auditor (KAP)
V.    Critical Findings & Red Flags
VI.   Forensic & Trend Analysis (Beneish M-Score)
VII.  OJK/BI Regulatory Compliance
VIII. Risk Scoring Matrix (CAMELS-BPR)
IX.   Recommendations & Audit Opinion
X.    Appendix & Data Sources
```

---

## 🔍 Analysis Capabilities

### Financial
- 5-year trends: assets, loans, deposits, profitability, efficiency
- Independent verification of 9 OJK ratios from raw data
- PPKA adequacy & adjusted CAR after shortfall
- BMPK check (related-party loans vs. capital)
- Benchmarking against national BPR industry averages

### Forensic
- **Beneish M-Score** adapted for BPR (8 components)
- **Window dressing detection** (5 methods)
- Cross-report anomaly correlation
- 3-scenario stress test + capital buffer analysis
- Base Case & Worst Case projections for T+1, T+2

### KYC/OSINT Investigation
- 28 queries per executive: legal, business, social media, SLIK, PPATK
- Beneficial owner tracing (down to natural persons)
- KAP independence analysis: tenure, affiliations, PPPK track record
- Network mapping: hidden connections between executives–shareholders–KAP
- Detection of 5 fraud patterns: tunneling, zombie BPR, deposit ponzi, etc.

### Compliance
- POJK 5/2015, 33/2018, 49/2017, 62/2020, 48/2017, 23/2018
- PBI 7/2/2005, PMK 154/2017
- Automatic web search for latest OJK regulations

---

## ⚙️ Platform Comparison

| Feature | Gemini CLI | Claude Code | Codex | OpenCode |
|---------|:----------:|:-----------:|:-----:|:--------:|
| True Parallelism | — | ✅ Subagents | ✅ AsyncIO | — |
| Google Search | ✅ Native | WebFetch | ✅ Tool | Plugin |
| Python Execution | Via bash | ✅ Bash tool | ✅ CodeInterp | ✅ Terminal |
| Context Window | 1M token | 200K | 128K | Varies |
| Setup | 🟢 Easy | 🟢 Easy | 🟡 Medium | 🟢 Easy |
| Best for | OSINT | Calculations | SDK/API | Flexible |

---

## 📏 Regulations Covered

| Regulation | Aspects Checked |
|------------|----------------|
| POJK 5/2015 | CAR ≥12%, minimum capital per region |
| POJK 33/2018 | NPL ≤5%, minimum PPKA per collectibility |
| POJK 49/2017 | BMPK 10%/20%/30% |
| POJK 62/2020 | Fit & Proper, concurrent positions |
| POJK 48/2017 | Transparency & report publication |
| POJK 23/2018 | AML/CFT, CDD/KYC, PPATK |
| PBI 7/2/2005 | Collectibility classification |
| PMK 154/2017 | KAP & AP active license |
| UU 7/1992 jo 10/1998 | Prohibited activities |

---

## ⚠️ Disclaimer

This system is a professional tool for BPR audit and investigation.
Output is **indicative** and does not replace formal audits per
IAPI/OJK standards. OSINT investigations are based on publicly available
information and require official verification before being used as a
basis for legal decisions.

---

*BPR Audit Intelligence System v2.0.0 — Built for stronger banking supervision.*
