import type { IMockRequest, MockHandler } from './types';
import { getQueryInt, getQueryString, paginate, sortBy } from './types';

type OrderStatus =
  | 'created'
  | 'preparing'
  | 'delivering'
  | 'completed'
  | 'cancelled'
  | 'refunded';

type PaymentMethod = 'card' | 'wallet' | 'cash' | 'paynow';

interface AdminOrderItem {
  name: string;
  quantity: number;
  priceCents: number;
}

interface AdminOrderRecord {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  restaurantId: string;
  restaurantName: string;
  riderName: string | null;
  status: OrderStatus;
  items: AdminOrderItem[];
  subtotalCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  paymentMethod: PaymentMethod;
  deliveryAddress: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_POOL: OrderStatus[] = [
  'created',
  'preparing',
  'preparing',
  'delivering',
  'delivering',
  'completed',
  'completed',
  'completed',
  'cancelled',
];

const PAYMENT_POOL: PaymentMethod[] = ['card', 'card', 'wallet', 'paynow', 'cash'];

const CUSTOMER_FIRST = [
  'Sophia',
  'Liam',
  'Aisha',
  'Wei',
  'Rahul',
  'Maria',
  'Kenji',
  'Min-ji',
  'Aroon',
  'Siti',
  'Daniel',
  'Priya',
  'Hiro',
  'Chloe',
  'Arjun',
];
const CUSTOMER_LAST = [
  'Tan',
  'Lim',
  'Nguyen',
  'Raj',
  'Sato',
  'Park',
  'Chen',
  'Patel',
  'Wong',
  'Ahmad',
];

const RIDERS = [
  'Bryan K.',
  'Haziq M.',
  'Ravi S.',
  'Yuki T.',
  'Zoe L.',
  'Daniel W.',
  null,
];

const ITEM_POOL: AdminOrderItem[] = [
  { name: 'Chicken Rice', quantity: 1, priceCents: 680 },
  { name: 'Laksa', quantity: 1, priceCents: 820 },
  { name: 'Pad Thai', quantity: 2, priceCents: 960 },
  { name: 'Pho Bo', quantity: 1, priceCents: 980 },
  { name: 'Sushi Set', quantity: 1, priceCents: 1880 },
  { name: 'Bibimbap', quantity: 1, priceCents: 1280 },
  { name: 'Margherita Pizza', quantity: 1, priceCents: 1990 },
  { name: 'Beef Burger', quantity: 2, priceCents: 1290 },
  { name: 'Ice Lemon Tea', quantity: 1, priceCents: 280 },
  { name: 'Mango Sticky Rice', quantity: 1, priceCents: 620 },
];

const pick = <T>(arr: T[], i: number): T => arr[i % arr.length];

const seed = (): AdminOrderRecord[] => {
  const list: AdminOrderRecord[] = [];
  const now = Date.now();
  for (let i = 0; i < 80; i += 1) {
    const itemCount = 1 + (i % 3);
    const items: AdminOrderItem[] = [];
    for (let j = 0; j < itemCount; j += 1) {
      const base = pick(ITEM_POOL, i + j);
      items.push({ ...base, quantity: 1 + ((i + j) % 3) });
    }
    const subtotalCents = items.reduce(
      (acc, it) => acc + it.priceCents * it.quantity,
      0,
    );
    const deliveryFeeCents = 199 + (i % 5) * 50;
    const totalCents = subtotalCents + deliveryFeeCents;
    const firstName = pick(CUSTOMER_FIRST, i);
    const lastName = pick(CUSTOMER_LAST, i + 3);
    const restaurantIdx = 1000 + (i % 50);
    const createdAt = new Date(now - i * 1800000).toISOString();
    list.push({
      id: `o_${String(200000 + i).padStart(6, '0')}`,
      customerName: `${firstName} ${lastName}`,
      customerEmail: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mail.com`,
      customerPhone: `+65 9${String(20000000 + i * 73).slice(0, 7)}`,
      restaurantId: `r_${String(restaurantIdx).padStart(4, '0')}`,
      restaurantName: `Restaurant ${restaurantIdx - 999}`,
      riderName: pick(RIDERS, i + 2),
      status: pick(STATUS_POOL, i),
      items,
      subtotalCents,
      deliveryFeeCents,
      totalCents,
      paymentMethod: pick(PAYMENT_POOL, i),
      deliveryAddress: `${100 + i} Main Street, #0${i % 10}-${10 + (i % 89)}`,
      note: i % 5 === 0 ? 'Less spicy please' : '',
      createdAt,
      updatedAt: createdAt,
    });
  }
  return list;
};

const store: AdminOrderRecord[] = [];

const applyFilters = (
  items: AdminOrderRecord[],
  req: IMockRequest,
): AdminOrderRecord[] => {
  const keyword = (getQueryString(req.query, 'keyword') || '').toLowerCase();
  const status = getQueryString(req.query, 'status');
  const payment = getQueryString(req.query, 'payment');
  const from = getQueryString(req.query, 'from');
  const to = getQueryString(req.query, 'to');
  const restaurantId = getQueryString(req.query, 'restaurant_id');
  return items.filter((o) => {
    if (keyword) {
      const hay = `${o.id} ${o.customerName} ${o.customerEmail} ${o.restaurantName}`.toLowerCase();
      if (!hay.includes(keyword)) return false;
    }
    if (status && status !== 'all' && o.status !== status) return false;
    if (payment && payment !== 'all' && o.paymentMethod !== payment) return false;
    if (restaurantId && o.restaurantId !== restaurantId) return false;
    if (from && new Date(o.createdAt).getTime() < new Date(from).getTime()) {
      return false;
    }
    if (to && new Date(o.createdAt).getTime() > new Date(to).getTime()) {
      return false;
    }
    return true;
  });
};

const applySort = (
  items: AdminOrderRecord[],
  req: IMockRequest,
): AdminOrderRecord[] => {
  const field = getQueryString(req.query, 'sort_field') || 'createdAt';
  const orderRaw = getQueryString(req.query, 'sort_order');
  const order: 'asc' | 'desc' = orderRaw === 'asc' ? 'asc' : 'desc';
  switch (field) {
    case 'totalCents':
      return sortBy(items, (o) => o.totalCents, order);
    case 'customerName':
      return sortBy(items, (o) => o.customerName.toLowerCase(), order);
    case 'restaurantName':
      return sortBy(items, (o) => o.restaurantName.toLowerCase(), order);
    case 'status':
      return sortBy(items, (o) => o.status, order);
    case 'createdAt':
    default:
      return sortBy(items, (o) => new Date(o.createdAt), order);
  }
};

const list: MockHandler = (req, res) => {
  const filtered = applyFilters(store, req);
  const sorted = applySort(filtered, req);
  const page = getQueryInt(req.query, 'page', 1);
  const pageSize = getQueryInt(req.query, 'page_size', 20);
  return res.json(paginate(sorted, page, pageSize));
};

const exportAll: MockHandler = (req, res) => {
  const filtered = applyFilters(store, req);
  const sorted = applySort(filtered, req);
  return res.json({ items: sorted, total: sorted.length });
};

const metrics: MockHandler = (req, res) => {
  const filtered = applyFilters(store, req);
  const totalCents = filtered.reduce((acc, o) => acc + o.totalCents, 0);
  const byStatus = filtered.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1;
    return acc;
  }, {});
  return res.json({
    total_orders: filtered.length,
    gross_revenue_cents: totalCents,
    by_status: byStatus,
  });
};

