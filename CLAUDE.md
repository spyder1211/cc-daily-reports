# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a CLI tool that generates daily reports from Claude Code usage history. The tool analyzes JSONL files from `~/.claude/projects` and creates markdown reports of daily work activities.

## Architecture

Based on the requirements document, this project will be structured as:

- **Language**: TypeScript
- **Runtime**: Node.js (v16+)
- **CLI Framework**: Commander.js
- **Date Processing**: date-fns
- **Output Styling**: chalk

### Planned File Structure
```
src/
├── cli.ts           # CLI entry point
├── index.ts         # Main processing logic
├── parser.ts        # JSONL parsing from Claude Code history
├── generator.ts     # Daily report generation
├── types.ts         # TypeScript type definitions
└── utils.ts         # Utility functions
```

## Key Data Structures

### Claude Code History Entry
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

### Daily Report Structure
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
```

## Commands

### Core CLI Commands
```bash
# Generate today's report
claude-daily-report

# Generate report for specific date
claude-daily-report --date 2025-07-03
claude-daily-report -d 2025-07-03

# Generate report for date range
claude-daily-report --from 2025-07-01 --to 2025-07-03

# Filter by project
claude-daily-report --project "project-name"

# Specify output file
claude-daily-report --output report.md
claude-daily-report -o report.md
```

### Development Commands
Once implemented, the following commands will be available:

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run linting
npm run lint

# Format code
npm run format
```

## Development Setup

1. The project targets Node.js v16+ compatibility
2. Uses ESLint + Prettier for code quality
3. Jest for testing
4. GitHub Actions for CI/CD
5. Will be published as npm package

## Data Source

The tool reads Claude Code history from:
- `~/.claude/projects/` directory
- Each project has a `.jsonl` file containing conversation history
- Extracts user messages with timestamps and project context

## Output Format

Generates markdown reports with:
- Daily work summary (total hours, projects, tasks)
- Project-based work breakdown with timestamps
- Time-based activity timeline
- Support for multiple output formats (markdown, JSON, HTML)