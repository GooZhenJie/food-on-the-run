DROP INDEX IF EXISTS idx_user_role_assignments_expires_at;

ALTER TABLE user_role_assignments
  DROP COLUMN IF EXISTS expires_at,
  DROP COLUMN IF EXISTS scope;
