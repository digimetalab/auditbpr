# Tool: Markdown Renderer & Formatting Standards
# Used by: All agents, Orchestrator
# Purpose: Ensure consistent formatting across all report sections

---

## General Rules
```
1. LANGUAGE: Formal Indonesian (OJK-style) for all report output
2. UNITS: Thousands of Rupiah — state "Ribuan Rupiah" in every table header
3. NUMBERS: Use dot (.) as thousands separator, comma (,) for decimals
   Example: 1.234.567,89
4. PERCENTAGES: Always 2 decimal places (e.g., 12.45%)
5. DATES: DD Month YYYY format (e.g., 31 Desember 2024)
6. CURRENCY: Do not use Rp symbol in tables — only in narrative text
```

---

## Table Format
```markdown
| Column Header | {{Year}} |
|:--------------|--------:|    ← Right-align numbers
| Item Name     | 123,456 |    ← No Rp symbol in tables
```

---

## Risk Indicator Icons
```
✅ Normal / Healthy / Compliant
⚠️ Warning / Needs attention / Approaching threshold
🔴 Critical / Violated / High risk
🚨 Danger / Immediate action required
↑  Rising trend
↓  Falling trend
→  Stable / no significant change
```

---

## Section Structure
Each agent output should follow this hierarchy:
```
## SECTION TITLE — {{BPR_NAME}}
### A. Sub-section
[Tables with data]
**Analysis:** [Narrative interpretation]
### B. Next Sub-section
...
### Conclusion
**Score:** [X/5]
[Narrative conclusion]
```
