import React from 'react';
import { AuthLayout } from '@/components/AuthLayout';
import type { IAuthPageProps } from './type';

export const AuthPage: React.FC<IAuthPageProps> = ({
  title = '',
  subtitle,
  footerText = '',
  footerLinkText = '',
  footerLinkTo = '/',
  children,
}) => {
  return (
    <AuthLayout
      title={title}
      subtitle={subtitle}
      footerText={footerText}
      footerLinkText={footerLinkText}
      footerLinkTo={footerLinkTo}
    >
      {children}
    </AuthLayout>
  );
};
