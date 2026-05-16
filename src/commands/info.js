/**
 * auditbpr info — Show system information
 */

const chalk = require('chalk');
const pkg = require('../../package.json');

function showInfo() {
  console.log(chalk.cyan.bold(`
  ╔══════════════════════════════════════════════════════════════╗
  ║           BPR AUDIT INTELLIGENCE SYSTEM v${pkg.version}            ║
  ╠══════════════════════════════════════════════════════════════╣
  ║                                                              ║
  ║  AI-powered multi-agent audit & investigation system for     ║
  ║  Indonesian Rural Banks (Bank Perkreditan Rakyat / BPR)      ║
  ║                                                              ║
  ╚══════════════════════════════════════════════════════════════╝
  `));

  console.log(chalk.white.bold('  Architecture:'));
  console.log(`
  ┌─────────────────────────────────────────────────────────────┐
  │  ORCHESTRATOR (Phase 0: Parse → Phase 4: Report)           │
  ├─────────────────────────────────────────────────────────────┤
  │  LAYER 1 (Parallel)        │  LAYER 2 (Parallel)          │
  │  ┌──────────────────────┐  │  ┌──────────────────────────┐ │
  │  │ 01 BPR Profile       │  │  │ 06 KYC Management        │ │
  │  │ 02 Balance Sheet     │  │  │ 07 KYC Shareholders      │ │
  │  │ 03 P&L               │  │  │ 08 KYC Auditor (KAP)     │ │
  │  │ 04 Asset Quality     │  │  └──────────────────────────┘ │
  │  │ 05 Financial Ratios  │  │                               │
  │  └──────────────────────┘  │                               │
  ├─────────────────────────────────────────────────────────────┤
  │  LAYER 3 (Sequential — waits for Layers 1 + 2)            │
  │  09 Cross-Reference → 10 Forensic → 11 Compliance         │
  └─────────────────────────────────────────────────────────────┘
  `);

  console.log(chalk.white.bold('  Supported Platforms:\n'));
  console.log('    • Gemini CLI   — Best for OSINT (1M token context)');
  console.log('    • Claude Code  — Best for calculations (subagent parallelism)');
  console.log('    • Codex/GPT    — Best for API integration (AsyncIO)');
  console.log('    • OpenCode     — Flexible (any LLM, open source)');

  console.log(chalk.white.bold('\n  Regulations Covered:\n'));
  console.log('    POJK 5/2015, 33/2018, 49/2017, 62/2020, 48/2017');
  console.log('    PBI 7/2/2005, PMK 154/2017, UU 8/2010 (AML/CFT)');

  console.log(chalk.white.bold('\n  Commands:\n'));
  console.log('    auditbpr init     — Set up a new audit project');
  console.log('    auditbpr run      — Execute the full audit');
  console.log('    auditbpr report   — Generate report from outputs');
  console.log('    auditbpr info     — Show this information');
  console.log('');
}

module.exports = { showInfo };
