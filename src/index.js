/**
 * auditbpr — Main Module
 * Exports core functionality for programmatic use
 */

const { initProject } = require('./commands/init');
const { runAudit } = require('./commands/run');
const { generateReport } = require('./commands/report');
const { loadConfig, saveConfig } = require('./config');

module.exports = {
  initProject,
  runAudit,
  generateReport,
  loadConfig,
  saveConfig,
};
