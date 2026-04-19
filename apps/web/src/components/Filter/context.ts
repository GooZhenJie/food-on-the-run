import { createContext, useContext } from 'react';
import type { IFilterContextValue, IFilterVal } from './type';

export const DEFAULT_FILTER_VAL: IFilterVal = {
  cuisine: '',
  category: '',
  flavour: '',
  priceRange: '',
  freeDelivery: false,
  under30: false,
  highRating: false,
  promo: false,
  halal: false,
};

export const FilterContext = createContext<IFilterContextValue>({
  filterVal: DEFAULT_FILTER_VAL,
  setFilterVal: () => {},
  resetFilter: () => {},
});

export const useFilterVal = () => useContext(FilterContext);
