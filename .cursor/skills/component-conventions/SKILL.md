---
name: component-conventions
description: >-
  Enforces component creation, modification, and deletion conventions for the food-on-the-run (FOTR) web app.
  Must be applied immediately and without user prompting when:
  1. Creating any new component file (index.tsx, new tsx component, extracting a sub-component);
  2. Modifying an existing component file (refactoring props, adjusting render structure);
  3. Deleting a component or moving/renaming its files.
  Core constraints: named exports only (no export default); Tailwind for styles (no SCSS/CSS modules);
  shared/context types in type.d.ts, local props types may be inline; hooks in hooks.ts;
  component directory follows ComponentName/index.tsx structure.
---

# Component Conventions — FOTR Web App

## Tech Stack

- **Styling**: Tailwind CSS only. No SCSS, no CSS Modules.
- **Inline styles**: Acceptable only for values that Tailwind cannot express (e.g., ECharts `style={{ height: 260 }}`). Do not use for spacing, color, or layout.
- **No `classnames` package** — use template literals for conditional class merging: `` `base-class ${condition ? 'extra' : ''}` ``

## Directory Structure

Most components live in their **own directory**:

```
ComponentName/
├── index.tsx      # required — named export(s)
├── type.d.ts      # for shared / context-level types; local props types may be inline
├── hooks.ts       # optional — custom hooks only
├── utils.ts       # optional — pure utility functions
├── config.ts      # optional — constants and configuration owned by this component
├── mock.ts        # optional — preview fixtures / sample props owned by this component
├── context.ts     # optional — React context + useXxx context hook
└── components/    # optional — private sub-components
```

**Schema components** (under `Render/schemaComponents/`) follow the same directory structure as any other component: `ComponentName/index.tsx` with co-located `type.d.ts` and `mock.ts` (preview fixtures). Their `mock.ts` must be typed against the component's own `type.d.ts` via the `IComponentFixtures<TData>` contract in `Render/preview/fixtures.ts`.

**Location:** see `directory-structure` skill — briefly, page-private components live under `src/pages/<page>/components/`, shared ones under `src/components/`.

## Ownership: Where to Put Config, Mock, and Schema JSON

Co-location is about **ownership**, not proximity. A file belongs next to whoever **owns** it — i.e., whoever would break if that file disappeared.

| What | Owner | Location |
|---|---|---|
| Props fixtures for a component (`IComponentFixtures<TData>`) | the component | `ComponentName/mock.ts` |
| Constants / enum options / defaults used only by one component | the component | `ComponentName/config.ts` |
| Default page schema JSON for a specific page (dev-time fallback, seed data) | the **page**, not any component | `src/pages/<page>/schema.ts` |
| Page-private constants (header copy, feature flags local to this page) | the page | `src/pages/<page>/config.ts` |
| Cross-page shared constants (API base URL, cuisine list, global enums) | the app | `src/config/` or `src/constants/` |
| Cross-page mock data for dev-time seeding (no real backend yet) | the app | `src/mock/` |

**Key rule — never put a consumer's config inside a reusable component.** A schema component (e.g., `AuthForm`) is reusable across many pages. Putting `loginPageSchema.ts` under `AuthForm/` would bind a reusable component to a specific consumer, which breaks reuse.

```
// ❌ wrong — AuthForm does not own the login page schema
schemaComponents/AuthForm/loginPageSchema.ts

// ✅ right — login page owns its own default schema
pages/login/schema.ts
```

**Rule of thumb:** if deleting the page/component should also delete the file, they live together. If the file would outlive the page/component, it belongs higher up (`src/config/`, `src/mock/`).

## Export Rules

```ts
// ✅ always use named exports
export const MyComponent: React.FC<IMyComponentProps> = (props) => { ... };

// ❌ never default-export components
export default MyComponent;
```

## Types

- **Local props interfaces** (only used inside the component file) may be declared inline at the top of `index.tsx`.
- **Shared types** — anything used by a `context.ts`, a parent component, or another file — must live in `type.d.ts`.

```ts
// ✅ inline in index.tsx — used only here
interface ICardProps {
  title: string;
  subtitle?: string;
}

// ✅ in type.d.ts — consumed by context.ts and parent
export interface IServiceContextValue {
  data: unknown;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}
```

