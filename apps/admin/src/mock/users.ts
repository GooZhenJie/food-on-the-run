import type { IMockRequest, MockHandler } from './types';
import { getQueryInt, getQueryString, paginate, sortBy } from './types';

type AdminUserRole = 'customer' | 'rider' | 'merchant' | 'admin';
type AdminUserStatus = 'active' | 'banned';

interface AdminUserRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminUserRole;
  status: AdminUserStatus;
  orders_count: number;
  lifetime_spend_cents: number;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

const ROLE_POOL: AdminUserRole[] = [
  'customer',
  'customer',
  'customer',
  'customer',
  'customer',
  'rider',
  'rider',
  'merchant',
  'merchant',
  'admin',
];

const FIRST = [
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
  'Nadia',
  'Ethan',
  'Olivia',
  'Kabir',
  'Zara',
];
const LAST = [
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
  'Garcia',
  'Silva',
  'Huang',
  'Oh',
  'Khan',
];

const seed = (): AdminUserRecord[] => {
  const now = Date.now();
  const list: AdminUserRecord[] = [];

  list.push({
    id: '1',
    name: 'Super Admin',
    email: 'admin@fotr.com',
    phone: '+65 90000000',
    role: 'admin',
    status: 'active',
    orders_count: 0,
    lifetime_spend_cents: 0,
    last_active_at: new Date(now - 3600000).toISOString(),
    created_at: new Date(now - 365 * 86400000).toISOString(),
    updated_at: new Date(now - 3600000).toISOString(),
  });

  for (let i = 0; i < 60; i += 1) {
    const first = FIRST[i % FIRST.length];
    const last = LAST[(i * 3) % LAST.length];
    const role = ROLE_POOL[i % ROLE_POOL.length];
    const daysAgo = 2 + (i * 5) % 180;
    const isBanned = i % 17 === 0;
    list.push({
      id: String(1000 + i),
      name: `${first} ${last}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@mail.com`,
      phone: `+65 9${String(30000000 + i * 223).slice(0, 7)}`,
      role,
      status: isBanned ? 'banned' : 'active',
      orders_count: role === 'customer' ? (i * 3) % 80 : 0,
      lifetime_spend_cents: role === 'customer' ? (i * 9871) % 2500000 : 0,
      last_active_at: new Date(now - (i % 24) * 3600000).toISOString(),
      created_at: new Date(now - daysAgo * 86400000).toISOString(),
      updated_at: new Date(now - (daysAgo - 1) * 86400000).toISOString(),
    });
  }
  return list;
};

const store: AdminUserRecord[] = [];

