import type { IMockRequest, MockHandler } from './types';
import { getQueryInt, getQueryString, paginate, sortBy } from './types';

type RestaurantStatus = 'active' | 'pending' | 'suspended';

interface AdminRestaurantRecord {
  id: string;
  name: string;
  cuisine: string;
  status: RestaurantStatus;
  ownerEmail: string;
  ownerName: string;
  city: string;
  phone: string;
  address: string;
  rating: number;
  ordersToday: number;
  revenueMonthCents: number;
  createdAt: string;
  updatedAt: string;
}

const CUISINES = [
  'Chinese',
  'Japanese',
  'Korean',
  'Thai',
  'Indian',
  'Italian',
  'Mexican',
  'American',
  'Mediterranean',
  'Vietnamese',
  'French',
  'Malaysian',
];

const CITIES = [
  'Singapore',
  'Jakarta',
  'Kuala Lumpur',
  'Bangkok',
  'Manila',
  'Ho Chi Minh City',
  'Tokyo',
  'Seoul',
  'Hong Kong',
  'Taipei',
];

const STATUS_POOL: RestaurantStatus[] = [
  'active',
  'active',
  'active',
  'active',
  'pending',
  'pending',
  'suspended',
];

const seed = (): AdminRestaurantRecord[] => {
  const names = [
    'Orange Lantern',
    'Nomad Kitchen',
    'Ember & Ash',
    'Saigon Rose',
    'Blue Noodle',
    'Golden Wok',
    'Spice Route',
    'Seoul Bites',
    'Tokyo Alley',
    'Basil & Lime',
    'Masala House',
    'Sunset Grill',
    'Hearth Bistro',
    'Pho Republic',
    'Sakura Ramen',
    'Laksa Lab',
    'Hawker Social',
    'Burger Barn',
    'Pizza Porter',
    'Taco Haven',
    'Dumpling Daughter',
    'Curry Club',
    'Night Market',
    'Banh Mi Bros',
    'Green Papaya',
    'Coastline Poke',
    'Harvest Table',
    'Chef\'s Corner',
    'Smokehouse 88',
    'Bao Family',
    'Roti Revolution',
    'Street Satay',
    'Umami Room',
    'Noodle Bar North',
    'Mango Tango',
    'Kimchi Kingdom',
    'Samba Grill',
    'Olive Branch',
    'Mint Leaf',
    'Peppercorn House',
    'Saffron Sky',
    'Cardamom Cafe',
    'Crimson Hotpot',
    'Wasabi Bay',
    'Chilli Padi',
    'Coconut Grove',
    'Urban Tandoor',
    'Lemongrass Lane',
    'Roast & Rice',
    'Dosa District',
  ];

  const now = Date.now();
  return names.map((name, i) => {
    const daysAgo = 1 + i * 3;
    return {
      id: `r_${String(1000 + i).padStart(4, '0')}`,
      name,
      cuisine: CUISINES[i % CUISINES.length],
      status: STATUS_POOL[i % STATUS_POOL.length],
      ownerEmail: `owner${i + 1}@fotr.com`,
      ownerName: `Owner ${i + 1}`,
      city: CITIES[i % CITIES.length],
      phone: `+65 9${String(10000000 + i * 137).slice(0, 7)}`,
      address: `${100 + i} Jalan ${String.fromCharCode(65 + (i % 26))}${
        i % 7
      }, #0${i % 10}-${10 + (i % 89)}`,
      rating: Math.round((3.5 + ((i * 37) % 15) / 10) * 10) / 10,
      ordersToday: (i * 7) % 130,
      revenueMonthCents: 120000 + ((i * 733) % 1800000),
      createdAt: new Date(now - daysAgo * 86400000).toISOString(),
      updatedAt: new Date(now - daysAgo * 3600000).toISOString(),
    };
  });
};

const store: AdminRestaurantRecord[] = seed();

