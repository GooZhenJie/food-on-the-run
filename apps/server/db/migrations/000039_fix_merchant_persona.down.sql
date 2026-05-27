UPDATE users
SET role = 'customer'::user_role
WHERE email = 'merchant@fotr.local'
  AND role = 'merchant'::user_role
  AND deleted_at IS NULL;