const nextId = (): string => {
  const maxNum = store.reduce((acc, u) => {
    const n = Number(u.id);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 1000);
  return String(maxNum + 1);
};

const applyFilters = (
  items: AdminUserRecord[],
  req: IMockRequest,
): AdminUserRecord[] => {
  const keyword = (getQueryString(req.query, 'keyword') || '').toLowerCase();
  const role = getQueryString(req.query, 'role');
  const status = getQueryString(req.query, 'status');
  return items.filter((u) => {
    if (keyword) {
      const hay = `${u.id} ${u.name} ${u.email} ${u.phone}`.toLowerCase();
      if (!hay.includes(keyword)) return false;
    }
    if (role && role !== 'all' && u.role !== role) return false;
    if (status && status !== 'all' && u.status !== status) return false;
    return true;
  });
};

const applySort = (
  items: AdminUserRecord[],
  req: IMockRequest,
): AdminUserRecord[] => {
  const field = getQueryString(req.query, 'sort_field') || 'created_at';
  const orderRaw = getQueryString(req.query, 'sort_order');
  const order: 'asc' | 'desc' = orderRaw === 'asc' ? 'asc' : 'desc';
  switch (field) {
    case 'name':
      return sortBy(items, (u) => u.name.toLowerCase(), order);
    case 'orders_count':
      return sortBy(items, (u) => u.orders_count, order);
    case 'lifetime_spend_cents':
      return sortBy(items, (u) => u.lifetime_spend_cents, order);
    case 'last_active_at':
      return sortBy(items, (u) => new Date(u.last_active_at), order);
    case 'created_at':
    default:
      return sortBy(items, (u) => new Date(u.created_at), order);
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

const getOne: MockHandler = (req, res) => {
  const id = req.params.id;
  const found = store.find((u) => u.id === id);
  if (!found) return res.status(404).json({ error: 'User not found' });
  return res.json(found);
};

const create: MockHandler = (req, res) => {
  const body = (req.body || {}) as Partial<AdminUserRecord>;
  if (!body.name || !body.email) {
    return res.status(400).json({ error: 'name and email are required' });
  }
  const now = new Date().toISOString();
  const record: AdminUserRecord = {
    id: nextId(),
    name: body.name,
    email: body.email,
    phone: body.phone || '',
    role: (body.role as AdminUserRole) || 'customer',
    status: (body.status as AdminUserStatus) || 'active',
    orders_count: 0,
    lifetime_spend_cents: 0,
    last_active_at: now,
    created_at: now,
    updated_at: now,
  };
  store.unshift(record);
  return res.status(201).json(record);
};

const update: MockHandler = (req, res) => {
  const id = req.params.id;
  const idx = store.findIndex((u) => u.id === id);
  if (idx < 0) return res.status(404).json({ error: 'User not found' });
  const body = (req.body || {}) as Partial<AdminUserRecord>;
  store[idx] = {
    ...store[idx],
    ...body,
    id: store[idx].id,
    created_at: store[idx].created_at,
    updated_at: new Date().toISOString(),
  };
  return res.json(store[idx]);
};

const updateRole: MockHandler = (req, res) => {
  const id = req.params.id;
  const body = (req.body || {}) as { role?: AdminUserRole };
  if (!body.role) return res.status(400).json({ error: 'role is required' });
  const idx = store.findIndex((u) => u.id === id);
  if (idx < 0) return res.status(404).json({ error: 'User not found' });
  store[idx] = {
    ...store[idx],
    role: body.role,
    updated_at: new Date().toISOString(),
  };
  return res.json(store[idx]);
};

const ban: MockHandler = (req, res) => {
  const id = req.params.id;
  const idx = store.findIndex((u) => u.id === id);
  if (idx < 0) return res.status(404).json({ error: 'User not found' });
  store[idx] = {
    ...store[idx],
    status: 'banned',
    updated_at: new Date().toISOString(),
  };
  return res.json(store[idx]);
};

const unban: MockHandler = (req, res) => {
  const id = req.params.id;
  const idx = store.findIndex((u) => u.id === id);
  if (idx < 0) return res.status(404).json({ error: 'User not found' });
  store[idx] = {
    ...store[idx],
    status: 'active',
    updated_at: new Date().toISOString(),
  };
  return res.json(store[idx]);
};

const remove: MockHandler = (req, res) => {
  const id = req.params.id;
  const idx = store.findIndex((u) => u.id === id);
  if (idx < 0) return res.status(404).json({ error: 'User not found' });
  store.splice(idx, 1);
  return res.status(204).end();
};

const getScope: MockHandler = (req, res) => {
  const id = req.params.id;
  const user = store.find((u) => u.id === id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({
    persona: user.role,
    restaurant_ids: [],
    restaurants: [],
    city_codes: [],
  });
};

const routes: Record<string, MockHandler> = {
  'GET /api/admin/users': list,
  'GET /api/admin/users/export': exportAll,
  'GET /api/admin/users/:id': getOne,
  'POST /api/admin/users': create,
  'PATCH /api/admin/users/:id': update,
  'PATCH /api/admin/users/:id/role': updateRole,
  'POST /api/admin/users/:id/ban': ban,
  'POST /api/admin/users/:id/unban': unban,
  'DELETE /api/admin/users/:id': remove,
  'GET /api/admin/users/:id/scope': getScope,
};

export default routes;