## Hooks

Custom hooks (`useXxx`) that contain non-trivial logic must be extracted to `hooks.ts`:

```ts
// hooks.ts
export const useMyLogic = () => { ... };
```

Simple one-liner hooks or standard `useState`/`useEffect` calls may stay inline in `index.tsx`.

## Context

When a component needs to share state with descendants, follow the pattern:

```ts
// context.ts
import { createContext, useContext } from 'react';
import type { IMyContextValue } from './type';

export const MyContext = createContext<IMyContextValue | null>(null);

export const useMyContext = (): IMyContextValue => {
  const ctx = useContext(MyContext);
  if (!ctx) throw new Error('useMyContext must be used inside <MyComponent>');
  return ctx;
};
```

## Storage Keys

Use the `__fotr_` prefix for any `localStorage` / `sessionStorage` keys:

```ts
const STORAGE_KEY = '__fotr_<feature>__';
```

## Creating a Component — Checklist

- [ ] Directory created under the correct location (page-level vs shared)
- [ ] `export const` used — no `export default`
- [ ] Shared / context types are in `type.d.ts`
- [ ] Hooks with non-trivial logic extracted to `hooks.ts`
- [ ] Constants / fixtures placed by **ownership** — component-owned → `config.ts` / `mock.ts`; page-owned → `pages/<page>/config.ts` or `schema.ts`; app-owned → `src/config/` or `src/mock/`
- [ ] Styling done with Tailwind; inline styles only for dynamic/chart values
- [ ] Context (if needed) in `context.ts` with a typed `useXxx` hook

## Modifying a Component — Checklist

- [ ] No new `export default` introduced
- [ ] If types now need to be shared, move them to `type.d.ts`
- [ ] No SCSS or CSS Modules added
- [ ] Inline styles not added for layout/spacing/color (Tailwind instead)
- [ ] Do **not** fix pre-existing lint errors unrelated to the current change

## Deleting a Component — Checklist

- [ ] Grep all import sites before deleting
- [ ] Remove the entire `ComponentName/` directory (not just `index.tsx`)
- [ ] Remove any barrel re-exports (e.g., entries in `componentMap.ts`)
- [ ] Remove all import statements at call sites

## Import Direction — No Reverse Imports

**A parent must never import anything from its child's directory.** Types, styles, functions, variables, constants, config, and context defined inside a child component belong exclusively to that child.

```
src/components/
├── Parent/
│   ├── index.tsx
│   └── components/
│       └── Child/
│           ├── index.tsx
│           ├── type.d.ts
│           ├── hooks.ts
│           └── config.ts
```

```ts
// ❌ reverse import — Parent reaching into Child's internals
import { useChildLogic } from '@/components/Parent/components/Child/hooks';
import { CHILD_CONFIG } from '@/components/Parent/components/Child/config';
import type { IChildState } from '@/components/Parent/components/Child/type';

// ✅ Parent may only import the Child component itself
import { Child } from '@/components/Parent/components/Child';
```

If a parent genuinely needs something currently defined inside a child, **lift it up**: move that type / function / constant / context to the parent level (or to a shared location) so the dependency flows downward only.

```
// Before — wrong direction
Child/config.ts  ←  Parent/index.tsx  ❌

// After — lift up
Parent/config.ts  →  Child/index.tsx  ✅
```

This rule applies at every nesting level: grandparent → parent → child → grandchild.

## Forbidden Patterns

```ts
// ❌ default export
export default MyComponent;

// ❌ SCSS / CSS Modules
import styles from './index.module.scss';

// ❌ inline styles for layout/spacing/color
<div style={{ marginTop: 8, color: '#333' }}>

// ❌ shared types declared inline in index.tsx when consumed elsewhere
// (move to type.d.ts)
interface IMyContextValue { ... }
export const MyContext = createContext<IMyContextValue | null>(null);

// ❌ parent importing child internals (reverse import)
import { useChildLogic } from './components/Child/hooks';
import type { IChildConfig } from './components/Child/type';

// ❌ consumer-specific config placed inside a reusable component
// (LoginPage owns this schema, not AuthForm)
schemaComponents/AuthForm/loginPageSchema.ts

// ✅ consumer owns its own config
pages/login/schema.ts
```
