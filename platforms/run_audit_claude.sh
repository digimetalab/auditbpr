#!/usr/bin/env bash
# ================================================================
# BPR Audit Intelligence System — Claude Code Runner
# Platform : Claude Code (Anthropic)
# Usage    : bash platforms/run_audit_claude.sh
# ================================================================

set -euo pipefail

# ── KONFIGURASI BPR — EDIT BAGIAN INI ───────────────────────────
BPR_NAME="PT BPR Contoh Sejahtera"
BPR_KOTA="Bandung"
BPR_PROVINSI="Jawa Barat"
PERIODE="2020-2024"

PENGURUS="
  - Direktur Utama: Budi Santoso
  - Direktur      : Siti Rahayu
  - Komisaris Utama: Ahmad Wijaya
  - Komisaris     : Dewi Kusuma"

PEMEGANG_SAHAM="
  - PT Investasi Maju Sejahtera : 60%
  - Budi Santoso                : 25%
  - Siti Rahayu                 : 15%"

RIWAYAT_KAP="
  - 2020-2022: KAP Budi & Rekan (AP: Budi Santoso, CPA)
  - 2023-2024: KAP Wijaya Partners (AP: Andi Wijaya, CPA)"
# ── END KONFIGURASI ──────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$ROOT_DIR/output"
LOG_DIR="$OUTPUT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/audit_claude_$TIMESTAMP.log"
BPR_CODE=$(echo "$BPR_NAME" | tr ' ' '_' | tr -dc '[:alnum:]_')

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[WARN] $1${NC}" | tee -a "$LOG_FILE"; }
info() { echo -e "${CYAN}$1${NC}" | tee -a "$LOG_FILE"; }

# ── SETUP CLAUDE.md (System Prompt) ──────────────────────────────
setup_claude_md() {
  log "Setup CLAUDE.md sebagai system prompt..."

  cat > "$ROOT_DIR/CLAUDE.md" << CLAUDEMD
# BPR Audit Intelligence System — System Prompt

## ROLE
Kamu adalah Chief Audit Officer AI dengan pengalaman 30 tahun di BPR Indonesia.

## PROJECT CONTEXT
- Root: $ROOT_DIR
- Data: $ROOT_DIR/data/
- Output: $ROOT_DIR/output/
- Bahasa: Indonesia Formal (OJK-style)
- Satuan: Ribuan Rupiah

## BPR TARGET
Nama    : $BPR_NAME
Kota    : $BPR_KOTA
Provinsi: $BPR_PROVINSI
Periode : $PERIODE
Pengurus:$PENGURUS
Pemegang Saham:$PEMEGANG_SAHAM
KAP:$RIWAYAT_KAP

## TOOLS YANG TERSEDIA
- Python/pandas/numpy untuk kalkulasi keuangan
- Bash untuk file operations
- WebFetch untuk penelitian web
- Read/Write file langsung

## REFERENSI PENTING
- Regulasi: config/regulatory_thresholds.md
- Benchmark: config/industry_benchmarks.md
- Red Flag: templates/red_flag_taxonomy.md
- Scoring: templates/risk_scoring_matrix.md
CLAUDEMD

  log "✅ CLAUDE.md dibuat"
}

# ── FASE 0: PARSE DATA DENGAN PYTHON ─────────────────────────────
fase_0() {
  log "━━━ FASE 0: Parsing Data (Python/pandas) ━━━"
  mkdir -p "$OUTPUT_DIR/agents" "$LOG_DIR"

  claude --dangerously-skip-permissions \
    "$(cat "$ROOT_DIR/tools/excel_csv_parser.md")

INSTRUKSI:
Gunakan Python dengan pandas untuk membaca semua file di $ROOT_DIR/data/:
- neraca.xlsx (atau .csv)
- laba_rugi.xlsx (atau .csv)
- aset_produktif.xlsx (atau .csv)
- rasio.xlsx (atau .csv)

1. Parse ke JSON sesuai schema di tool spec di atas
2. Validasi: Total Aset = Total Liabilitas + Ekuitas
3. Hitung YoY growth semua pos utama
4. Simpan ke: $OUTPUT_DIR/agents/parsed_data.json
5. Simpan summary ke: $OUTPUT_DIR/agents/fase0_summary.md" \
    >> "$LOG_FILE" 2>&1 \
    && log "✅ Fase 0 selesai" \
    || warn "Fase 0 ada warning, lanjut..."
}

