import type { ReactNode } from 'react';

export interface IDashboardPageProps {
  title?: string;
  subtitle?: string;
  /**
   * Audience hint shown as a chip in the header.
   * Typical values: "Merchant", "Admin", "Store manager".
   */
  audience?: string;
  /** Back link href; omit to hide. */
  backHref?: string;
  /** Back link label, defaults to "Home". */
  backLabel?: string;
  /** Whether to wrap children in a `<Refresh>` coordinator. Defaults to true. */
  withRefresh?: boolean;
  children?: ReactNode;
  [key: string]: unknown;
}
