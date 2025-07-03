// Claude Code履歴エントリーの型定義
export interface ClaudeHistoryEntry {
  type: 'summary' | 'user' | 'assistant';
  
  // summary行
  summary?: string;
  leafUuid?: string;
  
  // user/assistant行
  parentUuid?: string | null;
  isSidechain?: boolean;
  userType?: 'external';
  cwd?: string;
  sessionId?: string;
  version?: string;
  message?: {
    role: 'user' | 'assistant';
    content: string | object[];
  };
  uuid?: string;
  timestamp?: string;
  isMeta?: boolean;
  requestId?: string;
  toolUseResult?: any;
}

// セッション情報
export interface SessionInfo {
  sessionId: string;
  projectPath: string;
  startTime: Date;
  endTime: Date;
  duration: number; // minutes
  messageCount: number;
  userMessages: string[];
}

// プロジェクト情報
export interface ProjectInfo {
  name: string;
  path: string;
  sessions: SessionInfo[];
  totalDuration: number; // minutes
  totalMessages: number;
  date: string;
}

// 日報データ
export interface DailyReport {
  date: string;
  projects: ProjectInfo[];
  summary: {
    totalDuration: number; // minutes
    totalMessages: number;
    projectCount: number;
    sessionCount: number;
  };
}

// CLIオプション
export interface CLIOptions {
  date?: string;
  from?: string;
  to?: string;
  project?: string;
  output?: string;
  format?: 'markdown' | 'json' | 'html';
  verbose?: boolean;
}

// 日報生成設定
export interface ReportConfig {
  date: string;
  claudeProjectsPath: string;
  outputPath?: string | undefined;
  format: 'markdown' | 'json' | 'html';
  includeDetails: boolean;
}

// エラー型
export interface ParseError {
  file: string;
  line: number;
  message: string;
  originalError?: Error;
}

// 処理結果
export interface ProcessResult {
  success: boolean;
  data?: DailyReport;
  errors: ParseError[];
  warnings: string[];
}