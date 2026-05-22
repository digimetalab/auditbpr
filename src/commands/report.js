/**
 * auditbpr report — Generate report from agent outputs
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const chalk = require('chalk');
const ora = require('ora');

async function generateReport(options = {}) {
  const outputDir = path.resolve(options.output || './output');
  const agentsDir = path.join(outputDir, 'agents');
  const mdDir = path.join(outputDir, 'markdown');
  const pdfDir = path.join(outputDir, 'pdf');

  // Check for agent outputs
  if (!fs.existsSync(agentsDir)) {
    throw new Error('No agent outputs found. Run `auditbpr run` first.');
  }

  const agentFiles = fs.readdirSync(agentsDir).filter(f => f.startsWith('output_'));
  if (agentFiles.length === 0) {
    throw new Error('No agent output files found in ' + agentsDir);
  }

  console.log(chalk.cyan(`\n  Found ${agentFiles.length} agent output files\n`));

  // List available outputs
  for (const file of agentFiles) {
    const size = fs.statSync(path.join(agentsDir, file)).size;
    const sizeKb = (size / 1024).toFixed(1);
    console.log(chalk.dim(`  • ${file}`) + chalk.dim(` (${sizeKb} KB)`));
  }

  // Check for existing markdown report
  fs.mkdirSync(mdDir, { recursive: true });
  fs.mkdirSync(pdfDir, { recursive: true });

  const mdFiles = fs.readdirSync(mdDir).filter(f => f.endsWith('.md'));

  if (mdFiles.length > 0) {
    console.log(chalk.green(`\n  Markdown report(s) found:`));
    for (const f of mdFiles) {
      console.log(chalk.dim(`  • ${f}`));
    }

    // Convert to PDF if requested
    if (options.format === 'pdf' || options.format === 'both') {
      const spinner = ora('Converting to PDF...').start();
      try {
        const pandocCheck = spawnSync('pandoc', ['--version'], { stdio: 'ignore' });
        if (pandocCheck.status !== 0) {
          throw new Error('pandoc not found');
        }

        for (const mdFile of mdFiles) {
          const mdPath = path.join(mdDir, mdFile);
          const pdfPath = path.join(pdfDir, mdFile.replace('.md', '.pdf'));

          const result = spawnSync('pandoc', [
            mdPath,
            '--pdf-engine=wkhtmltopdf',
            '--toc', '--toc-depth=3',
            '-V', 'lang=id',
            '-V', 'geometry:margin=2.5cm',
            '-o', pdfPath,
          ], { stdio: 'inherit' });

          if (result.status !== 0) {
            throw new Error(`pandoc exited with code ${result.status}`);
          }

          spinner.succeed(`PDF generated: ${pdfPath}`);
        }
      } catch (err) {
        spinner.fail('PDF conversion failed');
        console.log(chalk.yellow('  Install pandoc + wkhtmltopdf for PDF support'));
        console.log(chalk.dim('  https://pandoc.org/installing.html'));
      }
    }
  } else {
    console.log(chalk.yellow('\n  No markdown report found.'));
    console.log(chalk.dim('  Run `auditbpr run` to generate the full report.'));
    console.log(chalk.dim('  Or manually assemble from agent outputs in output/agents/'));
  }
}

module.exports = { generateReport };
