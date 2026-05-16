#!/usr/bin/env python3
"""
BPR Financial Calculator — BPR Audit Intelligence System
========================================================
Python tool for BPR-specific financial calculations:
  - NPL (Non-Performing Loan) Gross & Net
  - PPKA (Provision for Productive Asset Losses)
  - CAR (Capital Adequacy Ratio) / KPMM
  - Beneish M-Score (BPR-adapted)
  - Anomaly detection

Usage:
  python3 tools/financial_calculator.py --demo
  python3 tools/financial_calculator.py --data ./output/parsed/
"""

import json
import sys
import os
from typing import Dict, List, Optional, Union


# ───────────────────────────────────────────────
# SAFE DIVISION HELPER
# ───────────────────────────────────────────────
def safe_div(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Safely divide two numbers, returning default if denominator is zero."""
    if denominator == 0:
        return default
    return numerator / denominator


# ───────────────────────────────────────────────
# NPL CALCULATION
# ───────────────────────────────────────────────
def calc_npl(data: Dict) -> Dict:
    """
    Calculate NPL Gross and NPL Net.

    Parameters:
        data: dict with keys:
            - lancar (Current)
            - dpk (Special Mention)
            - kurang_lancar (Substandard)
            - diragukan (Doubtful)
            - macet (Loss)
            - ckpn (Loan Loss Provision formed)

    Returns:
        dict with npl_gross, npl_net, total_kredit, total_non_performing
    """
    current = data.get("lancar", 0)
    special_mention = data.get("dpk", 0)
    substandard = data.get("kurang_lancar", 0)
    doubtful = data.get("diragukan", 0)
    loss = data.get("macet", 0)
    ckpn = data.get("ckpn", 0)

    total_loans = current + special_mention + substandard + doubtful + loss
    total_non_performing = substandard + doubtful + loss

    npl_gross = safe_div(total_non_performing, total_loans) * 100
    npl_net = safe_div(total_non_performing - ckpn, total_loans) * 100

    return {
        "total_loans": total_loans,
        "total_non_performing": total_non_performing,
        "ckpn": ckpn,
        "npl_gross_pct": round(npl_gross, 2),
        "npl_net_pct": round(npl_net, 2),
        "npl_status": "HEALTHY" if npl_gross < 5 else "EXCEEDED OJK LIMIT",
        "ojk_threshold": "NPL Gross max 5% (POJK 33/2018)"
    }


# ───────────────────────────────────────────────
# PPKA CALCULATION
# ───────────────────────────────────────────────
def calc_ppka(data: Dict) -> Dict:
    """
    Calculate minimum required PPKA per POJK 33/2018.

    Minimum PPKA rates:
        Current:         0.5%
        Special Mention: 10.0%
        Substandard:    30.0%
        Doubtful:       50.0%
        Loss:          100.0%

    Parameters:
        data: dict with keys:
            - lancar, dpk, kurang_lancar, diragukan, macet
            - ckpn_dibentuk (CKPN formed / provision allocated)

    Returns:
        dict with ppka_required, ppka_formed, coverage_ratio, shortfall
    """
    rates = {
        "lancar": 0.005,       # Current: 0.5%
        "dpk": 0.10,           # Special Mention: 10%
        "kurang_lancar": 0.30, # Substandard: 30%
        "diragukan": 0.50,     # Doubtful: 50%
        "macet": 1.00          # Loss: 100%
    }

    ppka_detail = {}
    ppka_required = 0

    for category, rate in rates.items():
        balance = data.get(category, 0)
        required = balance * rate
        ppka_detail[category] = {
            "balance": balance,
            "rate_pct": rate * 100,
            "required": round(required, 2)
        }
        ppka_required += required

    ppka_formed = data.get("ckpn_dibentuk", 0)
    shortfall = ppka_required - ppka_formed
    coverage = safe_div(ppka_formed, ppka_required) * 100

    return {
        "ppka_detail": ppka_detail,
        "ppka_required": round(ppka_required, 2),
        "ppka_formed": ppka_formed,
        "shortfall": round(shortfall, 2),
        "coverage_ratio_pct": round(coverage, 2),
        "status": "ADEQUATE" if coverage >= 100 else "INSUFFICIENT",
        "regulation": "POJK 33/POJK.03/2018"
    }


# ───────────────────────────────────────────────
# CAR / KPMM CALCULATION
# ───────────────────────────────────────────────
def calc_car(data: Dict) -> Dict:
    """
    Calculate CAR (Capital Adequacy Ratio) / KPMM.

    Formula:
        CAR = (Tier 1 + Tier 2) / ATMR × 100

    ATMR (Risk-Weighted Assets) estimation for BPR:
        If ATMR is not directly available, estimate:
        ATMR ≈ Total Assets × 0.80 (simplified BPR weighting)

    Parameters:
        data: dict with keys:
            - modal_inti (Tier 1 Capital / Core Capital)
            - modal_pelengkap (Tier 2 Capital / Supplementary Capital)
            - atmr (Risk-Weighted Assets, optional)
            - total_aset (Total Assets, used for ATMR estimation)
            - ppka_shortfall (PPKA shortfall for adjusted CAR, optional)

    Returns:
        dict with car_pct, adjusted_car_pct, status
    """
    tier1 = data.get("modal_inti", 0)
    tier2 = data.get("modal_pelengkap", 0)
    total_capital = tier1 + tier2

    # ATMR: use provided value or estimate from total assets
    atmr = data.get("atmr", 0)
    if atmr == 0:
        total_assets = data.get("total_aset", 0)
        atmr = total_assets * 0.80  # Simplified BPR risk weighting
        atmr_source = "ESTIMATED (Total Assets × 80%)"
    else:
        atmr_source = "ACTUAL DATA"

    car = safe_div(total_capital, atmr) * 100

    # Adjusted CAR: after deducting PPKA shortfall
    ppka_shortfall = data.get("ppka_shortfall", 0)
    adjusted_capital = total_capital - ppka_shortfall
    adjusted_car = safe_div(adjusted_capital, atmr) * 100

    return {
        "tier1_capital": tier1,
        "tier2_capital": tier2,
        "total_capital": total_capital,
        "atmr": round(atmr, 2),
        "atmr_source": atmr_source,
        "car_pct": round(car, 2),
        "ppka_shortfall": ppka_shortfall,
        "adjusted_car_pct": round(adjusted_car, 2),
        "status": "HEALTHY" if car >= 12 else "BELOW MINIMUM",
        "adjusted_status": "HEALTHY" if adjusted_car >= 12 else "BELOW MINIMUM (after PPKA adjustment)",
        "ojk_threshold": "CAR minimum 12% (POJK 5/2015)",
        "note": "If PPKA shortfall exists, adjusted CAR reflects a more realistic capital position"
    }


# ───────────────────────────────────────────────
# BENEISH M-SCORE (ADAPTED FOR BPR)
# ───────────────────────────────────────────────
def calc_beneish_mscore(current_year: Dict, prior_year: Dict) -> Dict:
    """
    Calculate Beneish M-Score adapted for BPR.

    M > -1.78  → likely manipulator (HIGH ALERT)
    M < -2.22  → likely not manipulated
    Between    → grey zone

    Parameters:
        current_year: dict with financial data for year T
        prior_year: dict with financial data for year T-1

    Required keys in each dict:
        kredit (loans), pendapatan_bunga (interest income),
        nim (NIM), total_aset (total assets), kas (cash),
        penempatan (placements), aset_tetap (fixed assets),
        pendapatan_operasional (operating revenue),
        penyusutan (depreciation), beban_admin (admin expense),
        total_kewajiban (total liabilities), laba_bersih (net profit),
        beban_ckpn (CKPN expense)

    Returns:
        dict with all 8 components, M-Score, and interpretation
    """
    def get(d, key, default=1.0):
        """Get value with fallback to default for missing data."""
        val = d.get(key, default)
        return val if val != 0 else default

    # DSRI — Days Sales in Receivables Index
    # Adapted: Loans / Interest Income ratio
    dsri = safe_div(
        safe_div(get(current_year, "kredit"), get(current_year, "pendapatan_bunga")),
        safe_div(get(prior_year, "kredit"), get(prior_year, "pendapatan_bunga")),
        default=1.0
    )

    # GMI — Gross Margin Index
    # Adapted: NIM ratio (prior / current)
    gmi = safe_div(
        get(prior_year, "nim"),
        get(current_year, "nim"),
        default=1.0
    )

    # AQI — Asset Quality Index
    # Proportion of non-core assets
    def non_core_ratio(d):
        total = get(d, "total_aset")
        core = get(d, "kas", 0) + get(d, "penempatan", 0) + get(d, "aset_tetap", 0)
        return safe_div(total - core, total)

    aqi = safe_div(non_core_ratio(current_year), non_core_ratio(prior_year), default=1.0)

    # SGI — Sales Growth Index
    sgi = safe_div(
        get(current_year, "pendapatan_operasional"),
        get(prior_year, "pendapatan_operasional"),
        default=1.0
    )

    # DEPI — Depreciation Index
    def depi_ratio(d):
        dep = get(d, "penyusutan", 0)
        fa = get(d, "aset_tetap", 0)
        return safe_div(dep, dep + fa)

    depi = safe_div(depi_ratio(prior_year), depi_ratio(current_year), default=1.0)

    # SGAI — SGA Expense Index
    # Adapted: Admin expense / Revenue ratio
    def sgai_ratio(d):
        return safe_div(get(d, "beban_admin", 0), get(d, "pendapatan_operasional"))

    sgai = safe_div(sgai_ratio(current_year), sgai_ratio(prior_year), default=1.0)

    # LVGI — Leverage Index
    def lev_ratio(d):
        return safe_div(get(d, "total_kewajiban"), get(d, "total_aset"))

    lvgi = safe_div(lev_ratio(current_year), lev_ratio(prior_year), default=1.0)

    # TATA — Total Accruals to Total Assets
    # Adapted: (Net Profit - Est. Operating Cash Flow) / Total Assets
    net_profit = get(current_year, "laba_bersih", 0)
    loan_change = get(current_year, "kredit", 0) - get(prior_year, "kredit", 0)
    ckpn_expense = get(current_year, "beban_ckpn", 0)
    depreciation = get(current_year, "penyusutan", 0)

    est_operating_cf = net_profit - loan_change + ckpn_expense + depreciation
    tata = safe_div(net_profit - est_operating_cf, get(current_year, "total_aset"), default=0.0)

    # M-SCORE FORMULA
    m_score = (
        -4.84
        + 0.920 * dsri
        + 0.528 * gmi
        + 0.404 * aqi
        + 0.892 * sgi
        + 0.115 * depi
        - 0.172 * sgai
        + 4.679 * tata
        - 0.327 * lvgi
    )

    # Interpretation
    if m_score > -1.78:
        interpretation = "LIKELY MANIPULATOR — HIGH ALERT"
        alert = "HIGH"
    elif m_score < -2.22:
        interpretation = "LIKELY NOT MANIPULATED"
        alert = "LOW"
    else:
        interpretation = "GREY ZONE — NEEDS FURTHER INVESTIGATION"
        alert = "MEDIUM"

    return {
        "components": {
            "DSRI": {"value": round(dsri, 4), "threshold": "> 1.465", "flagged": dsri > 1.465},
            "GMI":  {"value": round(gmi, 4),  "threshold": "> 1.193", "flagged": gmi > 1.193},
            "AQI":  {"value": round(aqi, 4),  "threshold": "> 1.254", "flagged": aqi > 1.254},
            "SGI":  {"value": round(sgi, 4),  "threshold": "> 1.607", "flagged": sgi > 1.607},
            "DEPI": {"value": round(depi, 4), "threshold": "> 1.083", "flagged": depi > 1.083},
            "SGAI": {"value": round(sgai, 4), "threshold": "> 1.054", "flagged": sgai > 1.054},
            "LVGI": {"value": round(lvgi, 4), "threshold": "> 1.0",   "flagged": lvgi > 1.0},
            "TATA": {"value": round(tata, 4), "threshold": "> 0.031", "flagged": tata > 0.031},
        },
        "m_score": round(m_score, 4),
        "alert_level": alert,
        "interpretation": interpretation,
        "note": "M-Score is a statistical indicator — not definitive proof. Interpret in context of other findings."
    }


# ───────────────────────────────────────────────
# ANOMALY DETECTION HELPERS
# ───────────────────────────────────────────────
def detect_anomalies(data_series: List[Dict]) -> List[Dict]:
    """
    Detect financial anomalies across a multi-year data series.

    Parameters:
        data_series: list of yearly data dicts, ordered chronologically

    Returns:
        list of detected anomaly dicts
    """
    anomalies = []

    for i in range(1, len(data_series)):
        current = data_series[i]
        prior = data_series[i - 1]

        year = current.get("tahun", f"Year {i + 1}")

        # Anomaly 1: Loan growth > 40% in one year
        loan_growth = safe_div(
            current.get("kredit", 0) - prior.get("kredit", 0),
            prior.get("kredit", 1)
        ) * 100
        if loan_growth > 40:
            anomalies.append({
                "year": year,
                "type": "AGGRESSIVE_LOAN_GROWTH",
                "value": f"{loan_growth:.1f}%",
                "severity": "HIGH",
                "description": f"Loan growth {loan_growth:.1f}% exceeds 40% threshold"
            })

        # Anomaly 2: NPL drops > 3% in one year (possible window dressing)
        npl_current = current.get("npl_gross", 0)
        npl_prior = prior.get("npl_gross", 0)
        npl_drop = npl_prior - npl_current
        if npl_drop > 3:
            anomalies.append({
                "year": year,
                "type": "SUSPICIOUS_NPL_DROP",
                "value": f"-{npl_drop:.1f}%",
                "severity": "HIGH",
                "description": f"NPL dropped {npl_drop:.1f}% in one year — possible window dressing"
            })

        # Anomaly 3: Profits rising but equity declining
        profit_up = current.get("laba_bersih", 0) > prior.get("laba_bersih", 0)
        equity_down = current.get("ekuitas", 0) < prior.get("ekuitas", 0)
        if profit_up and equity_down:
            anomalies.append({
                "year": year,
                "type": "PROFIT_EQUITY_MISMATCH",
                "value": "Profit ↑ but Equity ↓",
                "severity": "MEDIUM",
                "description": "Profits rising but equity declining — hidden dividends or losses?"
            })

        # Anomaly 4: DPK grows but interest expense doesn't follow
        dpk_growth = safe_div(
            current.get("dpk", 0) - prior.get("dpk", 0),
            prior.get("dpk", 1)
        ) * 100
        int_exp_growth = safe_div(
            current.get("beban_bunga", 0) - prior.get("beban_bunga", 0),
            prior.get("beban_bunga", 1)
        ) * 100
        if dpk_growth > 20 and int_exp_growth < 5:
            anomalies.append({
                "year": year,
                "type": "DPK_INTEREST_MISMATCH",
                "value": f"DPK +{dpk_growth:.1f}% but Interest Expense +{int_exp_growth:.1f}%",
                "severity": "MEDIUM",
                "description": "Deposits growing but interest expense not following — possible fictitious deposits"
            })

    return anomalies


# ───────────────────────────────────────────────
# DEMO / SELF-TEST
# ───────────────────────────────────────────────
def run_demo():
    """Run demonstration with sample BPR data."""
    print("=" * 60)
    print("BPR Financial Calculator — Demo")
    print("=" * 60)

    # --- NPL Demo ---
    print("\n1. NPL CALCULATION")
    print("-" * 40)
    npl_data = {
        "lancar": 800000,
        "dpk": 100000,
        "kurang_lancar": 30000,
        "diragukan": 20000,
        "macet": 50000,
        "ckpn": 45000
    }
    npl_result = calc_npl(npl_data)
    print(f"  Total Loans    : {npl_result['total_loans']:,.0f}")
    print(f"  Non-Performing : {npl_result['total_non_performing']:,.0f}")
    print(f"  NPL Gross      : {npl_result['npl_gross_pct']}%")
    print(f"  NPL Net        : {npl_result['npl_net_pct']}%")
    print(f"  Status         : {npl_result['npl_status']}")

    # --- PPKA Demo ---
    print("\n2. PPKA CALCULATION")
    print("-" * 40)
    ppka_data = {**npl_data, "ckpn_dibentuk": 45000}
    ppka_result = calc_ppka(ppka_data)
    print(f"  Required PPKA  : {ppka_result['ppka_required']:,.2f}")
    print(f"  Formed PPKA    : {ppka_result['ppka_formed']:,.0f}")
    print(f"  Coverage Ratio : {ppka_result['coverage_ratio_pct']}%")
    print(f"  Shortfall      : {ppka_result['shortfall']:,.2f}")
    print(f"  Status         : {ppka_result['status']}")

    # --- CAR Demo ---
    print("\n3. CAR / KPMM CALCULATION")
    print("-" * 40)
    car_data = {
        "modal_inti": 150000,
        "modal_pelengkap": 20000,
        "total_aset": 1200000,
        "ppka_shortfall": ppka_result["shortfall"] if ppka_result["shortfall"] > 0 else 0
    }
    car_result = calc_car(car_data)
    print(f"  Total Capital  : {car_result['total_capital']:,.0f}")
    print(f"  ATMR           : {car_result['atmr']:,.0f} ({car_result['atmr_source']})")
    print(f"  CAR            : {car_result['car_pct']}%")
    print(f"  Adjusted CAR   : {car_result['adjusted_car_pct']}%")
    print(f"  Status         : {car_result['status']}")

    # --- M-Score Demo ---
    print("\n4. BENEISH M-SCORE")
    print("-" * 40)
    prior_year = {
        "kredit": 900000, "pendapatan_bunga": 180000, "nim": 12.5,
        "total_aset": 1100000, "kas": 50000, "penempatan": 100000,
        "aset_tetap": 80000, "pendapatan_operasional": 200000,
        "penyusutan": 10000, "beban_admin": 60000,
        "total_kewajiban": 950000, "laba_bersih": 25000,
        "beban_ckpn": 8000
    }
    current_year = {
        "kredit": 1000000, "pendapatan_bunga": 190000, "nim": 11.8,
        "total_aset": 1200000, "kas": 55000, "penempatan": 110000,
        "aset_tetap": 85000, "pendapatan_operasional": 210000,
        "penyusutan": 11000, "beban_admin": 65000,
        "total_kewajiban": 1030000, "laba_bersih": 22000,
        "beban_ckpn": 12000
    }
    mscore_result = calc_beneish_mscore(current_year, prior_year)
    print(f"  M-Score        : {mscore_result['m_score']}")
    print(f"  Alert Level    : {mscore_result['alert_level']}")
    print(f"  Interpretation : {mscore_result['interpretation']}")
    print(f"\n  Components:")
    for comp, detail in mscore_result["components"].items():
        flag = "⚠️" if detail["flagged"] else "✅"
        print(f"    {comp:5s}: {detail['value']:8.4f}  {detail['threshold']:>10s}  {flag}")

    print("\n" + "=" * 60)
    print("Demo complete.")


if __name__ == "__main__":
    if "--demo" in sys.argv:
        run_demo()
    else:
        print("Usage: python3 tools/financial_calculator.py --demo")
        print("  Or import as a module: from tools.financial_calculator import calc_npl")
