package auth

import "time"

// Resource identifies the resource an authorization check is performed against.
// Fields are optional: the zero value (0 / "") means the resource does not
// participate in that scope dimension.
type Resource struct {
	RestaurantID int64
	CityCode     string
}

// bindingExpired reports whether the given expiry is in the past.
// A nil expiry means "never expires".
func bindingExpired(exp *time.Time) bool {
	if exp == nil {
		return false
	}
	return !exp.After(time.Now())
}

// MatchesScope reports whether the given Resource satisfies the given scope.
// Nil scope is always a match. Each non-nil dimension is matched with AND:
//   - RestaurantIDs non-nil → res.RestaurantID must be in the list
//   - CityCodes non-nil     → res.CityCode must be in the list
//
// An empty (but non-nil) slice means "no resource can match this dimension",
// effectively disabling the binding.
func MatchesScope(scope *ResourceScope, res Resource) bool {
	if scope == nil {
		return true
	}
	if scope.RestaurantIDs != nil {
		if res.RestaurantID == 0 {
			return false
		}
		found := false
		for _, id := range scope.RestaurantIDs {
			if id == res.RestaurantID {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	if scope.CityCodes != nil {
		if res.CityCode == "" {
			return false
		}
		found := false
		for _, c := range scope.CityCodes {
			if c == res.CityCode {
				found = true
				break
			}
		}
		if !found {
			return false
		}
	}
	return true
}

// CheckResource is the authoritative permission check. Evaluation order:
//  1. admin.super short-circuit: if the actor holds admin.super as a
//     non-expired, global (scope == nil) binding → allow. admin.super is
//     intentionally immune to user_permission_grants to prevent accidental
//     super-admin lockout.
//  2. DENY grants win: any non-expired grant with effect=-1, matching perm
//     and scope → deny.
//  3. ALLOW grants: any non-expired grant with effect=+1, matching perm
//     and scope → allow.
//  4. Role bindings: any non-expired RoleBinding whose PermSet contains perm
//     AND whose scope matches resource → allow.
//  5. Otherwise → deny.
func (a *Actor) CheckResource(perm string, res Resource) bool {
	if a == nil {
		return false
	}

	for _, rb := range a.RoleBindings {
		if rb.Code != RoleAdminSuper {
			continue
		}
		if rb.Scope != nil {
			continue
		}
		if bindingExpired(rb.ExpiresAt) {
			continue
		}
		return true
	}

	for _, g := range a.Grants {
		if g.Effect != GrantEffectDeny {
			continue
		}
		if g.Perm != perm {
			continue
		}
		if bindingExpired(g.ExpiresAt) {
			continue
		}
		if !MatchesScope(g.Scope, res) {
			continue
		}
		return false
	}

	for _, g := range a.Grants {
		if g.Effect != GrantEffectAllow {
			continue
		}
		if g.Perm != perm {
			continue
		}
		if bindingExpired(g.ExpiresAt) {
			continue
		}
		if !MatchesScope(g.Scope, res) {
			continue
		}
		return true
	}

	for _, rb := range a.RoleBindings {
		if bindingExpired(rb.ExpiresAt) {
			continue
		}
		if _, ok := rb.PermSet[perm]; !ok {
			continue
		}
		if !MatchesScope(rb.Scope, res) {
			continue
		}
		return true
	}

	return false
}

// EffectivePermissions returns the set of permission codes that evaluate true
// under CheckResource with an empty Resource{} (i.e. "global" context).
// Intended for the login response and the admin UI button-visibility check.
// Does NOT cover resource-scoped permissions — backend is the source of truth
// for those and must re-evaluate via CheckResource per request.
func (a *Actor) EffectivePermissions() map[string]struct{} {
	if a == nil {
		return nil
	}
	for _, rb := range a.RoleBindings {
		if rb.Code == RoleAdminSuper && rb.Scope == nil && !bindingExpired(rb.ExpiresAt) {
			all := make(map[string]struct{})
			for _, rb2 := range a.RoleBindings {
				if bindingExpired(rb2.ExpiresAt) {
					continue
				}
				for code := range rb2.PermSet {
					all[code] = struct{}{}
				}
			}
			for _, g := range a.Grants {
				if g.Effect == GrantEffectAllow && g.Scope == nil && !bindingExpired(g.ExpiresAt) {
					all[g.Perm] = struct{}{}
				}
			}
			return all
		}
	}

	denied := make(map[string]struct{})
	granted := make(map[string]struct{})
	for _, g := range a.Grants {
		if bindingExpired(g.ExpiresAt) {
			continue
		}
		if g.Scope != nil {
			continue
		}
		switch g.Effect {
		case GrantEffectDeny:
			denied[g.Perm] = struct{}{}
		case GrantEffectAllow:
			granted[g.Perm] = struct{}{}
		}
	}

	out := make(map[string]struct{})
	for _, rb := range a.RoleBindings {
		if bindingExpired(rb.ExpiresAt) {
			continue
		}
		if rb.Scope != nil {
			continue
		}
		for code := range rb.PermSet {
			if _, blocked := denied[code]; blocked {
				continue
			}
			out[code] = struct{}{}
		}
	}
	for code := range granted {
		if _, blocked := denied[code]; blocked {
			continue
		}
		out[code] = struct{}{}
	}
	return out
}

// ActiveRoleCodes returns the non-expired role codes attached to the actor.
// Used to populate the legacy Actor.Roles field and login response.
func (a *Actor) ActiveRoleCodes() []string {
	if a == nil {
		return nil
	}
	out := make([]string, 0, len(a.RoleBindings))
	for _, rb := range a.RoleBindings {
		if bindingExpired(rb.ExpiresAt) {
			continue
		}
		out = append(out, rb.Code)
	}
	return out
}
