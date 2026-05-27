-- Fix merchant@fotr.local persona: was incorrectly seeded as 'customer' in 000038.
UPDATE users
SET role = 'merchant'::user_role
WHERE email = 'merchant@fotr.local'
  AND role = 'customer'::user_role
  AND deleted_at IS NULL;
