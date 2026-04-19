export interface IMenuGridProps {
  title?: string;
  api?: string;
  [key: string]: unknown;
}

/** MenuGrid consumes this data shape from Service — mocks must match. */
export interface IMenuGridItem {
  id: string;
  name: string;
  price: number;
  tag: string;
  image: string;
}

export type TMenuGridData = IMenuGridItem[];
