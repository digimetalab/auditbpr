"""
Tests for tools/financial_calculator.py
"""
import sys
import os
import pytest

# Add tools directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
from financial_calculator import (
    calc_npl,
    calc_ppka,
    calc_car,
    calc_beneish_m_score,
    detect_anomalies,
    safe_div,
)


class TestSafeDiv:
    def test_normal_division(self):
        assert safe_div(10, 2) == 5.0

    def test_zero_denominator(self):
        assert safe_div(10, 0) == 0

    def test_zero_numerator(self):
        assert safe_div(0, 5) == 0


class TestCalcNPL:
    def test_healthy_npl(self):
        result = calc_npl(
            kurang_lancar=500,
            diragukan=300,
            macet=200,
            total_kredit=100000,
        )
        assert result["npl_persen"] == pytest.approx(1.0)
        assert result["status"] == "SEHAT"

    def test_exceeded_npl(self):
        result = calc_npl(
            kurang_lancar=2000,
            diragukan=1500,
            macet=2500,
            total_kredit=100000,
        )
        assert result["npl_persen"] == pytest.approx(6.0)
        assert result["status"] == "MELEBIHI BATAS"

    def test_zero_loans(self):
        result = calc_npl(
            kurang_lancar=0,
            diragukan=0,
            macet=0,
            total_kredit=0,
        )
        assert result["npl_persen"] == 0


class TestCalcPPKA:
    def test_adequate_ppka(self):
        result = calc_ppka(
            lancar=80000,
            dalam_perhatian=10000,
            kurang_lancar=5000,
            diragukan=3000,
            macet=2000,
            ppka_dibentuk=5500,
        )
        assert result["status"] == "MEMADAI"

    def test_insufficient_ppka(self):
        result = calc_ppka(
            lancar=80000,
            dalam_perhatian=10000,
            kurang_lancar=5000,
            diragukan=3000,
            macet=2000,
            ppka_dibentuk=1000,
        )
        assert result["status"] == "KURANG"
        assert result["selisih"] > 0


class TestCalcCAR:
    def test_healthy_car(self):
        result = calc_car(
            modal_inti=15000,
            modal_pelengkap=2000,
            atmr=100000,
        )
        assert result["car_persen"] == pytest.approx(17.0)
        assert result["status"] == "SEHAT"

    def test_below_minimum(self):
        result = calc_car(
            modal_inti=8000,
            modal_pelengkap=1000,
            atmr=100000,
        )
        assert result["car_persen"] == pytest.approx(9.0)
        assert result["status"] == "DI BAWAH MINIMUM"

    def test_estimated_atmr(self):
        """When ATMR is 0, it should be estimated from total assets."""
        result = calc_car(
            modal_inti=15000,
            modal_pelengkap=2000,
            atmr=0,
            total_aset=100000,
        )
        assert result["car_persen"] > 0
        assert result.get("catatan") is not None or "estimasi" in str(result).lower()


class TestBeneish:
    def test_likely_manipulator(self):
        result = calc_beneish_m_score(
            dsri=1.5,
            gmi=1.4,
            aqi=1.3,
            sgi=1.6,
            depi=1.2,
            sgai=0.8,
            lvgi=1.1,
            tata=0.05,
        )
        assert result["m_score"] > -1.78
        assert "MANIPULASI" in result["interpretasi"].upper() or "MANIPULAT" in result["interpretasi"].upper()

    def test_not_manipulated(self):
        result = calc_beneish_m_score(
            dsri=1.0,
            gmi=1.0,
            aqi=1.0,
            sgi=1.0,
            depi=1.0,
            sgai=1.0,
            lvgi=1.0,
            tata=0.01,
        )
        assert result["m_score"] < -1.78


class TestDetectAnomalies:
    def test_loan_growth_anomaly(self):
        """High year-over-year loan growth should be flagged."""
        data = {
            "kredit": [50000, 55000, 72500],  # 32% jump
            "npl": [3.0, 3.5, 3.2],
            "biaya_operasional": [8000, 8500, 9000],
            "pendapatan_operasional": [12000, 12500, 13000],
        }
        result = detect_anomalies(data)
        has_loan_flag = any("kredit" in str(a).lower() or "loan" in str(a).lower() for a in result)
        assert has_loan_flag

    def test_no_anomalies(self):
        """Stable data should produce no anomalies."""
        data = {
            "kredit": [50000, 52000, 54000],
            "npl": [3.0, 3.1, 3.0],
            "biaya_operasional": [8000, 8200, 8400],
            "pendapatan_operasional": [12000, 12300, 12600],
        }
        result = detect_anomalies(data)
        assert len(result) == 0
