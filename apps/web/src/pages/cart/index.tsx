import React from 'react';
import { Link, history } from 'umi';
import {
  LeftOutlined,
  DeleteOutlined,
  MinusOutlined,
  PlusOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { Button, App } from 'antd';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

export default function CartPage() {
  const { cart, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const { modal } = App.useApp();

  const deliveryFee = 0; // Free delivery for demo
  const total = subtotal + deliveryFee;

  const handleClear = () => {
    modal.confirm({
      title: 'Clear your cart?',
      content: 'All items will be removed.',
      okText: 'Clear',
      okButtonProps: { danger: true },
      cancelText: 'Keep',
      onOk: clearCart,
    });
  };

  // Empty state
  if (itemCount === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <ShopOutlined className="text-4xl text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
        <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
          Explore restaurants and add your favourite dishes to get started.
        </p>
        <Link
          to="/"
          className="bg-orange-500 text-white font-semibold px-8 py-3 rounded-full hover:bg-orange-600 transition-colors text-[15px]"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-48">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            to="/"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LeftOutlined className="text-sm" />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-900">Your cart</h1>
          </div>
          <button
            onClick={handleClear}
            className="text-sm text-gray-400 hover:text-rose-500 transition-colors"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Restaurant info */}
        <div className="flex items-center gap-2 px-1">
          <ShopOutlined className="text-orange-500" />
          <span className="text-sm font-medium text-gray-700">{cart.restaurantName}</span>
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] divide-y divide-gray-50">
          {cart.items.map((item) => (
            <div key={item.menuItemId} className="flex gap-3 p-4">
              {/* Image */}
              <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-[14px] font-semibold text-gray-900 truncate">{item.name}</h4>
                <p className="text-[14px] font-bold text-gray-800 mt-1">
                  {formatPrice(item.priceAmount * item.quantity)}
                </p>

                {/* Quantity controls */}
                <div className="flex items-center gap-0 mt-2">
                  {item.quantity === 1 ? (
                    <button
                      onClick={() => removeItem(item.menuItemId)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:border-rose-300 transition-colors"
                    >
                      <DeleteOutlined className="text-xs" />
                    </button>
                  ) : (
                    <button
                      onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                      className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange-300 transition-colors"
                    >
                      <MinusOutlined className="text-[10px]" />
                    </button>
                  )}
                  <span className="w-8 text-center text-sm font-semibold text-gray-900">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    className="w-7 h-7 rounded-full border border-orange-300 bg-orange-50 flex items-center justify-center text-orange-600 hover:bg-orange-100 transition-colors"
                  >
                    <PlusOutlined className="text-[10px]" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Order summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal ({itemCount} items)</span>
            <span className="text-gray-800 font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery fee</span>
            <span className="text-emerald-600 font-medium">
              {deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}
            </span>
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-lg text-gray-900">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Checkout CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe md:pb-4 bg-white/90 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          {isLoggedIn ? (
            <Button
              type="primary"
              size="large"
              block
              onClick={() => history.push('/checkout')}
              className="h-[52px] !rounded-2xl font-semibold text-[16px] shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
            >
              Checkout · {formatPrice(total)}
            </Button>
          ) : (
            <Button
              type="primary"
              size="large"
              block
              onClick={() => history.push('/login')}
              className="h-[52px] !rounded-2xl font-semibold text-[16px] shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
            >
              Sign in to checkout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
