import { DailyReport, ProjectInfo, SessionInfo } from './types';
import { 
  formatTime, 
  formatDuration
} from './utils';

/**
 * 日報生成器
 */
export class ReportGenerator {
  
  /**
   * マークダウン形式で日報を生成
   */
  public generateMarkdown(report: DailyReport): string {
    const { date, projects, summary } = report;
    
    let markdown = '';
    
    // ヘッダー
    markdown += `# 日報 ${date}\n\n`;
    
    // サマリー
    markdown += `## 作業サマリー\n\n`;
    markdown += `- **総作業時間**: ${formatDuration(summary.totalDuration)}\n`;
    markdown += `- **作業プロジェクト数**: ${summary.projectCount}個\n`;
    markdown += `- **送信メッセージ数**: ${summary.totalMessages}件\n`;
    markdown += `- **セッション数**: ${summary.sessionCount}セッション\n\n`;
    
    if (projects.length === 0) {
      markdown += `今日は作業記録がありませんでした。\n\n`;
      return markdown;
    }
    
    // プロジェクト別作業内容
    markdown += `## プロジェクト別作業内容\n\n`;
    
    for (const project of projects) {
      markdown += this.generateProjectMarkdown(project);
    }
    
    // 作業時間詳細
    if (projects.length > 0) {
      markdown += `## 作業時間詳細\n\n`;
      markdown += this.generateTimelineMarkdown(projects);
    }
    
    return markdown;
  }
  
  /**
   * プロジェクト部分のマークダウンを生成
   */
  private generateProjectMarkdown(project: ProjectInfo): string {
    let markdown = '';
    
    markdown += `### ${project.name} (${project.path})\n\n`;
    markdown += `- **作業時間**: ${formatDuration(project.totalDuration)}`;
    
    if (project.sessions.length > 1) {
      const timeRanges = project.sessions.map(session => 
        `${formatTime(session.startTime)}-${formatTime(session.endTime)}`
      );
      markdown += ` (${timeRanges.join(', ')})`;
    } else if (project.sessions.length === 1) {
      const session = project.sessions[0];
      if (session) {
        markdown += ` (${formatTime(session.startTime)}-${formatTime(session.endTime)})`;
      }
    }
    
    markdown += `\n`;
    markdown += `- **メッセージ数**: ${project.totalMessages}件\n`;
    markdown += `- **セッション数**: ${project.sessions.length}セッション\n\n`;
    
    // セッション詳細
    if (project.sessions.length > 1) {
      markdown += `#### セッション詳細\n\n`;
      for (let i = 0; i < project.sessions.length; i++) {
        const session = project.sessions[i];
        if (session) {
          markdown += `**セッション${i + 1}** (${formatTime(session.startTime)}-${formatTime(session.endTime)})\n`;
          markdown += `- 時間: ${formatDuration(session.duration)}\n`;
          markdown += `- メッセージ: ${session.messageCount}件\n\n`;
        }
      }
    }
    
    return markdown;
  }
  
  /**
   * タイムライン部分のマークダウンを生成
   */
  private generateTimelineMarkdown(projects: ProjectInfo[]): string {
    let markdown = '';
    
    // 全セッションを時系列でソート
    const allSessions: Array<{ project: string, session: SessionInfo }> = [];
    
    for (const project of projects) {
      for (const session of project.sessions) {
        allSessions.push({ project: project.name, session });
      }
    }
    
    allSessions.sort((a, b) => a.session.startTime.getTime() - b.session.startTime.getTime());
    
    for (const { project, session } of allSessions) {
      const startTime = formatTime(session.startTime);
      const endTime = formatTime(session.endTime);
      const duration = formatDuration(session.duration);
      
      markdown += `- **${startTime}-${endTime}** ${project} (${duration}, ${session.messageCount}件)\n`;
    }
    
    markdown += `\n`;
    return markdown;
  }
  
  /**
   * JSON形式で日報を生成
   */
  public generateJson(report: DailyReport): string {
    return JSON.stringify(report, null, 2);
  }
  
