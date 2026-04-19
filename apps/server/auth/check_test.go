package auth

import (
	"testing"
	"time"
)

func pastTime() *time.Time {
	t := time.Now().Add(-1 * time.Hour)
	return &t
}

func futureTime() *time.Time {
	t := time.Now().Add(1 * time.Hour)
	return &t
}

func permSet(codes ...string) map[string]struct{} {
	s := make(map[string]struct{}, len(codes))
	for _, c := range codes {
		s[c] = struct{}{}
	}
	return s
}

func TestMatchesScope_Nil(t *testing.T) {
	if !MatchesScope(nil, Resource{}) {
		t.Fatal("nil scope must match empty resource")
	}
	if !MatchesScope(nil, Resource{RestaurantID: 101}) {
		t.Fatal("nil scope must match any resource")
	}
}

func TestMatchesScope_Restaurant(t *testing.T) {
	scope := &ResourceScope{RestaurantIDs: []int64{101, 102}}

	if MatchesScope(scope, Resource{}) {
		t.Fatal("empty resource must not match scoped restaurant ids")
	}
	if !MatchesScope(scope, Resource{RestaurantID: 101}) {
		t.Fatal("id in scope must match")
	}
	if MatchesScope(scope, Resource{RestaurantID: 999}) {
		t.Fatal("id outside scope must not match")
	}
}

func TestMatchesScope_EmptySlice(t *testing.T) {
	scope := &ResourceScope{RestaurantIDs: []int64{}}
	if MatchesScope(scope, Resource{RestaurantID: 101}) {
		t.Fatal("empty but non-nil slice must block all resources")
	}
}

func TestMatchesScope_CombinedDimensions(t *testing.T) {
	scope := &ResourceScope{
		RestaurantIDs: []int64{101},
		CityCodes:     []string{"SG-01"},
	}
	if !MatchesScope(scope, Resource{RestaurantID: 101, CityCode: "SG-01"}) {
		t.Fatal("both dimensions match must pass")
	}
	if MatchesScope(scope, Resource{RestaurantID: 101, CityCode: "SG-02"}) {
		t.Fatal("city dimension missing must block")
	}
	if MatchesScope(scope, Resource{RestaurantID: 999, CityCode: "SG-01"}) {
		t.Fatal("restaurant dimension missing must block")
	}
}

func TestCheck_GlobalRoleNoScope(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: "admin.cs", PermSet: permSet("order:refund")},
		},
	}
	if !a.CheckResource("order:refund", Resource{}) {
		t.Fatal("global role should grant global resource")
	}
	if !a.CheckResource("order:refund", Resource{RestaurantID: 101}) {
		t.Fatal("global role should grant any resource")
	}
	if a.CheckResource("order:cancel", Resource{}) {
		t.Fatal("perm not in set must deny")
	}
}

func TestCheck_ScopedRoleHit(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{
				Code:    "admin.ops",
				Scope:   &ResourceScope{RestaurantIDs: []int64{101, 102}},
				PermSet: permSet("restaurant:write"),
			},
		},
	}
	if !a.CheckResource("restaurant:write", Resource{RestaurantID: 101}) {
		t.Fatal("scoped role should allow in-scope resource")
	}
	if a.CheckResource("restaurant:write", Resource{RestaurantID: 999}) {
		t.Fatal("scoped role must deny out-of-scope resource")
	}
	if a.CheckResource("restaurant:write", Resource{}) {
		t.Fatal("scoped role must deny when resource is unspecified")
	}
}

func TestCheck_ExpiredBindingIgnored(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: "admin.cs", ExpiresAt: pastTime(), PermSet: permSet("order:refund")},
		},
	}
	if a.CheckResource("order:refund", Resource{}) {
		t.Fatal("expired binding must not grant")
	}
}

func TestCheck_FutureBindingGrants(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: "admin.cs", ExpiresAt: futureTime(), PermSet: permSet("order:refund")},
		},
	}
	if !a.CheckResource("order:refund", Resource{}) {
		t.Fatal("non-expired binding must grant")
	}
}

func TestCheck_GrantAllowExtendsRole(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: "admin.cs", PermSet: permSet("order:read")},
		},
		Grants: []Grant{
			{Perm: "order:refund", Effect: GrantEffectAllow},
		},
	}
	if !a.CheckResource("order:refund", Resource{}) {
		t.Fatal("allow grant must add permission")
	}
	if !a.CheckResource("order:read", Resource{}) {
		t.Fatal("role permission must remain intact")
	}
}

func TestCheck_DenyWinsOverRole(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: "admin.finance", PermSet: permSet("payout:read")},
		},
		Grants: []Grant{
			{Perm: "payout:read", Effect: GrantEffectDeny},
		},
	}
	if a.CheckResource("payout:read", Resource{}) {
		t.Fatal("deny grant must override role permission")
	}
}

func TestCheck_DenyWinsOverGrantAllow(t *testing.T) {
	a := &Actor{
		Grants: []Grant{
			{Perm: "order:refund", Effect: GrantEffectAllow},
			{Perm: "order:refund", Effect: GrantEffectDeny},
		},
	}
	if a.CheckResource("order:refund", Resource{}) {
		t.Fatal("deny must precede allow when both present")
	}
}

func TestCheck_ExpiredGrantIgnored(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: "admin.finance", PermSet: permSet("payout:read")},
		},
		Grants: []Grant{
			{Perm: "payout:read", Effect: GrantEffectDeny, ExpiresAt: pastTime()},
		},
	}
	if !a.CheckResource("payout:read", Resource{}) {
		t.Fatal("expired deny must not block")
	}
}

