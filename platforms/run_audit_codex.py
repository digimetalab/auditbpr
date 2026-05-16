#!/usr/bin/env python3
"""
================================================================
BPR Audit Intelligence System — OpenAI Codex Runner
Platform : OpenAI Codex / GPT-4.1 / o3
Usage    : python platforms/run_audit_codex.py [--bpr "Nama"] [--periode "2020-2024"]
================================================================
"""

import os
import sys
import json
import asyncio
import argparse
import datetime
from pathlib import Path

try:
    from openai import AsyncOpenAI
except ImportError:
    print("❌ OpenAI SDK tidak ditemukan. Install: pip install openai")
    sys.exit(1)

# ── KONFIGURASI ──────────────────────────────────────────────────
DEFAULT_CONFIG = {
    "bpr_name"    : "PT BPR Contoh Sejahtera",
    "bpr_kota"    : "Bandung",
    "bpr_provinsi": "Jawa Barat",
    "periode"     : "2020-2024",
    "model"       : "gpt-4.1",          # atau "o3", "codex-1"
    "max_tokens"  : 16000,
    "pengurus": [
        {"jabatan": "Direktur Utama",  "nama": "Budi Santoso"},
        {"jabatan": "Direktur",        "nama": "Siti Rahayu"},
        {"jabatan": "Komisaris Utama", "nama": "Ahmad Wijaya"},
        {"jabatan": "Komisaris",       "nama": "Dewi Kusuma"},
    ],
    "pemegang_saham": [
        {"nama": "PT Investasi Maju Sejahtera", "persen": 60, "jenis": "badan_hukum"},
        {"nama": "Budi Santoso",                "persen": 25, "jenis": "individu"},
        {"nama": "Siti Rahayu",                 "persen": 15, "jenis": "individu"},
    ],
    "riwayat_kap": [
        {"tahun": "2020-2022", "kap": "KAP Budi & Rekan",    "ap": "Budi Santoso, CPA"},
        {"tahun": "2023-2024", "kap": "KAP Wijaya Partners", "ap": "Andi Wijaya, CPA"},
    ],
}

# ── PATHS ─────────────────────────────────────────────────────────
ROOT = Path(__file__).parent.parent
DATA = ROOT / "data"
OUTPUT = ROOT / "output"
AGENTS = ROOT / "agents"
TOOLS = ROOT / "tools"
TEMPLATES = ROOT / "templates"
CONFIG = ROOT / "config"
ORCHESTRATOR = ROOT / "orchestrator"

