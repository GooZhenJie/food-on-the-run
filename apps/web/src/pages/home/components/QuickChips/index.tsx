import React from 'react';
import {
  RocketOutlined,
  ThunderboltOutlined,
  StarFilled,
  TagOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { useFilterVal } from '@/components/Filter/context';
import type { IFilterVal } from '@/components/Filter/type';

type TChipKey = 'freeDelivery' | 'under30' | 'highRating' | 'promo' | 'halal';

interface IChipDef {
  key: TChipKey;
  label: string;
  icon: React.ReactNode;
}

const CHIPS: IChipDef[] = [
  { key: 'freeDelivery', label: 'Free delivery', icon: <RocketOutlined /> },
  { key: 'under30', label: 'Under 30 min', icon: <ThunderboltOutlined /> },
  { key: 'highRating', label: '4.5+ rated', icon: <StarFilled /> },
  { key: 'promo', label: 'Promo', icon: <TagOutlined /> },
  { key: 'halal', label: 'Halal', icon: <SafetyCertificateOutlined /> },
];

export const QuickChips: React.FC = () => {
  const { filterVal, setFilterVal } = useFilterVal();

  const handleToggle = (key: TChipKey) => {
    setFilterVal({ [key]: !filterVal[key] } as Partial<IFilterVal>);
    const el = document.getElementById('all-restaurants');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="-mx-4 sm:mx-0 overflow-x-auto no-scrollbar">
      <div className="flex gap-2 px-4 sm:px-0 min-w-max">
        {CHIPS.map((chip) => {
          const active = filterVal[chip.key];
          return (
            <button
              key={chip.key}
              type="button"
              onClick={() => handleToggle(chip.key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium transition-all shrink-0 ${
                active
                  ? 'bg-orange-500 text-white shadow-sm'
                  : 'bg-white text-gray-700 border border-gray-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              <span>{chip.icon}</span>
              <span>{chip.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
