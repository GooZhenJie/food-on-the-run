---
name: monorepo-shared
description: >-
  Layout and conventions for packages/shared — TypeScript shared by apps/web and apps/admin.
  Must be applied when adding, renaming, moving, or deleting any file under packages/shared/.
  Mirrors each app's src/utils/ mental model; apps/server (Go) does not use this package.
---

# Monorepo shared — `packages/shared`

## Role

- Workspace package **`@food/shared`** (`packages/shared/`), depended on with `"workspace:*"` from `apps/web` and/or `apps/admin`.
- **`apps/server`** is Go; shared Go code stays under `apps/server/`, not here.

## Layout (aligned with `apps/*/src/utils/`)

```
packages/shared/
├── package.json
└── src/
    └── utils/              # pure helpers — same role as apps/*/src/utils/
        └── cn.ts           # Tailwind class merge (clsx + tailwind-merge)
```

| What | Where |
| --- | --- |
| Pure function / helper needed by **both** web and admin | `packages/shared/src/utils/<name>.ts` |
| Tailwind `cn()` | `packages/shared/src/utils/cn.ts` — `import { cn } from '@food/shared'` |

Do **not** place arbitrary `.ts` files loose under `packages/shared/src/` — keep **`src/utils/`** as the single bucket for shared pure utilities so it stays consistent with `apps/web/src/utils/` and `apps/admin/src/utils/`.

## `package.json`

- List runtime deps that **this package's source** imports (e.g. `clsx`, `tailwind-merge` for `cn`).
- Keep **`exports`** pointing at real paths under `src/` (Umi bundles workspace TypeScript).

## Do not

- ❌ Put shared **React components** here unless the team deliberately adds React to this package and both apps agree — default is components stay under each app's `src/components/`.
- ❌ Copy the same helper into `apps/web/src/utils/` **and** `apps/admin/src/utils/` when both need it — **lift** one implementation to `packages/shared/src/utils/`.

## Checklist

- [ ] New shared helper lives under `packages/shared/src/utils/<name>.ts`
- [ ] `exports` updated when adding a new public entry (besides the root `cn` barrel if you split later)
- [ ] Root `package.json` / lockfile updated after `pnpm install` if dependencies changed