# ── HELPERS ──────────────────────────────────────────────────────
def read(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except FileNotFoundError:
        return f"[FILE TIDAK DITEMUKAN: {path}]"

def read_data_file(name: str) -> str:
    """Baca data file sebagai teks (untuk CSV) atau deskripsi (untuk xlsx)."""
    for ext in [".csv", ".xlsx"]:
        f = DATA / f"{name}{ext}"
        if f.exists():
            if ext == ".csv":
                return f.read_text(encoding="utf-8", errors="replace")[:10000]
            else:
                return f"[File Excel: {f}] — Agent harus membaca file ini dengan tools."
    return f"[Data {name} tidak ditemukan di folder data/]"

def bpr_context(cfg: dict) -> str:
    pengurus_str = "\n".join(
        f"  - {p['jabatan']}: {p['nama']}" for p in cfg["pengurus"]
    )
    ps_str = "\n".join(
        f"  - {p['nama']}: {p['persen']}% ({p['jenis']})" for p in cfg["pemegang_saham"]
    )
    kap_str = "\n".join(
        f"  - {k['tahun']}: {k['kap']} / AP: {k['ap']}" for k in cfg["riwayat_kap"]
    )
    return f"""
================================================================
DATA BPR
================================================================
Nama BPR    : {cfg['bpr_name']}
Kota        : {cfg['bpr_kota']}
Provinsi    : {cfg['bpr_provinsi']}
Periode     : {cfg['periode']}

PENGURUS:
{pengurus_str}

PEMEGANG SAHAM:
{ps_str}

RIWAYAT KAP:
{kap_str}
================================================================
"""

def system_prompt(cfg: dict) -> str:
    return f"""Kamu adalah Chief Audit Officer AI dengan pengalaman 30 tahun
di industri Bank Perkreditan Rakyat (BPR) Indonesia.

ATURAN:
- Bahasa output: Bahasa Indonesia Formal (standar OJK)
- Satuan angka: Ribuan Rupiah
- Setiap temuan harus didukung data/bukti
- Temuan OSINT wajib disertai URL sumber
- Format output: Markdown

REGULASI REFERENSI:
{read(CONFIG / 'regulatory_thresholds.md')}

BENCHMARK INDUSTRI:
{read(CONFIG / 'industry_benchmarks.md')}
"""

async def call_llm(client: AsyncOpenAI, cfg: dict, prompt: str, agent_name: str) -> str:
    """Panggil LLM dengan retry dan error handling."""
    print(f"  🤖 [{agent_name}] Menghubungi {cfg['model']}...")
    for attempt in range(3):
        try:
            resp = await client.chat.completions.create(
                model=cfg["model"],
                max_tokens=cfg["max_tokens"],
                messages=[
                    {"role": "system", "content": system_prompt(cfg)},
                    {"role": "user",   "content": prompt},
                ],
                timeout=300,
            )
            return resp.choices[0].message.content or ""
        except Exception as e:
            if attempt < 2:
                print(f"  ⚠️  [{agent_name}] Attempt {attempt+1} gagal: {e}. Retry...")
                await asyncio.sleep(10 * (attempt + 1))
            else:
                return f"[ERROR {agent_name}: {e}]"

def save(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print(f"  💾 Disimpan: {path.relative_to(ROOT)}")

# ── FASE 0: INISIALISASI ──────────────────────────────────────────
async def fase_0(client: AsyncOpenAI, cfg: dict) -> str:
    print("\n━━━ FASE 0: Parsing & Validasi Data ━━━")
    prompt = f"""
{bpr_context(cfg)}

DATA KEUANGAN:
NERACA:
{read_data_file('neraca')}

LABA RUGI:
{read_data_file('laba_rugi')}

ASET PRODUKTIF:
{read_data_file('aset_produktif')}

RASIO KEUANGAN:
{read_data_file('rasio')}

INSTRUKSI PARSING:
{read(TOOLS / 'excel_csv_parser.md')}

Jalankan validasi dan ringkasan data. Output dalam Markdown.
"""
    result = await call_llm(client, cfg, prompt, "Fase0-Parser")
    save(OUTPUT / "agents" / "fase0_parsed_data.md", result)
    print("✅ Fase 0 selesai")
    return result

# ── FASE 1: LAYER 1 (PARALEL) ─────────────────────────────────────
async def run_layer1_agent(client: AsyncOpenAI, cfg: dict, agent_id: str, parsed_data: str) -> tuple:
    skill = read(AGENTS / agent_id / "SKILL.md")
    data_map = {
        "01_bpr_profile": "",
        "02_neraca": read_data_file("neraca"),
        "03_laba_rugi": read_data_file("laba_rugi"),
        "04_aset_produktif": read_data_file("aset_produktif"),
        "05_rasio_keuangan": read_data_file("rasio"),
    }
    prompt = f"""
{bpr_context(cfg)}

DATA RELEVAN:
{data_map.get(agent_id, '')}

DATA PARSED (FASE 0):
{parsed_data[:5000]}

INSTRUKSI AGENT:
{skill}

Jalankan analisa lengkap sesuai instruksi. Output Markdown.
"""
    result = await call_llm(client, cfg, prompt, agent_id)
    save(OUTPUT / "agents" / f"output_{agent_id}.md", result)
    return agent_id, result

async def fase_1(client: AsyncOpenAI, cfg: dict, parsed_data: str) -> dict:
    print("\n━━━ FASE 1: Layer 1 — Data Agents [PARALEL] ━━━")
    agents = [
        "01_bpr_profile", "02_neraca", "03_laba_rugi",
        "04_aset_produktif", "05_rasio_keuangan",
    ]
    tasks = [run_layer1_agent(client, cfg, a, parsed_data) for a in agents]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    outputs = {}
    for r in results:
        if isinstance(r, tuple):
            agent_id, content = r
            outputs[agent_id] = content
            print(f"  ✅ {agent_id} selesai")
        else:
            print(f"  ⚠️  Error: {r}")
    print("✅ Fase 1 (Layer 1) selesai")
    return outputs

# ── FASE 2: LAYER 2 (PARALEL) ─────────────────────────────────────
async def run_layer2_agent(client: AsyncOpenAI, cfg: dict, agent_id: str) -> tuple:
    skill = read(AGENTS / agent_id / "SKILL.md")
    osint_protocol = read(TOOLS / "web_search_deepresearch.md")
    prompt = f"""
{bpr_context(cfg)}

PROTOKOL OSINT:
{osint_protocol}

INSTRUKSI AGENT:
{skill}

Lakukan investigasi mendalam. Simulasikan hasil pencarian web berdasarkan
data yang tersedia dan pengetahuanmu. Cantumkan URL referensi yang relevan.
Output dalam Markdown format standar OJK.
"""
    result = await call_llm(client, cfg, prompt, agent_id)
    save(OUTPUT / "agents" / f"output_{agent_id}.md", result)
    return agent_id, result

async def fase_2(client: AsyncOpenAI, cfg: dict) -> dict:
    print("\n━━━ FASE 2: Layer 2 — Investigation Agents [PARALEL] ━━━")
    agents = [
        "06_investigasi_pengurus",
        "07_investigasi_pemegang_saham",
        "08_investigasi_kap",
    ]
    tasks = [run_layer2_agent(client, cfg, a) for a in agents]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    outputs = {}
    for r in results:
        if isinstance(r, tuple):
            agent_id, content = r
            outputs[agent_id] = content
            print(f"  ✅ {agent_id} selesai")
        else:
            print(f"  ⚠️  Error: {r}")
    print("✅ Fase 2 (Layer 2) selesai")
    return outputs

# ── FASE 3: LAYER 3 (SEQUENTIAL) ──────────────────────────────────
async def fase_3(client: AsyncOpenAI, cfg: dict, all_prev: dict) -> dict:
    print("\n━━━ FASE 3: Layer 3 — Analytical Agents [SEQUENTIAL] ━━━")

    prev_text = "\n\n---\n\n".join(
        f"### OUTPUT {k.upper()}\n{v}" for k, v in all_prev.items()
    )
    red_flags = read(TEMPLATES / "red_flag_taxonomy.md")
    scoring   = read(TEMPLATES / "risk_scoring_matrix.md")

    agents = [
        "09_cross_reference_redflag",
        "10_forensic_trend",
        "11_regulatory_compliance",
    ]
    outputs = {}
    for agent_id in agents:
        print(f"  → {agent_id}...")
        skill = read(AGENTS / agent_id / "SKILL.md")

        # Sertakan output agent sebelumnya di layer 3
        layer3_prev = "\n\n".join(
            f"### {k}\n{v}" for k, v in outputs.items()
        )

        prompt = f"""
{bpr_context(cfg)}

RED FLAG TAXONOMY:
{red_flags}

RISK SCORING MATRIX:
{scoring}

INSTRUKSI AGENT:
{skill}

OUTPUT SEMUA AGENT SEBELUMNYA (Layer 1+2):
{prev_text[:30000]}

OUTPUT LAYER 3 SEBELUMNYA:
{layer3_prev[:10000]}

Jalankan analisa berdasarkan semua data. Output Markdown.
"""
        result = await call_llm(client, cfg, prompt, agent_id)
        save(OUTPUT / "agents" / f"output_{agent_id}.md", result)
        outputs[agent_id] = result
        print(f"  ✅ {agent_id} selesai")

    print("✅ Fase 3 (Layer 3) selesai")
    return outputs

# ── FASE 4: FINAL REPORT ──────────────────────────────────────────
async def fase_4(client: AsyncOpenAI, cfg: dict, all_outputs: dict):
    print("\n━━━ FASE 4: Assembly Laporan Final ━━━")

    all_text = "\n\n---\n\n".join(
        f"## {k.upper()}\n{v}" for k, v in all_outputs.items()
    )
    template = read(TEMPLATES / "laporan_final_template.md")
    orch     = read(ORCHESTRATOR / "SKILL.md")
    scoring  = read(TEMPLATES / "risk_scoring_matrix.md")

    prompt = f"""
{bpr_context(cfg)}

ORCHESTRATOR INSTRUKSI:
{orch}

TEMPLATE LAPORAN:
{template}

RISK SCORING MATRIX:
{scoring}

SEMUA OUTPUT AGENT (11 AGENT):
{all_text[:60000]}

INSTRUKSI FASE 4:
1. Hitung Risk Scoring Matrix CAMELS-BPR dari semua data
2. Tulis Executive Summary tajam dan komprehensif (5-7 paragraf)
3. Buat Opini Audit Profesional
4. Assembly laporan lengkap menggunakan template (Bab I-X)
5. Bahasa: Indonesia formal standar OJK
6. Pastikan semua placeholder {{...}} terisi

Output: laporan final lengkap dalam Markdown.
"""
    result = await call_llm(client, cfg, prompt, "Orchestrator-Final")

    bpr_code = cfg["bpr_name"].replace(" ", "_").replace("/", "_")
    md_path = OUTPUT / "markdown" / f"laporan_audit_{bpr_code}_{cfg['periode']}.md"
    save(md_path, result)
    print(f"✅ Laporan Markdown: {md_path.relative_to(ROOT)}")

    # Coba konversi ke PDF dengan pandoc
    try:
        import subprocess
        pdf_path = OUTPUT / "pdf" / f"laporan_audit_{bpr_code}_{cfg['periode']}.pdf"
        r = subprocess.run(
            ["pandoc", str(md_path), "--pdf-engine=wkhtmltopdf",
             "--toc", "--number-sections", "-V", "lang=id",
             "-V", "geometry:margin=2.5cm", "-o", str(pdf_path)],
            capture_output=True, timeout=120
        )
        if r.returncode == 0:
            print(f"✅ Laporan PDF: {pdf_path.relative_to(ROOT)}")
        else:
            print(f"⚠️  PDF gagal: {r.stderr.decode()[:200]}")
    except Exception as e:
        print(f"⚠️  PDF conversion skip: {e}")

# ── MAIN ─────────────────────────────────────────────────────────
async def main(cfg: dict):
    print("\n" + "="*64)
    print(f"  BPR AUDIT INTELLIGENCE SYSTEM — CODEX/GPT")
    print(f"  BPR     : {cfg['bpr_name']}")
    print(f"  Periode : {cfg['periode']}")
    print(f"  Model   : {cfg['model']}")
    print(f"  Started : {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*64 + "\n")

    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY tidak ditemukan. Set: export OPENAI_API_KEY=sk-...")
        sys.exit(1)

    for d in [OUTPUT/"markdown", OUTPUT/"pdf", OUTPUT/"agents", OUTPUT/"logs"]:
        d.mkdir(parents=True, exist_ok=True)

    client = AsyncOpenAI(api_key=api_key)

    # Eksekusi semua fase
    parsed      = await fase_0(client, cfg)
    l1_outputs  = await fase_1(client, cfg, parsed)
    l2_outputs  = await fase_2(client, cfg)
    all_12      = {**l1_outputs, **l2_outputs}
    l3_outputs  = await fase_3(client, cfg, all_12)
    all_outputs = {**all_12, **l3_outputs}
    await fase_4(client, cfg, all_outputs)

    print("\n" + "="*64)
    print(f"  ✅ AUDIT SELESAI — {datetime.datetime.now().strftime('%H:%M:%S')}")
    print(f"  Output: {OUTPUT}/")
    print("="*64 + "\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BPR Audit System — Codex Runner")
    parser.add_argument("--bpr",      default=DEFAULT_CONFIG["bpr_name"])
    parser.add_argument("--kota",     default=DEFAULT_CONFIG["bpr_kota"])
    parser.add_argument("--provinsi", default=DEFAULT_CONFIG["bpr_provinsi"])
    parser.add_argument("--periode",  default=DEFAULT_CONFIG["periode"])
    parser.add_argument("--model",    default=DEFAULT_CONFIG["model"])
    args = parser.parse_args()

    cfg = {**DEFAULT_CONFIG}
    cfg.update({
        "bpr_name": args.bpr, "bpr_kota": args.kota,
        "bpr_provinsi": args.provinsi, "periode": args.periode,
        "model": args.model,
    })

    asyncio.run(main(cfg))
