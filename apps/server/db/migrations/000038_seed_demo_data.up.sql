-- Seed demo data for FOTR presentation
-- Idempotent: uses ON CONFLICT / WHERE NOT EXISTS patterns

-- ============================================================
-- 1. USERS: merchant owner + demo customer
-- ============================================================

INSERT INTO users (name, email, phone, role)
SELECT 'Lily Tan', 'merchant@fotr.local', '+60111234567', 'customer'::user_role
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'merchant@fotr.local' AND deleted_at IS NULL
);

INSERT INTO users (name, email, phone, role)
SELECT 'Demo Customer', 'customer@fotr.local', '+60119876543', 'customer'::user_role
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'customer@fotr.local' AND deleted_at IS NULL
);

-- Auth credentials (password: 123456 → bcrypt hash)
INSERT INTO auth_credentials (user_id, provider, password_hash)
SELECT u.id, 'password'::auth_provider, '$2a$10$NcOo8HAC/u.IuwNgntHYMefrsMbaYDGzNYg9S5Pwygst9L7cXhLF.'
FROM users u
WHERE u.email = 'merchant@fotr.local' AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth_credentials c WHERE c.user_id = u.id AND c.provider = 'password'::auth_provider AND c.deleted_at IS NULL
  );

INSERT INTO auth_credentials (user_id, provider, password_hash)
SELECT u.id, 'password'::auth_provider, '$2a$10$NcOo8HAC/u.IuwNgntHYMefrsMbaYDGzNYg9S5Pwygst9L7cXhLF.'
FROM users u
WHERE u.email = 'customer@fotr.local' AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth_credentials c WHERE c.user_id = u.id AND c.provider = 'password'::auth_provider AND c.deleted_at IS NULL
  );

-- ============================================================
-- 2. RESTAURANTS
-- ============================================================

INSERT INTO restaurants (owner_id, name, description, image_url, address_line_1, city, postcode, lat, lng, phone, is_open)
SELECT u.id,
       'Aunty Lily''s Nasi Lemak',
       'Authentic Malay nasi lemak since 1985. Famous for our sambal and rendang.',
       'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&h=500&fit=crop',
       '23, Jalan Alor',
       'Kuala Lumpur',
       '50200',
       3.1467, 101.7058,
       '+60321234567',
       TRUE
FROM users u
WHERE u.email = 'merchant@fotr.local' AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM restaurants WHERE name = 'Aunty Lily''s Nasi Lemak' AND deleted_at IS NULL
  );

INSERT INTO restaurants (owner_id, name, description, image_url, address_line_1, city, postcode, lat, lng, phone, is_open)
SELECT u.id,
       'The Wonton Noodle Bar',
       'Handmade noodles and dim sum. Our broth is simmered for 12 hours daily.',
       'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&h=500&fit=crop',
       '88, Jalan Petaling',
       'Kuala Lumpur',
       '50000',
       3.1647, 101.6974,
       '+60321345678',
       TRUE
FROM users u
WHERE u.email = 'merchant@fotr.local' AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM restaurants WHERE name = 'The Wonton Noodle Bar' AND deleted_at IS NULL
  );

INSERT INTO restaurants (owner_id, name, description, image_url, address_line_1, city, postcode, lat, lng, phone, is_open)
SELECT u.id,
       'Tandoor Palace',
       'North Indian cuisine with authentic tandoori oven. Halal certified.',
       'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=800&h=500&fit=crop',
       '15, Jalan Tun Sambanthan',
       'Kuala Lumpur',
       '50470',
       3.1319, 101.6861,
       '+60321456789',
       TRUE
FROM users u
WHERE u.email = 'merchant@fotr.local' AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM restaurants WHERE name = 'Tandoor Palace' AND deleted_at IS NULL
  );

-- ============================================================
-- 3. MENU CATEGORIES
-- ============================================================

-- Restaurant 1: Aunty Lily's Nasi Lemak
INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT r.id, 'Signature Dishes', 0
FROM restaurants r WHERE r.name = 'Aunty Lily''s Nasi Lemak' AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = 'Signature Dishes' AND mc.deleted_at IS NULL);

INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT r.id, 'Rice & Noodles', 1
FROM restaurants r WHERE r.name = 'Aunty Lily''s Nasi Lemak' AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = 'Rice & Noodles' AND mc.deleted_at IS NULL);

INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT r.id, 'Sides & Snacks', 2
FROM restaurants r WHERE r.name = 'Aunty Lily''s Nasi Lemak' AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = 'Sides & Snacks' AND mc.deleted_at IS NULL);

INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT r.id, 'Beverages', 3
FROM restaurants r WHERE r.name = 'Aunty Lily''s Nasi Lemak' AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = 'Beverages' AND mc.deleted_at IS NULL);

-- Restaurant 2: The Wonton Noodle Bar
INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT r.id, 'Noodle Soups', 0
FROM restaurants r WHERE r.name = 'The Wonton Noodle Bar' AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = 'Noodle Soups' AND mc.deleted_at IS NULL);

INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT r.id, 'Dry Noodles', 1
FROM restaurants r WHERE r.name = 'The Wonton Noodle Bar' AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = 'Dry Noodles' AND mc.deleted_at IS NULL);

INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT r.id, 'Dim Sum', 2
FROM restaurants r WHERE r.name = 'The Wonton Noodle Bar' AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = 'Dim Sum' AND mc.deleted_at IS NULL);

-- Restaurant 3: Tandoor Palace
INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT r.id, 'Tandoori & Grill', 0
FROM restaurants r WHERE r.name = 'Tandoor Palace' AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = 'Tandoori & Grill' AND mc.deleted_at IS NULL);

INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT r.id, 'Curries', 1
FROM restaurants r WHERE r.name = 'Tandoor Palace' AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = 'Curries' AND mc.deleted_at IS NULL);

INSERT INTO menu_categories (restaurant_id, name, sort_order)
SELECT r.id, 'Breads', 2
FROM restaurants r WHERE r.name = 'Tandoor Palace' AND r.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_categories mc WHERE mc.restaurant_id = r.id AND mc.name = 'Breads' AND mc.deleted_at IS NULL);

-- ============================================================
-- 4. MENU ITEMS
-- ============================================================

-- Restaurant 1: Aunty Lily's
INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Nasi Lemak Special',
       'Fragrant coconut rice with sambal, fried anchovies, peanuts, boiled egg & rendang chicken',
       'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=400&h=300&fit=crop',
       1290, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'Aunty Lily''s Nasi Lemak' AND mc.name = 'Signature Dishes'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Nasi Lemak Special' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Rendang Tok',
       'Slow-cooked beef rendang in rich coconut gravy — our family recipe since 1985',
       'https://images.unsplash.com/photo-1606491956689-2ea866880049?w=400&h=300&fit=crop',
       1890, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'Aunty Lily''s Nasi Lemak' AND mc.name = 'Signature Dishes'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Rendang Tok' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Mee Goreng Mamak',
       'Spicy stir-fried yellow noodles with egg, tofu, and bean sprouts',
       'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=400&h=300&fit=crop',
       990, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'Aunty Lily''s Nasi Lemak' AND mc.name = 'Rice & Noodles'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Mee Goreng Mamak' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Roti Canai (2 pcs)',
       'Crispy layered flatbread served with dhal & sambal',
       'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
       490, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'Aunty Lily''s Nasi Lemak' AND mc.name = 'Sides & Snacks'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Roti Canai (2 pcs)' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Teh Tarik',
       'Pulled milk tea — frothy & creamy',
       'https://images.unsplash.com/photo-1571934811356-5cc061b6821f?w=400&h=300&fit=crop',
       390, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'Aunty Lily''s Nasi Lemak' AND mc.name = 'Beverages'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Teh Tarik' AND mi.deleted_at IS NULL);

-- Restaurant 2: The Wonton Noodle Bar
INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Signature Wonton Noodle Soup',
       'Handmade egg noodles in clear pork bone broth with shrimp wontons',
       'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop',
       1190, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'The Wonton Noodle Bar' AND mc.name = 'Noodle Soups'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Signature Wonton Noodle Soup' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Beef Brisket Noodle',
       'Tender braised beef brisket in aromatic five-spice broth',
       'https://images.unsplash.com/photo-1555126634-323283e090fa?w=400&h=300&fit=crop',
       1490, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'The Wonton Noodle Bar' AND mc.name = 'Noodle Soups'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Beef Brisket Noodle' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Dry Wonton Noodle',
       'Springy noodles tossed in dark soy & char siu sauce, wontons on the side',
       'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&h=300&fit=crop',
       1090, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'The Wonton Noodle Bar' AND mc.name = 'Dry Noodles'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Dry Wonton Noodle' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Har Gow (4 pcs)',
       'Crystal prawn dumplings with bamboo shoots',
       'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=300&fit=crop',
       890, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'The Wonton Noodle Bar' AND mc.name = 'Dim Sum'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Har Gow (4 pcs)' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Siu Mai (4 pcs)',
       'Pork & shrimp open-topped dumplings',
       'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=400&h=300&fit=crop',
       790, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'The Wonton Noodle Bar' AND mc.name = 'Dim Sum'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Siu Mai (4 pcs)' AND mi.deleted_at IS NULL);

-- Restaurant 3: Tandoor Palace
INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Tandoori Chicken',
       'Half chicken marinated in yoghurt & spices, chargrilled in clay oven',
       'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=400&h=300&fit=crop',
       1690, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'Tandoor Palace' AND mc.name = 'Tandoori & Grill'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Tandoori Chicken' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Lamb Seekh Kebab',
       'Minced lamb skewers with mint chutney',
       'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop',
       1490, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'Tandoor Palace' AND mc.name = 'Tandoori & Grill'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Lamb Seekh Kebab' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Butter Chicken',
       'Creamy tomato-based curry with tender chicken tikka',
       'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?w=400&h=300&fit=crop',
       1590, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'Tandoor Palace' AND mc.name = 'Curries'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Butter Chicken' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Dal Makhani',
       'Black lentils slow-cooked overnight with cream & butter',
       'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400&h=300&fit=crop',
       1190, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'Tandoor Palace' AND mc.name = 'Curries'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Dal Makhani' AND mi.deleted_at IS NULL);

INSERT INTO menu_items (restaurant_id, category_id, name, description, image_url, price_amount, is_available)
SELECT r.id, mc.id, 'Garlic Naan (2 pcs)',
       'Soft naan bread brushed with garlic butter',
       'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
       590, TRUE
FROM restaurants r JOIN menu_categories mc ON mc.restaurant_id = r.id
WHERE r.name = 'Tandoor Palace' AND mc.name = 'Breads'
  AND r.deleted_at IS NULL AND mc.deleted_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM menu_items mi WHERE mi.restaurant_id = r.id AND mi.name = 'Garlic Naan (2 pcs)' AND mi.deleted_at IS NULL);

-- ============================================================
-- 5. Assign merchant role to the merchant user
-- ============================================================
INSERT INTO user_role_assignments (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'merchant@fotr.local' AND u.deleted_at IS NULL
  AND r.code = 'merchant'
  AND NOT EXISTS (
    SELECT 1 FROM user_role_assignments ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );
