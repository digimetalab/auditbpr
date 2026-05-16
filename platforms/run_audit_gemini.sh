#!/usr/bin/env bash
# ================================================================
# BPR Audit Intelligence System — Gemini CLI Runner
# Platform : Gemini CLI (Official Google)
# Usage    : bash platforms/run_audit_gemini.sh
# ================================================================

set -euo pipefail

# ── BPR CONFIGURATION — EDIT THIS SECTION ───────────────────────
BPR_NAME="PT BPR Contoh Sejahtera"
BPR_KOTA="Bandung"
BPR_PROVINSI="Jawa Barat"
PERIODE="2020-2024"
NO_IZIN_OJK=""          # Optional

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
  - 2020-2021: KAP Budi & Rekan (AP: Budi Santoso, CPA)
  - 2022-2023: KAP Budi & Rekan (AP: Rina Wati, CPA)
  - 2024    : KAP Wijaya Partners (AP: Andi Wijaya, CPA)"
# ── END CONFIGURATION ───────────────────────────────────────────

# ── PATHS ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
DATA_DIR="$ROOT_DIR/data"
OUTPUT_DIR="$ROOT_DIR/output"
AGENTS_DIR="$ROOT_DIR/agents"
LOG_DIR="$OUTPUT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/audit_gemini_$TIMESTAMP.log"
BPR_CODE=$(echo "$BPR_NAME" | tr ' ' '_' | tr -dc '[:alnum:]_')

# ── OUTPUT COLORS ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'

