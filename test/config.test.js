/**
 * Tests for src/config.js
 * Vitest globals (describe, it, expect) are injected via vitest.config.mjs
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { loadConfig, saveConfig, deepMerge, DEFAULT_CONFIG } = require('../src/config');

describe('deepMerge', () => {
  it('should merge flat objects', () => {
    const result = deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 });
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('should deep merge nested objects', () => {
    const target = { bpr: { nama: '', kota: 'Default' } };
    const source = { bpr: { nama: 'PT BPR ABC' } };
    const result = deepMerge(target, source);
    expect(result.bpr.nama).toBe('PT BPR ABC');
    expect(result.bpr.kota).toBe('Default');
  });

  it('should replace arrays entirely', () => {
    const target = { items: [1, 2, 3] };
    const source = { items: [4, 5] };
    const result = deepMerge(target, source);
    expect(result.items).toEqual([4, 5]);
  });

  it('should not mutate original objects', () => {
    const target = { bpr: { nama: 'Old' } };
    const source = { bpr: { nama: 'New' } };
    deepMerge(target, source);
    expect(target.bpr.nama).toBe('Old');
  });

  it('should handle empty source', () => {
    const target = { a: 1 };
    expect(deepMerge(target, {})).toEqual({ a: 1 });
  });
});

describe('loadConfig', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auditbpr-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should return defaults when no config file exists', () => {
    const originalCwd = process.cwd();
    process.chdir(tmpDir);
    try {
      const config = loadConfig();
      expect(config.bpr.nama).toBe('');
      expect(config.platform).toBe('gemini');
    } finally {
      process.chdir(originalCwd);
    }
  });

  it('should load and deep merge custom config', () => {
    const configPath = path.join(tmpDir, '.auditbpr.json');
    fs.writeFileSync(configPath, JSON.stringify({
      bpr: { nama: 'PT BPR Test' },
    }));
    const config = loadConfig(configPath);
    expect(config.bpr.nama).toBe('PT BPR Test');
    expect(config.bpr.kota).toBe(''); // Preserved from defaults
    expect(config.platform).toBe('gemini'); // Preserved from defaults
  });

  it('should throw on malformed JSON', () => {
    const configPath = path.join(tmpDir, '.auditbpr.json');
    fs.writeFileSync(configPath, '{ invalid json }');
    expect(() => loadConfig(configPath)).toThrow('Invalid JSON');
  });
});

describe('saveConfig', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'auditbpr-test-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('should create config file', () => {
    const savedPath = saveConfig({ test: true }, tmpDir);
    expect(fs.existsSync(savedPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(savedPath, 'utf8'));
    expect(content.test).toBe(true);
  });
});
