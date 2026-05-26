import React, { useState } from 'react';
import { Link, history } from 'umi';
import {
  LeftOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  CreditCardOutlined,
  CheckCircleFilled,
  LoadingOutlined,
  ShopOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { Button, Input, App } from 'antd';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { createOrder, payOrder } from '@/services/orders';

const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

type TPaymentState = 'idle' | 'processing' | 'success';

export default function CheckoutPage() {
  const { cart, itemCount, subtotal, clearCart } = useCart();
  const { isLoggedIn } = useAuth();
  const [note, setNote] = useState('');
  const [paymentState, setPaymentState] = useState<TPaymentState>('idle');
  const { message } = App.useApp();

  // Auth guard
  if (!isLoggedIn && paymentState === 'idle') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <LockOutlined className="text-3xl text-orange-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sign in to checkout</h2>
        <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
          You need to sign in before placing an order.
        </p>
        <Link
          to="/login"
          className="bg-orange-500 text-white font-semibold px-8 py-3 rounded-full hover:bg-orange-600 transition-colors text-[15px]"
        >
          Sign in
        </Link>
        <Link to="/cart" className="text-sm text-gray-400 mt-4 hover:text-gray-600">
          ← Back to cart
        </Link>
      </div>
    );
  }

  const deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    setPaymentState('processing');

    try {
      // Create order via API
      const order = await createOrder({
        restaurant_id: Number(cart.restaurantId),
        items: cart.items.map((item) => ({
          menu_item_id: Number(item.menuItemId),
          quantity: item.quantity,
        })),
        note: note || undefined,
      });

      // Simulate payment
      await payOrder(order.id);

      setPaymentState('success');
      message.success('Order placed successfully!');
      clearCart();

      setTimeout(() => {
        history.push('/orders');
      }, 2000);
    } catch (e) {
      setPaymentState('idle');
      const msg = e instanceof Error ? e.message : 'Failed to place order';
      message.error(msg);
    }
  };

  // Empty cart guard
  if (itemCount === 0 && paymentState !== 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <span className="text-5xl mb-4">🛒</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Nothing to checkout</h2>
        <p className="text-sm text-gray-500 mb-6">Add some items to your cart first.</p>
        <Link
          to="/"
          className="bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-orange-600 transition-colors"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  // Success state
  if (paymentState === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <div className="relative mb-8">
          <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center animate-[scale-in_0.4s_ease-out]">
            <CheckCircleFilled className="text-5xl text-emerald-500" />
          </div>
          {/* Pulse ring */}
          <div className="absolute inset-0 w-24 h-24 rounded-full bg-emerald-100 animate-ping opacity-20" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Order confirmed!</h2>
        <p className="text-sm text-gray-500 text-center max-w-xs mb-2">
          Your food is being prepared. We'll notify you when it's ready for pickup.
        </p>
        <p className="text-xs text-gray-400 mb-8">Redirecting to your orders...</p>
      </div>
    );
  }

  // Processing overlay
  if (paymentState === 'processing') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <LoadingOutlined className="text-3xl text-orange-500" spin />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Processing payment...</h2>
        <p className="text-sm text-gray-500">Please don't close this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            to="/cart"
            className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <LeftOutlined className="text-sm" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">Checkout</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Delivery info */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center shrink-0">
              <EnvironmentOutlined className="text-orange-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Deliver to</p>
              <p className="text-[14px] font-semibold text-gray-900 mt-0.5">Home</p>
              <p className="text-[13px] text-gray-500">
                12, Jalan PJS 8/4, Bandar Sunway, 46150 Petaling Jaya
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-3 border-t border-gray-100">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <ClockCircleOutlined className="text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Estimated time</p>
              <p className="text-[14px] font-semibold text-gray-900 mt-0.5">25 – 35 min</p>
            </div>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShopOutlined className="text-orange-500 text-sm" />
            <h3 className="text-sm font-bold text-gray-900">{cart.restaurantName}</h3>
          </div>
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div key={item.menuItemId} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-gray-100 rounded text-[11px] font-bold flex items-center justify-center text-gray-600">
                    {item.quantity}×
                  </span>
                  <span className="text-[14px] text-gray-700">{item.name}</span>
                </div>
                <span className="text-[14px] font-medium text-gray-800">
                  {formatPrice(item.priceAmount * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Note to restaurant</h3>
          <Input.TextArea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Extra sambal, no onion..."
            rows={2}
            className="!rounded-xl !border-gray-200"
            maxLength={200}
          />
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Payment method</h3>
          <div className="flex items-center gap-3 p-3 border border-orange-200 bg-orange-50/50 rounded-xl">
            <CreditCardOutlined className="text-lg text-orange-500" />
            <div className="flex-1">
              <p className="text-[14px] font-medium text-gray-900">Online payment</p>
              <p className="text-[12px] text-gray-500">Visa •••• 4242</p>
            </div>
            <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center">
              <CheckCircleFilled className="text-[10px] text-white" />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-800 font-medium">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery fee</span>
            <span className="text-emerald-600 font-medium">Free</span>
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-between">
            <span className="font-bold text-gray-900">Total</span>
            <span className="font-bold text-lg text-gray-900">{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      {/* Place Order CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-4 pb-safe md:pb-4 bg-white/90 backdrop-blur-sm border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <Button
            type="primary"
            size="large"
            block
            onClick={handlePlaceOrder}
            className="h-[52px] !rounded-2xl font-semibold text-[16px] shadow-[0_4px_16px_rgba(249,115,22,0.3)]"
          >
            Place order · {formatPrice(total)}
          </Button>
        </div>
      </div>
    </div>
  );
}
