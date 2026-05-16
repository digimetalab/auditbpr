# Tool: PDF Generator
# Used by: Orchestrator (Phase 4)
# Purpose: Convert final Markdown report to PDF

---

## Overview
Converts the completed Markdown audit report into a professionally
formatted PDF document using `pandoc` and `wkhtmltopdf`.

---

## Commands

### Option A — Pandoc (Recommended)
```bash
pandoc \
  --pdf-engine=wkhtmltopdf \
  --css=templates/pdf_style.css \
  --metadata title="BPR Audit Report — {{BPR_NAME}}" \
  -V margin-top=20mm \
  -V margin-bottom=20mm \
  -V margin-left=15mm \
  -V margin-right=15mm \
  -f markdown \
  -t html5 \
  --toc --toc-depth=3 \
  -o "./output/pdf/laporan_audit_{{BPR_CODE}}_{{PERIOD}}.pdf" \
  "./output/markdown/laporan_audit_{{BPR_CODE}}_{{PERIOD}}.md"
```

### Option B — Python (Alternative)
```bash
python3 -c "
import subprocess
subprocess.run([
    'pandoc',
    '--pdf-engine=wkhtmltopdf',
    '--css=templates/pdf_style.css',
    '-f', 'markdown',
    '-t', 'html5',
    '--toc',
    '-o', './output/pdf/report.pdf',
    './output/markdown/report.md'
])
"
```

---

## Prerequisites
```bash
# Linux (Ubuntu/Debian):
sudo apt-get install -y pandoc wkhtmltopdf

# macOS:
brew install pandoc wkhtmltopdf

# Windows:
# Download from https://pandoc.org and https://wkhtmltopdf.org
```

---

## PDF Style
The CSS file `templates/pdf_style.css` controls the PDF formatting:
- Font: Inter or Roboto (fallback: serif)
- Page breaks between chapters
- Table formatting for financial data
- Color coding for risk indicators
- OJK-appropriate professional formatting
