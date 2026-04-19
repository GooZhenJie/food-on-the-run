---
name: directory-structure
description: >-
  Enforces file and folder placement rules for apps/web/ — the customer-facing
  UmiJS + React app. Use immediately when:
  1. Adding, renaming, moving, or deleting any file or folder under apps/web/src/;
  2. Creating a new page route in apps/web;
  3. Deciding where to place a new component (page-level vs shared).

  Do NOT use this skill for apps/admin/ — see the sibling skill
  `directory-structure-admin` for the admin console.
---

# Directory Structure — apps/web (customer)

## Source Tree

```
apps/web/src/
├── layouts/              # global layout wrappers (route-level)
├── pages/                # every <page>/index.tsx here = one route
│   └── <page>/           # REQUIRED directory form — no flat .tsx allowed
│       ├── index.tsx     # the route file
│       ├── hooks.ts      # optional — page-level hooks
│       ├── utils.ts      # optional — page-level utilities
│       ├── type.d.ts     # optional — page-level types
│       └── components/   # optional — components private to this page
│           └── ComponentName/
│               ├── index.tsx
│               └── ...   # see component-conventions skill
├── components/           # shared components (used by 2+ pages)
│   └── ComponentName/
├── services/             # API call functions — one file per resource
│   └── restaurants.ts
├── mock/                 # mock data for development
│   ├── api.ts            # route → mock response mapping
│   └── *.ts              # data fixtures
└── utils/                # pure utility functions, no side effects
```

---

## Placement Rules

| What | Where |
|---|---|
| Page route file | `src/pages/<page>/index.tsx` (directory form is required — flat `.tsx` is forbidden) |
| Component used only on one page | `src/pages/<page>/components/ComponentName/` |
| Component shared across 2+ pages | `src/components/ComponentName/` |
| API fetch function for a resource | `src/services/<resource>.ts` |
| Mock data fixture | `src/mock/<resource>.ts` |
| Mock route map | `src/mock/api.ts` |
| Pure utility/helper | `src/utils/index.ts` or `src/utils/<name>.ts` |

---

## Page Files

- A page lives in its own directory: `src/pages/<page>/index.tsx`
- Flat page files (`src/pages/<page>.tsx`) are **forbidden**, even for one-line routes.
  The directory form is the single canonical layout — it removes the "when do I
  upgrade to a folder?" decision and lets a page grow `hooks.ts`, `utils.ts`,
  `type.d.ts`, `components/` without any rename.
- Pages must use `export default` for the route component (Umi requires it)
- All **other** components must use named exports — see `component-conventions` skill

```
✅ src/pages/dashboard/index.tsx    — route /dashboard
✅ src/pages/restaurant/index.tsx   — route /restaurant
❌ src/pages/restaurant.tsx         — flat file, forbidden
❌ src/pages/dashboard/helpers.tsx  — not a route, should be in utils/ or components/
```

---

## Routes in `.umirc.ts` — Must Stay in Sync

Every page under `src/pages/` that is referenced by a route in
`apps/web/.umirc.ts` is tied to its file path by the `component` field.

```ts
// .umirc.ts
routes: [
  { path: "/",          component: "home"       },  // resolves to src/pages/home/index.tsx
  { path: "/login",     component: "login"      },  // resolves to src/pages/login/index.tsx
  { path: "/restaurant",component: "restaurant" },  // resolves to src/pages/restaurant/index.tsx
]
```

**Rule: any of the following actions must update `.umirc.ts` in the same change:**

| File action | `.umirc.ts` action |
|---|---|
| Rename `src/pages/<old>/` → `src/pages/<new>/` | Update `component: "<old>"` → `component: "<new>"` |
| Delete a page directory | Remove the matching route entry |
| Add a new page | Create `src/pages/<name>/index.tsx` and add a matching route entry |

**Failure symptom:** `fatal - Error: Cannot find module './<name>' from '.../src/pages'` on `umi dev`.
If you see this, the first thing to check is whether a page was renamed / moved without
updating `.umirc.ts`.

