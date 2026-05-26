import React, { useEffect, useState } from 'react';
import { Link } from 'umi';
import { LeftOutlined, RightOutlined, ShopOutlined } from '@ant-design/icons';
import { App } from 'antd';
import { listMyOrders } from '@/services/orders';
import type { IOrderRow } from '@/services/orders';

const formatPrice = (cents: number) => `RM ${(cents / 100).toFixed(2)}`;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-50' },
  preparing: { label: 'Preparing', color: 'text-violet-700', bg: 'bg-violet-50' },
  ready: { label: 'Ready', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  picked_up: { label: 'Picked up', color: 'text-teal-700', bg: 'bg-teal-50' },
  delivered: { label: 'Delivered', color: 'text-green-700', bg: 'bg-green-50' },
  cancelled: { label: 'Cancelled', color: 'text-gray-700', bg: 'bg-gray-100' },
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.color} ${cfg.bg}`}>
      {cfg.label}
    </span>
  );
};

const OrderCard: React.FC<{ order: IOrderRow }> = ({ order }) => {
  const isActive = ['pending', 'confirmed', 'preparing', 'ready'].includes(order.status);

  return (
    <Link
      to={`/order-detail/${order.id}`}
      className={`block bg-white rounded-2xl p-4 shadow-[0_2px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow ${
        isActive ? 'ring-2 ring-orange-100' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[14px] font-semibold text-gray-900 truncate">
              {order.restaurant_name || `Restaurant #${order.restaurant_id}`}
            </h3>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-[12px] text-gray-400 mt-1">
            {new Date(order.created_at).toLocaleDateString('en-MY', {
              day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-[13px] text-gray-500">Order #{order.id}</p>
            <p className="text-[14px] font-bold text-gray-900">{formatPrice(order.total_amount)}</p>
          </div>
        </div>
        <RightOutlined className="text-[10px] text-gray-300 mt-1.5 shrink-0" />
      </div>

      {isActive && (
        <div className="mt-3 pt-3 border-t border-gray-50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-[12px] text-orange-600 font-medium">Order in progress</span>
          </div>
        </div>
      )}
    </Link>
  );
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<IOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const { message } = App.useApp();

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const data = await listMyOrders();
        if (!cancelled) setOrders(data);
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : 'Failed to load orders';
          message.error(msg);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    return () => { cancelled = true; };
  }, [message]);

  const activeOrders = orders.filter((o) => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));
  const pastOrders = orders.filter((o) => !['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors">
            <LeftOutlined className="text-sm" />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">My orders</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <ShopOutlined className="text-5xl mb-3" />
            <p className="text-sm font-medium text-gray-600 mb-1">No orders yet</p>
            <p className="text-xs text-gray-400 mb-6">Your order history will appear here.</p>
            <Link to="/" className="bg-orange-500 text-white font-semibold px-6 py-2.5 rounded-full hover:bg-orange-600 transition-colors text-sm">
              Start ordering
            </Link>
          </div>
        ) : (
          <>
            {activeOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-900 mb-3 px-1">Active orders</h2>
                <div className="space-y-3">{activeOrders.map((o) => <OrderCard key={o.id} order={o} />)}</div>
              </section>
            )}
            {pastOrders.length > 0 && (
              <section>
                <h2 className="text-sm font-bold text-gray-900 mb-3 px-1">Past orders</h2>
                <div className="space-y-3">{pastOrders.map((o) => <OrderCard key={o.id} order={o} />)}</div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