const nextId = (): string => {
  const maxNum = store.reduce((acc, r) => {
    const n = Number(r.id.replace(/^r_/, ''));
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 1000);
  return `r_${String(maxNum + 1).padStart(4, '0')}`;
};

const applyFilters = (
  items: AdminRestaurantRecord[],
  req: IMockRequest,
): AdminRestaurantRecord[] => {
  const keyword = (getQueryString(req.query, 'keyword') || '').toLowerCase();
  const status = getQueryString(req.query, 'status');
  const cuisine = getQueryString(req.query, 'cuisine');
  const city = getQueryString(req.query, 'city');
  return items.filter((r) => {
    if (keyword) {
      const hay = `${r.name} ${r.ownerEmail} ${r.ownerName} ${r.id}`.toLowerCase();
      if (!hay.includes(keyword)) return false;
    }
    if (status && status !== 'all' && r.status !== status) return false;
    if (cuisine && cuisine !== 'all' && r.cuisine !== cuisine) return false;
    if (city && city !== 'all' && r.city !== city) return false;
    return true;
  });
};

const applySort = (
  items: AdminRestaurantRecord[],
  req: IMockRequest,
): AdminRestaurantRecord[] => {
  const sortField = getQueryString(req.query, 'sort_field') || 'createdAt';
  const sortOrderRaw = getQueryString(req.query, 'sort_order');
  const sortOrder: 'asc' | 'desc' = sortOrderRaw === 'asc' ? 'asc' : 'desc';
  switch (sortField) {
    case 'name':
      return sortBy(items, (r) => r.name.toLowerCase(), sortOrder);
    case 'rating':
      return sortBy(items, (r) => r.rating, sortOrder);
    case 'ordersToday':
      return sortBy(items, (r) => r.ordersToday, sortOrder);
    case 'revenueMonthCents':
      return sortBy(items, (r) => r.revenueMonthCents, sortOrder);
    case 'status':
      return sortBy(items, (r) => r.status, sortOrder);
    case 'createdAt':
    default:
      return sortBy(items, (r) => new Date(r.createdAt), sortOrder);
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
  const found = store.find((r) => r.id === id);
  if (!found) return res.status(404).json({ error: 'Restaurant not found' });
  return res.json(found);
};

const create: MockHandler = (req, res) => {
  const body = (req.body || {}) as Partial<AdminRestaurantRecord>;
  if (!body.name || !body.ownerEmail) {
    return res.status(400).json({ error: 'name and ownerEmail are required' });
  }
  const now = new Date().toISOString();
  const record: AdminRestaurantRecord = {
    id: nextId(),
    name: body.name,
    cuisine: body.cuisine || CUISINES[0],
    status: (body.status as RestaurantStatus) || 'pending',
    ownerEmail: body.ownerEmail,
    ownerName: body.ownerName || body.ownerEmail.split('@')[0],
    city: body.city || CITIES[0],
    phone: body.phone || '',
    address: body.address || '',
    rating: 0,
    ordersToday: 0,
    revenueMonthCents: 0,
    createdAt: now,
    updatedAt: now,
  };
  store.unshift(record);
  return res.status(201).json(record);
};

const update: MockHandler = (req, res) => {
  const id = req.params.id;
  const idx = store.findIndex((r) => r.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Restaurant not found' });
  const body = (req.body || {}) as Partial<AdminRestaurantRecord>;
  const next: AdminRestaurantRecord = {
    ...store[idx],
    ...body,
    id: store[idx].id,
    createdAt: store[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  store[idx] = next;
  return res.json(next);
};

const remove: MockHandler = (req, res) => {
  const id = req.params.id;
  const idx = store.findIndex((r) => r.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Restaurant not found' });
  store.splice(idx, 1);
  return res.status(204).end();
};

const updateStatus: MockHandler = (req, res) => {
  const id = req.params.id;
  const body = (req.body || {}) as { status?: RestaurantStatus };
  if (!body.status) return res.status(400).json({ error: 'status is required' });
  const idx = store.findIndex((r) => r.id === id);
  if (idx < 0) return res.status(404).json({ error: 'Restaurant not found' });
  store[idx] = {
    ...store[idx],
    status: body.status,
    updatedAt: new Date().toISOString(),
  };
  return res.json(store[idx]);
};

const routes: Record<string, MockHandler> = {
  'GET /api/admin/restaurants': list,
  'GET /api/admin/restaurants/export': exportAll,
  'GET /api/admin/restaurants/:id': getOne,
  'POST /api/admin/restaurants': create,
  'PATCH /api/admin/restaurants/:id': update,
  'DELETE /api/admin/restaurants/:id': remove,
  'POST /api/admin/restaurants/:id/status': updateStatus,
};

export default routes;