---

## File Count Limit

- Single file must not exceed **500 lines**
- If a page grows beyond 500 lines, extract sub-components into `components/`

---

## Forbidden Patterns

```
❌ src/pages/login.tsx                  — flat page file, must be src/pages/login/index.tsx
❌ src/components/MyComponent.tsx       — flat component file, must use a directory
❌ src/pages/index/Button.tsx           — non-route file at pages level
❌ src/pages/utils.ts                   — utils belong in src/utils/
❌ src/components/ComponentA/ComponentB.tsx  — nested flat file, ComponentB needs its own dir
```

---

## Page Directory Naming — Strict kebab-case

Page directory names under `src/pages/` are **route segments** (the folder name
IS the URL path segment), so they must be:

- **All lowercase**
- **Single word**, OR **hyphenated** if multi-word
- **Never** concatenated English compounds (`signup`, `forgotpassword`, `userprofile`)
- **Never** camelCase, PascalCase, or snake_case

```
✅ src/pages/login/               — single word
✅ src/pages/home/                — single word
✅ src/pages/sign-up/             — compound, hyphenated
✅ src/pages/forgot-password/     — compound, hyphenated
✅ src/pages/user-profile/        — compound, hyphenated
✅ src/pages/order-history/       — compound, hyphenated

❌ src/pages/signup/              — compound without hyphen
❌ src/pages/forgotpassword/      — compound without hyphen
❌ src/pages/userProfile/         — camelCase
❌ src/pages/UserProfile/         — PascalCase (that's for components)
❌ src/pages/user_profile/        — snake_case
```

The same rule applies to the `path:` value in `.umirc.ts` (`/sign-up`, not
`/signup`) and to any string literal identifying that route (mock API keys,
`fetchPublicPageSchema('/sign-up')`, `to="/sign-up"`, `matchPaths: ['/sign-up']`).

**Quick test:** if the folder name contains two English words mashed together,
it's wrong. Insert a hyphen.

---

## Naming Audit — Mandatory Step Before Any Pages Change

Before adding, renaming, or reviewing any file under `src/pages/`, run a
one-line audit on existing siblings:

```
ls apps/web/src/pages
```

For every entry that violates the kebab-case rule above, **stop and report it
to the user in the same response**. Do not silently skip them. The goal is to
never let the user be the one who notices `signup/` sitting next to `home/`.

Report format:

> Naming issues found in `apps/web/src/pages/`:
> - `signup/` → should be `sign-up/` (compound without hyphen)
>
> Want me to fix these in the same change?

---

## Auto-generated Directories — Never Touch

```
src/.umi/             — regenerated on every dev start
src/.umi-production/  — regenerated on every build
```

---

## Adding a New Page — Checklist

- [ ] Directory created at `src/pages/<page>/` with `index.tsx` inside (no flat `.tsx`)
- [ ] Page component uses `export default`
- [ ] Private components extracted to `src/pages/<page>/components/ComponentName/`
- [ ] Page-level hooks/utils/types go in sibling `hooks.ts` / `utils.ts` / `type.d.ts` (not inline, not in `src/utils/` unless truly shared)
- [ ] File stays under 500 lines
- [ ] Matching route entry added to `apps/web/.umirc.ts`

## Renaming / Moving / Deleting a Page — Checklist

- [ ] Every call site updated (grep the old path before moving)
- [ ] `apps/web/.umirc.ts` `routes` updated — `component` field must match the new path
- [ ] Old directory / file removed (not just emptied)
- [ ] `umi dev` starts without `MODULE_NOT_FOUND`

## Adding a New Component — Checklist

- [ ] Placed in `src/components/` (shared) or `src/pages/<page>/components/` (page-private)
- [ ] Lives in its own directory `ComponentName/`
- [ ] Follows `component-conventions` skill for file layout and exports

---

## Sibling Skill

For the internal admin console (`apps/admin/`), use `directory-structure-admin`
instead. Rules are similar in spirit but differ in layout primitives, route
organization, and component granularity.
