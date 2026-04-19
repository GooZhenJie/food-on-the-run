-- Permission points (idempotent)
INSERT INTO permissions (code, description) VALUES
  ('user:read',           'Read user profile'),
  ('user:write',          'Modify user profile'),
  ('user:impersonate',    'Impersonate another user'),
  ('role:read',           'Read RBAC roles and assignments'),
  ('role:write',          'Manage RBAC role assignments'),
  ('order:read',          'Read orders'),
  ('order:cancel',        'Cancel an order'),
  ('order:refund',        'Issue a refund'),
  ('restaurant:read',     'Read restaurants'),
  ('restaurant:write',    'Write restaurants'),
  ('restaurant:publish',  'Publish or unpublish a restaurant'),
  ('menu:read',           'Read menu items'),
  ('menu:write',          'Write menu items'),
  ('promotion:read',      'Read promotions'),
  ('promotion:write',     'Manage promotions'),
  ('payment:read',        'Read payment records'),
  ('payout:read',         'Read restaurant payouts'),
  ('payout:write',        'Manage restaurant payouts'),
  ('schema:read',         'Read page schemas'),
  ('schema:publish',      'Publish page schemas'),
  ('schema:delete',       'Delete page schemas'),
  ('delivery:read',       'Read deliveries'),
  ('delivery:accept',     'Accept a delivery'),
  ('delivery:complete',   'Complete a delivery'),
  ('review:write',        'Write a review')
ON CONFLICT (code) DO NOTHING;

-- System roles (idempotent)
INSERT INTO roles (code, name, persona, is_system) VALUES
  ('admin.super',      'Super Admin',       'admin',    TRUE),
  ('admin.ops',        'Operations',        'admin',    TRUE),
  ('admin.cs',         'Customer Support',  'admin',    TRUE),
  ('admin.finance',    'Finance',           'admin',    TRUE),
  ('admin.default',    'Admin (default)',   'admin',    TRUE),
  ('rider.default',    'Rider',             'rider',    TRUE),
  ('customer.default', 'Customer',          'customer', TRUE)
ON CONFLICT (code) DO NOTHING;

-- admin.super: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'admin.super'
ON CONFLICT DO NOTHING;

-- admin.ops
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'admin.ops'
  AND p.code IN (
    'restaurant:read', 'restaurant:write', 'restaurant:publish',
    'menu:read', 'menu:write',
    'promotion:read', 'promotion:write',
    'schema:read', 'schema:publish', 'schema:delete',
    'user:read'
  )
ON CONFLICT DO NOTHING;

-- admin.cs
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'admin.cs'
  AND p.code IN (
    'order:read', 'order:cancel', 'order:refund',
    'user:read', 'user:write'
  )
ON CONFLICT DO NOTHING;

-- admin.finance
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'admin.finance'
  AND p.code IN (
    'payment:read', 'payout:read', 'payout:write', 'order:read'
  )
ON CONFLICT DO NOTHING;

-- admin.default
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'admin.default'
  AND p.code IN ('user:read')
ON CONFLICT DO NOTHING;

-- rider.default
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'rider.default'
  AND p.code IN ('delivery:read', 'delivery:accept', 'delivery:complete')
ON CONFLICT DO NOTHING;

-- customer.default
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'customer.default'
  AND p.code IN ('review:write', 'order:read')
ON CONFLICT DO NOTHING;

-- Bootstrap: grant admin.super to every existing user with persona = admin
INSERT INTO user_role_assignments (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.role = 'admin'
  AND u.deleted_at IS NULL
  AND r.code = 'admin.super'
  AND r.deleted_at IS NULL
ON CONFLICT DO NOTHING;

-- Bootstrap: grant <persona>.default to every existing user
INSERT INTO user_role_assignments (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = (u.role::text || '.default') AND r.deleted_at IS NULL
WHERE u.deleted_at IS NULL
ON CONFLICT DO NOTHING;
