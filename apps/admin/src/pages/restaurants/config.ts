import type { RestaurantStatus } from '@/services/restaurants';

export const DEFAULT_PAGE_SIZE = 20;

export const STATUS_COLORS: Record<RestaurantStatus, string> = {
  active: 'green',
  pending: 'gold',
  suspended: 'red',
};

export const STATUS_LABELS: Record<RestaurantStatus, string> = {
  active: 'Active',
  pending: 'Pending review',
  suspended: 'Suspended',
};

export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending review' },
  { value: 'suspended', label: 'Suspended' },
];

export const STATUS_SELECT_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending review' },
  { value: 'suspended', label: 'Suspended' },
];

export const CUISINE_OPTIONS = [
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

export const CITY_OPTIONS = [
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
