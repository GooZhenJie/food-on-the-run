import { REVIEWS } from '@/mock/restaurants';
import type { IComponentFixtures } from '../../preview/fixtures';
import type { TReviewListData } from './type';

const normal: TReviewListData = REVIEWS;

const heavy: TReviewListData = Array.from({ length: 80 }, (_, i) => ({
  id: `heavy-${i}`,
  author: `Reviewer ${i + 1}`,
  rating: (i % 5) + 1,
  comment:
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat((i % 3) + 1),
  date: `2026-04-${String((i % 28) + 1).padStart(2, '0')}`,
}));

const edge: TReviewListData = [
  {
    id: 'edge-long',
    author: 'AnonymousUserWithAVeryLongDisplayName'.repeat(2),
    rating: 5,
    comment:
      'This review contains 🔥 emojis, <script>alert(1)</script> injection attempts, ' +
      'and a really, really, really, really, really, really, really, really, really long body. '.repeat(6),
    date: '2026-04-19',
  },
  {
    id: 'edge-zero-rating',
    author: '',
    rating: 0,
    comment: '',
    date: '',
  },
  {
    id: 'edge-high-rating',
    author: 'Out Of Range',
    rating: 99,
    comment: 'Rating should never be > 5, checking renderer resilience.',
    date: '2026-04-18',
  },
];

export const reviewListFixtures: IComponentFixtures<TReviewListData> = {
  presets: {
    normal,
    empty: [],
    heavy,
    edge,
  },
  errorMessage: 'HTTP 500: review service unavailable',
};
