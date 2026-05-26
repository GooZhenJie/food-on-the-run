import type { TAdminRole } from '@/services/type';

export const DEFAULT_PAGE_SIZE = 20;

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

export const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'customer', label: 'Customer' },
  { value: 'rider', label: 'Rider' },
  { value: 'merchant', label: 'Merchant' },
  { value: 'admin', label: 'Admin' },
];

export const ROLE_SELECT_OPTIONS = [
  { value: 'customer', label: 'Customer' },
  { value: 'rider', label: 'Rider' },
  { value: 'merchant', label: 'Merchant' },
  { value: 'admin', label: 'Admin' },
];

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'banned', label: 'Banned' },
];
