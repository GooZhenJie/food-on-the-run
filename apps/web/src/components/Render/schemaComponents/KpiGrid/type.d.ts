export type TKpiDirection = 'up' | 'down' | 'flat';

/**
 * A single KPI tile. `direction` is optional — when omitted the trend string
 * is rendered in neutral gray. When supplied it colours the trend (up→green,
 * down→red for "bad-when-up" metrics, flat→gray). `invertColor` flips the
 * semantics for metrics where "up is bad" (e.g. cancellation rate).
 */
export interface IKpiItem {
  label: string;
  value: number | string;
  unit?: string;
  trend?: string;
  direction?: TKpiDirection;
  invertColor?: boolean;
  /** Optional contextual note under the trend. */
  note?: string;
}

export type TKpiGridData = IKpiItem[];

export interface IKpiGridProps {
  api?: string;
  /** Columns on lg+. Defaults to 4. */
  cols?: 2 | 3 | 4;
  [key: string]: unknown;
}
