import { useEffect, useRef, useState } from 'react';
import { FILTER_OPTIONS } from '@/mock/restaurants';
import { DEFAULT_FILTER_VAL } from './context';
import type { IFilterVal } from './type';

const STORAGE_KEY = '__fotr_filter_scheme__';

export const useFilter = () => {
  const saved = (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_FILTER_VAL;
      // Merge with defaults so older stored schemas pick up new fields
      return { ...DEFAULT_FILTER_VAL, ...(JSON.parse(raw) as Partial<IFilterVal>) };
    } catch {
      return DEFAULT_FILTER_VAL;
    }
  })();

  const [filterVal, setFilterValRaw] = useState<IFilterVal>(saved);

  const setFilterVal = (partial: Partial<IFilterVal>) => {
    setFilterValRaw((prev) => {
      const next = { ...prev, ...partial };
      // Reset category when cuisine changes
      if (partial.cuisine !== undefined && partial.cuisine !== prev.cuisine) {
        next.category = '';
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const resetFilter = () => {
    localStorage.removeItem(STORAGE_KEY);
    setFilterValRaw(DEFAULT_FILTER_VAL);
  };

  /** Cascaded category options based on selected cuisine */
  const categoryOptions =
    filterVal.cuisine && FILTER_OPTIONS.category[filterVal.cuisine]
      ? FILTER_OPTIONS.category[filterVal.cuisine]
      : [];

  return { filterVal, setFilterVal, resetFilter, categoryOptions };
};

/** Makes the filter bar stick to the top on scroll */
export const useStickyFilter = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [sticky, setSticky] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const threshold = el.getBoundingClientRect().top + window.scrollY;

    const handleScroll = () => {
      setSticky(window.scrollY > threshold);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { ref, sticky };
};
