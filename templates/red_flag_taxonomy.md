# Red Flag Taxonomy — BPR Audit Intelligence
# Used by: Agent 09, Agent 10, Agent 11, Orchestrator

## Red Flag Classification

### TIER 1 — CRITICAL (Fraud / Severe Violation Indicators)
```yaml
RF-K01:
  name: "Fictitious Loans / Phantom Loans"
  indicators:
    - Loans to borrowers whose identity cannot be verified
    - Collateral significantly below fair market value
    - Very high loan growth without corresponding DPK growth
    - PPKA not reflecting actual credit quality
  regulation: "POJK 33/2018, KUHP Article 263"
  severity: CRITICAL

RF-K02:
  name: "Massive Insider Lending"
  indicators:
    - Related party loans exceeding BMPK (>10% of capital for related parties)
    - Loans to companies owned by management/shareholders
    - Related party loan terms more favorable than market
    - Inadequate collateral for related party loans
  regulation: "POJK 49/2017 Article 11"
  severity: CRITICAL

RF-K03:
  name: "Financial Statement Window Dressing"
  indicators:
    - Significant position surges/drops at end of reporting period
    - Non-performing loans suddenly become current near book closing
    - Large related party deposits added at period-end
    - PPKA inconsistent with collectibility
  regulation: "POJK 48/2017, SAK ETAP"
  severity: CRITICAL

RF-K04:
  name: "Phantom Paid-up Capital"
  indicators:
    - Paid-up capital not matching bank statement/cash receipts
    - Capital source from loans that were returned
    - Capital deposit funds recorded as liability >12 months
    - Capital addition concurrent with large shareholder fund withdrawals
  regulation: "POJK 5/2015 Article 5"
  severity: CRITICAL

RF-K05:
  name: "Customer Fund Embezzlement"
  indicators:
    - Unexplained cash differences
    - Registered deposits not matching receipt slips
    - Customer savings balances not matching BPR records
    - Cash mutations not supported by adequate vouchers
  regulation: "KUHP Article 374, Banking Law Article 49"
  severity: CRITICAL
```

### TIER 2 — HIGH (Significant Risk)
```yaml
RF-T01:
  name: "Excessive Credit Concentration"
  indicators:
    - ">50% total loans to top 10 borrowers"
    - ">30% to one economic sector"
    - ">25% to one geographic area"
  regulation: "POJK 49/2017"
  severity: HIGH

RF-T02:
  name: "Systemic Credit Quality Degradation"
  indicators:
    - NPL Gross rising >2% in one year
    - Loss category increasing >50% YoY
    - NPL exceeding 5% (OJK limit)
    - Restructured loans >10% of total loans
  regulation: "POJK 33/2018"
  severity: HIGH

RF-T03:
  name: "Liquidity Stress"
  indicators:
    - Cash Ratio approaching or below 4%
    - LDR above 110%
    - Interbank deposits surging drastically (>200% YoY)
    - Deposit rates above 2× LPS guaranteed rate
  regulation: "SE OJK Cash Ratio"
  severity: HIGH

RF-T04:
  name: "Capital Erosion"
  indicators:
    - CAR declining >4% in one year
    - Equity negative or approaching zero
    - Consecutive losses >2 years
    - PPKA exceeding core capital
  regulation: "POJK 5/2015"
  severity: HIGH

RF-T05:
  name: "Non-Independent Auditor"
  indicators:
    - Same KAP >5 consecutive years
    - KAP has business/family ties with management/shareholders
    - KAP not registered with PPPK Kemenkeu
    - AP does not have active license
    - Opinion changed from qualified to unqualified without adequate explanation
  regulation: "PMK 154/2017"
  severity: HIGH

RF-T06:
  name: "Problematic Management"
  indicators:
    - Management has active legal cases
    - Management failed OJK fit & proper test
    - Management has non-performing loans at own BPR
    - Management concurrently serving at another financial institution
  regulation: "POJK 62/2020"
  severity: HIGH
```

### TIER 3 — MEDIUM (Needs Monitoring)
```yaml
RF-S01:
  name: "Declining Efficiency"
  indicators:
    - BOPO rising >5% in two consecutive years
    - Operating expenses growing faster than revenue
    - NIM declining >2% in two years
  severity: MEDIUM

RF-S02:
  name: "Non-Organic Growth"
  indicators:
    - Loans growing >40% in one year
    - DPK growing >50% in one year without network expansion
    - Assets growing >35% without additional capital
  severity: MEDIUM

RF-S03:
  name: "Data Inconsistencies"
  indicators:
    - Financial ratios cannot be reconciled from balance sheet/P&L data
    - Data differences between OJK reports and BPR documents
    - Accounting policy changes without adequate disclosure
  severity: MEDIUM

RF-S04:
  name: "Weak Governance"
  indicators:
    - Inactive commissioners (no annual AGM)
    - No audit committee (for BPRs of certain scale)
    - Excessive concurrent positions by management
    - Unclear controlling shareholder
  severity: MEDIUM
```

## Red Flag Scoring Matrix
```yaml
composite_risk_calculation:
  tier1_critical:
    weight: 3.0
    formula: "count_RF_K × 3.0"

  tier2_high:
    weight: 2.0
    formula: "count_RF_T × 2.0"

  tier3_medium:
    weight: 1.0
    formula: "count_RF_S × 1.0"

total_score_interpretation:
  0-2:   "LOW RISK — Normal monitoring"
  3-5:   "MEDIUM RISK — Enhanced monitoring"
  6-9:   "HIGH RISK — Special OJK examination"
  10-14: "VERY HIGH RISK — Intensive supervision status"
  ">=15": "CRITICAL RISK — Consider administrative action"
```
