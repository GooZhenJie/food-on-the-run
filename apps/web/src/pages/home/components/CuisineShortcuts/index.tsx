import React from 'react';
import { useFilterVal } from '@/components/Filter/context';
import type { ICuisineShortcut } from '@/services/type';

interface ICuisineShortcutsProps {
  cuisines: ICuisineShortcut[];
  loading?: boolean;
}

export const CuisineShortcuts: React.FC<ICuisineShortcutsProps> = ({ cuisines, loading }) => {
  const { filterVal, setFilterVal } = useFilterVal();

  const handleSelect = (value: string) => {
    setFilterVal({ cuisine: filterVal.cuisine === value ? '' : value });
    const el = document.getElementById('all-restaurants');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100 animate-pulse" />
            <div className="w-12 h-3 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
      {cuisines.map((c) => {
        const isActive = filterVal.cuisine === c.value;
        return (
          <button
            key={c.value}
            type="button"
            onClick={() => handleSelect(c.value)}
            className="flex flex-col items-center gap-2 group"
          >
            <span
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-base sm:text-lg font-bold tracking-wide transition-all ${
                isActive
                  ? 'ring-2 ring-orange-500 ring-offset-2 scale-105'
                  : 'group-hover:scale-105'
              } ${c.color}`}
            >
              {c.icon}
            </span>
            <span
              className={`text-[12px] sm:text-[13px] font-medium truncate max-w-full ${
                isActive ? 'text-orange-600' : 'text-gray-700'
              }`}
            >
              {c.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
