import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'umi';
import {
  LeftOutlined,
  CheckCircleFilled,
  ClockCircleFilled,
  FireFilled,
  ShoppingOutlined,
  CarFilled,
  SmileFilled,
  CloseCircleFilled,
} from '@ant-design/icons';
import { App } from 'antd';
import { getOrderDetail } from '@/services/orders';
import type { IOrderDetailResponse } from '@/services/orders';

const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

const STATUS_ORDER = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];

const TIMELINE_STEPS = [
  { key: 'pending', label: 'Order placed', icon: <ClockCircleFilled /> },
  { key: 'confirmed', label: 'Confirmed', icon: <CheckCircleFilled /> },
  { key: 'preparing', label: 'Preparing', icon: <FireFilled /> },
  { key: 'ready', label: 'Ready for pickup', icon: <ShoppingOutlined /> },
  { key: 'picked_up', label: 'Picked up', icon: <CarFilled /> },
  { key: 'delivered', label: 'Delivered', icon: <SmileFilled /> },
];

const getStepState = (stepKey: string, currentStatus: string): 'completed' | 'active' | 'pending' => {
  const stepIdx = STATUS_ORDER.indexOf(stepKey);
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  if (stepIdx < currentIdx) return 'completed';
  if (stepIdx === currentIdx) return 'active';
  return 'pending';
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<IOrderDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await getOrderDetail(id!);
        if (!cancelled) setData(res);
      } catch (e) {
        if (!cancelled) message.error('Failed to load order');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [id, message]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-300 border-t-orange-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <span className="text-5xl mb-4">📦</span>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Order not found</h2>
        <Link to="/orders" className="bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-orange-600 transition-colors mt-4">
          View all orders
        </Link>
      </div>
    );
  }

  const { order, items } = data;
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/orders" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
            <LeftOutlined className="text-sm" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Order details</h1>
            <p className="text-[11px] text-gray-400 -mt-0.5">#{order.id}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">
        {/* Status timeline */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-5">Order status</h3>
          {isCancelled ? (
            <div className="flex items-center gap-3 p-4 bg-red-50 rounded-xl">
              <CloseCircleFilled className="text-xl text-red-500" />
              <p className="text-sm font-semibold text-red-700">Order cancelled</p>
            </div>
          ) : (
            <div className="relative">
              {TIMELINE_STEPS.map((step, idx) => {
                const state = getStepState(step.key, order.status);
                const isLast = idx === TIMELINE_STEPS.length - 1;
                return (
                  <div key={step.key} className="flex gap-3 relative">
                    {!isLast && (
                      <div className={`absolute left-[15px] top-[30px] w-0.5 h-[calc(100%-6px)] ${state === 'completed' ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                    )}
                    <div className={`relative z-10 w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 text-sm ${
                      state === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                      state === 'active' ? 'bg-orange-100 text-orange-600 ring-4 ring-orange-50' :
                      'bg-gray-100 text-gray-400'
                    }`}>
                      {step.icon}
                    </div>
                    <div className={isLast ? '' : 'pb-6'}>
                      <p className={`text-[14px] font-medium leading-[30px] ${
                        state === 'active' ? 'text-orange-600 font-semibold' :
                        state === 'completed' ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {step.label}
                        {state === 'active' && (
                          <span className="ml-2 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                            <span className="text-[11px] text-orange-500">Current</span>
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Items ordered</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-gray-100 rounded text-[11px] font-bold flex items-center justify-center text-gray-600">
                    {item.quantity}×
                  </span>
                  <span className="text-[14px] text-gray-700">{item.name}</span>
                </div>
                <span className="text-[14px] font-medium text-gray-800">
                  {formatPrice(item.price_amount * item.quantity)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment summary */}
        <div className="bg-white rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] p-5 space-y-3">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Payment summary</h3>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span className="text-gray-800 font-medium">{formatPrice(order.subtotal_amount)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Delivery fee</span>
            <span className="text-gray-800 font-medium">
              {order.delivery_fee_amount === 0 ? 'Free' : formatPrice(order.delivery_fee_amount)}
            </span>
          </div>
          <div className="pt-3 border-t border-gray-100 flex justify-between">
            <span className="font-bold text-gray-900">Total paid</span>
            <span className="font-bold text-lg text-gray-900">{formatPrice(order.total_amount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
