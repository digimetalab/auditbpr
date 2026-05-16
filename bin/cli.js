#!/usr/bin/env node
/**
 * auditbpr — CLI Entry Point
 * AI-powered multi-agent audit system for BPR Indonesia
 */

const { Command } = require('commander');
const pkg = require('../package.json');

const program = new Command();

program
  .name('auditbpr')
  .description(pkg.description)
  .version(pkg.version);

// ── INIT Command ────────────────────────────────────────────────
program
  .command('init')
  .description('Initialize a new BPR audit project in the current directory')
  .option('-y, --yes', 'Skip interactive prompts and use defaults')
  .action(async (options) => {
    const { initProject } = require('../src/commands/init');
    await initProject(options);
  });

// ── RUN Command ─────────────────────────────────────────────────
program
  .command('run')
  .description('Run the full BPR audit using an AI platform')
  .option('--bpr <name>', 'BPR name')
  .option('--kota <city>', 'City / Regency')
  .option('--provinsi <province>', 'Province')
  .option('--periode <period>', 'Analysis period (e.g., 2020-2024)')
  .option('--platform <platform>', 'AI platform: gemini | claude | codex | opencode', 'gemini')
  .option('--config <path>', 'Path to .auditbpr.json config file')
  .action(async (options) => {
    const { runAudit } = require('../src/commands/run');
    await runAudit(options);
  });

// ── REPORT Command ──────────────────────────────────────────────
program
  .command('report')
  .description('Generate report from existing agent outputs')
  .option('--format <format>', 'Output format: markdown | pdf | both', 'both')
  .option('--output <dir>', 'Output directory', './output')
  .action(async (options) => {
    const { generateReport } = require('../src/commands/report');
    await generateReport(options);
  });

// ── INFO Command ────────────────────────────────────────────────
program
  .command('info')
  .description('Show system information and architecture')
  .action(() => {
    const { showInfo } = require('../src/commands/info');
    showInfo();
  });

program.parse();
