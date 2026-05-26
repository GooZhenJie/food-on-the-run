import React from 'react';
import { Link } from 'umi';
import { ShoppingCartOutlined } from '@ant-design/icons';
import { useCart } from '@/contexts/CartContext';

const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

export const CartBar: React.FC = () => {
  const { itemCount, subtotal } = useCart();

  if (itemCount === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe md:pb-4">
      <Link
        to="/cart"
        className="flex items-center justify-between w-full max-w-lg mx-auto bg-orange-500 hover:bg-orange-600 text-white rounded-2xl px-5 py-3.5 shadow-[0_8px_32px_rgba(249,115,22,0.35)] transition-all active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCartOutlined className="text-xl" />
            <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 bg-white text-orange-600 text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] leading-none">
              {itemCount}
            </span>
          </div>
          <span className="font-semibold text-[15px]">View cart</span>
        </div>
        <span className="font-bold text-[15px]">{formatPrice(subtotal)}</span>
      </Link>
    </div>
  );
};
