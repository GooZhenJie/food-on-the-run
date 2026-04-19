import React from 'react';

interface IComponentUpdatingProps {
  name?: string;
}

export const ComponentUpdating: React.FC<IComponentUpdatingProps> = ({ name }) => {
  if (name && typeof window !== 'undefined') {
    // eslint-disable-next-line no-console
    console.warn(`[Render] Unknown component "${name}" — frontend code not released yet.`);
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-5 text-center">
      <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mb-4">
        <svg
          className="w-7 h-7 text-orange-500 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v3a5 5 0 00-5 5H4z"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-gray-900">
        This section is getting an upgrade
      </h3>
      <p className="text-[13px] text-gray-500 mt-1 max-w-[320px]">
        We&apos;re rolling out new content here. Please check back in a moment.
      </p>
    </div>
  );
};
