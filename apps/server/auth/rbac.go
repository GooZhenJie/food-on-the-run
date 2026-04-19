package auth

import (
	"context"
	"encoding/json"
	"time"

	db "github.com/food-on-the-run/server/db/sqlc"
)

// LoadActor builds an Actor for the given user by reading role bindings,
// grants and ABAC scopes from DB.
//
// Implementation notes:
//   - Binding / grant rows with expires_at in the past are filtered in SQL;
//     the evaluator re-checks regardless for safety.
//   - Role permission sets are hydrated in a single batch query
//     (ListRolePermissionCodesByRoleIDs) so LoadActor is 3 round-trips total.
//   - Roles / Permissions (legacy fields) mirror "globally-scoped, non-expired"
//     bindings / grants so the login response and Actor.Can continue to work.
func LoadActor(ctx context.Context, q db.Querier, userID int64, persona string) (*Actor, error) {
	bindings, err := loadRoleBindings(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	grants, err := loadGrants(ctx, q, userID)
	if err != nil {
		return nil, err
	}
	scopes, err := loadScopes(ctx, q, userID, persona)
	if err != nil {
		return nil, err
	}

	actor := &Actor{
		UserID:       userID,
		Persona:      persona,
		RoleBindings: bindings,
		Grants:       grants,
		Scopes:       scopes,
	}
	actor.Permissions = actor.EffectivePermissions()
	actor.Roles = summaryRoleCodes(bindings)
	return actor, nil
}

// loadRoleBindings reads all non-expired role bindings for the user and
// hydrates each binding's permission set in one batched query.
func loadRoleBindings(ctx context.Context, q db.Querier, userID int64) ([]RoleBinding, error) {
	rows, err := q.ListUserRoleBindings(ctx, userID)
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}

	roleIDs := make([]int64, 0, len(rows))
	idToIdx := make(map[int64]int, len(rows))
	bindings := make([]RoleBinding, 0, len(rows))
	for _, row := range rows {
		scope, err := decodeScope(row.Scope)
		if err != nil {
			return nil, err
		}
		rb := RoleBinding{
			Code:    row.RoleCode,
			Persona: string(row.RolePersona),
			Scope:   scope,
			PermSet: map[string]struct{}{},
		}
		if row.ExpiresAt.Valid {
			t := row.ExpiresAt.Time
			rb.ExpiresAt = &t
		}
		idToIdx[row.RoleID] = len(bindings)
		bindings = append(bindings, rb)
		roleIDs = append(roleIDs, row.RoleID)
	}

	perms, err := q.ListRolePermissionCodesByRoleIDs(ctx, roleIDs)
	if err != nil {
		return nil, err
	}
	for _, p := range perms {
		idx, ok := idToIdx[p.RoleID]
		if !ok {
			continue
		}
		bindings[idx].PermSet[p.Code] = struct{}{}
	}
	return bindings, nil
}

// loadGrants reads non-expired user-level permission grants.
func loadGrants(ctx context.Context, q db.Querier, userID int64) ([]Grant, error) {
	rows, err := q.ListUserGrantsForEval(ctx, userID)
	if err != nil {
		return nil, err
	}
	if len(rows) == 0 {
		return nil, nil
	}
	out := make([]Grant, 0, len(rows))
	for _, row := range rows {
		scope, err := decodeScope(row.Scope)
		if err != nil {
			return nil, err
		}
		g := Grant{
			Perm:   row.PermissionCode,
			Effect: int8(row.Effect),
			Scope:  scope,
		}
		if row.ExpiresAt.Valid {
			t := row.ExpiresAt.Time
			g.ExpiresAt = &t
		}
		out = append(out, g)
	}
	return out, nil
}

// loadScopes resolves ABAC persona scope data (merchant → owned restaurants).
func loadScopes(ctx context.Context, q db.Querier, userID int64, persona string) (Scopes, error) {
	if persona != PersonaMerchant {
		return Scopes{}, nil
	}
	ids, err := q.ListRestaurantIDsByOwner(ctx, userID)
	if err != nil {
		return Scopes{}, err
	}
	return Scopes{RestaurantIDs: ids}, nil
}

// SliceToSet converts a slice of permission codes into a set for O(1) lookup.
func SliceToSet(items []string) map[string]struct{} {
	if len(items) == 0 {
		return nil
	}
	set := make(map[string]struct{}, len(items))
	for _, it := range items {
		set[it] = struct{}{}
	}
	return set
}

// summaryRoleCodes flattens all non-expired bindings to their codes.
// Duplicate codes are impossible because (user_id, role_id) is unique.
func summaryRoleCodes(bindings []RoleBinding) []string {
	if len(bindings) == 0 {
		return nil
	}
	out := make([]string, 0, len(bindings))
	for _, rb := range bindings {
		if bindingExpired(rb.ExpiresAt) {
			continue
		}
		out = append(out, rb.Code)
	}
	return out
}

// decodeScope parses a JSONB scope column into a *ResourceScope.
// A NULL column (raw == nil or empty) yields nil, which evaluator treats
// as "global".
func decodeScope(raw []byte) (*ResourceScope, error) {
	if len(raw) == 0 {
		return nil, nil
	}
	s := &ResourceScope{}
	if err := json.Unmarshal(raw, s); err != nil {
		return nil, err
	}
	if s.RestaurantIDs == nil && s.CityCodes == nil {
		return nil, nil
	}
	return s, nil
}

// EncodeScope serializes a *ResourceScope for the scope JSONB column.
// Returns nil bytes for nil scope (SQL NULL).
func EncodeScope(scope *ResourceScope) ([]byte, error) {
	if scope == nil {
		return nil, nil
	}
	if scope.RestaurantIDs == nil && scope.CityCodes == nil {
		return nil, nil
	}
	return json.Marshal(scope)
}

// ExpiresAtFromTime is a small helper that copies a time into a fresh *time.Time,
// or returns nil when t is the zero value.
func ExpiresAtFromTime(t time.Time) *time.Time {
	if t.IsZero() {
		return nil
	}
	copy := t
	return &copy
}
