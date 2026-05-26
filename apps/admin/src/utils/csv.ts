export type CsvCell = string | number | boolean | null | undefined;

export interface CsvColumn<T> {
  header: string;
  accessor: (row: T) => CsvCell;
}

const escapeCell = (value: CsvCell): string => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const toCsv = <T>(rows: T[], columns: CsvColumn<T>[]): string => {
  const header = columns.map((c) => escapeCell(c.header)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCell(c.accessor(row))).join(','))
    .join('\n');
  return `${header}\n${body}`;
};

export const downloadCsv = <T>(
  filename: string,
  rows: T[],
  columns: CsvColumn<T>[],
): void => {
  const csv = toCsv(rows, columns);
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  link.download = filename.endsWith('.csv')
    ? filename
    : `${filename}-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
