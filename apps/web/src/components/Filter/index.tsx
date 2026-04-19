import React from 'react';
import { List, AutoSizer } from 'react-virtualized';
import { FILTER_OPTIONS } from '@/mock/restaurants';
import { FilterContext, useFilterVal } from './context';
import { useFilter, useStickyFilter } from './hooks';
import type { IFilterOption } from './type';

interface IFilterProviderProps {
  children: React.ReactNode;
}

interface ISelectGroupProps {
  label: string;
  options: IFilterOption[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}

const SelectGroup: React.FC<ISelectGroupProps> = ({ label, options, value, onChange, disabled }) => {
  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <span className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:bg-gray-50 disabled:text-gray-400 cursor-pointer"
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
};

/** Virtualized option list — shows when cuisine has >3 options (demonstrates react-virtualized) */
const VirtualOptionList: React.FC<{ options: IFilterOption[]; selectedValue: string; onSelect: (v: string) => void }> = ({
  options,
  selectedValue,
  onSelect,
}) => {
  if (options.length <= 3) return null;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden" style={{ height: 120 }}>
      <AutoSizer disableHeight>
        {({ width }) => (
          <List
            width={width}
            height={120}
            rowCount={options.length}
            rowHeight={40}
            rowRenderer={({ index, key, style }) => {
              const opt = options[index];
              return (
                <div
                  key={key}
                  style={style}
                  onClick={() => onSelect(opt.value)}
                  className={`flex items-center px-3 text-sm cursor-pointer hover:bg-orange-50 transition-colors ${
                    selectedValue === opt.value ? 'bg-orange-100 text-orange-700 font-semibold' : 'text-gray-700'
                  }`}
                >
                  {opt.label}
                </div>
              );
            }}
          />
        )}
      </AutoSizer>
    </div>
  );
};

/**
 * Provides filter state context. Wrap any tree that reads/writes filter state.
 */
export const FilterProvider: React.FC<IFilterProviderProps> = ({ children }) => {
  const { filterVal, setFilterVal, resetFilter } = useFilter();
  return (
    <FilterContext.Provider value={{ filterVal, setFilterVal, resetFilter }}>
      {children}
    </FilterContext.Provider>
  );
};

/**
 * Select-based filter bar. Must be used inside <FilterProvider>.
 */
export const FilterBar: React.FC = () => {
  const { filterVal, setFilterVal, resetFilter } = useFilterVal();
  const { ref, sticky } = useStickyFilter();

  /** Cascaded category options based on selected cuisine */
  const categoryOptions =
    filterVal.cuisine && FILTER_OPTIONS.category[filterVal.cuisine]
      ? FILTER_OPTIONS.category[filterVal.cuisine]
      : [];

  const hasActiveFilter =
    filterVal.cuisine || filterVal.category || filterVal.flavour || filterVal.priceRange;

  return (
    <>
      <div
        ref={ref}
        className={`z-10 transition-shadow bg-white ${
          sticky ? 'fixed top-0 left-0 right-0 shadow-md px-6 py-3' : 'rounded-2xl border border-gray-100 shadow-sm p-4 mb-6'
        }`}
      >
        <div className="flex flex-wrap items-end gap-4">
          <SelectGroup
            label="Cuisine"
            options={FILTER_OPTIONS.cuisine}
            value={filterVal.cuisine}
            onChange={(v) => setFilterVal({ cuisine: v })}
          />
          <SelectGroup
            label="Category"
            options={categoryOptions}
            value={filterVal.category}
            onChange={(v) => setFilterVal({ category: v })}
            disabled={!filterVal.cuisine}
          />
          <SelectGroup
            label="Flavour"
            options={FILTER_OPTIONS.flavour}
            value={filterVal.flavour}
            onChange={(v) => setFilterVal({ flavour: v })}
          />
          <SelectGroup
            label="Price Range"
            options={FILTER_OPTIONS.priceRange}
            value={filterVal.priceRange}
            onChange={(v) => setFilterVal({ priceRange: v })}
          />
          {hasActiveFilter && (
            <button
              onClick={resetFilter}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors self-end pb-1.5"
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Demonstrates react-virtualized for large option lists */}
        {FILTER_OPTIONS.cuisine.length > 3 && (
          <div className="mt-3">
            <VirtualOptionList
              options={FILTER_OPTIONS.cuisine}
              selectedValue={filterVal.cuisine}
              onSelect={(v) => setFilterVal({ cuisine: v })}
            />
          </div>
        )}
      </div>

      {sticky && <div className="h-[72px]" />}
    </>
  );
};
