/**
 * Tests for src/validator.js
 * Vitest globals (describe, it, expect) are injected via vitest.config.mjs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { validateConfig, validateDataFiles, validateParsedData } = require('../src/validator');

describe('validateConfig', () => {
  it('should pass with valid config', () => {
    const config = {
      bpr: { nama: 'PT BPR Test', kota: 'Jakarta', provinsi: 'DKI Jakarta', periode: '2020-2024' },
      platform: 'gemini',
      pengurus: [{ jabatan: 'Direktur', nama: 'Test' }],
      pemegang_saham: [{ nama: 'Owner', persen: 100 }],
      riwayat_kap: [{ tahun: '2024', kap: 'KAP Test' }],
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors.every(e => e.status === 'pass')).toBe(true);
  });

  it('should fail with empty BPR name', () => {
    const config = {
      bpr: { nama: '', kota: 'Jakarta', provinsi: 'DKI', periode: '2020-2024' },
      platform: 'gemini',
      pengurus: [{ jabatan: 'Direktur', nama: 'Test' }],
      pemegang_saham: [{ nama: 'Owner', persen: 100 }],
      riwayat_kap: [{ tahun: '2024', kap: 'KAP Test' }],
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(false);
    const namaCheck = result.errors.find(e => e.name === 'config.bpr.nama');
    expect(namaCheck.status).toBe('fail');
  });

  it('should fail with invalid platform', () => {
    const config = {
      bpr: { nama: 'Test', kota: 'Jakarta', provinsi: 'DKI', periode: '2020-2024' },
      platform: 'invalid',
      pengurus: [{ jabatan: 'Direktur', nama: 'Test' }],
      pemegang_saham: [{ nama: 'Owner', persen: 100 }],
      riwayat_kap: [{ tahun: '2024', kap: 'KAP Test' }],
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(false);
  });

  it('should fail with missing pengurus', () => {
    const config = {
      bpr: { nama: 'Test', kota: 'Jakarta', provinsi: 'DKI', periode: '2020-2024' },
      platform: 'gemini',
      pengurus: [],
      pemegang_saham: [{ nama: 'Owner', persen: 100 }],
      riwayat_kap: [{ tahun: '2024', kap: 'KAP Test' }],
    };
    const result = validateConfig(config);
    expect(result.valid).toBe(false);
  });
});

describe('validateDataFiles', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auditbpr-data-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should report all missing when directory is empty', () => {
    const result = validateDataFiles(tmpDir);
    expect(result.found).toHaveLength(0);
    expect(result.missing).toHaveLength(4);
  });

  it('should detect xlsx files', () => {
    fs.writeFileSync(path.join(tmpDir, 'neraca.xlsx'), 'dummy');
    fs.writeFileSync(path.join(tmpDir, 'rasio.csv'), 'dummy');
    const result = validateDataFiles(tmpDir);
    expect(result.found).toContain('neraca');
    expect(result.found).toContain('rasio');
    expect(result.missing).toContain('laba_rugi');
    expect(result.missing).toContain('aset_produktif');
  });

  it('should fail when directory does not exist', () => {
    const result = validateDataFiles('/nonexistent/path');
    expect(result.missing).toHaveLength(4);
    expect(result.warnings.some(w => w.status === 'fail')).toBe(true);
  });

  it('should warn on empty files', () => {
    fs.writeFileSync(path.join(tmpDir, 'neraca.xlsx'), '');
    const result = validateDataFiles(tmpDir);
    expect(result.found).toContain('neraca');
    expect(result.warnings.some(w => w.status === 'warn')).toBe(true);
  });
});
