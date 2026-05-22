/**
 * auditbpr — Audit Orchestrator
 * Node.js orchestrator with EventEmitter.
 * Mirrors the 4-phase architecture from platforms/run_audit_codex.py.
 *
 * Phases:
 *   0. parseData()      — Parse Excel/CSV to JSON
 *   1. runLayer1()      — Agents 01-05 in parallel
 *   2. runLayer2()      — Agents 06-08 in parallel (concurrent with L1)
 *   3. runLayer3()      — Agents 09-11 sequential
 *   4. assembleReport() — Risk scoring + final report
 */

const { EventEmitter } = require('events');
const path = require('path');

const AGENTS = {
  layer1: ['01_bpr_profile', '02_neraca', '03_laba_rugi', '04_aset_produktif', '05_rasio_keuangan'],
  layer2: ['06_investigasi_pengurus', '07_investigasi_pemegang_saham', '08_investigasi_kap'],
  layer3: ['09_cross_reference_redflag', '10_forensic_trend', '11_regulatory_compliance'],
};

class AuditOrchestrator extends EventEmitter {
  /**
   * @param {Object} options
   * @param {Object} options.config - AuditBPR config
   * @param {import('./platform-adapter').PlatformAdapter} options.adapter - Platform adapter instance
   * @param {boolean} [options.dryRun=false] - If true, skip actual execution
   * @param {string[]} [options.agents] - Filter to specific agent IDs
   */
  constructor(options = {}) {
    super();
    this.config = options.config;
    this.adapter = options.adapter;
    this.dryRun = options.dryRun || false;
    this.agentFilter = options.agents || null;
    this.outputs = {};
    this.timing = {};
  }

  /**
   * Filter agents list by the agentFilter if set.
   */
  _filterAgents(agents) {
    if (!this.agentFilter) return agents;
    return agents.filter(a => {
      const num = a.split('_')[0];
      return this.agentFilter.includes(num) || this.agentFilter.includes(a);
    });
  }

  /**
   * Execute a single agent, capturing timing and errors.
   */
  async _executeAgent(agentId) {
    const start = Date.now();
    this.emit('agent:start', { agentId });

    try {
      if (this.dryRun) {
        this.emit('agent:dryrun', { agentId });
        this.outputs[agentId] = `[DRY RUN] ${agentId} would execute here`;
        this.timing[agentId] = 0;
        return this.outputs[agentId];
      }

      const pkgRoot = path.resolve(__dirname, '..');
      const skillPath = path.join(pkgRoot, 'agents', agentId, 'SKILL.md');
      const context = {
        config: this.config,
        previousOutputs: this.outputs,
      };

      const result = await this.adapter.executeAgent(agentId, skillPath, context);
      this.outputs[agentId] = result;
      this.timing[agentId] = Date.now() - start;

      this.emit('agent:complete', {
        agentId,
        duration: this.timing[agentId],
      });

      return result;
    } catch (err) {
      this.timing[agentId] = Date.now() - start;
      this.emit('agent:error', { agentId, error: err });
      this.outputs[agentId] = `[ERROR] ${agentId}: ${err.message}`;
      throw err;
    }
  }

  /**
   * Phase 0: Parse and validate data files.
   */
  async parseData() {
    this.emit('phase:start', { phase: 0, name: 'Parse & Validate Data' });
    const start = Date.now();

    if (this.dryRun) {
      this.emit('phase:dryrun', { phase: 0 });
      return;
    }

    // Parsing is typically done by the orchestrator's SKILL.md
    // Here we delegate to the adapter to run parsing
    try {
      const result = await this.adapter.executeAgent(
        'orchestrator_parse',
        path.resolve(__dirname, '..', 'orchestrator', 'SKILL.md'),
        { config: this.config, previousOutputs: {} }
      );
      this.outputs['fase0_parsed'] = result;
    } catch (err) {
      this.emit('phase:error', { phase: 0, error: err });
      throw err;
    }

    this.emit('phase:complete', { phase: 0, duration: Date.now() - start });
  }

  /**
   * Phase 1: Run Layer 1 (01-05) in parallel.
   */
  async runLayer1() {
    const agents = this._filterAgents(AGENTS.layer1);
    this.emit('phase:start', { phase: 1, name: 'Layer 1 — Financial Analysis', agents });
    const start = Date.now();

    const results = await Promise.allSettled(
      agents.map(a => this._executeAgent(a))
    );

    const errors = results.filter(r => r.status === 'rejected');
    this.emit('phase:complete', {
      phase: 1,
      duration: Date.now() - start,
      succeeded: results.filter(r => r.status === 'fulfilled').length,
      failed: errors.length,
    });

    return results;
  }

  /**
   * Phase 2: Run Layer 2 (06-08) in parallel.
   */
  async runLayer2() {
    const agents = this._filterAgents(AGENTS.layer2);
    this.emit('phase:start', { phase: 2, name: 'Layer 2 — OSINT Investigation', agents });
    const start = Date.now();

    const results = await Promise.allSettled(
      agents.map(a => this._executeAgent(a))
    );

    const errors = results.filter(r => r.status === 'rejected');
    this.emit('phase:complete', {
      phase: 2,
      duration: Date.now() - start,
      succeeded: results.filter(r => r.status === 'fulfilled').length,
      failed: errors.length,
    });

    return results;
  }

  /**
   * Phase 3: Run Layer 3 (09-11) sequentially.
   */
  async runLayer3() {
    const agents = this._filterAgents(AGENTS.layer3);
    this.emit('phase:start', { phase: 3, name: 'Layer 3 — Synthesis', agents });
    const start = Date.now();

    for (const agentId of agents) {
      await this._executeAgent(agentId);
    }

    this.emit('phase:complete', {
      phase: 3,
      duration: Date.now() - start,
      succeeded: agents.length,
      failed: 0,
    });
  }

  /**
   * Phase 4: Assemble final report.
   */
  async assembleReport() {
    this.emit('phase:start', { phase: 4, name: 'Report Assembly' });
    const start = Date.now();

    if (this.dryRun) {
      this.emit('phase:dryrun', { phase: 4 });
      return;
    }

    try {
      const result = await this.adapter.executeAgent(
        'orchestrator_report',
        path.resolve(__dirname, '..', 'orchestrator', 'SKILL.md'),
        { config: this.config, previousOutputs: this.outputs }
      );
      this.outputs['final_report'] = result;
    } catch (err) {
      this.emit('phase:error', { phase: 4, error: err });
      throw err;
    }

    this.emit('phase:complete', { phase: 4, duration: Date.now() - start });
  }

  /**
   * Run the full audit pipeline.
   */
  async run() {
    const totalStart = Date.now();
    this.emit('audit:start', { config: this.config, dryRun: this.dryRun });

    try {
      // Phase 0: Parse data
      await this.parseData();

      // Phase 1+2: L1 and L2 in parallel
      const [l1Results, l2Results] = await Promise.all([
        this.runLayer1(),
        this.runLayer2(),
      ]);

      // Phase 3: L3 sequential
      await this.runLayer3();

      // Phase 4: Report assembly
      await this.assembleReport();

      this.emit('audit:complete', {
        duration: Date.now() - totalStart,
        outputs: Object.keys(this.outputs),
        timing: this.timing,
      });
    } catch (err) {
      this.emit('audit:error', {
        error: err,
        duration: Date.now() - totalStart,
        completedAgents: Object.keys(this.outputs),
      });
      throw err;
    }
  }
}

module.exports = { AuditOrchestrator, AGENTS };
