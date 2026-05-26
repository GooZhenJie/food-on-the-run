import React from 'react';
import { StarFilled } from '@ant-design/icons';
import { AsyncBoundary } from '@food/shared/components/AsyncBoundary';
import { useServiceData } from '@/components/Service/context';
import type { IReviewListProps, TReviewListData } from './type';

export const ReviewList: React.FC<IReviewListProps> = ({ title }) => {
  const { data } = useServiceData<TReviewListData>();
  const reviews = data ?? [];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
      <AsyncBoundary>
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">{review.author}</span>
                <span className="text-sm text-gray-400">{review.date}</span>
              </div>
              <div className="text-amber-500 text-sm mt-1 inline-flex items-center gap-0.5">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <StarFilled key={i} />
                ))}
              </div>
              <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
      </AsyncBoundary>
    </div>
  );
};
