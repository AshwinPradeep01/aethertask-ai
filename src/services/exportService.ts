import { Task } from '../types';

export class ExportService {
  /**
   * Export tasks as structured Markdown
   */
  static exportToMarkdown(tasks: Task[]): void {
    const lines: string[] = [];
    lines.push('# Aether Tasks Export');
    lines.push(`Exported on: ${new Date().toLocaleString()}`);
    lines.push(`Total Tasks: ${tasks.length}\n`);

    const statuses: { label: string; status: Task['status'] }[] = [
      { label: 'In Progress', status: 'in_progress' },
      { label: 'To Do', status: 'todo' },
      { label: 'Review', status: 'review' },
      { label: 'Completed', status: 'done' },
    ];

    statuses.forEach(({ label, status }) => {
      const group = tasks.filter((t) => t.status === status);
      if (group.length === 0) return;

      lines.push(`## ${label} (${group.length})`);
      group.forEach((task) => {
        const check = task.status === 'done' ? '[x]' : '[ ]';
        const priorityBadge = `[${task.priority.toUpperCase()}]`;
        const due = task.dueDate ? ` *(Due: ${task.dueDate})*` : '';
        lines.push(`- ${check} **${task.title}** ${priorityBadge}${due}`);
        if (task.description) {
          lines.push(`  > ${task.description.replace(/\n/g, ' ')}`);
        }
        if (task.subtasks.length > 0) {
          task.subtasks.forEach((st) => {
            const stCheck = st.completed ? '[x]' : '[ ]';
            lines.push(`    - ${stCheck} ${st.title}${st.estimatedMinutes ? ` (${st.estimatedMinutes}m)` : ''}`);
          });
        }
      });
      lines.push('');
    });

    this.downloadFile('aether-tasks.md', lines.join('\n'), 'text/markdown');
  }

  /**
   * Export tasks as JSON backup
   */
  static exportToJson(tasks: Task[]): void {
    const jsonStr = JSON.stringify(tasks, null, 2);
    this.downloadFile('aether-tasks-backup.json', jsonStr, 'application/json');
  }

  /**
   * Export tasks as standard iCalendar (.ics)
   */
  static exportToIcs(tasks: Task[]): void {
    const lines: string[] = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Aether Task AI//EN',
      'CALSCALE:GREGORIAN',
    ];

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      const dateFormatted = task.dueDate.replace(/-/g, '');
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${task.id}@aethertasks.local`);
      lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);
      lines.push(`DTSTART;VALUE=DATE:${dateFormatted}`);
      lines.push(`SUMMARY:${task.title}`);
      if (task.description) {
        lines.push(`DESCRIPTION:${task.description.replace(/\n/g, '\\n')}`);
      }
      lines.push(`STATUS:${task.status === 'done' ? 'COMPLETED' : 'CONFIRMED'}`);
      lines.push('END:VEVENT');
    });

    lines.push('END:VCALENDAR');
    this.downloadFile('aether-tasks.ics', lines.join('\r\n'), 'text/calendar');
  }

  private static downloadFile(filename: string, content: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