log()  { echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"; }
warn() { echo -e "${YELLOW}[$(date '+%H:%M:%S')] ⚠️  $1${NC}" | tee -a "$LOG_FILE"; }
err()  { echo -e "${RED}[$(date '+%H:%M:%S')] ❌ $1${NC}" | tee -a "$LOG_FILE"; exit 1; }
info() { echo -e "${CYAN}$1${NC}" | tee -a "$LOG_FILE"; }

# ── PRE-FLIGHT CHECKS ────────────────────────────────────────────
preflight() {
  info "\n================================================================"
  info " BPR AUDIT INTELLIGENCE SYSTEM — GEMINI CLI"
  info " BPR     : $BPR_NAME"
  info " Periode : $PERIODE"
  info " Started : $(date)"
  info "================================================================\n"

  command -v gemini >/dev/null 2>&1 || err "Gemini CLI not found. Install: npm install -g @google/gemini-cli"

  mkdir -p "$OUTPUT_DIR/markdown" "$OUTPUT_DIR/pdf" "$OUTPUT_DIR/agents" "$LOG_DIR"

  local files_ok=true
  for f in neraca.xlsx laba_rugi.xlsx aset_produktif.xlsx rasio.xlsx; do
    if [[ ! -f "$DATA_DIR/$f" ]]; then
      warn "File not found: data/$f"
      # Try CSV format as fallback
      local csv="${f%.xlsx}.csv"
      if [[ -f "$DATA_DIR/$csv" ]]; then
        log "Using CSV: data/$csv"
      else
        files_ok=false
      fi
    fi
  done
  [[ "$files_ok" == false ]] && err "Incomplete data. Place Excel/CSV files in data/ folder"

  log "✅ Pre-flight checks passed"
}

# ── HELPER: RESOLVE DATA FILE ────────────────────────────────────
resolve_file() {
  local base="$1"
  if [[ -f "$DATA_DIR/${base}.xlsx" ]]; then echo "$DATA_DIR/${base}.xlsx"
  elif [[ -f "$DATA_DIR/${base}.csv" ]]; then echo "$DATA_DIR/${base}.csv"
  else echo ""; fi
}

# ── BPR CONTEXT STRING ───────────────────────────────────────────
bpr_context() {
cat <<EOF

================================================================
BPR DATA FOR ANALYSIS
================================================================
Nama BPR    : $BPR_NAME
Kota        : $BPR_KOTA
Provinsi    : $BPR_PROVINSI
Periode     : $PERIODE
No Izin OJK : ${NO_IZIN_OJK:-"(tidak diisi)"}

PENGURUS:$PENGURUS

PEMEGANG SAHAM:$PEMEGANG_SAHAM

RIWAYAT KAP:$RIWAYAT_KAP
================================================================
EOF
}

# ── PHASE 0: INITIALIZATION & PARSING ────────────────────────────
fase_0() {
  log "━━━ PHASE 0: Data Parsing & Validation ━━━"

  local NERACA=$(resolve_file "neraca")
  local LR=$(resolve_file "laba_rugi")
  local AP=$(resolve_file "aset_produktif")
  local RASIO=$(resolve_file "rasio")

  gemini \
    --file "$NERACA" --file "$LR" --file "$AP" --file "$RASIO" \
    --model gemini-2.5-pro --yolo \
    "$(bpr_context)
$(cat "$ROOT_DIR/tools/excel_csv_parser.md")

INSTRUKSI FASE 0:
1. Parse semua file ke struktur JSON sesuai schema di atas
2. Validasi: Total Aset = Total Liabilitas + Ekuitas (setiap tahun)
3. Catat semua data yang hilang atau anomali
4. Hitung metrik dasar: YoY growth semua pos utama
5. Output: ringkasan parsing dalam format Markdown

Simpan hasil ke: output/agents/fase0_parsed_data.md" \
    > "$OUTPUT_DIR/agents/fase0_parsed_data.md" 2>&1 \
    && log "✅ Fase 0 selesai" \
    || warn "⚠️  Fase 0 ada error, cek log"
}

# ── PHASE 1: LAYER 1 AGENTS (sequential, treated as parallel) ────
fase_1() {
  log "━━━ FASE 1: Layer 1 — Data Agents ━━━"

  local NERACA=$(resolve_file "neraca")
  local LR=$(resolve_file "laba_rugi")
  local AP=$(resolve_file "aset_produktif")
  local RASIO=$(resolve_file "rasio")
  local PHASE0="$OUTPUT_DIR/agents/fase0_parsed_data.md"

  declare -A AGENT_FILES=(
    ["01_bpr_profile"]=""
    ["02_neraca"]="$NERACA"
    ["03_laba_rugi"]="$LR"
    ["04_aset_produktif"]="$AP"
    ["05_rasio_keuangan"]="$RASIO"
  )

  for AGENT in 01_bpr_profile 02_neraca 03_laba_rugi 04_aset_produktif 05_rasio_keuangan; do
    log "  → Agent $AGENT..."
    local SKILL="$AGENTS_DIR/$AGENT/SKILL.md"
    local OUT="$OUTPUT_DIR/agents/output_${AGENT}.md"
    local DATA_FILE="${AGENT_FILES[$AGENT]}"

    local FILE_ARGS=""
    [[ -n "$DATA_FILE" && -f "$DATA_FILE" ]] && FILE_ARGS="--file $DATA_FILE"
    [[ -f "$PHASE0" ]] && FILE_ARGS="$FILE_ARGS --file $PHASE0"

    gemini \
      $FILE_ARGS \
      --model gemini-2.5-pro --yolo \
      "$(bpr_context)
$(cat "$ROOT_DIR/config/regulatory_thresholds.md")
$(cat "$ROOT_DIR/config/industry_benchmarks.md")
$(cat "$SKILL")

Jalankan analisa lengkap sesuai instruksi SKILL.md di atas.
Output dalam Bahasa Indonesia formal standar OJK." \
      > "$OUT" 2>&1 \
      && log "  ✅ $AGENT selesai" \
      || warn "  ⚠️  $AGENT ada error"

    sleep 5  # Rate limit buffer
  done

  log "✅ Fase 1 (Layer 1) selesai"
}

# ── PHASE 2: LAYER 2 AGENTS (investigation / OSINT) ──────────────
fase_2() {
  log "━━━ FASE 2: Layer 2 — Investigation Agents ━━━"

  for AGENT in 06_investigasi_pengurus 07_investigasi_pemegang_saham 08_investigasi_kap; do
    log "  → Agent $AGENT..."
    local SKILL="$AGENTS_DIR/$AGENT/SKILL.md"
    local OUT="$OUTPUT_DIR/agents/output_${AGENT}.md"

    gemini \
      --model gemini-2.5-pro --yolo \
      "$(bpr_context)
$(cat "$ROOT_DIR/tools/web_search_deepresearch.md")
$(cat "$SKILL")

Lakukan investigasi mendalam menggunakan Google Search.
Output dalam Bahasa Indonesia formal standar OJK." \
      > "$OUT" 2>&1 \
      && log "  ✅ $AGENT selesai" \
      || warn "  ⚠️  $AGENT ada error"

    sleep 10  # OSINT needs more time
  done

  log "✅ Fase 2 (Layer 2) selesai"
}

# ── PHASE 3: LAYER 3 AGENTS (analytical, sequential) ─────────────
fase_3() {
  log "━━━ FASE 3: Layer 3 — Analytical Agents ━━━"

  # Combine all Layer 1+2 output
  local ALL_PREV=""
  for f in "$OUTPUT_DIR/agents"/output_0{1..8}*.md; do
    [[ -f "$f" ]] && ALL_PREV="$ALL_PREV\n\n---\n\n$(cat "$f")"
  done

  for AGENT in 09_cross_reference_redflag 10_forensic_trend 11_regulatory_compliance; do
    log "  → Agent $AGENT..."
    local SKILL="$AGENTS_DIR/$AGENT/SKILL.md"
    local OUT="$OUTPUT_DIR/agents/output_${AGENT}.md"

    # Include output from previous agents
    local PREV_OUTPUTS=""
    for f in "$OUTPUT_DIR/agents"/output_*.md; do
      [[ -f "$f" ]] && PREV_OUTPUTS="$PREV_OUTPUTS\n\n$(cat "$f")"
    done

    gemini \
      --model gemini-2.5-pro --yolo \
      "$(bpr_context)
$(cat "$ROOT_DIR/templates/red_flag_taxonomy.md")
$(cat "$ROOT_DIR/templates/risk_scoring_matrix.md")
$(cat "$SKILL")

OUTPUT DARI SEMUA AGENT SEBELUMNYA:
$(echo -e "$PREV_OUTPUTS" | head -c 50000)

Lakukan analisa berdasarkan semua data di atas.
Output dalam Bahasa Indonesia formal standar OJK." \
      > "$OUT" 2>&1 \
      && log "  ✅ $AGENT selesai" \
      || warn "  ⚠️  $AGENT ada error"

    sleep 5
  done

  log "✅ Fase 3 (Layer 3) selesai"
}

# ── PHASE 4: FINAL REPORT ASSEMBLY ───────────────────────────────
fase_4() {
  log "━━━ PHASE 4: Final Report Assembly ━━━"

  local ALL_OUTPUTS=""
  for f in "$OUTPUT_DIR/agents"/output_*.md; do
    [[ -f "$f" ]] && ALL_OUTPUTS="$ALL_OUTPUTS\n\n$(cat "$f")"
  done

  local MD_OUT="$OUTPUT_DIR/markdown/laporan_audit_${BPR_CODE}_${PERIODE}.md"

  gemini \
    --model gemini-2.5-pro --yolo \
    "$(bpr_context)
$(cat "$ROOT_DIR/orchestrator/SKILL.md")
$(cat "$ROOT_DIR/templates/laporan_final_template.md")
$(cat "$ROOT_DIR/templates/risk_scoring_matrix.md")

SEMUA OUTPUT AGENT (11 AGENT):
$(echo -e "$ALL_OUTPUTS" | head -c 80000)

INSTRUKSI FASE 4:
1. Hitung Risk Scoring Matrix CAMELS-BPR dari semua data
2. Tulis Executive Summary yang tajam (5-7 paragraf)
3. Buat Opini Audit Profesional
4. Assembly laporan lengkap menggunakan template
5. Pastikan semua BAB I-X terisi lengkap
6. Bahasa: Indonesia formal standar OJK" \
    > "$MD_OUT" 2>&1 \
    && log "✅ Laporan Markdown: $MD_OUT" \
    || warn "⚠️  Assembly ada error"

  # Convert to PDF if pandoc is available
  if command -v pandoc &>/dev/null; then
    local PDF_OUT="$OUTPUT_DIR/pdf/laporan_audit_${BPR_CODE}_${PERIODE}.pdf"
    log "  Converting to PDF..."
    pandoc "$MD_OUT" \
      --pdf-engine=wkhtmltopdf \
      --toc --toc-depth=3 --number-sections \
      -V lang=id -V geometry:margin=2.5cm -V fontsize=11pt \
      -o "$PDF_OUT" 2>/dev/null \
      && log "✅ PDF Report: $PDF_OUT" \
      || warn "⚠️  PDF conversion failed (pandoc/wkhtmltopdf error)"
  else
    warn "pandoc not found. Install: sudo apt install pandoc wkhtmltopdf"
    warn "Markdown report available: $MD_OUT"
  fi
}

# ── MAIN ─────────────────────────────────────────────────────────
main() {
  preflight
  fase_0
  fase_1
  fase_2
  fase_3
  fase_4

  info "\n================================================================"
  info " ✅ AUDIT COMPLETE"
  info " BPR      : $BPR_NAME"
  info " Finished : $(date)"
  info " Log      : $LOG_FILE"
  info " Output   : $OUTPUT_DIR/"
  info "================================================================\n"
}

main "$@"
