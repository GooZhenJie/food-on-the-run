---
name: ui-design-system
description: >-
  Enforces the FOTR visual design system — big-tech consumer-app aesthetic
  (Grab / Uber / DoorDash) in an orange brand palette. Load immediately and
  without prompting when:
  1. Creating any new user-facing page under `apps/web/src/pages/`;
  2. Creating any new user-facing component under `apps/web/src/components/` or `apps/web/src/pages/<page>/components/`;
  3. Restyling, refactoring, or redesigning an existing page/component;
  4. Using Ant Design elements (Button, Input, Form, Table, Modal, Drawer, etc.).
  Non-negotiable: the antd theme lives in ONE place (`src/theme/antdTheme.ts`)
  and is applied globally via `src/app.tsx`. Never create a local
  `<ConfigProvider>` that overrides theme tokens.
---

# UI Design System — Food on the Run

## Hard Guarantees (don't break these)

The design system is enforced by **shared infrastructure**, not by memory.
If a new page / component does the following, it will automatically look
consistent with the rest of the app:

1. **Use antd components** (`Button`, `Input`, `Form`, `Table`, `Modal`…).
   The global theme in `src/app.tsx` applies orange primary, Inter font,
   52 px large controls, pill-shaped buttons, and 12–16 px radius
   automatically — **no per-page configuration needed**.
2. **Use Tailwind only for layout / spacing / color** — never for element sizing that antd already handles.
3. **Never add a `<ConfigProvider>` inside a page or component.** The global one is the single source of truth.
4. **Use the shared layout wrappers** (`AuthLayout` for auth; default `layouts/index.tsx` for the rest).

If you obey these four rules, the rest of this skill is about the last 10%
polish.

---

## Design Philosophy

Reference: Grab, Uber Eats, DoorDash. Key principles:

1. **Clarity over cleverness** — large readable text, obvious primary actions
2. **Single confident CTA per view** — one orange pill button, everything else secondary
3. **Generous whitespace** — content breathes; never cram
4. **Rounded everything** — 12–16 px on inputs/cards, fully rounded pills on buttons
5. **Brand orange, used sparingly** — as accent / primary action, not as background flood
6. **Mobile-first** — design at 375 px width first, scale up

---

## Single Source of Truth

| File | What it owns |
|---|---|
| `apps/web/src/theme/antdTheme.ts` | All antd theme tokens (colors, radius, sizes, font). **Never edit the values anywhere else.** Exports `BRAND_COLORS`, `FONT_STACK`, `fotrAntdTheme`. |
| `apps/web/src/app.tsx` | Wraps the whole app with `<ConfigProvider theme={fotrAntdTheme}>`. |
| `apps/web/src/components/AuthLayout/index.tsx` | Auth-flow page shell (centered single column, brand header, legal footer). |
| `apps/web/src/layouts/index.tsx` | Global site layout (top nav + outlet) for non-auth pages. |

**If you need a new brand color or a new shared size, edit `antdTheme.ts`** — do not hard-code hex values inside pages or components.

---

## Brand Colors

Import from `@/theme/antdTheme`:

```ts
import { BRAND_COLORS } from '@/theme/antdTheme';
```

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `primary` | `#F97316` | `orange-500` | Primary buttons, active states, key accents |
| `primaryHover` | `#EA580C` | `orange-600` | Button hover, link hover |
| `primaryActive` | `#C2410C` | `orange-700` | Button active, link visited |
| `primarySoft` | `#FFF7ED` | `orange-50` | Badge backgrounds, subtle highlights |
| `textPrimary` | `#111827` | `gray-900` | Headings, body text |
| `textSecondary` | `#6B7280` | `gray-500` | Subtitles, captions, placeholders |
| `textMuted` | `#9CA3AF` | `gray-400` | Timestamps, dividers, disabled |
| `border` | `#E5E7EB` | `gray-200` | Input / card borders |
| `borderStrong` | `#D1D5DB` | `gray-300` | Hover borders |
| `surface` | `#FFFFFF` | `white` | Page / card background |
| `surfaceAlt` | `#F9FAFB` | `gray-50` | Hover states, subtle sections, table header |
| `success` | `#16A34A` | `green-600` | Order confirmed, payment success |
| `warning` | `#F59E0B` | `amber-500` | Alerts |
| `danger` | `#DC2626` | `red-600` | Errors, destructive actions |

