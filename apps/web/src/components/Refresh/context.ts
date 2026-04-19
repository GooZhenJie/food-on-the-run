import { createContext, useContext } from 'react';

export interface IRefreshContextValue {
  register: (key: string, fetcher: () => void) => void;
  unregister: (key: string) => void;
  reportSuccess: (key: string) => void;
  reportFailure: (key: string) => void;
  triggerRefreshAll: () => void;
}

const noop = () => {};

export const RefreshContext = createContext<IRefreshContextValue>({
  register: noop,
  unregister: noop,
  reportSuccess: noop,
  reportFailure: noop,
  triggerRefreshAll: noop,
});

export const useRefreshRegister = (key: string) => {
  const ctx = useContext(RefreshContext);
  return {
    register: ctx.register,
    unregister: ctx.unregister,
    reportSuccess: ctx.reportSuccess,
    reportFailure: ctx.reportFailure,
    key,
  };
};

export const useRefresh = () => useContext(RefreshContext);
