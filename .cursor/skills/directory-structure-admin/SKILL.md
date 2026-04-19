---
name: directory-structure-admin
description: >-
  Enforces file and folder placement rules for apps/admin/ — the internal
  back-office console (UmiJS + React + antd + Tailwind). Use immediately when:
  1. Adding, renaming, moving, or deleting any file or folder under apps/admin/src/;
  2. Creating a new admin route;
  3. Deciding where to place a new component (module-private vs shared).

  Do NOT use this skill for apps/web/ — see the sibling skill
  `directory-structure` for the consumer app.
---

# Directory Structure — apps/admin (back-office)

## Source Tree

```
apps/admin/src/
├── layouts/
│   ├── index.tsx         # AdminLayout — sidebar + top bar, wraps authed routes
│   └── AuthLayout/       # full-bleed login layout (no sidebar)
├── pages/                # every <module>/index.tsx here = one route
│   └── <module>/         # REQUIRED directory form — no flat .tsx allowed
│       ├── index.tsx     # module list page (the route file)
│       ├── hooks.ts      # optional — module-level hooks
│       ├── utils.ts      # optional — module-level utilities
│       ├── type.d.ts     # optional — module-level types
│       ├── detail/       # sub-route: <module>/detail/index.tsx
│       │   └── index.tsx
│       └── components/   # components private to this module
│           └── ComponentName/
│               ├── index.tsx
│               └── ...   # see component-conventions skill
├── components/           # shared across 2+ modules
│   ├── DataTable/        # standard paginated table wrapper
│   ├── FilterBar/        # standard filter strip above tables
│   ├── FormDrawer/       # standard slide-over form
│   └── ComponentName/
├── services/             # API call functions — one file per resource
│   └── restaurants.ts    # hits /api/admin/restaurants/*
├── mock/
│   ├── api.ts
│   └── *.ts
├── hooks/                # admin-only hooks (usePagination, useTableParams, …)
├── theme/                # antd theme config — single source of truth
└── utils/                # pure utility functions, no side effects
```

TypeScript shared **only** between `apps/web` and `apps/admin` lives in **`packages/shared`** (`@food/shared`), with the same **`src/utils/`** mental model as this tree — see **`monorepo-shared`** skill (single source of truth). **`apps/server`** is Go and does not use this package.

---

## Placement Rules

| What | Where |
|---|---|
| Route file | `src/pages/<module>/index.tsx` (directory form is required — flat `.tsx` is forbidden) |
| Sub-route of a module | `src/pages/<module>/<subroute>/index.tsx` |
| Component used only in one module | `src/pages/<module>/components/ComponentName/` |
| Component shared across 2+ modules | `src/components/ComponentName/` |
| API fetch function for a resource | `src/services/<resource>.ts` (hits `/api/admin/<resource>/*`) |
| Admin-only reusable hook | `src/hooks/<name>.ts` |
| Mock fixture | `src/mock/<resource>.ts` |
| Pure utility/helper | `src/utils/<name>.ts` |
| Pure TS helper needed by **web and admin** | `packages/shared/src/utils/<name>.ts` — see **`monorepo-shared`** |

---

## Module Organization

Admin pages are organized by **backend resource**, not by user flow:

```
✅ src/pages/restaurants/index.tsx        — list restaurants
✅ src/pages/restaurants/detail/index.tsx — restaurant detail + edit
✅ src/pages/orders/index.tsx             — list orders
✅ src/pages/users/index.tsx              — list users
✅ src/pages/feature-flags/index.tsx      — feature flags
❌ src/pages/restaurant-review.tsx        — verb-based page, fold into restaurants/ as a tab or action
```

Every admin module typically has a `List` page and a `Detail` page. Extract a
shared sub-component whenever the same visual block appears in both.

---

## Page Files

- A page lives in its own directory: `src/pages/<module>/index.tsx`
- Flat page files (`src/pages/<module>.tsx`) are **forbidden**, even for a
  one-line route. The directory form is the single canonical layout — it
  removes the "when do I upgrade to a folder?" decision and lets a module grow
  `hooks.ts`, `utils.ts`, `type.d.ts`, `detail/`, `components/` without any rename.
- Pages must use `export default` for the route component (Umi requires it)
- All **other** components must use named exports — see `component-conventions`

```
✅ src/pages/orders/index.tsx      — route /orders
✅ src/pages/login/index.tsx       — route /login (AuthLayout)
❌ src/pages/login.tsx             — flat file, forbidden
❌ src/pages/orders/helpers.tsx    — not a route, move to utils/ or components/
```

---

## Routes in `.umirc.ts` — Must Stay in Sync

Every page under `src/pages/` that is referenced by a route in
`apps/admin/.umirc.ts` is tied to its file path by the `component` field.

```ts
// apps/admin/.umirc.ts
routes: [
  { path: "/login",       component: "login",       layout: false },  // src/pages/login/index.tsx
  { path: "/",            component: "dashboard"                  },  // src/pages/dashboard/index.tsx
  { path: "/restaurants", component: "restaurants"                },  // src/pages/restaurants/index.tsx
  { path: "/orders",      component: "orders"                     },  // src/pages/orders/index.tsx
]
```