const getOne: MockHandler = (req, res) => {
  const id = req.params.id;
  const found = store.find((o) => o.id === id);
  if (!found) return res.status(404).json({ error: 'Order not found' });
  return res.json(found);
};

const updateStatus: MockHandler = (req, res) => {
  const id = req.params.id;
  const body = (req.body || {}) as { status?: OrderStatus };
  if (!body.status) return res.status(400).json({ error: 'status is required' });
  const idx = store.findIndex((o) => o.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Order not found' });
  store[idx] = {
    ...store[idx],
    status: body.status,
    updatedAt: new Date().toISOString(),
  };
  return res.json(store[idx]);
};

const refund: MockHandler = (req, res) => {
  const id = req.params.id;
  const idx = store.findIndex((o) => o.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Order not found' });
  store[idx] = {
    ...store[idx],
    status: 'refunded',
    updatedAt: new Date().toISOString(),
  };
  return res.json(store[idx]);
};

const remove: MockHandler = (req, res) => {
  const id = req.params.id;
  const idx = store.findIndex((o) => o.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Order not found' });
  store.splice(idx, 1);
  return res.status(204).end();
};

const routes: Record<string, MockHandler> = {
  'GET /api/admin/orders': list,
  'GET /api/admin/orders/export': exportAll,
  'GET /api/admin/orders/metrics': metrics,
  'GET /api/admin/orders/:id': getOne,
  'POST /api/admin/orders/:id/status': updateStatus,
  'POST /api/admin/orders/:id/refund': refund,
  'DELETE /api/admin/orders/:id': remove,
};

export default routes;
