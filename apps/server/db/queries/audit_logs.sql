-- name: WriteAuditLog :exec
INSERT INTO audit_logs (
  actor_id,
  actor_role,
  action,
  resource_type,
  resource_id,
  ip_address,
  user_agent,
  meta_data
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