**Rule: any of the following actions must update `.umirc.ts` in the same change:**

| File action | `.umirc.ts` action |
|---|---|
| Rename `src/pages/<old>/` → `src/pages/<new>/` | Update `component: "<old>"` → `component: "<new>"` |
| Delete a page directory | Remove the matching route entry |
| Add a new page | Create `src/pages/<name>/index.tsx` and add a matching route entry |

---

## Shared Table / Form Primitives

Admin modules are table-heavy. To avoid copy-paste, funnel all lists and forms
through these primitives:

| Primitive | Location | Purpose |
|---|---|---|
| `DataTable` | `src/components/DataTable/` | pagination, sort, row actions wrapper around antd `<Table>` |
| `FilterBar` | `src/components/FilterBar/` | standard filter strip above tables |
| `FormDrawer` | `src/components/FormDrawer/` | standard slide-over edit form |

**Rule:** a new list page must not re-implement pagination or filter logic
inline. Extend the primitive (new prop, new column type) instead.

---

## File Count Limit

- Single file must not exceed **500 lines**
- Admin detail pages tend to grow — extract Section components early:
  `pages/<module>/detail/components/<SectionName>/`

---

## Forbidden Patterns

```
❌ src/pages/orders.tsx                       — flat page file, must be src/pages/orders/index.tsx
❌ src/components/MyComponent.tsx             — flat component file, must use a directory
❌ src/pages/index/Button.tsx                 — non-route file at pages level
❌ src/pages/utils.ts                         — utils belong in src/utils/
❌ src/pages/<module>/Table.tsx               — module-private component without its own dir
❌ multiple <ConfigProvider> with theme overrides — theme lives only in src/app.tsx
```

---

## Module Directory Naming — Strict kebab-case

Module directory names under `src/pages/` are **route segments** (the folder
name IS the URL path segment), so they must be:

- **All lowercase**
- **Single word**, OR **hyphenated** if multi-word
- **Never** concatenated English compounds (`featureflags`, `rideprofiles`)
- **Never** camelCase, PascalCase, or snake_case

```
✅ src/pages/orders/              — single word
✅ src/pages/restaurants/         — single word
✅ src/pages/feature-flags/       — compound, hyphenated
✅ src/pages/rider-profiles/      — compound, hyphenated
✅ src/pages/audit-logs/          — compound, hyphenated

❌ src/pages/featureflags/        — compound without hyphen
❌ src/pages/riderProfiles/       — camelCase
❌ src/pages/RiderProfiles/       — PascalCase (that's for components)
❌ src/pages/rider_profiles/      — snake_case
```

The same rule applies to the `path:` value in `apps/admin/.umirc.ts` and to
every string literal identifying that route (API paths, navigation links, etc.).

**Quick test:** if the folder name contains two English words mashed together,
it's wrong. Insert a hyphen.

---

## Naming Audit — Mandatory Step Before Any Pages Change

Before adding, renaming, or reviewing any file under `src/pages/`, run a
one-line audit on existing siblings:

```
ls apps/admin/src/pages
```

For every entry that violates the kebab-case rule above, **stop and report it
to the user in the same response**. Do not silently skip them. The goal is to
never let the user be the one who notices `featureflags/` sitting next to `orders/`.

Report format:

> Naming issues found in `apps/admin/src/pages/`:
> - `featureflags/` → should be `feature-flags/` (compound without hyphen)
>
> Want me to fix these in the same change?

---

## Auto-generated Directories — Never Touch

```
src/.umi/             — regenerated on every dev start
src/.umi-production/  — regenerated on every build
```

---

## Adding a New Module (List + Detail) — Checklist

- [ ] `src/pages/<module>/index.tsx` created — list page, `export default`
- [ ] `src/pages/<module>/detail/index.tsx` created (if applicable)
- [ ] List uses `DataTable` primitive — no inline pagination state
- [ ] Edit form uses `FormDrawer` primitive
- [ ] Module-private components in `src/pages/<module>/components/<Name>/`
- [ ] Service file at `src/services/<module>.ts`, calls `/api/admin/<resource>/*`
- [ ] Route entries added to `apps/admin/.umirc.ts`
- [ ] Every file stays under 500 lines

## Renaming / Moving / Deleting a Page — Checklist

- [ ] Every call site updated (grep the old path before moving)
- [ ] `apps/admin/.umirc.ts` `routes` updated — `component` field matches the new path
- [ ] Old directory / file removed (not just emptied)
- [ ] `umi dev` starts without `MODULE_NOT_FOUND`

## Adding a New Component — Checklist

- [ ] Placed in `src/components/` (shared) or `src/pages/<module>/components/` (module-private)
- [ ] Lives in its own directory `ComponentName/`
- [ ] Follows `component-conventions` skill for file layout and exports

---

## Sibling Skill

For the consumer-facing app (`apps/web/`), use `directory-structure` instead.
