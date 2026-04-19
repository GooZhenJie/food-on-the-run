export interface IServiceContextValue {
  data: unknown;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export interface IServiceProps {
  api: string;
  /** Re-fetch when any value in this array changes */
  deps?: unknown[];
  /** Polling interval in milliseconds. Omit to disable polling. */
  interval?: number;
  /** Return false to abort the request */
  beforeRequest?: () => boolean;
  /** Transform the raw response before storing */
  formatData?: (raw: unknown) => unknown;
  children: React.ReactNode;
}
