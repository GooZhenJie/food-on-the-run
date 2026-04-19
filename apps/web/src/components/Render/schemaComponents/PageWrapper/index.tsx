import React from 'react';
import type { IPageWrapperProps } from './type';

export const PageWrapper: React.FC<IPageWrapperProps> = ({ children }) => {
  return <div className="page-wrapper">{children}</div>;
};
