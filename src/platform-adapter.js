/**
 * auditbpr — Platform Adapter
 * Abstraction layer for executing agents on different AI platforms.
 *
 * Factory: PlatformAdapter.create(platformKey, config)
 * Adapters: GeminiAdapter, ClaudeAdapter, CodexAdapter, DryRunAdapter
 */

const fs = require('fs');
const path = require('path');

const MAX_RETRIES = 3;
const DEFAULT_TIMEOUT = 300000; // 5 minutes

/**
 * Base platform adapter class.
 */
class PlatformAdapter {
  constructor(config = {}) {
    this.config = config;
    this.timeout = config.timeout || DEFAULT_TIMEOUT;
  }

  /**
   * Factory method to create the appropriate adapter.
   * @param {string} platformKey - gemini|claude|codex|dryrun
   * @param {Object} config - Platform-specific configuration
   * @returns {PlatformAdapter}
   */
  static create(platformKey, config = {}) {
    switch (platformKey) {
      case 'gemini':
        return new GeminiAdapter(config);
      case 'claude':
        return new ClaudeAdapter(config);
      case 'codex':
        return new CodexAdapter(config);
      case 'dryrun':
        return new DryRunAdapter(config);
      default:
        throw new Error(`Unknown platform: ${platformKey}`);
    }
  }

  /**
   * Execute an agent with the given skill content and context.
   * @param {string} agentId - Agent identifier (e.g., '01_bpr_profile')
   * @param {string} skillPath - Path to SKILL.md file
   * @param {Object} context - { config, previousOutputs }
   * @returns {Promise<string>} Agent output
   */
  async executeAgent(agentId, skillPath, context) {
    throw new Error('executeAgent() must be implemented by subclass');
  }

  /**
   * Read skill file content.
   */
  _readSkill(skillPath) {
    try {
      return fs.readFileSync(skillPath, 'utf8');
    } catch {
      return `[SKILL not found: ${skillPath}]`;
    }
  }

  /**
   * Spawn a process with retries and timeout using cross-spawn.
   */
  async _spawnWithRetry(cmd, args, options = {}, retries = MAX_RETRIES) {
    const spawn = require('cross-spawn');

    for (let attempt = 1; attempt <= retries; attempt++) {
      const result = await new Promise((resolve, reject) => {
        let stdout = '';
        let stderr = '';

        const child = spawn(cmd, args, {
          ...options,
          stdio: options.captureOutput ? 'pipe' : 'inherit',
        });

        const timer = setTimeout(() => {
          child.kill('SIGTERM');
          reject(new Error(`Timeout after ${this.timeout}ms for ${cmd}`));
        }, this.timeout);

        if (child.stdout) {
          child.stdout.on('data', (d) => { stdout += d.toString(); });
        }
        if (child.stderr) {
          child.stderr.on('data', (d) => { stderr += d.toString(); });
        }

        child.on('close', (code) => {
          clearTimeout(timer);
          resolve({ code, stdout, stderr });
        });

        child.on('error', (err) => {
          clearTimeout(timer);
          reject(err);
        });
      });

      if (result.code === 0) {
        return result.stdout || '';
      }

      if (attempt < retries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw new Error(
          `${cmd} failed after ${retries} attempts (exit code: ${result.code}).\nStderr: ${result.stderr}`
        );
      }
    }
  }
}

/**
 * Gemini CLI adapter — executes agents via `gemini` command.
 */
class GeminiAdapter extends PlatformAdapter {
  async executeAgent(agentId, skillPath, context) {
    const skillContent = this._readSkill(skillPath);
    const bpr = context.config.bpr || {};
    const prompt = `${skillContent}\n\nBPR: ${bpr.nama}\nPeriode: ${bpr.periode}\nExecute agent ${agentId}.`;

    const pkgRoot = path.resolve(__dirname, '..');

    return this._spawnWithRetry('gemini', [
      '--model', 'gemini-2.5-pro',
      '--yolo',
      prompt,
    ], { cwd: pkgRoot, captureOutput: true });
  }
}

/**
 * Claude Code adapter — executes agents via `claude` command.
 */
class ClaudeAdapter extends PlatformAdapter {
  async executeAgent(agentId, skillPath, context) {
    const skillContent = this._readSkill(skillPath);
    const bpr = context.config.bpr || {};
    const prompt = `${skillContent}\n\nBPR: ${bpr.nama}\nPeriode: ${bpr.periode}\nExecute agent ${agentId}.`;

    const pkgRoot = path.resolve(__dirname, '..');

    return this._spawnWithRetry('claude', [
      '--dangerously-skip-permissions',
      '-p', prompt,
    ], { cwd: pkgRoot, captureOutput: true });
  }
}

/**
 * Codex / OpenAI adapter — executes via Python script.
 */
class CodexAdapter extends PlatformAdapter {
  async executeAgent(agentId, skillPath, context) {
    const bpr = context.config.bpr || {};
    const pkgRoot = path.resolve(__dirname, '..');
    const scriptPath = path.join(pkgRoot, 'platforms', 'run_audit_codex.py');

    return this._spawnWithRetry('python', [
      scriptPath,
      '--bpr', bpr.nama || '',
      '--kota', bpr.kota || '',
      '--provinsi', bpr.provinsi || '',
      '--periode', bpr.periode || '',
    ], { cwd: pkgRoot, captureOutput: true });
  }
}

/**
 * Dry-run adapter — simulates execution without calling any external process.
 */
class DryRunAdapter extends PlatformAdapter {
  async executeAgent(agentId, skillPath, context) {
    const skillContent = this._readSkill(skillPath);
    return `[DRY RUN] Agent ${agentId} would execute.\nSkill: ${skillPath}\nContent length: ${skillContent.length} chars`;
  }
}

module.exports = {
  PlatformAdapter,
  GeminiAdapter,
  ClaudeAdapter,
  CodexAdapter,
  DryRunAdapter,
};
