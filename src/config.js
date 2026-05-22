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
 * Deep merge two objects. Arrays are replaced, not merged.
 * Nested objects are recursively merged.
 * @param {Object} target
 * @param {Object} source
 * @returns {Object} Merged result (new object, no mutation)
 */
function deepMerge(target, source) {
  const output = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] &&
      typeof source[key] === 'object' &&
      !Array.isArray(source[key]) &&
      target[key] &&
      typeof target[key] === 'object' &&
      !Array.isArray(target[key])
    ) {
      output[key] = deepMerge(target[key], source[key]);
    } else {
      output[key] = source[key];
    }
  }
  return output;
}

/**
 * Load configuration from .auditbpr.json
 * Searches current directory, then parent directories up to 5 levels.
 */
function loadConfig(customPath) {
  if (customPath && fs.existsSync(customPath)) {
    const raw = fs.readFileSync(customPath, 'utf8');
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      throw new Error(`Invalid JSON in config file ${customPath}: ${e.message}`);
    }
    return deepMerge(DEFAULT_CONFIG, parsed);
  }

  let dir = process.cwd();
  for (let i = 0; i < 5; i++) {
    const configPath = path.join(dir, CONFIG_FILENAME);
    if (fs.existsSync(configPath)) {
      const raw = fs.readFileSync(configPath, 'utf8');
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (e) {
        throw new Error(`Invalid JSON in config file ${configPath}: ${e.message}`);
      }
      return deepMerge(DEFAULT_CONFIG, parsed);
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return deepMerge(DEFAULT_CONFIG, {});
}

/**
 * Save configuration to .auditbpr.json
 */
function saveConfig(config, targetDir) {
  const configPath = path.join(targetDir || process.cwd(), CONFIG_FILENAME);
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  return configPath;
}

module.exports = { loadConfig, saveConfig, deepMerge, DEFAULT_CONFIG, CONFIG_FILENAME };
