import React from 'react';
import { useServiceData } from '@/components/Service/context';
import type { IReviewListProps, TReviewListData } from './type';

export const ReviewList: React.FC<IReviewListProps> = ({ title }) => {
  const { data, loading, error } = useServiceData();
  const reviews = (data as TReviewListData) || [];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading reviews...</div>
      ) : error ? (
        <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          Failed to load reviews: {error}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-gray-400 text-sm bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-6 text-center">
          No reviews yet
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gray-800">{review.author}</span>
                <span className="text-sm text-gray-400">{review.date}</span>
              </div>
              <div className="text-amber-500 text-sm mt-1">{'⭐'.repeat(review.rating)}</div>
              <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
