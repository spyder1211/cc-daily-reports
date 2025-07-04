# Claude Code Daily Report Generator

A CLI tool that automatically generates daily work reports from Claude Code usage history.

[![npm version](https://img.shields.io/npm/v/claude-daily-report.svg)](https://www.npmjs.com/package/claude-daily-report)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

- **📊 Automatic Report Generation**: Generate daily work reports from Claude Code usage history
- **🕒 Session-based Time Tracking**: Calculate work time based on session start/end times
- **📝 Message Counting**: Track the number of messages sent per project
- **📁 Project Filtering**: Generate reports for specific projects
- **📄 Multiple Output Formats**: Support for Markdown, JSON, and HTML outputs
- **🎨 Beautiful CLI Interface**: Colorful and intuitive command-line interface
- **⚡ Fast Performance**: Efficient parsing of large JSONL files

## 📦 Installation

Install the CLI globally using npm:

```bash
npm install -g claude-daily-report
```

### Prerequisites

- Node.js 16.0.0 or higher
- Claude Code installed and used (history files in `~/.claude/projects`)


## 🚀 Quick Start

### Basic Usage

```bash
# Generate today's report
claude-daily-report

# Generate report for specific date
claude-daily-report 2025-07-03
claude-daily-report --date 2025-07-03

# Show summary only
claude-daily-report --summary
```

### Project Management

```bash
# List available projects
claude-daily-report projects

# Generate report for specific project
claude-daily-report --project expense-checker
claude-daily-report -p claude-daily-reports
```

### Output Options

```bash
# Save to markdown file
claude-daily-report --output daily-report.md
claude-daily-report -o daily-report.md

# Generate JSON report
claude-daily-report --format json --output report.json

# Generate HTML report
claude-daily-report --format html --output report.html
```

## 📋 Command Reference

### Main Command

```bash
claude-daily-report [options] [date]
```

#### Arguments
- `date` - Target date in YYYY-MM-DD format (default: today)

#### Options
- `-d, --date <date>` - Specify target date (YYYY-MM-DD)
- `-p, --project <name>` - Filter by specific project name
- `-o, --output <file>` - Output file path
- `-f, --format <format>` - Output format: markdown, json, html (default: markdown)
- `-v, --verbose` - Show detailed information
- `-s, --summary` - Show summary only (no file output)
- `-h, --help` - Display help information

### Sub-commands

```bash
# List all available projects
claude-daily-report projects

# Show work summary
claude-daily-report summary [date]

# Display usage examples
claude-daily-report examples
```

## 📊 Report Format

### Markdown Output

```markdown
# Daily Report 2025-07-03

## Work Summary

- **Total Work Time**: 4h 1min
- **Projects Worked On**: 5 projects
- **Messages Sent**: 318 messages
- **Sessions**: 9 sessions

## Project Details

### expense-checker (/Users/spyder/c/table/expense-checker)

- **Work Time**: 1h 22min (14:21-14:47, 14:50-15:46)
- **Messages**: 156 messages
- **Sessions**: 4 sessions

### claude-daily-reports (/Users/spyder/personal/claude-daily-reports)

- **Work Time**: 30min (19:36-20:06)
- **Messages**: 114 messages
- **Sessions**: 1 session

## Timeline

- **14:21-14:47** expense-checker (25min, 56 messages)
- **19:36-20:06** claude-daily-reports (30min, 114 messages)
```

### JSON Output

```json
{
  "date": "2025-07-03",
  "projects": [
    {
      "name": "expense-checker",
      "path": "/Users/spyder/c/table/expense-checker",
      "totalDuration": 82,
      "totalMessages": 156,
      "sessions": [...]
    }
  ],
  "summary": {
    "totalDuration": 241,
    "totalMessages": 318,
    "projectCount": 5,
    "sessionCount": 9
  }
}
```

## 🏗️ Architecture

The tool consists of several key components:

- **Parser** (`parser.ts`): Analyzes Claude Code JSONL history files
- **Generator** (`generator.ts`): Creates reports in various formats
- **CLI** (`cli.ts`): Command-line interface with rich features
- **Utils** (`utils.ts`): Helper functions for date/time formatting and file operations

### Data Flow

1. **Discovery**: Scan `~/.claude/projects` for project directories
2. **Parsing**: Read and parse JSONL files for target date
3. **Analysis**: Extract user messages, calculate session times
4. **Generation**: Create formatted reports
5. **Output**: Display to console or save to file

## 🔧 Development

For development, clone the repository and install dependencies.

### Scripts

```bash
# Clone the repository
git clone https://github.com/spyder-team/claude-daily-reports.git
cd claude-daily-reports

# Install dependencies
npm install

# Build the project
npm run build

# Run in development mode (with TypeScript)
npm run dev -- [commands]

# Run built version
npm start

# Lint code
npm run lint

# Format code
npm run format

# Run tests
npm test
```

### Project Structure

```
src/
├── cli.ts           # CLI interface
├── index.ts         # Main application logic
├── parser.ts        # JSONL parsing functionality
├── generator.ts     # Report generation
├── types.ts         # TypeScript type definitions
└── utils.ts         # Utility functions
```

## 📝 Examples

### Daily Workflow

```bash
# Morning: Check yesterday's work
claude-daily-report summary $(date -d "yesterday" +%Y-%m-%d)

# End of day: Generate today's report
claude-daily-report --output today.md

# Weekly review: Generate reports for specific projects
claude-daily-report -p my-important-project -o weekly-update.md
```

### Integration with Other Tools

```bash
# Generate JSON for further processing
claude-daily-report --format json | jq '.summary'

# Create weekly reports
for i in {1..7}; do
  date=$(date -d "$i days ago" +%Y-%m-%d)
  claude-daily-report $date -o "reports/daily-$date.md"
done
```

## 🛠️ Configuration

### Environment Variables

- `CLAUDE_PROJECTS_PATH` - Custom path to Claude projects directory (default: `~/.claude/projects`)

### Customization

The tool automatically detects your Claude Code installation and project structure. No additional configuration is required for most users.

## 🐛 Troubleshooting

### Common Issues

**No projects found**
```bash
# Check if Claude Code has been used
ls ~/.claude/projects

# Verify project directory structure
claude-daily-report projects
```

**Permission errors**
```bash
# Ensure read access to Claude Code history
chmod -R 755 ~/.claude/projects
```

**Date parsing errors**
```bash
# Use YYYY-MM-DD format
claude-daily-report 2025-07-03  # ✅ Correct
claude-daily-report 07/03/2025  # ❌ Incorrect
```

### Debug Mode

```bash
# Enable verbose output for troubleshooting
claude-daily-report --verbose

# Check specific project
claude-daily-report -p project-name --verbose
```

## 🗺️ Roadmap

### Phase 1 (Completed)
- ✅ Basic daily report generation
- ✅ Project filtering
- ✅ Multiple output formats
- ✅ CLI interface

### Phase 2 (Planned)
- 📅 Date range reports
- 📈 Advanced analytics
- 🎛️ Custom templates
- 📊 Visualization charts

### Phase 3 (Future)
- 🌐 Web dashboard
- 📧 Email integration
- 🔔 Notifications
- 📱 Mobile app

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Commit your changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Commander.js](https://github.com/tj/commander.js/) for CLI functionality
- Uses [date-fns](https://date-fns.org/) for date manipulation
- Styled with [chalk](https://github.com/chalk/chalk) for terminal colors
- Inspired by the productivity needs of Claude Code users

## 📞 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/spyder-team/claude-daily-reports/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/spyder-team/claude-daily-reports/discussions)
- 📖 **Documentation**: [Wiki](https://github.com/spyder-team/claude-daily-reports/wiki)

---

**Made with ❤️ for the Claude Code community**
