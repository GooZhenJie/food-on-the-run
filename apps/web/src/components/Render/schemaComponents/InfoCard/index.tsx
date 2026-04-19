import React from 'react';
import type { IInfoCardProps } from './type';

export const InfoCard: React.FC<IInfoCardProps> = ({ openingHours, phone, address }) => {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Restaurant Info</h2>
      <div className="flex flex-col gap-3 text-sm text-gray-700">
        <div className="flex items-center gap-3">
          <span className="text-lg">🕐</span>
          <div>
            <div className="text-gray-400 text-xs">Opening Hours</div>
            <div className="font-medium">{openingHours}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg">📞</span>
          <div>
            <div className="text-gray-400 text-xs">Phone</div>
            <div className="font-medium">{phone}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg">📍</span>
          <div>
            <div className="text-gray-400 text-xs">Address</div>
            <div className="font-medium">{address}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
