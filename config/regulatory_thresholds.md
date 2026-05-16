# Regulatory Thresholds — BPR Audit Intelligence System
# Source: OJK/BI regulations for Indonesian Rural Banks (BPR)
# Used by: All agents, Orchestrator
# Last updated: 2024

---

## Capital Adequacy (POJK 5/POJK.03/2015)

```yaml
CAR_KPMM:
  minimum: 12%
  warning: 14%
  healthy: ">= 15%"
  note: "CAR = (Tier 1 + Tier 2) / Risk-Weighted Assets × 100"

minimum_paid_up_capital:
  zone_1:
    regions: "Jakarta, Banten, West Java"
    minimum: "Rp 6 billion"
  zone_2:
    regions: "Other cities in Java & Bali"
    minimum: "Rp 4 billion"
  zone_3:
    regions: "Outside Java & Bali (capital cities)"
    minimum: "Rp 3 billion"
  zone_4:
    regions: "Other areas outside Java & Bali"
    minimum: "Rp 2 billion"
```

---

## Asset Quality (POJK 33/POJK.03/2018)

```yaml
NPL:
  npl_gross_max: 5%
  npl_net_max: 5%
  warning_level: 3%
  healthy: "< 2%"
  note: "NPL = (Substandard + Doubtful + Loss) / Total Loans × 100"

collectibility_classification:
  current:
    criteria: "Payments current, no arrears"
    ppka_rate: 0.5%
  special_mention:
    criteria: "1-90 days past due"
    ppka_rate: 10%
  substandard:
    criteria: "91-120 days past due"
    ppka_rate: 30%
  doubtful:
    criteria: "121-180 days past due"
    ppka_rate: 50%
  loss:
    criteria: "> 180 days past due"
    ppka_rate: 100%

ppka_coverage:
  minimum: 100%
  note: "Formed PPKA must >= Required PPKA. Shortfall reduces effective capital."
```

---

## Credit Concentration Limits / BMPK (POJK 49/POJK.03/2017)

```yaml
related_party:
  individual: 10%
  group: 20%
  base: "% of BPR's capital"
  note: "Related party includes management, commissioners, shareholders >10%, and their affiliates"

non_related_party:
  individual: 20%
  group: 30%
  base: "% of BPR's capital"
```

---

## Profitability

```yaml
ROA:
  excellent: "> 1.5%"
  healthy: "1.25 - 1.5%"
  adequate: "0.5 - 1.24%"
  poor: "0 - 0.49%"
  loss: "< 0%"
  note: "ROA = Pre-tax Profit / Average Total Assets × 100"

NIM:
  excellent: "> 10%"
  healthy: "8 - 10%"
  adequate: "5 - 7.99%"
  poor: "3 - 4.99%"
  critical: "< 3%"
  note: "NIM = Net Interest Income / Average Productive Assets × 100"
```

---

## Efficiency

```yaml
BOPO:
  excellent: "< 85%"
  healthy: "85 - 89.99%"
  adequate: "90 - 93.99%"
  poor: "94 - 96%"
  critical: "> 96%"
  ojk_max: 93.99%
  note: "BOPO = Total Operating Expenses / Total Operating Revenue × 100"
```

---

## Liquidity

```yaml
LDR:
  optimal: "78 - 92%"
  acceptable: "70 - 100%"
  warning_low: "< 70%"
  warning_high: "> 100%"
  critical_high: "> 115%"
  note: "LDR = Total Loans / Total Third-Party Funds × 100"

cash_ratio:
  minimum: 4.05%
  healthy: "> 6%"
  excellent: "> 10%"
  note: "Cash Ratio = Liquid Assets / Immediate Liabilities × 100"
```

---

## Governance (POJK 62/POJK.03/2020)

```yaml
fit_and_proper:
  requirement: "All directors and commissioners must pass OJK Fit & Proper Test"
  concurrent_positions: "Directors prohibited from serving at other banks/BPRs"
  commissioner_limit: "Max 3 financial institutions"
  cooling_off: "6 months after leaving previous financial institution"

minimum_composition:
  directors: 2
  commissioners: 2
  note: "Must include independent commissioner for BPRs with assets > Rp 80 billion"
```

---

## Reporting & Transparency (POJK 48/POJK.03/2017)

```yaml
annual_report:
  deadline: "End of April following fiscal year"
  content: "Must include audited financial statements"

monthly_report:
  deadline: "10th of following month"
  content: "Balance sheet, P&L, asset quality, ratios"

publication:
  requirement: "Annual financial statements must be published in local newspaper or website"
```

---

## AML/CFT (POJK 12/POJK.01/2017)

```yaml
requirements:
  - "CDD (Customer Due Diligence) for all customers"
  - "EDD (Enhanced Due Diligence) for PEP and high-risk customers"
  - "STR (Suspicious Transaction Report) to PPATK"
  - "CTR (Cash Transaction Report) for transactions ≥ Rp 500 million"
  - "KYC officer appointed"
  - "Internal AML/CFT policy documented"
```

---

## External Audit (PMK 154/PMK.01/2017)

```yaml
kap_requirements:
  registration: "Must be registered with PPPK Kemenkeu"
  ap_license: "Signing AP must have active license"
  rotation_ap: "Max 3 consecutive years for same AP"
  rotation_kap: "Not strictly regulated for BPR (best practice: max 5 years)"
  independence: "No business or family ties with BPR management/shareholders"
```

---

## BPR Health Assessment (SE OJK)

```yaml
composite_rating:
  level_1: "SEHAT PRIMA (Very Healthy) — Composite Score 4.5-5.0"
  level_2: "SEHAT (Healthy) — Composite Score 3.5-4.4"
  level_3: "CUKUP SEHAT (Fairly Healthy) — Composite Score 2.5-3.4"
  level_4: "KURANG SEHAT (Unhealthy) — Composite Score 1.5-2.4"
  level_5: "TIDAK SEHAT (Very Unhealthy) — Composite Score 1.0-1.4"
```
