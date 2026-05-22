/**
 * auditbpr validate — Validate project configuration and data files
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { loadConfig } = require('../config');
const { validateConfig, validateDataFiles, validateParsedData } = require('../validator');

/**
 * Format a check result with status icon.
 */
function formatCheck(check) {
  const icons = {
    pass: chalk.green('✓'),
    warn: chalk.yellow('⚠'),
    fail: chalk.red('✗'),
  };
  const icon = icons[check.status] || '?';
  const color = check.status === 'fail' ? chalk.red
    : check.status === 'warn' ? chalk.yellow
    : chalk.dim;
  return `  ${icon} ${chalk.white(check.name)} — ${color(check.message)}`;
}

async function validateCommand(options = {}) {
  console.log(chalk.cyan.bold('\n  BPR Audit — Validation\n'));

  let hasFailures = false;

  // 1. Validate config
  console.log(chalk.white.bold('  Configuration:'));
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.log(chalk.red(`  ✗ Config error: ${err.message}`));
    hasFailures = true;
    config = null;
  }

  if (config) {
    const configResult = validateConfig(config);
    for (const check of configResult.errors) {
      console.log(formatCheck(check));
      if (check.status === 'fail') hasFailures = true;
    }
  }
  console.log('');

  // 2. Validate data files
  console.log(chalk.white.bold('  Data Files:'));
  const dataDir = config ? path.resolve(config.data_dir || './data') : './data';
  const dataResult = validateDataFiles(dataDir);

  for (const name of dataResult.found) {
    console.log(`  ${chalk.green('✓')} ${chalk.white(name)} — ${chalk.dim('found')}`);
  }
  for (const name of dataResult.missing) {
    console.log(`  ${chalk.yellow('⚠')} ${chalk.white(name)} — ${chalk.yellow('not found')}`);
  }
  for (const w of dataResult.warnings) {
    console.log(formatCheck(w));
    if (w.status === 'fail') hasFailures = true;
  }

  // Auto-fix: create missing directories
  if (options.fix) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log(chalk.green(`  → Created: ${dataDir}`));
    }
    const outputDirs = ['output/markdown', 'output/pdf', 'output/agents', 'output/logs'];
    for (const dir of outputDirs) {
      const fullPath = path.resolve(dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(chalk.green(`  → Created: ${dir}`));
      }
    }
  }
  console.log('');

  // 3. Validate parsed data (if exists)
  const parsedDir = path.resolve(config ? config.output_dir || './output' : './output', 'parsed');
  if (fs.existsSync(parsedDir)) {
    console.log(chalk.white.bold('  Parsed Data:'));
    const parsedResult = validateParsedData(parsedDir);
    for (const check of parsedResult.checks) {
      console.log(formatCheck(check));
      if (check.status === 'fail') hasFailures = true;
    }
    console.log('');
  }

  // Summary
  console.log(chalk.dim('  ─'.repeat(30)));
  const dataReady = dataResult.found.length;
  const dataTotal = dataResult.found.length + dataResult.missing.length;

  if (hasFailures) {
    console.log(chalk.red(`\n  Result: Validation failed. Fix issues above.`));
  } else if (dataResult.missing.length > 0) {
    console.log(chalk.yellow(`\n  Result: ${dataReady}/${dataTotal} data files ready. Audit can run with partial data.`));
  } else {
    console.log(chalk.green(`\n  Result: All checks passed! Ready to run audit.`));
  }
  console.log('');
}

module.exports = { validateCommand };
