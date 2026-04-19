DELETE FROM sessions WHERE user_id = (SELECT id FROM users WHERE email = 'admin@fotr.local');

DELETE FROM auth_credentials WHERE user_id = (SELECT id FROM users WHERE email = 'admin@fotr.local');

DELETE FROM user_role_assignments WHERE user_id = (SELECT id FROM users WHERE email = 'admin@fotr.local');

DELETE FROM users WHERE email = 'admin@fotr.local';
