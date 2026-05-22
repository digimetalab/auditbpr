# Changelog

All notable changes to AuditBPR will be documented in this file.

## [1.0.0] — 2026-05-22

### Added
- `tools/auto_reader.py` — Excel/CSV auto-parser with content-based type detection
- `src/orchestrator.js` — Programmatic 4-phase agent orchestration engine with EventEmitter
- `src/platform-adapter.js` — Platform abstraction layer (Gemini, Claude, Codex, DryRun)
- `src/validator.js` — Config, data file, and parsed data validation
- `src/logger.js` — Structured logging (console + JSON file)
- `src/commands/validate.js` — CLI command for data & config validation
- `config/regulatory_thresholds.yaml` — Machine-readable OJK/BI thresholds
- `config/industry_benchmarks.yaml` — Machine-readable BPR industry benchmarks
- `--dry-run` flag for `auditbpr run` — preview execution plan
- `--agents` flag for `auditbpr run` — run specific agents only
- `--verbose` global flag — detailed error stack traces
- `--validate-only` flag for auto_reader.py
- Test suite: vitest (JS) + pytest (Python)

### Fixed
- **Config deep merge bug** — nested objects (e.g., `bpr.kota`) were lost on partial config
- **Windows compatibility** — cross-spawn for platform detection, bash availability check
- **Command injection** in `report.js` — replaced string-concatenated `execSync` with `spawnSync` array args
- **Error handling** — removed `process.exit()` from all library functions, throw errors instead
- **Version mismatch** — SKILL.md (was 2.0.0) now matches package.json (1.0.0)
- **JSON parse crash** — config.js now catches malformed JSON with clear error message

### Changed
- `init.js` reuses `DEFAULT_CONFIG` from `config.js` (was duplicated)
- `run.js` validates BPR name before execution
- `run.js` spawn calls now return Promises with proper error propagation
- `info.js` reads regulation list dynamically from config files
- `financial_calculator.py` can read thresholds from YAML config
- `financial_calculator.py` implements `--data` and `--json` flags

### Removed
- Unused `inquirer` dependency (was in package.json, never imported)
- Hardcoded dummy data from platform scripts
