import * as fs from 'fs';
import * as path from 'path';
import { ClaudeHistoryParser } from './parser';
import { ReportGenerator } from './generator';
import { CLIOptions, ReportConfig } from './types';
import { formatDate, createSafeFilePath, directoryExists } from './utils';

/**
 * Claude Daily Report Generator のメインクラス
 */
export class ClaudeDailyReportGenerator {
  private parser: ClaudeHistoryParser;
  private generator: ReportGenerator;

  constructor(claudeProjectsPath?: string) {
    this.parser = new ClaudeHistoryParser(claudeProjectsPath);
    this.generator = new ReportGenerator();
  }

  /**
   * 日報を生成
   */
  public async generateReport(options: CLIOptions): Promise<string> {
    // 設定を準備
    const config = this.prepareConfig(options);
    
    // 解析実行
    const result = options.project 
      ? await this.parser.parseProjectOnly(options.project, config.date)
      : await this.parser.parseForDate(config.date);

    if (!result.success || !result.data) {
      throw new Error(`Failed to parse history: ${result.errors.map(e => e.message).join(', ')}`);
    }

    // 警告を出力
    if (result.warnings.length > 0) {
      console.warn('Warnings:');
      result.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }

    // 日報生成
    let content: string;
    switch (config.format) {
      case 'json':
        content = this.generator.generateJson(result.data);
        break;
      case 'html':
        content = this.generator.generateHtml(result.data);
        break;
      case 'markdown':
      default:
        content = this.generator.generateMarkdown(result.data);
        break;
    }

    // ファイル出力
    if (config.outputPath) {
      await this.writeToFile(config.outputPath, content);
      return `Report generated: ${config.outputPath}`;
    } else {
      return content;
    }
  }

  /**
   * 日付範囲での日報生成（将来の拡張機能）
   */
  public async generateRangeReport(_fromDate: string, _toDate: string, _options: CLIOptions): Promise<string> {
    // 実装は将来のPhase 3で対応
    throw new Error('Date range reports are not yet implemented. Please use single date reports.');
  }

  /**
   * 利用可能なプロジェクト一覧を取得
   */
  public getAvailableProjects(): string[] {
    return this.parser.getAvailableProjects();
  }

  /**
   * 設定を準備
   */
  private prepareConfig(options: CLIOptions): ReportConfig {
    // 日付の決定
    const date = options.date || formatDate(new Date());

    // 出力パスの決定
    let outputPath: string | undefined;
    if (options.output) {
      outputPath = options.output;
    } else if (options.format && options.format !== 'markdown') {
      // デフォルトファイル名を生成
      const extension = this.getFileExtension(options.format);
      const filename = `daily-report-${date}${extension}`;
      outputPath = createSafeFilePath(process.cwd(), filename);
    }

    // フォーマットの決定
    const format = options.format || 'markdown';

    return {
      date,
      claudeProjectsPath: '', // パーサーが自動決定
      outputPath,
      format,
      includeDetails: options.verbose || false
    };
  }

  /**
   * ファイル拡張子を取得
   */
  private getFileExtension(format: string): string {
    switch (format) {
      case 'json':
        return '.json';
      case 'html':
        return '.html';
      case 'markdown':
      default:
        return '.md';
    }
  }

  /**
   * ファイルに書き込み
   */
  private async writeToFile(filePath: string, content: string): Promise<void> {
    try {
      // ディレクトリが存在しない場合は作成
      const dir = path.dirname(filePath);
      if (!directoryExists(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // ファイル書き込み
      fs.writeFileSync(filePath, content, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to write file ${filePath}: ${error}`);
    }
  }

  /**
   * サマリー情報を表示
   */
  public async showSummary(date?: string): Promise<void> {
    const targetDate = date || formatDate(new Date());
    const result = await this.parser.parseForDate(targetDate);

    if (!result.success || !result.data) {
      console.error('Failed to generate summary:', result.errors.map(e => e.message).join(', '));
      return;
    }

    const { summary, projects } = result.data;

    console.log(`\n📊 Daily Summary for ${targetDate}`);
    console.log('─'.repeat(50));
    console.log(`⏰ Total Time: ${this.formatMinutes(summary.totalDuration)}`);
    console.log(`📝 Messages: ${summary.totalMessages}`);
    console.log(`📁 Projects: ${summary.projectCount}`);
    console.log(`🔄 Sessions: ${summary.sessionCount}`);

    if (projects.length > 0) {
      console.log('\n📁 Projects:');
      projects.forEach(project => {
        console.log(`  • ${project.name}: ${this.formatMinutes(project.totalDuration)} (${project.totalMessages} messages)`);
      });
    }

    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
  }

  /**
   * 分を時間形式で表示
   */
  private formatMinutes(minutes: number): string {
    if (minutes === 0) return '0min';
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) {
      return `${remainingMinutes}min`;
    } else if (remainingMinutes === 0) {
      return `${hours}h`;
    } else {
      return `${hours}h ${remainingMinutes}min`;
    }
  }
}

// エクスポート用の便利関数
export async function generateDailyReport(options: CLIOptions = {}): Promise<string> {
  const generator = new ClaudeDailyReportGenerator();
  return await generator.generateReport(options);
}

export async function showDailySummary(date?: string): Promise<void> {
  const generator = new ClaudeDailyReportGenerator();
  return await generator.showSummary(date);
}

export function getAvailableProjects(): string[] {
  const generator = new ClaudeDailyReportGenerator();
  return generator.getAvailableProjects();
}