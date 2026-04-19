export interface IFilterVal {
  cuisine: string;
  category: string;
  flavour: string;
  priceRange: string;
  freeDelivery: boolean;
  under30: boolean;
  highRating: boolean;
  promo: boolean;
  halal: boolean;
}

export interface IFilterContextValue {
  filterVal: IFilterVal;
  setFilterVal: (val: Partial<IFilterVal>) => void;
  resetFilter: () => void;
}

export interface IFilterOption {
  value: string;
  label: string;
}