  /**
   * HTML形式で日報を生成
   */
  public generateHtml(report: DailyReport): string {
    const { date, projects, summary } = report;
    
    let html = '';
    
    // HTMLヘッダー
    html += `<!DOCTYPE html>\n`;
    html += `<html lang="ja">\n`;
    html += `<head>\n`;
    html += `  <meta charset="UTF-8">\n`;
    html += `  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
    html += `  <title>日報 ${date}</title>\n`;
    html += `  <style>\n`;
    html += this.getHtmlStyles();
    html += `  </style>\n`;
    html += `</head>\n`;
    html += `<body>\n`;
    
    // ヘッダー
    html += `  <div class="container">\n`;
    html += `    <h1>日報 ${date}</h1>\n`;
    
    // サマリー
    html += `    <div class="summary">\n`;
    html += `      <h2>作業サマリー</h2>\n`;
    html += `      <ul>\n`;
    html += `        <li><strong>総作業時間</strong>: ${formatDuration(summary.totalDuration)}</li>\n`;
    html += `        <li><strong>作業プロジェクト数</strong>: ${summary.projectCount}個</li>\n`;
    html += `        <li><strong>送信メッセージ数</strong>: ${summary.totalMessages}件</li>\n`;
    html += `        <li><strong>セッション数</strong>: ${summary.sessionCount}セッション</li>\n`;
    html += `      </ul>\n`;
    html += `    </div>\n`;
    
    if (projects.length === 0) {
      html += `    <p>今日は作業記録がありませんでした。</p>\n`;
    } else {
      // プロジェクト別作業内容
      html += `    <div class="projects">\n`;
      html += `      <h2>プロジェクト別作業内容</h2>\n`;
      
      for (const project of projects) {
        html += this.generateProjectHtml(project);
      }
      
      html += `    </div>\n`;
      
      // 作業時間詳細
      html += `    <div class="timeline">\n`;
      html += `      <h2>作業時間詳細</h2>\n`;
      html += this.generateTimelineHtml(projects);
      html += `    </div>\n`;
    }
    
    html += `  </div>\n`;
    html += `</body>\n`;
    html += `</html>\n`;
    
    return html;
  }
  
  /**
   * プロジェクト部分のHTMLを生成
   */
  private generateProjectHtml(project: ProjectInfo): string {
    let html = '';
    
    html += `      <div class="project">\n`;
    html += `        <h3>${this.escapeHtml(project.name)} <span class="path">(${this.escapeHtml(project.path)})</span></h3>\n`;
    html += `        <ul>\n`;
    
    let timeRange = '';
    if (project.sessions.length > 1) {
      const timeRanges = project.sessions.map(session => 
        `${formatTime(session.startTime)}-${formatTime(session.endTime)}`
      );
      timeRange = ` (${timeRanges.join(', ')})`;
    } else if (project.sessions.length === 1) {
      const session = project.sessions[0];
      if (session) {
        timeRange = ` (${formatTime(session.startTime)}-${formatTime(session.endTime)})`;
      }
    }
    
    html += `          <li><strong>作業時間</strong>: ${formatDuration(project.totalDuration)}${timeRange}</li>\n`;
    html += `          <li><strong>メッセージ数</strong>: ${project.totalMessages}件</li>\n`;
    html += `          <li><strong>セッション数</strong>: ${project.sessions.length}セッション</li>\n`;
    html += `        </ul>\n`;
    
    // セッション詳細
    if (project.sessions.length > 1) {
      html += `        <h4>セッション詳細</h4>\n`;
      html += `        <ul class="sessions">\n`;
      for (let i = 0; i < project.sessions.length; i++) {
        const session = project.sessions[i];
        if (session) {
          html += `          <li>\n`;
          html += `            <strong>セッション${i + 1}</strong> (${formatTime(session.startTime)}-${formatTime(session.endTime)})<br>\n`;
          html += `            時間: ${formatDuration(session.duration)}, メッセージ: ${session.messageCount}件\n`;
          html += `          </li>\n`;
        }
      }
      html += `        </ul>\n`;
    }
    
    html += `      </div>\n`;
    
    return html;
  }
  
  /**
   * タイムライン部分のHTMLを生成
   */
  private generateTimelineHtml(projects: ProjectInfo[]): string {
    let html = '';
    
    // 全セッションを時系列でソート
    const allSessions: Array<{ project: string, session: SessionInfo }> = [];
    
    for (const project of projects) {
      for (const session of project.sessions) {
        allSessions.push({ project: project.name, session });
      }
    }
    
    allSessions.sort((a, b) => a.session.startTime.getTime() - b.session.startTime.getTime());
    
    html += `      <ul class="timeline-list">\n`;
    for (const { project, session } of allSessions) {
      const startTime = formatTime(session.startTime);
      const endTime = formatTime(session.endTime);
      const duration = formatDuration(session.duration);
      
      html += `        <li>\n`;
      html += `          <strong>${startTime}-${endTime}</strong> ${this.escapeHtml(project || '')} \n`;
      html += `          <span class="details">(${duration}, ${session.messageCount}件)</span>\n`;
      html += `        </li>\n`;
    }
    html += `      </ul>\n`;
    
    return html;
  }
  
  /**
   * HTMLエスケープ
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m] || m);
  }
  
  /**
   * HTMLスタイルを取得
   */
  private getHtmlStyles(): string {
    return `
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
      background-color: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
    }
    
    h2 {
      color: #34495e;
      border-bottom: 2px solid #ecf0f1;
      padding-bottom: 5px;
    }
    
    h3 {
      color: #2980b9;
    }
    
    h4 {
      color: #7f8c8d;
      margin-top: 20px;
    }
    
    .summary {
      background-color: #ecf0f1;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    
    .project {
      margin: 25px 0;
      padding: 20px;
      border-left: 4px solid #3498db;
      background-color: #f8f9fa;
    }
    
    .path {
      color: #7f8c8d;
      font-size: 0.9em;
      font-weight: normal;
    }
    
    .sessions {
      background-color: white;
      padding: 10px;
      border-radius: 3px;
    }
    
    .timeline {
      margin-top: 30px;
    }
    
    .timeline-list {
      list-style: none;
      padding: 0;
    }
    
    .timeline-list li {
      padding: 8px 0;
      border-bottom: 1px solid #ecf0f1;
    }
    
    .details {
      color: #7f8c8d;
      font-size: 0.9em;
    }
    
    ul {
      padding-left: 20px;
    }
    
    strong {
      color: #2c3e50;
    }
`;
  }
}