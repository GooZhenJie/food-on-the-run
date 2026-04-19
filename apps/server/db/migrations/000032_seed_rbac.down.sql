-- Revoke seeded assignments first
DELETE FROM user_role_assignments
WHERE role_id IN (
  SELECT id FROM roles WHERE code IN (
    'admin.super', 'admin.ops', 'admin.cs', 'admin.finance', 'admin.default',
    'rider.default', 'customer.default'
  )
);

DELETE FROM role_permissions
WHERE role_id IN (
  SELECT id FROM roles WHERE code IN (
    'admin.super', 'admin.ops', 'admin.cs', 'admin.finance', 'admin.default',
    'rider.default', 'customer.default'
  )
);

DELETE FROM roles WHERE code IN (
  'admin.super', 'admin.ops', 'admin.cs', 'admin.finance', 'admin.default',
  'rider.default', 'customer.default'
);

DELETE FROM permissions WHERE code IN (
  'user:read', 'user:write', 'user:impersonate',
  'role:read', 'role:write',
  'order:read', 'order:cancel', 'order:refund',
  'restaurant:read', 'restaurant:write', 'restaurant:publish',
  'menu:read', 'menu:write',
  'promotion:read', 'promotion:write',
  'payment:read',
  'payout:read', 'payout:write',
  'schema:read', 'schema:publish', 'schema:delete',
  'delivery:read', 'delivery:accept', 'delivery:complete',
  'review:write'
);
