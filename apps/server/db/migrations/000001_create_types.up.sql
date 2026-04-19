CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE user_role AS ENUM (
  'customer',
  'rider',
  'admin'
);

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'delivered',
  'cancelled'
);

CREATE TYPE delivery_status AS ENUM (
  'unassigned',
  'assigned',
  'picked_up',
  'delivered'
);
