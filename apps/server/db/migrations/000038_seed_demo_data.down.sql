-- Reverse seed demo data
DELETE FROM menu_items WHERE restaurant_id IN (
  SELECT id FROM restaurants WHERE name IN ('Aunty Lily''s Nasi Lemak', 'The Wonton Noodle Bar', 'Tandoor Palace')
);
DELETE FROM menu_categories WHERE restaurant_id IN (
  SELECT id FROM restaurants WHERE name IN ('Aunty Lily''s Nasi Lemak', 'The Wonton Noodle Bar', 'Tandoor Palace')
);
DELETE FROM restaurants WHERE name IN ('Aunty Lily''s Nasi Lemak', 'The Wonton Noodle Bar', 'Tandoor Palace');
DELETE FROM auth_credentials WHERE user_id IN (
  SELECT id FROM users WHERE email IN ('merchant@fotr.local', 'customer@fotr.local')
);
DELETE FROM user_roles WHERE user_id IN (
  SELECT id FROM users WHERE email = 'merchant@fotr.local'
);
DELETE FROM users WHERE email IN ('merchant@fotr.local', 'customer@fotr.local');
