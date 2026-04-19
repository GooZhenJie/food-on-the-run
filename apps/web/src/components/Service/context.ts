import { createContext, useContext } from 'react';
import type { IServiceContextValue } from './type';

export const ServiceContext = createContext<IServiceContextValue>({
  data: null,
  loading: false,
  error: null,
  refresh: () => {},
});

export const useServiceData = () => useContext(ServiceContext);
