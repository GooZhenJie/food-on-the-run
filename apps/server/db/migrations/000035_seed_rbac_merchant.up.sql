-- Merchant roles (idempotent; reseeds roles skipped by 000032 which ran before
-- the merchant enum value existed)
INSERT INTO roles (code, name, persona, is_system) VALUES
  ('merchant.owner',   'Restaurant Owner',   'merchant', TRUE),
  ('merchant.staff',   'Restaurant Staff',   'merchant', TRUE),
  ('merchant.default', 'Merchant (default)', 'merchant', TRUE)
ON CONFLICT (code) DO NOTHING;

-- merchant.owner: full control of own restaurant scope
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'merchant.owner'
  AND p.code IN (
    'restaurant:read', 'restaurant:write',
    'menu:read', 'menu:write',
    'order:read', 'order:cancel',
    'payout:read'
  )
ON CONFLICT DO NOTHING;

-- merchant.staff: read-only ops
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.code = 'merchant.staff'
  AND p.code IN ('restaurant:read', 'menu:read', 'order:read')
ON CONFLICT DO NOTHING;

-- merchant.default intentionally has zero permissions; it's just the bootstrap
-- assignment when a user is promoted to merchant persona.