# ── FASE 1: PYTHON KALKULASI KEUANGAN ────────────────────────────
fase_1_calc() {
  log "━━━ Kalkulasi Keuangan (Python) ━━━"

  claude --dangerously-skip-permissions \
    "Baca file: $ROOT_DIR/tools/financial_calculator.py
Baca data: $OUTPUT_DIR/agents/parsed_data.json (jika ada)

Gunakan Python untuk menghitung:
1. Beneish M-Score (8 komponen) per pasang tahun
2. NPL Gross & Neto dari data aset produktif
3. PPKA Wajib vs PPKA Dibentuk (shortfall/surplus)
4. Adjusted CAR setelah shortfall PPKA
5. BMPK check: kredit pihak terkait vs modal
6. Window dressing indicators (5 metode)
7. Semua 9 rasio OJK — verifikasi independen

Simpan ke: $OUTPUT_DIR/agents/calculated_metrics.json
Simpan summary ke: $OUTPUT_DIR/agents/calc_summary.md" \
    >> "$LOG_FILE" 2>&1 \
    && log "✅ Kalkulasi selesai" \
    || warn "Kalkulasi ada warning"
}

# ── FASE 1: LAYER 1 — DATA AGENTS (TRUE PARALLEL) ────────────────
fase_1_agents() {
  log "━━━ FASE 1: Layer 1 Agents — True Parallel ━━━"

  # Claude Code mendukung subagent — jalankan semua paralel
  claude --dangerously-skip-permissions \
    "Jalankan 5 agent berikut secara PARALEL menggunakan subagents.
Masing-masing agent membaca SKILL.md-nya dan menganalisa data BPR.
Context BPR: $BPR_NAME, $BPR_KOTA, Periode $PERIODE

AGENT 1 — BPR Profile:
$(cat "$ROOT_DIR/agents/01_bpr_profile/SKILL.md")
→ Simpan ke: $OUTPUT_DIR/agents/output_01_bpr_profile.md

AGENT 2 — Neraca:
$(cat "$ROOT_DIR/agents/02_neraca/SKILL.md")
→ Data: $ROOT_DIR/data/neraca.xlsx
→ Simpan ke: $OUTPUT_DIR/agents/output_02_neraca.md

AGENT 3 — Laba Rugi:
$(cat "$ROOT_DIR/agents/03_laba_rugi/SKILL.md")
→ Data: $ROOT_DIR/data/laba_rugi.xlsx
→ Simpan ke: $OUTPUT_DIR/agents/output_03_laba_rugi.md

AGENT 4 — Aset Produktif:
$(cat "$ROOT_DIR/agents/04_aset_produktif/SKILL.md")
→ Data: $ROOT_DIR/data/aset_produktif.xlsx
→ Simpan ke: $OUTPUT_DIR/agents/output_04_aset_produktif.md

AGENT 5 — Rasio Keuangan:
$(cat "$ROOT_DIR/agents/05_rasio_keuangan/SKILL.md")
→ Data: $ROOT_DIR/data/rasio.xlsx
→ Metrics: $OUTPUT_DIR/agents/calculated_metrics.json
→ Simpan ke: $OUTPUT_DIR/agents/output_05_rasio_keuangan.md

Jalankan semua 5 agent secara paralel, tunggu semua selesai." \
    >> "$LOG_FILE" 2>&1 \
    && log "✅ Layer 1 agents selesai" \
    || warn "Layer 1 ada warning"
}

# ── FASE 2: LAYER 2 — INVESTIGATION AGENTS (PARALLEL) ────────────
fase_2() {
  log "━━━ FASE 2: Layer 2 — Investigation Agents ━━━"

  claude --dangerously-skip-permissions \
    "Jalankan 3 agent investigasi berikut secara PARALEL.
Gunakan WebFetch dan web search untuk OSINT.
Context BPR: $BPR_NAME, $BPR_KOTA

AGENT 6 — Investigasi Pengurus:
$(cat "$ROOT_DIR/agents/06_investigasi_pengurus/SKILL.md")
Pengurus:$PENGURUS
→ Simpan ke: $OUTPUT_DIR/agents/output_06_investigasi_pengurus.md

AGENT 7 — Investigasi Pemegang Saham:
$(cat "$ROOT_DIR/agents/07_investigasi_pemegang_saham/SKILL.md")
Pemegang Saham:$PEMEGANG_SAHAM
→ Simpan ke: $OUTPUT_DIR/agents/output_07_investigasi_pemegang_saham.md

AGENT 8 — Investigasi KAP:
$(cat "$ROOT_DIR/agents/08_investigasi_kap/SKILL.md")
KAP:$RIWAYAT_KAP
→ Simpan ke: $OUTPUT_DIR/agents/output_08_investigasi_kap.md

Jalankan semua 3 agent secara paralel." \
    >> "$LOG_FILE" 2>&1 \
    && log "✅ Layer 2 agents selesai" \
    || warn "Layer 2 ada warning"
}

