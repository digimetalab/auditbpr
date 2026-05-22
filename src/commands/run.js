/**
 * auditbpr run — Execute the BPR audit
 */

const fs = require('fs');
const path = require('path');
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
    throw new Error(
      `Unknown platform: ${platformKey}. Available: ${Object.keys(PLATFORMS).join(', ')}`
    );
  }

  try {
    const spawn = require('cross-spawn');
    const result = spawn.sync(platform.command, ['--version'], { stdio: 'ignore' });
    return result.status === 0;
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

/**
 * Check if bash is available (for shell-based platforms on Windows)
 */
function checkBashAvailability() {
  if (process.platform !== 'win32') return true;
  try {
    const spawn = require('cross-spawn');
    const result = spawn.sync('bash', ['--version'], { stdio: 'ignore' });
    return result.status === 0;
  } catch {
    return false;
  }
}

/**
 * Spawn a child process and return a Promise that resolves/rejects on exit.
 */
function spawnProcess(cmd, args, options) {
  return new Promise((resolve, reject) => {
    const spawn = require('cross-spawn');
    const child = spawn(cmd, args, options);

    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to start process '${cmd}': ${err.message}`));
    });
  });
}

async function runAudit(options = {}) {
  console.log(chalk.cyan.bold('\n  ╔══════════════════════════════════════════════╗'));
  console.log(chalk.cyan.bold('  ║   BPR AUDIT INTELLIGENCE SYSTEM              ║'));
  console.log(chalk.cyan.bold('  ╚══════════════════════════════════════════════╝\n'));

  // Load config
  const config = loadConfig(options.config);
  const platformKey = options.platform || config.platform || 'gemini';
  const platform = PLATFORMS[platformKey];

  if (!platform) {
    throw new Error(
      `Unknown platform: ${platformKey}. Available: ${Object.keys(PLATFORMS).join(', ')}`
    );
  }

  // Override config with CLI options
  if (options.bpr) config.bpr.nama = options.bpr;
  if (options.kota) config.bpr.kota = options.kota;
  if (options.provinsi) config.bpr.provinsi = options.provinsi;
  if (options.periode) config.bpr.periode = options.periode;

  // Validate BPR name
  if (!config.bpr.nama || config.bpr.nama.trim() === '') {
    throw new Error(
      'BPR name (config.bpr.nama) is required. Set it in .auditbpr.json or use --bpr flag.'
    );
  }

  // Filter agents if --agents specified
  const agentFilter = options.agents
    ? options.agents.split(',').map(a => a.trim())
    : null;

  // Display config
  console.log(chalk.white('  BPR      : ') + chalk.bold(config.bpr.nama));
  console.log(chalk.white('  City     : ') + config.bpr.kota);
  console.log(chalk.white('  Province : ') + config.bpr.provinsi);
  console.log(chalk.white('  Period   : ') + config.bpr.periode);
  console.log(chalk.white('  Platform : ') + chalk.yellow(platform.name));
  if (agentFilter) {
    console.log(chalk.white('  Agents   : ') + chalk.yellow(agentFilter.join(', ')));
  }
  if (options.dryRun) {
    console.log(chalk.white('  Mode     : ') + chalk.yellow('DRY RUN'));
  }
  console.log('');

  // Dry run mode — show what would execute and return
  if (options.dryRun) {
    console.log(chalk.yellow('  [DRY RUN] Would execute:'));
    console.log(chalk.dim(`    Platform : ${platform.name}`));
    console.log(chalk.dim(`    Script   : ${platform.script}`));
    console.log(chalk.dim(`    BPR      : ${config.bpr.nama}`));
    console.log(chalk.dim(`    Periode  : ${config.bpr.periode}`));
    if (agentFilter) {
      console.log(chalk.dim(`    Agents   : ${agentFilter.join(', ')}`));
    }
    console.log(chalk.green('\n  ✅ Dry run complete. No actions taken.'));
    return;
  }

  // Check platform availability
  const spinner = ora('Checking platform...').start();
  if (!checkPlatform(platformKey)) {
    spinner.fail(chalk.red(`${platform.name} not found`));
    console.log(chalk.yellow(`  Install: ${platform.installHint}`));
    throw new Error(`Platform '${platform.name}' is not installed. Install: ${platform.installHint}`);
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
      throw new Error('No data files found. Place files in data/ folder first.');
    }
  }

  // Find the audit script
  const pkgRoot = path.resolve(__dirname, '..', '..');
  const scriptPath = path.join(pkgRoot, platform.script);

  if (!fs.existsSync(scriptPath)) {
    throw new Error(`Script not found: ${scriptPath}`);
  }

  // Execute the audit
  console.log(chalk.cyan('\n  Starting audit...\n'));
  console.log(chalk.dim('  ─'.repeat(30)));

  try {
    if (platformKey === 'codex') {
      // Python script
      const args = [
        scriptPath,
        '--bpr', config.bpr.nama,
        '--kota', config.bpr.kota,
        '--provinsi', config.bpr.provinsi,
        '--periode', config.bpr.periode,
      ];
      await spawnProcess('python', args, { stdio: 'inherit', cwd: pkgRoot });
    } else if (platformKey === 'opencode') {
      // OpenCode config
      await spawnProcess('opencode', ['run', '--config', scriptPath],
        { stdio: 'inherit', cwd: pkgRoot });
    } else {
      // Shell script (Gemini / Claude) — Windows compatibility
      if (process.platform === 'win32') {
        if (!checkBashAvailability()) {
          console.log(chalk.yellow('  ⚠ bash not found on Windows.'));
          console.log(chalk.yellow('  Suggestions:'));
          console.log(chalk.dim('    1. Install Git Bash or WSL'));
          console.log(chalk.dim('    2. Use --platform codex (Python-based, no bash needed)'));
          throw new Error(
            'bash is not available on this Windows system. ' +
            'Install Git Bash/WSL, or use --platform codex instead.'
          );
        }
      }
      await spawnProcess('bash', [scriptPath], { stdio: 'inherit', cwd: pkgRoot });
    }

    console.log(chalk.green('\n  ✅ Audit completed successfully!'));
    console.log(chalk.dim('  Output: ./output/'));
  } catch (err) {
    console.log(chalk.red(`\n  ✗ ${err.message}`));
    throw err;
  }
}

module.exports = { runAudit, PLATFORMS, checkPlatform, checkDataFiles };
