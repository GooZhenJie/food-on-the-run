import React from 'react';
import { history } from 'umi';
import { OAuthButtons } from '@/components/OAuthButtons';
import type { IOAuthSectionProps } from './type';

export const OAuthSection: React.FC<IOAuthSectionProps> = ({ redirect = '/' }) => {
  return <OAuthButtons onSuccess={() => history.push(redirect)} />;
};