# ── FASE 3: LAYER 3 — ANALYTICAL (SEQUENTIAL) ────────────────────
fase_3() {
  log "━━━ FASE 3: Layer 3 — Analytical Agents ━━━"

  for AGENT in 09_cross_reference_redflag 10_forensic_trend 11_regulatory_compliance; do
    log "  → $AGENT..."

    claude --dangerously-skip-permissions \
      "$(cat "$ROOT_DIR/agents/$AGENT/SKILL.md")
$(cat "$ROOT_DIR/templates/red_flag_taxonomy.md")
$(cat "$ROOT_DIR/templates/risk_scoring_matrix.md")

Context BPR: $BPR_NAME, $PERIODE

Baca semua output agent sebelumnya di: $OUTPUT_DIR/agents/
Jalankan analisa lengkap berdasarkan semua data yang tersedia.
→ Simpan ke: $OUTPUT_DIR/agents/output_${AGENT}.md" \
      >> "$LOG_FILE" 2>&1 \
      && log "  ✅ $AGENT selesai" \
      || warn "  ⚠️  $AGENT ada warning"
  done

  log "✅ Layer 3 selesai"
}

# ── FASE 4: FINAL ASSEMBLY ────────────────────────────────────────
fase_4() {
  log "━━━ FASE 4: Assembly Laporan Final ━━━"

  local MD_OUT="$OUTPUT_DIR/markdown/laporan_audit_${BPR_CODE}_${PERIODE}.md"

  claude --dangerously-skip-permissions \
    "$(cat "$ROOT_DIR/orchestrator/SKILL.md")
$(cat "$ROOT_DIR/templates/laporan_final_template.md")
$(cat "$ROOT_DIR/templates/risk_scoring_matrix.md")

BPR: $BPR_NAME, $BPR_KOTA, $PERIODE

Baca semua output agent di: $OUTPUT_DIR/agents/output_*.md
1. Hitung Risk Scoring Matrix CAMELS-BPR
2. Tulis Executive Summary tajam (5-7 paragraf)
3. Buat Opini Audit Profesional
4. Assembly laporan lengkap BAB I-X
5. Simpan ke: $MD_OUT

Setelah Markdown selesai, konversi ke PDF menggunakan:
pandoc '$MD_OUT' --pdf-engine=wkhtmltopdf --toc --number-sections \
  -V lang=id -V geometry:margin=2.5cm \
  -o '$OUTPUT_DIR/pdf/laporan_audit_${BPR_CODE}_${PERIODE}.pdf'" \
    >> "$LOG_FILE" 2>&1 \
    && log "✅ Laporan final selesai: $MD_OUT" \
    || warn "Assembly ada warning"
}

# ── MAIN ─────────────────────────────────────────────────────────
main() {
  command -v claude >/dev/null 2>&1 || { echo "❌ Claude Code tidak ditemukan. Install: npm install -g @anthropic-ai/claude-code"; exit 1; }
  mkdir -p "$OUTPUT_DIR/markdown" "$OUTPUT_DIR/pdf" "$OUTPUT_DIR/agents" "$LOG_DIR"

  info "\n================================================================"
  info " BPR AUDIT INTELLIGENCE SYSTEM — CLAUDE CODE"
  info " BPR: $BPR_NAME | Periode: $PERIODE"
  info " Started: $(date)"
  info "================================================================\n"

  setup_claude_md
  fase_0
  fase_1_calc
  fase_1_agents
  fase_2
  fase_3
  fase_4

  info "\n================================================================"
  info " ✅ AUDIT SELESAI — $(date)"
  info " Output: $OUTPUT_DIR/"
  info "================================================================\n"
}

main "$@"
