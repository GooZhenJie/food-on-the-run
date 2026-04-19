import type { TAdminRole } from '@/services/type';

export const ROLE_COLORS: Record<TAdminRole, string> = {
  customer: 'default',
  rider: 'blue',
  merchant: 'orange',
  admin: 'purple',
};

export const ROLE_LABELS: Record<TAdminRole, string> = {
  customer: 'Customer',
  rider: 'Rider',
  merchant: 'Merchant',
  admin: 'Admin',
};

export const ROLE_DESCRIPTIONS: Record<TAdminRole, string> = {
  customer: 'End user ordering food',
  rider: 'Delivery courier',
  merchant: 'Restaurant owner / staff (Phase 3)',
  admin: 'Internal back-office operator',
};

export const SELECTABLE_ROLES: TAdminRole[] = ['customer', 'rider', 'admin'];

export const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All roles' },
  ...SELECTABLE_ROLES.map((role) => ({ value: role, label: ROLE_LABELS[role] })),
];

export const DEFAULT_PAGE_SIZE = 20;