**Never** use green as the primary action color — that's Grab's brand, not ours.
**Never** use gradients as full-page backgrounds. A single brand block or header stripe is fine.

---

## Typography

Font stack is already applied globally via `fotrAntdTheme.token.fontFamily`.
You don't need to set `font-family` anywhere.

| Role | Tailwind | Weight | Notes |
|---|---|---|---|
| Display / Page title | `text-[28px] sm:text-[32px]` | `font-bold` | `leading-tight tracking-tight` |
| Section title | `text-xl sm:text-2xl` | `font-bold` | — |
| Card title | `text-base sm:text-lg` | `font-semibold` | — |
| Body | `text-[15px]` | `font-normal` | `leading-relaxed` for long prose |
| Small / caption | `text-[13px]` | `font-normal` | `text-gray-500` |
| Overline (dividers) | `text-[12px] uppercase tracking-wider` | `font-medium` | `text-gray-400` |

---

## Spacing & Sizing

- **Container widths**: `max-w-[420px]` (forms), `max-w-2xl` (content pages), `max-w-5xl` (detail), `max-w-7xl` (lists, dashboards, admin)
- **Page padding**: `px-4 py-6 sm:px-6 sm:py-8` (lists); `px-5 py-10 sm:py-16` (auth/forms)
- **Card padding**: `p-5 sm:p-6`
- **Form field gap**: rely on antd `Form.Item` default — do NOT add extra margin
- **Input / button height**: **52 px** (size="large"), **40 px** (default) — set globally in the theme, don't override
- **Touch target**: never smaller than 44 × 44 px

---

## Border Radius

All handled by the global theme — just pick the right antd component / Tailwind class.

| Element | Radius | Source |
|---|---|---|
| antd Button (large) | pill (9999) | Global — automatic |
| antd Button (default) | pill (9999) | Global — automatic |
| antd Input / Select / DatePicker | 14 px | Global — automatic |
| antd Card / Modal / Drawer | 16 px | Global — automatic |
| Custom divs (cards, badges, thumbnails) | `rounded-xl` / `rounded-2xl` | Tailwind |
| Avatars | `rounded-full` | Tailwind |

**Never** apply `!rounded-*` overrides to antd components — the theme is correct. Fix the theme instead.

---

## Shadows

Keep shadows subtle. Primary buttons have `shadow: none` globally.

| Use | Class |
|---|---|
| Resting card | `shadow-sm` |
| Hover / lifted card | `shadow-md` |
| Dropdowns / popovers | `shadow-lg` |
| Modals | antd default |

**Never** `shadow-xl` or `shadow-2xl` in regular UI.

---

## Ant Design Integration

### Component picker

| Situation | Use |
|---|---|
| Forms, inputs, selects, date pickers | antd (`Form`, `Input`, `Select`, `DatePicker`) |
| Tables — admin, data views | antd `Table` |
| Modals, drawers, popconfirms | antd (`Modal`, `Drawer`, `Popconfirm`) |
| Toasts / notifications | antd `message` / `notification` (never browser `alert()`) |
| Tabs | antd `Tabs` |
| Dropdown menus | antd `Dropdown` |
| Primary CTA | antd `Button type="primary" size="large"` |
| Layout (flex, grid, page composition) | **Tailwind only** |
| Simple badges, pills, brand blocks | **Tailwind only** (native elements) |
| Social / OAuth buttons | Native `<button>` + Tailwind — see `OAuthButtons` |

