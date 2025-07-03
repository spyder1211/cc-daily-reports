#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { ClaudeDailyReportGenerator } from './index';
import { CLIOptions } from './types';
import { formatDate, isValidDateString } from './utils';

const program = new Command();

// パッケージ情報
const packageJson = require('../package.json');

// ヘルプメッセージの色付け（将来使用予定）
// function colorizeOutput(text: string): string {
//   return text
//     .replace(/Claude Daily Report Generator/g, chalk.blue.bold('Claude Daily Report Generator'))
//     .replace(/USAGE:/g, chalk.yellow.bold('USAGE:'))
//     .replace(/OPTIONS:/g, chalk.yellow.bold('OPTIONS:'))
//     .replace(/EXAMPLES:/g, chalk.yellow.bold('EXAMPLES:'));
// }

// CLI設定
program
  .name('claude-daily-report')
  .description(chalk.blue('Generate daily reports from Claude Code usage history'))
  .version(packageJson.version)
  .configureOutput({
    outputError: (str, write) => write(chalk.red(str)),
  });

// メインコマンド
program
  .argument('[date]', 'Target date (YYYY-MM-DD format, default: today)')
  .option('-d, --date <date>', 'Specify target date (YYYY-MM-DD)')
  .option('-p, --project <name>', 'Filter by specific project name')
  .option('-o, --output <file>', 'Output file path')
  .option('-f, --format <format>', 'Output format (markdown, json, html)', 'markdown')
  .option('-v, --verbose', 'Show detailed information')
  .option('-s, --summary', 'Show summary only (no file output)')
  .action(async (dateArg: string | undefined, options: any) => {
    try {
      // 日付の処理
      let targetDate = dateArg || options.date || formatDate(new Date());
      
      // 日付形式の検証
      if (!isValidDateString(targetDate)) {
        console.error(chalk.red(`❌ Invalid date format: ${targetDate}`));
        console.error(chalk.yellow('Please use YYYY-MM-DD format (e.g., 2025-07-03)'));
        process.exit(1);
      }

      // フォーマットの検証
      const validFormats = ['markdown', 'json', 'html'];
      if (!validFormats.includes(options.format)) {
        console.error(chalk.red(`❌ Invalid format: ${options.format}`));
        console.error(chalk.yellow(`Valid formats: ${validFormats.join(', ')}`));
        process.exit(1);
      }

      const generator = new ClaudeDailyReportGenerator();

      // サマリーモードの場合
      if (options.summary) {
        await generator.showSummary(targetDate);
        return;
      }

      // CLIオプションを準備
      const cliOptions: CLIOptions = {
        date: targetDate,
        project: options.project,
        output: options.output,
        format: options.format,
        verbose: options.verbose
      };

      console.log(chalk.blue(`📊 Generating daily report for ${targetDate}...`));

      if (options.project) {
        console.log(chalk.gray(`🔍 Filtering by project: ${options.project}`));
      }

      // 日報生成
      const result = await generator.generateReport(cliOptions);

      if (options.output) {
        console.log(chalk.green(`✅ ${result}`));
      } else {
        // 標準出力に出力
        console.log('\n' + result);
      }

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error}`));
      
      if (options.verbose) {
        console.error(chalk.gray(error instanceof Error ? error.stack : String(error)));
      }
      
      process.exit(1);
    }
  });

// プロジェクト一覧表示コマンド
program
  .command('projects')
  .description('List available Claude Code projects')
  .action(() => {
    try {
      const generator = new ClaudeDailyReportGenerator();
      const projects = generator.getAvailableProjects();

      if (projects.length === 0) {
        console.log(chalk.yellow('📁 No Claude Code projects found'));
        console.log(chalk.gray('Make sure Claude Code has been used and projects exist in ~/.claude/projects'));
        return;
      }

      console.log(chalk.blue(`📁 Available projects (${projects.length}):`));
      console.log('─'.repeat(50));
      
      projects.forEach((project, index) => {
        console.log(`${chalk.gray((index + 1).toString().padStart(2))}. ${chalk.cyan(project)}`);
      });

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error}`));
      process.exit(1);
    }
  });

// サマリー表示コマンド
program
  .command('summary')
  .description('Show work summary for specified date')
  .argument('[date]', 'Target date (YYYY-MM-DD format, default: today)')
  .action(async (date: string | undefined) => {
    try {
      const targetDate = date || formatDate(new Date());
      
      if (!isValidDateString(targetDate)) {
        console.error(chalk.red(`❌ Invalid date format: ${targetDate}`));
        console.error(chalk.yellow('Please use YYYY-MM-DD format (e.g., 2025-07-03)'));
        process.exit(1);
      }

      const generator = new ClaudeDailyReportGenerator();
      await generator.showSummary(targetDate);

    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error}`));
      process.exit(1);
    }
  });

// 使用例の表示
program
  .command('examples')
  .description('Show usage examples')
  .action(() => {
    console.log(chalk.blue.bold('Claude Daily Report Generator - Usage Examples'));
    console.log('─'.repeat(60));
    console.log();
    
    console.log(chalk.yellow('📋 Basic Usage:'));
    console.log('  claude-daily-report                    # Generate today\'s report');
    console.log('  claude-daily-report 2025-07-03        # Generate report for specific date');
    console.log('  claude-daily-report --summary          # Show summary only');
    console.log();
    
    console.log(chalk.yellow('📁 Project Filtering:'));
    console.log('  claude-daily-report -p expense-checker # Filter by project name');
    console.log('  claude-daily-report projects           # List all available projects');
    console.log();
    
    console.log(chalk.yellow('📄 Output Options:'));
    console.log('  claude-daily-report -o report.md       # Save to markdown file');
    console.log('  claude-daily-report -f json            # JSON format output');
    console.log('  claude-daily-report -f html -o report.html  # HTML format file');
    console.log();
    
    console.log(chalk.yellow('🔍 Information:'));
    console.log('  claude-daily-report summary            # Show work summary');
    console.log('  claude-daily-report summary 2025-07-03 # Summary for specific date');
    console.log('  claude-daily-report -v                 # Verbose output');
    console.log();
    
    console.log(chalk.gray('💡 Tip: Use --help with any command for more details'));
  });

// エラーハンドリング
program.exitOverride();

try {
  program.parse();
} catch (error: any) {
  if (error.code === 'commander.version') {
    process.exit(0);
  } else if (error.code === 'commander.help') {
    process.exit(0);
  } else {
    console.error(chalk.red(`❌ Command error: ${error.message}`));
    process.exit(1);
  }
}

// コマンドが指定されていない場合のデフォルト動作
if (process.argv.length === 2) {
  // 引数なしで実行された場合は今日の日報を生成
  (async () => {
    try {
      const generator = new ClaudeDailyReportGenerator();
      const today = formatDate(new Date());
      
      console.log(chalk.blue(`📊 Generating daily report for ${today}...`));
      
      const result = await generator.generateReport({ date: today });
      console.log('\n' + result);
      
    } catch (error) {
      console.error(chalk.red(`❌ Error: ${error}`));
      process.exit(1);
    }
  })();
}