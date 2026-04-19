import type { IDiffLine, IDiffSummary } from './type';

/**
 * Line-level LCS diff between two strings.
 * Returns a flat list of same/add/del lines suitable for unified rendering.
 */
export function diffTextLines(before: string, after: string): IDiffLine[] {
  const a = before.length ? before.split('\n') : [];
  const b = after.length ? after.split('\n') : [];
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] =
        a[i] === b[j]
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const result: IDiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      result.push({ type: 'same', text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ type: 'del', text: a[i] });
      i++;
    } else {
      result.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < m) result.push({ type: 'del', text: a[i++] });
  while (j < n) result.push({ type: 'add', text: b[j++] });
  return result;
}

/**
 * Aggregate counts of added / removed / unchanged lines.
 */
export function summarizeDiff(lines: IDiffLine[]): IDiffSummary {
  let added = 0;
  let removed = 0;
  let same = 0;
  for (const line of lines) {
    if (line.type === 'add') added++;
    else if (line.type === 'del') removed++;
    else same++;
  }
  return { added, removed, same };
}

/**
 * Pretty-print a JSON value with a stable 2-space indent.
 * Returns an empty string for null / undefined input.
 */
export function stringifyJson(value: unknown): string {
  if (value === null || value === undefined) return '';
  return JSON.stringify(value, null, 2);
}
