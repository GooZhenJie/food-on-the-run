DELETE FROM user_role_assignments
WHERE role_id IN (
  SELECT id FROM roles WHERE code IN ('merchant.owner', 'merchant.staff', 'merchant.default')
);

DELETE FROM role_permissions
WHERE role_id IN (
  SELECT id FROM roles WHERE code IN ('merchant.owner', 'merchant.staff', 'merchant.default')
);

DELETE FROM roles WHERE code IN ('merchant.owner', 'merchant.staff', 'merchant.default');
