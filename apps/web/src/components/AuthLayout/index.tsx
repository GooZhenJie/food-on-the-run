import React from 'react';
import { Link } from 'umi';

interface IAuthLayoutProps {
  title: string;
  subtitle?: string;
  footerText: string;
  footerLinkText: string;
  footerLinkTo: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<IAuthLayoutProps> = ({
  title,
  subtitle,
  footerText,
  footerLinkText,
  footerLinkTo,
  children,
}) => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="px-6 py-5 sm:px-10 sm:py-6 flex items-center justify-between border-b border-gray-100">
        <Link to="/" className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-orange-500 text-white text-lg font-black">
            F
          </span>
          <span className="text-lg font-bold text-gray-900 tracking-tight">
            FoodRun
          </span>
        </Link>
        <Link
          to="/"
          className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
        >
          Need help?
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-10 sm:py-16">
        <div className="w-full max-w-[420px]">
          <div className="mb-8">
            <h1 className="text-[28px] sm:text-[32px] leading-tight font-bold text-gray-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[15px] text-gray-500 mt-2">{subtitle}</p>
            )}
          </div>

          {children}

          <p className="text-[14px] text-gray-600 mt-8 text-center">
            {footerText}{' '}
            <Link
              to={footerLinkTo}
              className="text-orange-600 font-semibold hover:text-orange-700"
            >
              {footerLinkText}
            </Link>
          </p>
        </div>
      </main>

      <footer className="px-6 py-5 border-t border-gray-100 text-center">
        <p className="text-xs text-gray-400">
          By continuing, you agree to our{' '}
          <a href="/terms" className="text-gray-500 hover:text-gray-700 underline">
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy" className="text-gray-500 hover:text-gray-700 underline">
            Privacy Policy
          </a>
          .
        </p>
      </footer>
    </div>
  );
};
