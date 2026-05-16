# Tool: Excel/CSV Auto-Parser
# Used by: Orchestrator (Phase 0)
# Purpose: Parse BPR financial data from Excel/CSV files into structured JSON

---

## Overview
This tool automatically detects file types (balance sheet, P&L, productive
assets, ratios, management, shareholders, KAP) based on content analysis —
not filenames. Users can place any named Excel/CSV files in the `data/` folder.

---

## Expected Data Schemas

### 1. Balance Sheet (Posisi Keuangan / Neraca)
```yaml
detection_keywords: ["total aset", "total aktiva", "kewajiban", "ekuitas", "pasiva"]
columns:
  - item: string        # Balance sheet line item
  - year_1: number      # Year 1 value (thousands Rp)
  - year_2: number
  - year_3: number
  - year_4: number
  - year_5: number

expected_items:
  assets:
    - "Kas" (Cash)
    - "Penempatan pada Bank Lain" (Interbank Placements)
    - "Surat Berharga" (Securities)
    - "Kredit yang Diberikan" (Loans)
    - "Penyisihan Penghapusan" (Loan Loss Provision / CKPN)
    - "Kredit Neto" (Net Loans)
    - "Aset Tetap" (Fixed Assets)
    - "Akumulasi Penyusutan" (Accumulated Depreciation)
    - "Aset Lainnya" (Other Assets)
    - "AYDA" (Foreclosed Assets)
    - "Total Aset" (Total Assets)

  liabilities:
    - "Tabungan" (Savings)
    - "Deposito" (Time Deposits)
    - "Total DPK" (Total Deposits)
    - "Kewajiban Segera" (Immediate Liabilities)
    - "Simpanan dari Bank Lain" (Interbank Deposits)
    - "Pinjaman Diterima" (Borrowings Received)
    - "Kewajiban Lainnya" (Other Liabilities)
    - "Total Kewajiban" (Total Liabilities)

  equity:
    - "Modal Disetor" (Paid-up Capital)
    - "Cadangan" (Reserves)
    - "Laba/Rugi Tahun Lalu" (Prior Year Profit/Loss)
    - "Laba/Rugi Tahun Berjalan" (Current Year Profit/Loss)
    - "Total Ekuitas" (Total Equity)
```

### 2. Profit & Loss (Laba Rugi)
```yaml
detection_keywords: ["pendapatan bunga", "beban bunga", "laba rugi", "laba bersih"]
expected_items:
  revenue:
    - "Pendapatan Bunga" (Interest Income)
    - "Provisi dan Komisi" (Fees & Commissions)
    - "Pendapatan Operasional Lainnya" (Other Operating Income)
  expense:
    - "Beban Bunga" (Interest Expense)
    - "Beban CKPN" (Provision Expense)
    - "Beban Administrasi dan Umum" (Admin & General Expense)
    - "Beban Operasional Lainnya" (Other Operating Expense)
  result:
    - "Laba Operasional" (Operating Profit)
    - "Pendapatan Non-Operasional" (Non-Operating Income)
    - "Beban Non-Operasional" (Non-Operating Expense)
    - "Laba Sebelum Pajak" (Pre-Tax Profit)
    - "Pajak" (Income Tax)
    - "Laba Bersih" (Net Profit)
```

### 3. Productive Asset Quality (Aset Produktif)
```yaml
detection_keywords: ["kolektibilitas", "lancar", "kurang lancar", "diragukan", "macet"]
expected_items:
  - Per collectibility: Lancar (Current), DPK (Special Mention),
    Kurang Lancar (Substandard), Diragukan (Doubtful), Macet (Loss)
  - Broken down by: Loans, Securities, Interbank, Equity
  - Related party vs non-related party
  - PPKA formed (CKPN)
```

### 4. Financial Ratios (Rasio Keuangan)
```yaml
detection_keywords: ["CAR", "KPMM", "NPL", "ROA", "BOPO", "LDR", "NIM"]
expected_items:
  - CAR / KPMM (%)
  - NPL Gross (%)
  - NPL Net (%)
  - ROA (%)
  - BOPO (%)
  - NIM (%)
  - LDR (%)
  - Cash Ratio (%)
  - PPKA Ratio (%)
```

---

## Parser Behavior
```
1. Read ALL files in the data/ directory (xlsx, xls, csv)
2. Detect each file's type from content keywords
3. Parse into normalized JSON with consistent column names
4. Output to ./output/parsed/*.json
5. Generate _summary.json with parse status
6. Log issues to parsing_log.txt
```

---

## Notes
- All monetary values in thousands of Rupiah (ribuan Rp)
- Item names use standard OJK terminology (Indonesian)
- Parser should handle merged cells, multi-sheet workbooks, and varied layouts
