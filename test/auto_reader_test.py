"""
Tests for tools/auto_reader.py
"""
import sys
import os
import json
import tempfile
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "tools"))
from auto_reader import detect_file_type, parse_csv_file, process_directory, generate_summary


FIXTURES_DIR = os.path.join(os.path.dirname(__file__), "fixtures")


class TestDetectFileType:
    def test_detect_neraca(self):
        filepath = os.path.join(FIXTURES_DIR, "sample_neraca.csv")
        dtype, counts = detect_file_type(filepath)
        assert dtype == "neraca"
        assert counts["neraca"] >= 2

    def test_detect_laba_rugi(self):
        filepath = os.path.join(FIXTURES_DIR, "sample_laba_rugi.csv")
        dtype, counts = detect_file_type(filepath)
        assert dtype == "laba_rugi"

    def test_detect_rasio(self):
        filepath = os.path.join(FIXTURES_DIR, "sample_rasio.csv")
        dtype, counts = detect_file_type(filepath)
        assert dtype == "rasio"

    def test_unknown_file(self):
        filepath = os.path.join(FIXTURES_DIR, "sample_unknown.csv")
        dtype, counts = detect_file_type(filepath)
        assert dtype is None


class TestParseCsvFile:
    def test_parse_neraca(self):
        filepath = os.path.join(FIXTURES_DIR, "sample_neraca.csv")
        rows = parse_csv_file(filepath)
        assert len(rows) > 0
        # Should have keys from the CSV header
        assert any("Pos" in str(k) or "pos" in str(k) for k in rows[0].keys())

    def test_parse_empty_csv(self):
        with tempfile.NamedTemporaryFile(suffix=".csv", mode="w", delete=False) as f:
            f.write("")
            temp_path = f.name
        try:
            rows = parse_csv_file(temp_path)
            assert rows == []
        finally:
            os.unlink(temp_path)


class TestProcessDirectory:
    def test_process_fixtures(self):
        with tempfile.TemporaryDirectory() as outdir:
            results = process_directory(FIXTURES_DIR, outdir)
            files = results.get("files", [])
            # Should process at least the 3 known files
            detected = [f for f in files if f["status"] == "success"]
            undetected = [f for f in files if f["status"] == "undetected"]
            assert len(detected) >= 2  # neraca, laba_rugi, or rasio
            assert any(f["filename"] == "sample_unknown.csv" for f in undetected)

    def test_nonexistent_directory(self):
        results = process_directory("/nonexistent/path", "/tmp/out")
        assert "error" in results

    def test_summary_generation(self):
        with tempfile.TemporaryDirectory() as outdir:
            results = process_directory(FIXTURES_DIR, outdir)
            summary_path = generate_summary(results, outdir)
            assert os.path.exists(summary_path)
            with open(summary_path) as f:
                summary = json.load(f)
            assert "files" in summary
