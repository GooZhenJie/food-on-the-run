INSERT INTO users (name, email, role)
SELECT 'Local Admin', 'admin@fotr.local', 'admin'::user_role
WHERE NOT EXISTS (
  SELECT 1 FROM users WHERE email = 'admin@fotr.local' AND deleted_at IS NULL
);

INSERT INTO auth_credentials (user_id, provider, password_hash)
SELECT u.id, 'password'::auth_provider, '$2a$10$NcOo8HAC/u.IuwNgntHYMefrsMbaYDGzNYg9S5Pwygst9L7cXhLF.'
FROM users u
WHERE u.email = 'admin@fotr.local'
  AND u.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth_credentials c
    WHERE c.user_id = u.id
      AND c.provider = 'password'::auth_provider
      AND c.deleted_at IS NULL
  );

INSERT INTO user_role_assignments (user_id, role_id)
SELECT u.id, r.id
FROM users u
JOIN roles r ON r.code = 'admin.super' AND r.deleted_at IS NULL
WHERE u.email = 'admin@fotr.local'
  AND u.deleted_at IS NULL
ON CONFLICT (user_id, role_id) DO NOTHING;
