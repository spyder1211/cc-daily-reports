import { format, isValid, parseISO, differenceInMinutes } from 'date-fns';
import { ja } from 'date-fns/locale';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * 日付文字列を標準形式に変換
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) {
    throw new Error(`Invalid date: ${date}`);
  }
  return format(d, 'yyyy-MM-dd');
}

/**
 * 日付文字列を日本語形式に変換
 */
export function formatDateJapanese(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) {
    throw new Error(`Invalid date: ${date}`);
  }
  return format(d, 'yyyy年MM月dd日(E)', { locale: ja });
}

/**
 * 時間を「HH:MM」形式に変換
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(d)) {
    throw new Error(`Invalid date: ${date}`);
  }
  return format(d, 'HH:mm');
}

/**
 * 時間間隔を分単位で計算
 */
export function calculateDuration(startTime: Date | string, endTime: Date | string): number {
  const start = typeof startTime === 'string' ? parseISO(startTime) : startTime;
  const end = typeof endTime === 'string' ? parseISO(endTime) : endTime;
  
  if (!isValid(start) || !isValid(end)) {
    throw new Error(`Invalid dates: ${startTime} - ${endTime}`);
  }
  
  return differenceInMinutes(end, start);
}

/**
 * 分を「X時間Y分」形式に変換
 */
export function formatDuration(minutes: number): string {
  if (minutes === 0) return '0分';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}分`;
  } else if (remainingMinutes === 0) {
    return `${hours}時間`;
  } else {
    return `${hours}時間${remainingMinutes}分`;
  }
}

/**
 * Claude Codeのプロジェクトディレクトリパスを取得
 */
export function getClaudeProjectsPath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, '.claude', 'projects');
}

/**
 * プロジェクトディレクトリ名からプロジェクト名を抽出
 */
export function extractProjectName(dirName: string): string {
  // Claude Codeはパスの各部分を-で区切る
  // -Users-spyder-personal-claude-daily-reports → claude-daily-reports
  // -Users-spyder-c-table-expense-checker → expense-checker
  
  // 先頭と末尾の連続する-を除去
  let cleaned = dirName.replace(/^-+/, '').replace(/-+$/, '');
  
  // パス区切りとして-を使って分割
  const parts = cleaned.split('-');
  
  if (parts.length === 0) {
    return dirName;
  }
  
  // 実際のディレクトリ構造から最後の部分を推定
  // Users-spyder-personal-claude-daily-reports の場合、
  // 最後の2つ以上の部分がプロジェクト名の可能性が高い
  
  if (parts.length === 6) {
    // 6個の場合: Users-spyder-personal-claude-daily-reports → claude-daily-reports
    // または: Users-spyder-c-table-expense-checker → expense-checker  
    // パターンを判定: 3番目が1文字なら最後の2つ、そうでなければ最後の3つ
    if (parts[2]?.length === 1) {
      // c, table, expense, checker → expense-checker
      const projectParts = parts.slice(-2);
      return projectParts.join('-');
    } else {
      // personal, claude, daily, reports → claude-daily-reports
      const projectParts = parts.slice(3);
      return projectParts.join('-');
    }
  } else if (parts.length >= 4) {
    // 中程度のパスの場合、最後の2つを結合
    const projectParts = parts.slice(-2); // 最後の2つ
    return projectParts.join('-');
  } else if (parts.length >= 2) {
    // 短い場合は最後の部分
    return parts[parts.length - 1] || dirName;
  }
  
  return parts[0] || dirName;
}

/**
 * プロジェクトディレクトリ名から実際のパスを復元
 */
export function extractProjectPath(dirName: string): string {
  // -Users-spyder-c-table-expense-checker → /Users/spyder/c-table/expense-checker
  return dirName.replace(/^-/, '').replace(/-/g, '/');
}

/**
 * ディレクトリが存在するかチェック
 */
export function directoryExists(dirPath: string): boolean {
  try {
    const stats = fs.statSync(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * ファイルが存在するかチェック
 */
export function fileExists(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

/**
 * JSONLファイルを読み込み、各行をパース
 */
export function readJsonlFile(filePath: string): any[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    return lines.map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        throw new Error(`Failed to parse line ${index + 1} in ${filePath}: ${error}`);
      }
    });
  } catch (error) {
    throw new Error(`Failed to read JSONL file ${filePath}: ${error}`);
  }
}

/**
 * 指定した日付が今日かチェック
 */
export function isToday(date: string): boolean {
  const today = formatDate(new Date());
  return date === today;
}

/**
 * 日付文字列の妥当性をチェック
 */
export function isValidDateString(dateString: string): boolean {
  const date = parseISO(dateString);
  return isValid(date);
}

/**
 * ファイルパスを安全に作成
 */
export function createSafeFilePath(dir: string, filename: string): string {
  // ファイル名に使用できない文字を除去
  const safeFilename = filename.replace(/[<>:"/\\|?*]/g, '_');
  return path.join(dir, safeFilename);
}

/**
 * バイト数を人間が読みやすい形式に変換
 */
export function formatBytes(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * エラーメッセージを整形
 */
export function formatError(error: Error): string {
  return `Error: ${error.message}`;
}

/**
 * 配列を重複を除いて結合
 */
export function uniqueArray<T>(array: T[]): T[] {
  return [...new Set(array)];
}