**Do not** mix `Space`, `Row/Col` with Tailwind flex/grid in the same subtree.
Prefer Tailwind for layout.

### Button rules

The global theme already gives you:
- 52 px height (large) / 40 px (default)
- Pill radius
- Font-weight 600
- No shadow

You only need:

```tsx
// Primary CTA — exactly one per view
<Button type="primary" size="large" block>Confirm</Button>

// Secondary — bordered, same height, same radius
<Button size="large">Cancel</Button>

// Danger
<Button danger size="large">Delete</Button>

// Text / link-style
<Button type="link">Learn more</Button>
```

**Never** add `!rounded-full` or `!font-semibold` — already global.
**Never** more than one `type="primary"` in the same view.

### Form rules

- `<Form layout="vertical" requiredMark={false}>` — labels above inputs, no asterisks
- **No prefix icons inside inputs** — cleaner, matches Grab/Uber look
- Secondary actions (e.g. "Forgot?") sit **inline with the label**, right-aligned
- Use `hasFeedback` on password / validation-heavy fields
- Extract non-trivial validators to `src/utils/<domain>.ts` (see `validatePassword`)
- Submit button is the last `Form.Item` with `className="!mb-0"`

---

## Layout Patterns (copy these exactly)

### 1. Auth flow (login, sign-up, forgot password)

Use `<AuthLayout>`. Reference: `src/components/AuthLayout/index.tsx`,
`src/pages/login/index.tsx`, `src/pages/sign-up/index.tsx`.

### 2. List / browse page (restaurants, users, orders)

```tsx
export default function UsersPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-[15px] text-gray-500 mt-1">Manage your team members</p>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />}>
          Add user
        </Button>
      </header>

      {/* filter bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        ...filters...
      </div>

      {/* content: antd Table for data, or a Tailwind grid of cards */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <Table ... />
      </div>
    </div>
  );
}
```

### 3. Detail page (restaurant, user profile, order)

```tsx
<div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
  {/* hero */}
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <img className="w-full h-56 object-cover" src="..." alt="" />
    <div className="p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900">Title</h1>
      <p className="text-[15px] text-gray-500 mt-1">Subtitle</p>
    </div>
  </div>

  {/* sections */}
  <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Section</h2>
    ...
  </section>
</div>
```

### 4. Admin / dashboard form

```tsx
<div className="max-w-2xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
  <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit user</h1>
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
    <Form layout="vertical" requiredMark={false} size="large">
      ...Form.Items...
      <div className="flex gap-3 justify-end mt-2">
        <Button size="large">Cancel</Button>
        <Button type="primary" size="large" htmlType="submit">Save changes</Button>
      </div>
    </Form>
  </div>
</div>
```

### 5. Data table (antd Table)

```tsx
<Table
  dataSource={rows}
  columns={columns}
  rowKey="id"
  pagination={{ pageSize: 20, showSizeChanger: false }}
  className="bg-white rounded-2xl overflow-hidden"
/>
```

The global theme already styles the header background (`surfaceAlt`) and radius (12).

### 6. Empty state

```tsx
<div className="flex flex-col items-center py-16 text-gray-400">
  <span className="text-5xl mb-3">📭</span>
  <p className="text-sm">No items yet.</p>
  <Button type="primary" size="large" className="mt-4">Add the first one</Button>
</div>
```

---

## Mobile Responsiveness

| Breakpoint | Tailwind | Design intent |
|---|---|---|
| < 640 px | (default) | Single column, edge-to-edge `px-4` |
| ≥ 640 px | `sm:` | Tighter typography, show secondary elements |
| ≥ 768 px | `md:` | Two-column where appropriate |
| ≥ 1024 px | `lg:` | Full desktop layout, nav bars visible |

- On mobile, OAuth buttons show icon-only (hide label with `hidden sm:inline`)
- On mobile, page headers may collapse to logo-only
- Never horizontal-scroll on mobile — wrap or stack. Tables that don't fit: use `overflow-x-auto` on the wrapper.

