/**
 * auditbpr — Validation Module
 * Validates configuration, data files, and parsed data.
 */

const fs = require('fs');
const path = require('path');

/**
 * Validate auditbpr configuration object.
 * @param {Object} config
 * @returns {{ valid: boolean, errors: Array<{name: string, status: string, message: string}> }}
 */
function validateConfig(config) {
  const errors = [];

  function check(name, condition, message) {
    if (!condition) {
      errors.push({ name, status: 'fail', message });
    } else {
      errors.push({ name, status: 'pass', message });
    }
  }

  check('config.bpr', config && config.bpr, 'bpr section must exist');

  if (config && config.bpr) {
    check('config.bpr.nama',
      config.bpr.nama && config.bpr.nama.trim() !== '',
      'BPR name is required');
    check('config.bpr.kota',
      config.bpr.kota && config.bpr.kota.trim() !== '',
      'City is required');
    check('config.bpr.provinsi',
      config.bpr.provinsi && config.bpr.provinsi.trim() !== '',
      'Province is required');
    check('config.bpr.periode',
      config.bpr.periode && config.bpr.periode.trim() !== '',
      'Period is required');
  }

  check('config.platform',
    config && config.platform && ['gemini', 'claude', 'codex', 'opencode'].includes(config.platform),
    'Platform must be one of: gemini, claude, codex, opencode');

  check('config.pengurus',
    config && Array.isArray(config.pengurus) && config.pengurus.length > 0,
    'At least one management member (pengurus) is required');

  check('config.pemegang_saham',
    config && Array.isArray(config.pemegang_saham) && config.pemegang_saham.length > 0,
    'At least one shareholder (pemegang_saham) is required');

  check('config.riwayat_kap',
    config && Array.isArray(config.riwayat_kap) && config.riwayat_kap.length > 0,
    'At least one KAP history entry (riwayat_kap) is required');

  const valid = errors.every(e => e.status !== 'fail');
  return { valid, errors };
}

/**
 * Validate required data files exist in the data directory.
 * @param {string} dataDir - Path to data directory
 * @returns {{ found: string[], missing: string[], warnings: Array<{name: string, status: string, message: string}> }}
 */
function validateDataFiles(dataDir) {
  const required = ['neraca', 'laba_rugi', 'aset_produktif', 'rasio'];
  const found = [];
  const missing = [];
  const warnings = [];

  if (!fs.existsSync(dataDir)) {
    warnings.push({
      name: 'data_dir',
      status: 'fail',
      message: `Data directory not found: ${dataDir}`,
    });
    return { found, missing: required, warnings };
  }

  for (const name of required) {
    const xlsx = path.join(dataDir, `${name}.xlsx`);
    const csv = path.join(dataDir, `${name}.csv`);

    if (fs.existsSync(xlsx)) {
      found.push(name);
      const stats = fs.statSync(xlsx);
      if (stats.size === 0) {
        warnings.push({
          name: `${name}.xlsx`,
          status: 'warn',
          message: `${name}.xlsx exists but is empty (0 bytes)`,
        });
      }
    } else if (fs.existsSync(csv)) {
      found.push(name);
      const stats = fs.statSync(csv);
      if (stats.size === 0) {
        warnings.push({
          name: `${name}.csv`,
          status: 'warn',
          message: `${name}.csv exists but is empty (0 bytes)`,
        });
      }
    } else {
      missing.push(name);
    }
  }

  return { found, missing, warnings };
}

/**
 * Validate parsed data files for balance checks per year.
 * @param {string} parsedDir - Path to parsed data directory (output/parsed/)
 * @returns {{ valid: boolean, checks: Array<{name: string, status: string, message: string}> }}
 */
function validateParsedData(parsedDir) {
  const checks = [];

  if (!fs.existsSync(parsedDir)) {
    checks.push({
      name: 'parsed_dir',
      status: 'warn',
      message: `Parsed data directory not found: ${parsedDir}. Run parsing first.`,
    });
    return { valid: true, checks };
  }

  // Check for expected parsed JSON files
  const expectedFiles = [
    'parsed_data_neraca.json',
    'parsed_data_laba_rugi.json',
    'parsed_data_aset_produktif.json',
    'parsed_data_rasio.json',
  ];

  for (const file of expectedFiles) {
    const filePath = path.join(parsedDir, file);
    if (!fs.existsSync(filePath)) {
      checks.push({
        name: file,
        status: 'warn',
        message: `Parsed file not found: ${file}`,
      });
      continue;
    }

    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(raw);

      // For neraca (balance sheet), check total_aset == total_kewajiban + total_ekuitas per year
      if (file === 'parsed_data_neraca.json' && Array.isArray(data)) {
        for (const yearData of data) {
          const year = yearData.tahun || yearData.year || 'unknown';
          const totalAset = yearData.total_aset || yearData.total_assets || 0;
          const totalKewajiban = yearData.total_kewajiban || yearData.total_liabilities || 0;
          const totalEkuitas = yearData.total_ekuitas || yearData.total_equity || 0;
          const diff = Math.abs(totalAset - (totalKewajiban + totalEkuitas));

          if (diff > 1) {
            checks.push({
              name: `balance_check_${year}`,
              status: 'fail',
              message: `Balance sheet mismatch for ${year}: Assets (${totalAset}) != Liabilities (${totalKewajiban}) + Equity (${totalEkuitas}), diff: ${diff}`,
            });
          } else {
            checks.push({
              name: `balance_check_${year}`,
              status: 'pass',
              message: `Balance sheet balanced for ${year}`,
            });
          }
        }
      } else {
        checks.push({
          name: file,
          status: 'pass',
          message: `Parsed file valid: ${file}`,
        });
      }
    } catch (e) {
      checks.push({
        name: file,
        status: 'fail',
        message: `Failed to parse ${file}: ${e.message}`,
      });
    }
  }

  const valid = checks.every(c => c.status !== 'fail');
  return { valid, checks };
}

module.exports = { validateConfig, validateDataFiles, validateParsedData };
