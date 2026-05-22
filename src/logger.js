/**
 * auditbpr — Structured Logger
 * Chalk-colored console output with timestamps.
 * Optional JSON file output to configurable path.
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

const LEVELS = {
  debug: { priority: 0, color: chalk.gray,   label: 'DEBUG' },
  info:  { priority: 1, color: chalk.cyan,   label: 'INFO ' },
  warn:  { priority: 2, color: chalk.yellow, label: 'WARN ' },
  error: { priority: 3, color: chalk.red,    label: 'ERROR' },
};

/**
 * Create a structured logger instance.
 * @param {Object} options
 * @param {string} [options.level='info'] - Minimum log level: debug|info|warn|error
 * @param {string} [options.logFile] - Path to JSON log file (optional)
 * @param {string} [options.prefix] - Prefix for log messages
 */
function createLogger(options = {}) {
  const minLevel = options.level || 'info';
  const logFile = options.logFile || null;
  const prefix = options.prefix || '';
  const minPriority = (LEVELS[minLevel] || LEVELS.info).priority;

  // Ensure log directory exists if logFile specified
  if (logFile) {
    const logDir = path.dirname(logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  function formatTimestamp() {
    return new Date().toISOString();
  }

  function log(level, message, meta = {}) {
    const levelDef = LEVELS[level];
    if (!levelDef || levelDef.priority < minPriority) return;

    const timestamp = formatTimestamp();
    const prefixStr = prefix ? `[${prefix}] ` : '';

    // Console output with chalk colors
    const coloredLevel = levelDef.color(levelDef.label);
    const coloredTimestamp = chalk.dim(timestamp);
    console.log(`${coloredTimestamp} ${coloredLevel} ${prefixStr}${message}`);

    // JSON file output
    if (logFile) {
      const entry = {
        timestamp,
        level,
        prefix: prefix || undefined,
        message,
        ...meta,
      };
      try {
        fs.appendFileSync(logFile, JSON.stringify(entry) + '\n');
      } catch {
        // Silently ignore file write errors
      }
    }
  }

  return {
    debug: (msg, meta) => log('debug', msg, meta),
    info:  (msg, meta) => log('info', msg, meta),
    warn:  (msg, meta) => log('warn', msg, meta),
    error: (msg, meta) => log('error', msg, meta),
    log,
  };
}

module.exports = { createLogger, LEVELS };