---

## Motion & Feedback

- Interactive elements: `transition-colors` or `transition-all` (150–200 ms)
- Pressed state on custom buttons: `active:scale-[0.98]`
- Loading: antd `loading` prop, or inline spinner

```tsx
<span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
```

- Success / error: antd `message.success()` / `message.error()` — never `alert()`

---

## Forbidden Patterns

```tsx
// ❌ Local ConfigProvider — breaks the single source of truth
<ConfigProvider theme={{ token: { colorPrimary: '...' } }}>...</ConfigProvider>

// ❌ Overriding theme values on individual components
<Button className="!rounded-full">        // already global
<Input className="!h-[52px]">             // already global
<Button style={{ background: '#F97316' }}> // use type="primary" instead

// ❌ Hard-coded brand hex outside antdTheme.ts
<div className="bg-[#F97316]">  // use bg-orange-500 OR pull from BRAND_COLORS

// ❌ Full-page gradient background
<div className="bg-gradient-to-br from-amber-400 to-red-500 min-h-screen">

// ❌ Square inputs / buttons
<Button className="!rounded-none">

// ❌ Prefix icons inside text inputs on auth / public forms
<Input prefix={<MailOutlined />} />

// ❌ Multiple primary buttons per view
<Button type="primary">Save</Button>
<Button type="primary">Share</Button>

// ❌ Heavy shadows
<div className="shadow-xl">

// ❌ Browser alerts
alert('Saved');

// ❌ Mixing antd layout + Tailwind layout
<Row><Col><div className="flex gap-4">...</div></Col></Row>

// ❌ SCSS / CSS Modules
import styles from './index.module.scss';

// ❌ Inline styles for color / spacing / layout
<div style={{ marginTop: 16, color: '#F97316' }}>
```

---

## Reference Implementations

| Pattern | File |
|---|---|
| Global theme tokens | `apps/web/src/theme/antdTheme.ts` |
| Global `ConfigProvider` | `apps/web/src/app.tsx` |
| Auth page shell | `apps/web/src/components/AuthLayout/index.tsx` |
| Auth form | `apps/web/src/pages/login/index.tsx`, `apps/web/src/pages/sign-up/index.tsx` |
| OAuth button row | `apps/web/src/components/OAuthButtons/index.tsx` |
| List + filter bar + card grid | `apps/web/src/pages/home/index.tsx` |

---

## Checklist — New Page

- [ ] No `<ConfigProvider>` in the file (theme is global)
- [ ] Uses `<AuthLayout>` for auth, otherwise inherits `layouts/index.tsx`
- [ ] Picked a layout pattern from the "Layout Patterns" section above
- [ ] Uses antd for inputs / tables / modals; Tailwind only for layout
- [ ] Exactly one `type="primary"` button
- [ ] `size="large"` on all form inputs and primary buttons
- [ ] No hard-coded brand hex values (use `BRAND_COLORS` or `orange-500`)
- [ ] Mobile-safe at 375 px width — no horizontal scroll
- [ ] Toasts via antd `message`
- [ ] No `!rounded-*` / `!h-*` overrides on antd components

## Checklist — New Component

- [ ] Uses antd for form / feedback / overlay primitives
- [ ] Uses Tailwind for layout, spacing, color
- [ ] No local theme overrides
- [ ] Respects `BRAND_COLORS` tokens
- [ ] Responsive — collapses on mobile
- [ ] Named export (no `export default`) — see `component-conventions`

## Checklist — Changing the Design System

- [ ] Token change goes in `src/theme/antdTheme.ts` ONLY
- [ ] If a new shared color is needed, add it to `BRAND_COLORS`
- [ ] Update this skill's "Brand Colors" table to match
- [ ] Verify existing auth pages still render correctly (visual regression by eye)
