/**
 * auditbpr run — Execute the BPR audit
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');
const { loadConfig } = require('../config');

const PLATFORMS = {
  gemini: {
    name: 'Gemini CLI',
    command: 'gemini',
    script: 'platforms/run_audit_gemini.sh',
    installHint: 'npm install -g @google/gemini-cli',
  },
  claude: {
    name: 'Claude Code',
    command: 'claude',
    script: 'platforms/run_audit_claude.sh',
    installHint: 'npm install -g @anthropic-ai/claude-code',
  },
  codex: {
    name: 'Codex (OpenAI)',
    command: 'python',
    script: 'platforms/run_audit_codex.py',
    installHint: 'pip install openai pandas openpyxl',
  },
  opencode: {
    name: 'OpenCode',
    command: 'opencode',
    script: 'platforms/opencode.config.json',
    installHint: 'npm install -g opencode-ai',
  },
};

function checkPlatform(platformKey) {
  const platform = PLATFORMS[platformKey];
  if (!platform) {
    console.error(chalk.red(`Unknown platform: ${platformKey}`));
    console.log('Available platforms: ' + Object.keys(PLATFORMS).join(', '));
    process.exit(1);
  }

  try {
    execSync(`${platform.command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function checkDataFiles(dataDir) {
  const required = ['neraca', 'laba_rugi', 'aset_produktif', 'rasio'];
  const found = [];
  const missing = [];

  for (const name of required) {
    const xlsx = path.join(dataDir, `${name}.xlsx`);
    const csv = path.join(dataDir, `${name}.csv`);
    if (fs.existsSync(xlsx) || fs.existsSync(csv)) {
      found.push(name);
    } else {
      missing.push(name);
    }
  }

  return { found, missing };
}

async function runAudit(options = {}) {
  console.log(chalk.cyan.bold('\n  ╔══════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('  ║   BPR AUDIT INTELLIGENCE SYSTEM              ║'));
  console.log(chalk.cyan.bold('  ╚══════════════════════════════════════════════╝\n'));

  // Load config
  const config = loadConfig(options.config);
  const platformKey = options.platform || config.platform || 'gemini';
  const platform = PLATFORMS[platformKey];

  // Override config with CLI options
  if (options.bpr) config.bpr.nama = options.bpr;
  if (options.kota) config.bpr.kota = options.kota;
  if (options.provinsi) config.bpr.provinsi = options.provinsi;
  if (options.periode) config.bpr.periode = options.periode;

  // Display config
  console.log(chalk.white('  BPR      : ') + chalk.bold(config.bpr.nama));
  console.log(chalk.white('  City     : ') + config.bpr.kota);
  console.log(chalk.white('  Province : ') + config.bpr.provinsi);
  console.log(chalk.white('  Period   : ') + config.bpr.periode);
  console.log(chalk.white('  Platform : ') + chalk.yellow(platform.name));
  console.log('');

  // Check platform availability
  const spinner = ora('Checking platform...').start();
  if (!checkPlatform(platformKey)) {
    spinner.fail(chalk.red(`${platform.name} not found`));
    console.log(chalk.yellow(`  Install: ${platform.installHint}`));
    process.exit(1);
  }
  spinner.succeed(`${platform.name} detected`);

  // Check data files
  const dataDir = path.resolve(config.data_dir || './data');
  const { found, missing } = checkDataFiles(dataDir);

  if (found.length > 0) {
    console.log(chalk.green(`  ✓ Data files found: ${found.join(', ')}`));
  }
  if (missing.length > 0) {
    console.log(chalk.yellow(`  ⚠ Missing data files: ${missing.join(', ')}`));
    if (missing.length === 4) {
      console.log(chalk.red('  ✗ No data files found. Place files in data/ folder first.'));
      process.exit(1);
    }
  }

  // Find the audit script
  const pkgRoot = path.resolve(__dirname, '..', '..');
  const scriptPath = path.join(pkgRoot, platform.script);

  if (!fs.existsSync(scriptPath)) {
    console.error(chalk.red(`Script not found: ${scriptPath}`));
    process.exit(1);
  }

  // Execute the audit
  console.log(chalk.cyan('\n  Starting audit...\n'));
  console.log(chalk.dim('  ─'.repeat(30)));

  if (platformKey === 'codex') {
    // Python script
    const child = spawn('python', [scriptPath,
      '--bpr', config.bpr.nama,
      '--kota', config.bpr.kota,
      '--provinsi', config.bpr.provinsi,
      '--periode', config.bpr.periode,
    ], { stdio: 'inherit', cwd: pkgRoot });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n  ✅ Audit completed successfully!'));
      } else {
        console.log(chalk.red(`\n  ✗ Audit exited with code ${code}`));
      }
    });
  } else if (platformKey === 'opencode') {
    // OpenCode config
    const child = spawn('opencode', ['run', '--config', scriptPath],
      { stdio: 'inherit', cwd: pkgRoot });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n  ✅ Audit completed successfully!'));
      } else {
        console.log(chalk.red(`\n  ✗ Audit exited with code ${code}`));
      }
    });
  } else {
    // Shell script (Gemini / Claude)
    const child = spawn('bash', [scriptPath], { stdio: 'inherit', cwd: pkgRoot });

    child.on('close', (code) => {
      if (code === 0) {
        console.log(chalk.green('\n  ✅ Audit completed successfully!'));
        console.log(chalk.dim('  Output: ./output/'));
      } else {
        console.log(chalk.red(`\n  ✗ Audit exited with code ${code}`));
      }
    });
  }
}

module.exports = { runAudit };
