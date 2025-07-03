import * as fs from 'fs';
import * as path from 'path';
import { parseISO, isSameDay } from 'date-fns';
import { 
  SessionInfo, 
  ProjectInfo, 
  ParseError, 
  ProcessResult 
} from './types';
import { 
  getClaudeProjectsPath, 
  extractProjectName, 
  extractProjectPath, 
  directoryExists, 
  readJsonlFile, 
  calculateDuration, 
  isValidDateString
} from './utils';

/**
 * Claude Code履歴を解析してプロジェクト情報を抽出
 */
export class ClaudeHistoryParser {
  private claudeProjectsPath: string;
  private errors: ParseError[] = [];
  private warnings: string[] = [];

  constructor(claudeProjectsPath?: string) {
    this.claudeProjectsPath = claudeProjectsPath || getClaudeProjectsPath();
  }

  /**
   * 指定日の日報データを生成
   */
  public async parseForDate(targetDate: string): Promise<ProcessResult> {
    this.errors = [];
    this.warnings = [];

    try {
      // 日付の妥当性チェック
      if (!isValidDateString(targetDate)) {
        throw new Error(`Invalid date format: ${targetDate}`);
      }

      // Claude プロジェクトディレクトリの存在チェック
      if (!directoryExists(this.claudeProjectsPath)) {
        throw new Error(`Claude projects directory not found: ${this.claudeProjectsPath}`);
      }

      // プロジェクト一覧を取得
      const projectDirs = this.getProjectDirectories();
      if (projectDirs.length === 0) {
        this.warnings.push('No Claude projects found');
        return {
          success: true,
          data: {
            date: targetDate,
            projects: [],
            summary: {
              totalDuration: 0,
              totalMessages: 0,
              projectCount: 0,
              sessionCount: 0
            }
          },
          errors: this.errors,
          warnings: this.warnings
        };
      }

      // 各プロジェクトの履歴を解析
      const projects: ProjectInfo[] = [];
      for (const projectDir of projectDirs) {
        try {
          const projectInfo = await this.parseProjectForDate(projectDir, targetDate);
          if (projectInfo && projectInfo.sessions.length > 0) {
            projects.push(projectInfo);
          }
        } catch (error) {
          this.errors.push({
            file: projectDir,
            line: 0,
            message: `Failed to parse project: ${error}`,
            originalError: error as Error
          });
        }
      }

      // サマリーを計算
      const summary = this.calculateSummary(projects);

      return {
        success: true,
        data: {
          date: targetDate,
          projects: projects.sort((a, b) => b.totalDuration - a.totalDuration),
          summary
        },
        errors: this.errors,
        warnings: this.warnings
      };

    } catch (error) {
      this.errors.push({
        file: 'parser',
        line: 0,
        message: `Parse failed: ${error}`,
        originalError: error as Error
      });

      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }

  /**
   * プロジェクトディレクトリ一覧を取得
   */
  private getProjectDirectories(): string[] {
    try {
      const entries = fs.readdirSync(this.claudeProjectsPath);
      return entries.filter(entry => {
        const fullPath = path.join(this.claudeProjectsPath, entry);
        return directoryExists(fullPath) && entry.startsWith('-');
      });
    } catch (error) {
      throw new Error(`Failed to read projects directory: ${error}`);
    }
  }

  /**
   * 指定プロジェクトの指定日の履歴を解析
   */
  private async parseProjectForDate(projectDir: string, targetDate: string): Promise<ProjectInfo | null> {
    const projectPath = path.join(this.claudeProjectsPath, projectDir);
    const projectName = extractProjectName(projectDir);
    const actualPath = extractProjectPath(projectDir);

    // プロジェクト内のJSONLファイルを取得
    const jsonlFiles = this.getJsonlFiles(projectPath);
    if (jsonlFiles.length === 0) {
      this.warnings.push(`No JSONL files found in project: ${projectName}`);
      return null;
    }

    // 各JSONLファイルからセッション情報を抽出
    const sessions: SessionInfo[] = [];
    for (const jsonlFile of jsonlFiles) {
      try {
        const sessionInfo = await this.parseSessionFile(jsonlFile, targetDate, actualPath);
        if (sessionInfo) {
          sessions.push(sessionInfo);
        }
      } catch (error) {
        this.errors.push({
          file: jsonlFile,
          line: 0,
          message: `Failed to parse session file: ${error}`,
          originalError: error as Error
        });
      }
    }

    if (sessions.length === 0) {
      return null;
    }

    // プロジェクト情報を作成
    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    const totalMessages = sessions.reduce((sum, session) => sum + session.messageCount, 0);

    return {
      name: projectName,
      path: actualPath,
      sessions: sessions.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
      totalDuration,
      totalMessages,
      date: targetDate
    };
  }

  /**
   * JSONLファイル一覧を取得
   */
  private getJsonlFiles(projectPath: string): string[] {
    try {
      const entries = fs.readdirSync(projectPath);
      return entries
        .filter(entry => entry.endsWith('.jsonl'))
        .map(entry => path.join(projectPath, entry));
    } catch (error) {
      throw new Error(`Failed to read project directory: ${error}`);
    }
  }

  /**
   * セッションファイルを解析
   */
  private async parseSessionFile(filePath: string, targetDate: string, projectPath: string): Promise<SessionInfo | null> {
    const entries = readJsonlFile(filePath);
    const sessionId = path.basename(filePath, '.jsonl');

    // 指定日のエントリーをフィルタ
    const targetEntries = entries.filter(entry => {
      if (!entry.timestamp) return false;
      const entryDate = parseISO(entry.timestamp);
      const target = parseISO(targetDate);
      return isSameDay(entryDate, target);
    });

    if (targetEntries.length === 0) {
      return null;
    }

    // ユーザーメッセージを抽出
    const userMessages = targetEntries
      .filter(entry => entry.type === 'user' && entry.message?.role === 'user')
      .map(entry => {
        const content = entry.message?.content;
        if (typeof content === 'string') {
          return content;
        } else if (Array.isArray(content)) {
          // ツール使用の場合、テキスト部分を抽出
          const textContent = content.find(item => item.type === 'text');
          return textContent?.text || '[Tool use]';
        }
        return '[Unknown content]';
      });

    if (userMessages.length === 0) {
      return null;
    }

    // 開始時刻と終了時刻を計算
    const timestamps = targetEntries
      .filter(entry => entry.timestamp)
      .map(entry => parseISO(entry.timestamp!))
      .sort((a, b) => a.getTime() - b.getTime());

    if (timestamps.length === 0) {
      return null;
    }

    const startTime = timestamps[0];
    const endTime = timestamps[timestamps.length - 1];
    
    if (!startTime || !endTime) {
      return null;
    }
    
    const duration = calculateDuration(startTime, endTime);

    return {
      sessionId,
      projectPath,
      startTime,
      endTime,
      duration,
      messageCount: userMessages.length,
      userMessages
    };
  }

  /**
   * サマリーを計算
   */
  private calculateSummary(projects: ProjectInfo[]) {
    const totalDuration = projects.reduce((sum, project) => sum + project.totalDuration, 0);
    const totalMessages = projects.reduce((sum, project) => sum + project.totalMessages, 0);
    const sessionCount = projects.reduce((sum, project) => sum + project.sessions.length, 0);

    return {
      totalDuration,
      totalMessages,
      projectCount: projects.length,
      sessionCount
    };
  }

  /**
   * 特定プロジェクトのみを解析
   */
  public async parseProjectOnly(projectName: string, targetDate: string): Promise<ProcessResult> {
    this.errors = [];
    this.warnings = [];

    try {
      const projectDirs = this.getProjectDirectories();
      const matchingDir = projectDirs.find(dir => extractProjectName(dir) === projectName);

      if (!matchingDir) {
        throw new Error(`Project not found: ${projectName}`);
      }

      const projectInfo = await this.parseProjectForDate(matchingDir, targetDate);
      const projects = projectInfo ? [projectInfo] : [];
      const summary = this.calculateSummary(projects);

      return {
        success: true,
        data: {
          date: targetDate,
          projects,
          summary
        },
        errors: this.errors,
        warnings: this.warnings
      };

    } catch (error) {
      this.errors.push({
        file: 'parser',
        line: 0,
        message: `Parse failed: ${error}`,
        originalError: error as Error
      });

      return {
        success: false,
        errors: this.errors,
        warnings: this.warnings
      };
    }
  }

  /**
   * 利用可能なプロジェクト一覧を取得
   */
  public getAvailableProjects(): string[] {
    try {
      const projectDirs = this.getProjectDirectories();
      return projectDirs.map(dir => extractProjectName(dir));
    } catch (error) {
      return [];
    }
  }
}