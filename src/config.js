/**
 * auditbpr — Configuration Management
 */

const fs = require('fs');
const path = require('path');

const CONFIG_FILENAME = '.auditbpr.json';

const DEFAULT_CONFIG = {
  bpr: {
    nama: '',
    kota: '',
    provinsi: '',
    periode: '',
    no_izin_ojk: '',
  },
  pengurus: [],
  pemegang_saham: [],
  riwayat_kap: [],
  platform: 'gemini',
  output_language: 'id',
  output_dir: './output',
  data_dir: './data',
};

/**
 * Load configuration from .auditbpr.json
 * Searches current directory, then parent directories up to 5 levels.
 */
function loadConfig(customPath) {
  if (customPath && fs.existsSync(customPath)) {
    const raw = fs.readFileSync(customPath, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
  }

  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const configPath = path.join(dir, CONFIG_FILENAME);
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return { ...DEFAULT_CONFIG };
}

/**
 * Save configuration to .auditbpr.json
 */
function saveConfig(config, targetDir) {
  const configPath = path.join(targetDir || process.cwd(), CONFIG_FILENAME);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

module.exports = { loadConfig, saveConfig, DEFAULT_CONFIG, CONFIG_FILENAME };