func TestCheck_AdminSuperShortCircuits(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: RoleAdminSuper, PermSet: permSet()},
		},
	}
	if !a.CheckResource("anything:anywhere", Resource{}) {
		t.Fatal("admin.super must grant any permission")
	}
	if !a.CheckResource("x:y", Resource{RestaurantID: 999}) {
		t.Fatal("admin.super must grant any resource")
	}
}

func TestCheck_AdminSuperExpiredDoesNotShortCircuit(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: RoleAdminSuper, ExpiresAt: pastTime(), PermSet: permSet()},
		},
	}
	if a.CheckResource("anything:x", Resource{}) {
		t.Fatal("expired admin.super must not short-circuit")
	}
}

func TestCheck_AdminSuperScopedDoesNotShortCircuit(t *testing.T) {
	scope := &ResourceScope{RestaurantIDs: []int64{1}}
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: RoleAdminSuper, Scope: scope, PermSet: permSet("order:read")},
		},
	}
	if a.CheckResource("anything:x", Resource{RestaurantID: 1}) {
		t.Fatal("scoped admin.super must not short-circuit")
	}
	if !a.CheckResource("order:read", Resource{RestaurantID: 1}) {
		t.Fatal("scoped admin.super should still grant its own perm set in scope")
	}
}

func TestCheck_AdminSuperIgnoresDenyGrants(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: RoleAdminSuper, PermSet: permSet()},
		},
		Grants: []Grant{
			{Perm: "order:refund", Effect: GrantEffectDeny},
		},
	}
	if !a.CheckResource("order:refund", Resource{}) {
		t.Fatal("admin.super short-circuit is intentional and must not be overridden by a revoke grant")
	}
}

func TestCheck_ScopedGrantAllow(t *testing.T) {
	a := &Actor{
		Grants: []Grant{
			{
				Perm:   "restaurant:publish",
				Effect: GrantEffectAllow,
				Scope:  &ResourceScope{RestaurantIDs: []int64{42}},
			},
		},
	}
	if !a.CheckResource("restaurant:publish", Resource{RestaurantID: 42}) {
		t.Fatal("scoped allow grant should apply in scope")
	}
	if a.CheckResource("restaurant:publish", Resource{RestaurantID: 43}) {
		t.Fatal("scoped allow grant should not apply out of scope")
	}
}

func TestCheck_ScopedDeny_OnlyBlocksInScope(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: "admin.ops", PermSet: permSet("restaurant:write")},
		},
		Grants: []Grant{
			{
				Perm:   "restaurant:write",
				Effect: GrantEffectDeny,
				Scope:  &ResourceScope{RestaurantIDs: []int64{999}},
			},
		},
	}
	if a.CheckResource("restaurant:write", Resource{RestaurantID: 999}) {
		t.Fatal("scoped deny must block in scope")
	}
	if !a.CheckResource("restaurant:write", Resource{RestaurantID: 101}) {
		t.Fatal("scoped deny must not leak outside its scope")
	}
}

func TestCheck_NilActor(t *testing.T) {
	var a *Actor
	if a.CheckResource("any", Resource{}) {
		t.Fatal("nil actor must deny")
	}
	if a.Can("any") {
		t.Fatal("nil actor Can must deny")
	}
}

func TestEffectivePermissions_AdminSuperReturnsUnion(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: RoleAdminSuper, PermSet: permSet("order:read")},
			{Code: "admin.cs", PermSet: permSet("user:write")},
		},
	}
	got := a.EffectivePermissions()
	if _, ok := got["order:read"]; !ok {
		t.Fatal("admin.super effective set should include super's perms")
	}
	if _, ok := got["user:write"]; !ok {
		t.Fatal("admin.super effective set should include other roles' perms")
	}
}

func TestEffectivePermissions_DenyRemovesFromSet(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: "admin.finance", PermSet: permSet("payout:read", "order:read")},
		},
		Grants: []Grant{
			{Perm: "payout:read", Effect: GrantEffectDeny},
		},
	}
	got := a.EffectivePermissions()
	if _, ok := got["payout:read"]; ok {
		t.Fatal("denied perm must not appear in effective set")
	}
	if _, ok := got["order:read"]; !ok {
		t.Fatal("unrelated perm must remain")
	}
}

func TestEffectivePermissions_ScopedRoleNotInEffectiveSet(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{
				Code:    "admin.ops",
				Scope:   &ResourceScope{RestaurantIDs: []int64{101}},
				PermSet: permSet("restaurant:write"),
			},
		},
	}
	got := a.EffectivePermissions()
	if _, ok := got["restaurant:write"]; ok {
		t.Fatal("scoped role must not contribute to global effective set")
	}
}

func TestCan_LegacyBehavior(t *testing.T) {
	a := &Actor{
		Permissions: permSet("order:read"),
	}
	if !a.Can("order:read") {
		t.Fatal("Can must still honor legacy Permissions field")
	}
	if a.Can("order:refund") {
		t.Fatal("Can must reject missing perm")
	}
}

func TestCan_AdminSuperBinding(t *testing.T) {
	a := &Actor{
		RoleBindings: []RoleBinding{
			{Code: RoleAdminSuper, PermSet: permSet()},
		},
	}
	if !a.Can("anything:anywhere") {
		t.Fatal("admin.super binding must short-circuit Can")
	}
}
