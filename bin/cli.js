#!/usr/bin/env node
/**
 * auditbpr — CLI Entry Point
 * AI-powered multi-agent audit system for BPR Indonesia
 */

const { Command } = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');

const program = new Command();

/**
 * Wrap async command actions with error handling.
 * Shows chalk.red error and optional stack trace with --verbose.
 */
function wrapAction(fn) {
  return async (...args) => {
    try {
      await fn(...args);
    } catch (err) {
      console.error(chalk.red('\n  ✗ Error: ' + err.message));
      if (program.opts().verbose) {
        console.error(chalk.dim(err.stack));
      }
      process.exitCode = 1;
    }
  };
}

program
  .name('auditbpr')
  .description(pkg.description)
  .version(pkg.version)
  .option('--verbose', 'Show detailed error stack traces');

// ── INIT Command ────────────────────────────────────────────────
program
  .command('init')
  .description('Initialize a new BPR audit project in the current directory')
  .option('-y, --yes', 'Skip interactive prompts and use defaults')
  .action(wrapAction(async (options) => {
    const { initProject } = require('../src/commands/init');
    await initProject(options);
  }));

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
  .option('--dry-run', 'Show what would be executed without running')
  .option('--agents <list>', 'Comma-separated list of agents to run (e.g., 01,02,03)')
  .action(wrapAction(async (options) => {
    const { runAudit } = require('../src/commands/run');
    await runAudit(options);
  }));

// ── REPORT Command ──────────────────────────────────────────────
program
  .command('report')
  .description('Generate report from existing agent outputs')
  .option('--format <format>', 'Output format: markdown | pdf | both', 'both')
  .option('--output <dir>', 'Output directory', './output')
  .action(wrapAction(async (options) => {
    const { generateReport } = require('../src/commands/report');
    await generateReport(options);
  }));

// ── VALIDATE Command ────────────────────────────────────────────
program
  .command('validate')
  .description('Validate project configuration, data files, and parsed data')
  .option('--fix', 'Attempt to auto-fix issues where possible')
  .action(wrapAction(async (options) => {
    const { validateCommand } = require('../src/commands/validate');
    await validateCommand(options);
  }));

// ── INFO Command ────────────────────────────────────────────────
program
  .command('info')
  .description('Show system information and architecture')
  .action(wrapAction(async () => {
    const { showInfo } = require('../src/commands/info');
    showInfo();
  }));

program.parse();
