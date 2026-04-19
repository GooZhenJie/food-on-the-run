package auth

import "time"

// Actor represents an authenticated principal derived from a validated JWT.
//
// Phase 4 layering:
//   - Roles / Permissions are "summary" fields: the role codes and permission
//     codes a user has globally (scope == nil and not expired). They power the
//     legacy Can() short-circuit and the login response consumed by the web UI.
//   - RoleBindings / Grants are the authoritative fields used by CheckResource
//     for resource-scoped authorization.
//   - Scopes is ABAC persona scope (merchant → owned restaurant ids), unchanged
//     from Phase 3.
type Actor struct {
	UserID       int64
	Persona      string
	Roles        []string
	Permissions  map[string]struct{}
	RoleBindings []RoleBinding
	Grants       []Grant
	Scopes       Scopes
}

// Scopes carries data-level filters bound to the actor persona.
// Distinct from RoleBinding.Scope which is per role-assignment.
type Scopes struct {
	RestaurantIDs []int64  `json:"restaurant_ids,omitempty"`
	CityCodes     []string `json:"city_codes,omitempty"`
}

// RoleBinding is a single (user, role) assignment with optional scope and TTL.
// PermSet is the set of permission codes attached to the role itself.
type RoleBinding struct {
	Code      string
	Persona   string
	Scope     *ResourceScope
	ExpiresAt *time.Time
	PermSet   map[string]struct{}
}

// Grant is a user-level permission override (grant or revoke).
// Effect is +1 (grant) or -1 (revoke). Revoke beats grant beats role.
type Grant struct {
	Perm      string
	Effect    int8
	Scope     *ResourceScope
	ExpiresAt *time.Time
}

// ResourceScope restricts a RoleBinding / Grant to a subset of resources.
// A nil ResourceScope means "global" (match every resource).
// Within a ResourceScope each non-nil dimension must match (logical AND).
type ResourceScope struct {
	RestaurantIDs []int64  `json:"restaurant_ids,omitempty"`
	CityCodes     []string `json:"city_codes,omitempty"`
}

// ScopedToRestaurant reports whether the given restaurant id is within the
// actor's persona scope (used by merchant handlers). Unrelated to RBAC scope.
func (a *Actor) ScopedToRestaurant(id int64) bool {
	if a == nil {
		return false
	}
	for _, rid := range a.Scopes.RestaurantIDs {
		if rid == id {
			return true
		}
	}
	return false
}

// HasPersona reports whether the actor belongs to the given persona.
func (a *Actor) HasPersona(p string) bool {
	if a == nil {
		return false
	}
	return a.Persona == p
}

// Can is the legacy global permission check. Returns true when:
//  1. The actor holds admin.super as a non-expired, global (scope == nil) binding, OR
//  2. perm is in Actor.Permissions (the pre-computed global set).
//
// Resource-scoped handlers should call CheckResource instead.
func (a *Actor) Can(perm string) bool {
	if a == nil {
		return false
	}
	for _, rb := range a.RoleBindings {
		if rb.Code == RoleAdminSuper && rb.Scope == nil && !bindingExpired(rb.ExpiresAt) {
			return true
		}
	}
	if len(a.RoleBindings) == 0 {
		for _, code := range a.Roles {
			if code == RoleAdminSuper {
				return true
			}
		}
	}
	if a.Permissions == nil {
		return false
	}
	_, ok := a.Permissions[perm]
	return ok
}

// Built-in role codes. Seeded by migration 000032.
const (
	RoleAdminSuper   = "admin.super"
	RoleAdminOps     = "admin.ops"
	RoleAdminCS      = "admin.cs"
	RoleAdminFinance = "admin.finance"

	RoleMerchantOwner = "merchant.owner"
	RoleMerchantStaff = "merchant.staff"

	RoleRiderDefault    = "rider.default"
	RoleCustomerDefault = "customer.default"
)

// Persona values mirror the user_role enum.
const (
	PersonaCustomer = "customer"
	PersonaRider    = "rider"
	PersonaMerchant = "merchant"
	PersonaAdmin    = "admin"
)

// Grant effect constants. SMALLINT column is constrained to {1, -1}.
const (
	GrantEffectAllow int8 = 1
	GrantEffectDeny  int8 = -1
)
