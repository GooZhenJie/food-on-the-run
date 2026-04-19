package auth

// Actor represents an authenticated principal derived from a validated JWT.
// Phase 1 only populates UserID and Persona; Roles/Permissions/Scopes are
// reserved fields that will be filled in Phase 2 (RBAC) and Phase 3 (ABAC).
type Actor struct {
	UserID      int64
	Persona     string
	Roles       []string
	Permissions map[string]struct{}
	Scopes      Scopes
}

// Scopes carries data-level filters bound to the actor.
// Phase 1 keeps this empty; handlers must still accept the field and be
// scope-aware so later phases can flip on enforcement without churn.
type Scopes struct {
	RestaurantIDs []int64  `json:"restaurant_ids,omitempty"`
	CityCodes     []string `json:"city_codes,omitempty"`
}

// Can returns whether the actor is granted the given permission code.
// admin.super is a short-circuit super role so super admins never get
// locked out by accidental permission edits.
func (a *Actor) Can(perm string) bool {
	if a == nil {
		return false
	}
	for _, r := range a.Roles {
		if r == RoleAdminSuper {
			return true
		}
	}
	if a.Permissions == nil {
		return false
	}
	_, ok := a.Permissions[perm]
	return ok
}

// HasPersona reports whether the actor belongs to the given persona.
func (a *Actor) HasPersona(p string) bool {
	if a == nil {
		return false
	}
	return a.Persona == p
}

// Built-in role codes. Phase 2 migration will seed these rows into the
// roles table; Phase 1 references RoleAdminSuper for the Can short-circuit.
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
