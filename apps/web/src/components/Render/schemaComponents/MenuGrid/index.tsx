import React from 'react';
import { useServiceData } from '@/components/Service/context';
import type { IMenuGridProps, TMenuGridData } from './type';

export const MenuGrid: React.FC<IMenuGridProps> = ({ title }) => {
  const { data, loading, error } = useServiceData();
  const items = (data as TMenuGridData) || [];

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{title}</h2>
      {loading ? (
        <div className="text-gray-400 text-sm">Loading menu...</div>
      ) : error ? (
        <div className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          Failed to load menu: {error}
        </div>
      ) : items.length === 0 ? (
        <div className="text-gray-400 text-sm bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-6 text-center">
          No menu items yet
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <img src={item.image} alt={item.name} className="w-full h-32 object-cover" />
              <div className="p-3">
                <div className="flex items-start justify-between gap-1">
                  <span className="text-sm font-semibold text-gray-800">{item.name}</span>
                  {item.tag && (
                    <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 whitespace-nowrap">{item.tag}</span>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-amber-600 font-bold">RM {item.price.toFixed(2)}</span>
                  <button className="text-xs bg-amber-500 text-white rounded-full px-3 py-1 hover:bg-amber-600 transition-colors">
                    Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
