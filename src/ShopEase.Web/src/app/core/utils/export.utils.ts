export interface ReportData {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  summary?: Record<string, number>;
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function exportToCSV(headers: string[], rows: (string | number)[][], filename = 'export.csv'): void {
  let csv = headers.join(',') + '\n';
  rows.forEach((row) => {
    csv += row.map((cell) => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(',') + '\n';
  });
  downloadFile(csv, filename, 'text/csv');
}

export function exportToText(title: string, headers: string[], rows: (string | number)[][], filename = 'export.txt'): void {
  let txt = `${title}\n${'='.repeat(title.length)}\nGenerated: ${new Date().toLocaleString()}\n\n`;
  const widths = headers.map((h, i) => {
    const maxDataWidth = rows.reduce((max, row) => Math.max(max, (row[i] ?? '').toString().length), 0);
    return Math.max(h.length, maxDataWidth) + 2;
  });
  txt += headers.map((h, i) => h.padEnd(widths[i])).join('|') + '\n';
  txt += widths.map((w) => '-'.repeat(w)).join('+') + '\n';
  rows.forEach((row) => {
    txt += row.map((cell, i) => (cell ?? '').toString().padEnd(widths[i])).join('|') + '\n';
  });
  txt += `\nTotal Records: ${rows.length}`;
  downloadFile(txt, filename, 'text/plain');
}
