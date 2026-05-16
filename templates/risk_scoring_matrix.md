# Risk Scoring Matrix — BPR Audit Intelligence
# Used by: Orchestrator, Agent 09, Agent 11

## CAMELS-BPR Scoring Methodology

### Framework
```
Adapted from CAMELS (Capital, Asset, Management, Earnings, Liquidity, Sensitivity)
customized for the Indonesian BPR context and OJK/BI regulations.

Each dimension: Score 1-5
  5 = VERY HEALTHY (Prima)
  4 = HEALTHY (Adequate)
  3 = FAIRLY HEALTHY (Needs Attention)
  2 = UNHEALTHY (Critical)
  1 = VERY UNHEALTHY (Danger)

Composite = Weighted Average of all dimensions
```

## Dimension 1: CAPITAL
```yaml
weight: 20%
components:
  CAR_KPMM:
    internal_weight: 60%
    scoring:
      5: ">= 15%"
      4: "12-14.99%"
      3: "10-11.99%"
      2: "8-9.99%"
      1: "< 8%"

  capital_trend:
    internal_weight: 20%
    scoring:
      5: "Rising consistently 5 years"
      4: "Rising 3-4 of 5 years"
      3: "Stagnant or rising 2 years"
      2: "Declining 1-2 years"
      1: "Declining 3+ years or negative"

  ppka_adequacy:
    internal_weight: 20%
    scoring:
      5: "Provision >= 120% of required PPKA"
      4: "Provision 100-119%"
      3: "Provision 80-99%"
      2: "Provision 60-79%"
      1: "Provision < 60%"
```

## Dimension 2: ASSET QUALITY
```yaml
weight: 25%
components:
  NPL_gross:
    internal_weight: 40%
    scoring:
      5: "< 2%"
      4: "2-3.99%"
      3: "4-4.99%"
      2: "5-7.99%"
      1: ">= 8%"

  NPL_net:
    internal_weight: 25%
    scoring:
      5: "< 1%"
      4: "1-2.99%"
      3: "3-4.99%"
      2: "5-7.99%"
      1: ">= 8%"

  NPL_trend:
    internal_weight: 20%
    scoring:
      5: "Declining consistently 3+ years"
      4: "Declining 2 years"
      3: "Stagnant (±1%)"
      2: "Rising 1-2 years"
      1: "Rising 3+ years"

  credit_concentration:
    internal_weight: 15%
    scoring:
      5: "Top-10 borrowers < 30% total loans"
      4: "Top-10 borrowers 30-40%"
      3: "Top-10 borrowers 40-50%"
      2: "Top-10 borrowers 50-60%"
      1: "Top-10 borrowers > 60%"
```

## Dimension 3: MANAGEMENT (Governance)
```yaml
weight: 15%
components:
  fit_proper:
    internal_weight: 35%
    scoring:
      5: "All management passed, no issues"
      4: "All passed, minor notes"
      3: "1 member with significant notes"
      2: "Member not yet passed or has case"
      1: "Active member has legal case / failed"

  kap_independence:
    internal_weight: 25%
    scoring:
      5: "Registered KAP, routine rotation <5 years, no affiliations"
      4: "Registered KAP, 5 years, no affiliations"
      3: "Registered KAP, >5 years, or minor notes"
      2: "KAP affiliated with management/shareholders"
      1: "KAP unregistered or has cases"

  ownership_structure:
    internal_weight: 25%
    scoring:
      5: "Transparent, clear beneficial owners, no conflicts"
      4: "Transparent, minor concerns"
      3: "Lacking transparency or potential conflicts"
      2: "Not transparent or real conflicts of interest"
      1: "Unclear ownership, massive conflicts of interest"

  gcg_compliance:
    internal_weight: 15%
    scoring:
      5: "Regular AGM, GCG reports exist, complete SOPs"
      4: "AGM exists, reports exist, minor gaps"
      3: "Inconsistent AGM"
      2: "GCG violations identified"
      1: "No GCG structure at all"
```

## Dimension 4: EARNINGS (Profitability)
```yaml
weight: 15%
components:
  ROA:
    internal_weight: 40%
    scoring:
      5: "> 1.5%"
      4: "1.25-1.5%"
      3: "0.5-1.24%"
      2: "0-0.49%"
      1: "< 0% (loss)"

  NIM:
    internal_weight: 35%
    scoring:
      5: "> 10%"
      4: "8-10%"
      3: "5-7.99%"
      2: "3-4.99%"
      1: "< 3%"

  profitability_trend:
    internal_weight: 25%
    scoring:
      5: "Profits rising consistently 4-5 years"
      4: "Profits rising 3 years"
      3: "Profits stagnant or rising 2 years"
      2: "Profits declining 2+ years"
      1: "Losses 2+ consecutive years"
```

## Dimension 5: EFFICIENCY
```yaml
weight: 10%
components:
  BOPO:
    internal_weight: 70%
    scoring:
      5: "< 85%"
      4: "85-89.99%"
      3: "90-93.99%"
      2: "94-96%"
      1: "> 96%"

  BOPO_trend:
    internal_weight: 30%
    scoring:
      5: "Declining consistently 3+ years"
      4: "Declining 2 years"
      3: "Stagnant (±2%)"
      2: "Rising 2 years"
      1: "Rising 3+ years"
```

## Dimension 6: LIQUIDITY
```yaml
weight: 15%
components:
  LDR:
    internal_weight: 40%
    scoring:
      5: "78-92%"
      4: "70-77.99% or 92.01-100%"
      3: "60-69.99% or 100.01-110%"
      2: "50-59.99% or 110.01-115%"
      1: "< 50% or > 115%"

  cash_ratio:
    internal_weight: 35%
    scoring:
      5: "> 10%"
      4: "8-10%"
      3: "6-7.99%"
      2: "4-5.99%"
      1: "< 4%"

  dpk_stability:
    internal_weight: 25%
    scoring:
      5: "DPK growing stably, no concentration"
      4: "DPK growing, minor concentration"
      3: "DPK fluctuating or significant related parties"
      2: "DPK declining or high concentration"
      1: "DPK declining drastically or dominated by related parties"
```

## Composite Score Formula
```
COMPOSITE_SCORE =
  (Score_Capital × 0.20) +
  (Score_Asset × 0.25) +
  (Score_Management × 0.15) +
  (Score_Earnings × 0.15) +
  (Score_Efficiency × 0.10) +
  (Score_Liquidity × 0.15)

PLUS: Red Flag Penalty
  Tier-1 Red Flag: -0.5 per item
  Tier-2 Red Flag: -0.3 per item
  Tier-3 Red Flag: -0.1 per item

FINAL_SCORE = max(1.0, COMPOSITE_SCORE - RF_PENALTY)
```

## Final Score Interpretation
```
4.5 - 5.0 → ✅ VERY HEALTHY      — No special action needed
3.5 - 4.4 → ✅ HEALTHY            — Normal monitoring
2.5 - 3.4 → ⚠️ FAIRLY HEALTHY    — Intensive supervision
1.5 - 2.4 → 🔴 UNHEALTHY         — Immediate corrective action
1.0 - 1.4 → 🚨 VERY UNHEALTHY    — Consider administrative sanctions
```
