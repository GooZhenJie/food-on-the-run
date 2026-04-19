export interface IReviewListProps {
  title?: string;
  api?: string;
  [key: string]: unknown;
}

/** ReviewList consumes this data shape from Service — mocks must match. */
export interface IReviewItem {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export type TReviewListData = IReviewItem[];
