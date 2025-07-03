# Claude Daily Report Generator - 要件定義書

## 1. プロジェクト概要

### 1.1 目的
Claude Codeの使用履歴から自動的に日報（作業報告書）のマークダウンファイルを生成するCLIツールを開発する。

### 1.2 背景
- 毎日Claude Codeで多くの作業を行っているが、作業内容の記録が手動で非効率
- Claude Codeは使用履歴を`~/.claude/projects`にJSONLファイルとして自動保存している
- この履歴を活用して自動的に日報を生成したい

### 1.3 対象ユーザー
- Claude Codeを日常的に使用する開発者
- 作業記録・日報作成が必要な人
- npmパッケージとして公開し、コミュニティに提供

## 2. 機能要件

### 2.1 主要機能

#### 2.1.1 Claude Code履歴解析機能
- `~/.claude/projects`ディレクトリから各プロジェクトの`.jsonl`ファイルを読み取り
- ユーザーの指示内容（`user`メッセージ）を抽出
- タイムスタンプ、プロジェクト名、作業ディレクトリ情報を取得

#### 2.1.2 日報生成機能
- 指定日付の作業内容をマークダウン形式で出力
- プロジェクト別、時系列での整理
- 作業時間、作業内容の要約

#### 2.1.3 出力フォーマット
```markdown
# 日報 YYYY-MM-DD

## 作業サマリー
- 総作業時間: X時間
- 作業プロジェクト数: X個
- 実行したタスク数: X個

## プロジェクト別作業内容

### プロジェクト名1 (/path/to/project)
- **10:23** 指示内容1
- **14:15** 指示内容2
- **16:30** 指示内容3

### プロジェクト名2 (/path/to/project)
- **09:45** 指示内容4
- **13:20** 指示内容5

## 作業時間詳細
- 09:00-12:00 プロジェクト名1
- 13:00-17:00 プロジェクト名2
```

### 2.2 コマンド仕様

#### 2.2.1 基本コマンド
```bash
# 今日の日報生成
claude-daily-report

# 特定日の日報生成
claude-daily-report --date 2025-07-03
claude-daily-report -d 2025-07-03

# 日付範囲指定
claude-daily-report --from 2025-07-01 --to 2025-07-03

# 特定プロジェクトのみ
claude-daily-report --project "project-name"

# 出力ファイル指定
claude-daily-report --output report.md
claude-daily-report -o report.md
```

#### 2.2.2 オプション
- `--date, -d`: 特定日付の日報生成
- `--from, --to`: 期間指定
- `--project, -p`: 特定プロジェクトのみ
- `--output, -o`: 出力ファイル指定
- `--format, -f`: 出力フォーマット（markdown, json, html）
- `--verbose, -v`: 詳細表示
- `--help, -h`: ヘルプ表示

## 3. 技術要件

### 3.1 実装技術
- **言語**: TypeScript
- **ランタイム**: Node.js (v16以上)
- **配布**: npm パッケージ
- **CLI フレームワーク**: Commander.js
- **日付処理**: date-fns
- **出力装飾**: chalk

### 3.2 ファイル構成
```
claude-daily-report/
├── package.json
├── tsconfig.json
├── src/
│   ├── cli.ts           # CLIエントリーポイント
│   ├── index.ts         # メイン処理
│   ├── parser.ts        # JSONL解析
│   ├── generator.ts     # 日報生成
│   ├── types.ts         # 型定義
│   └── utils.ts         # ユーティリティ
├── dist/                # ビルド出力
└── README.md
```

### 3.3 データ構造

#### 3.3.1 Claude Code履歴の構造
```typescript
interface ClaudeHistoryEntry {
  timestamp: string;
  type: 'user' | 'assistant';
  sessionId: string;
  cwd: string;
  message: {
    role: 'user' | 'assistant';
    content: string;
  };
}
```

#### 3.3.2 日報データ構造
```typescript
interface DailyReport {
  date: string;
  projects: ProjectReport[];
  summary: {
    totalHours: number;
    projectCount: number;
    taskCount: number;
  };
}

interface ProjectReport {
  name: string;
  path: string;
  tasks: TaskEntry[];
  duration: number;
}

interface TaskEntry {
  time: string;
  instruction: string;
  category?: string;
}
```

## 4. 非機能要件

### 4.1 パフォーマンス
- 大量履歴（数千エントリー）でも数秒以内で処理完了
- メモリ使用量は最小限に抑制

### 4.2 互換性
- Node.js v16以上
- macOS, Linux, Windows対応
- Claude Code v1.0以降の履歴フォーマット対応

### 4.3 エラーハンドリング
- 履歴ファイルが存在しない場合の適切な処理
- 不正なJSONLファイルの処理
- 権限エラーの適切な表示

## 5. 開発・運用要件

### 5.1 開発環境
- TypeScript
- ESLint + Prettier
- Jest (テスト)
- GitHub Actions (CI/CD)

### 5.2 配布・公開
- npm パッケージとして公開
- GitHub でオープンソース公開
- 詳細なREADME、使用例の提供

### 5.3 メンテナンス
- Claude Code仕様変更への対応
- コミュニティからのフィードバック対応
- 定期的なセキュリティアップデート

## 6. 実装優先度

### Phase 1 (必須)
- 基本的な日報生成機能
- 今日の日報生成
- マークダウン出力

### Phase 2 (重要)
- 日付指定機能
- プロジェクト別フィルタリング
- 出力ファイル指定

### Phase 3 (拡張)
- 期間指定機能
- 複数出力フォーマット
- 作業時間集計

## 7. リスク・制約事項

### 7.1 技術リスク
- Claude Code履歴フォーマットの変更リスク
- 大量データ処理時のパフォーマンス問題
- 異なるOS間での互換性問題

### 7.2 制約事項
- Claude Code がインストールされている環境でのみ動作
- 履歴ファイルへの読み取り権限が必要
- 日本語・英語以外の言語での表示は考慮外

## 8. 成功指標

- npm での週間ダウンロード数: 100以上
- GitHub スター数: 50以上
- 主要なバグ報告: 月5件以下
- ユーザーからの機能要望: 月10件以上