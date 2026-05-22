/**
 * auditbpr init — Initialize a new BPR audit project
 */

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const ora = require('ora');
const { DEFAULT_CONFIG } = require('../config');

async function initProject(options = {}) {
  const spinner = ora('Initializing BPR audit project...').start();

  try {
    const cwd = process.cwd();

    // Create directory structure
    const dirs = [
      'data',
      'output/markdown',
      'output/pdf',
      'output/agents',
      'output/logs',
    ];

    for (const dir of dirs) {
      const fullPath = path.join(cwd, dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }

    // Create .gitkeep in data/
    const gitkeep = path.join(cwd, 'data', '.gitkeep');
    if (!fs.existsSync(gitkeep)) {
      fs.writeFileSync(gitkeep, '');
    }

    // Create default config if not exists
    const configPath = path.join(cwd, '.auditbpr.json');
    if (!fs.existsSync(configPath)) {
      const defaultConfig = {
        ...DEFAULT_CONFIG,
        bpr: {
          ...DEFAULT_CONFIG.bpr,
          nama: 'PT BPR Example',
          kota: 'City',
          provinsi: 'Province',
          periode: '2020-2024',
        },
        pengurus: [
          { jabatan: 'Direktur Utama', nama: 'Full Name' },
          { jabatan: 'Direktur', nama: 'Full Name' },
          { jabatan: 'Komisaris Utama', nama: 'Full Name' },
        ],
        pemegang_saham: [
          { nama: 'Shareholder Name', persen: 60, jenis: 'individu' },
        ],
        riwayat_kap: [
          { tahun: '2020-2024', kap: 'KAP Name & Partners', ap: 'AP Name, CPA' },
        ],
      };

      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
    }

    spinner.succeed(chalk.green('Project initialized successfully!'));

    console.log('\n' + chalk.cyan('Project structure created:'));
    console.log(chalk.dim('  data/           ') + '← Place Excel/CSV files here');
    console.log(chalk.dim('  output/         ') + '← Reports will be generated here');
    console.log(chalk.dim('  .auditbpr.json  ') + '← Edit BPR configuration');

    console.log('\n' + chalk.yellow('Next steps:'));
    console.log('  1. Edit ' + chalk.bold('.auditbpr.json') + ' with your BPR data');
    console.log('  2. Place financial data files in ' + chalk.bold('data/'));
    console.log('  3. Run: ' + chalk.bold('auditbpr run'));

    console.log('\n' + chalk.dim('Required data files:'));
    console.log('  • neraca.xlsx          — 5-year balance sheet');
    console.log('  • laba_rugi.xlsx       — 5-year profit & loss');
    console.log('  • aset_produktif.xlsx  — 5-year asset quality');
    console.log('  • rasio.xlsx           — 5-year financial ratios');

  } catch (error) {
    spinner.fail(chalk.red('Initialization failed: ' + error.message));
    throw error;
  }
}

module.exports = { initProject };
