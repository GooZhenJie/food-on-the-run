import React, { useState } from 'react';
import { Input, App } from 'antd';
import { SearchOutlined, EnvironmentFilled, ShoppingCartOutlined } from '@ant-design/icons';

interface ILocationBarProps {
  address?: string;
  cartCount?: number;
}

export const LocationBar: React.FC<ILocationBarProps> = ({
  address = 'Bukit Bintang, Kuala Lumpur',
  cartCount = 0,
}) => {
  const [query, setQuery] = useState('');
  const { message } = App.useApp();

  const handleChangeAddress = () => {
    message.info('Address picker coming soon');
  };

  const handleOpenCart = () => {
    message.info(cartCount ? `You have ${cartCount} items in cart` : 'Your cart is empty');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleChangeAddress}
          className="flex items-center gap-2 min-w-0 flex-1 sm:flex-none text-left hover:opacity-80 transition-opacity"
        >
          <span className="w-9 h-9 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <EnvironmentFilled />
          </span>
          <span className="min-w-0">
            <span className="block text-[11px] uppercase tracking-wider text-gray-400 font-medium">
              Deliver to
            </span>
            <span className="block text-sm font-semibold text-gray-900 truncate">
              {address} <span className="text-orange-500">▾</span>
            </span>
          </span>
        </button>
        <div className="flex-1 hidden sm:block">
          <Input
            size="large"
            prefix={<SearchOutlined className="text-gray-400" />}
            placeholder="Search restaurants or dishes"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleOpenCart}
          className="relative w-11 h-11 rounded-full bg-gray-50 hover:bg-gray-100 text-gray-700 flex items-center justify-center transition-colors shrink-0"
          aria-label="Open cart"
        >
          <ShoppingCartOutlined className="text-xl" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] px-1 rounded-full bg-orange-500 text-white text-[11px] font-bold flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </button>
      </div>
      <div className="mt-3 sm:hidden">
        <Input
          size="large"
          prefix={<SearchOutlined className="text-gray-400" />}
          placeholder="Search restaurants or dishes"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </div>
  );
};
