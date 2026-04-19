---
name: ui-design-system
description: >-
  Enforces the FOTR visual design system across BOTH `apps/web` (consumer,
  mobile-first, Grab / Uber / DoorDash aesthetic) and `apps/admin` (back-office,
  desktop-first but mobile-usable, Shopify / Linear / Stripe aesthetic). Load
  immediately and without prompting when:
  1. Creating or modifying any page/component under `apps/web/src/`;
  2. Creating or modifying any page/component under `apps/admin/src/`;
  3. Restyling, refactoring, or redesigning existing UI in either app;
  4. Using any Ant Design element (`Button`, `Input`, `Form`, `Table`, `Drawer`, `Modal`, `Menu`, `Sider`, …).
  Both apps share brand colors, antd integration rules, the single-source
  `ConfigProvider` rule, and the three hard responsive rules. They differ in
  density, typography scale, control sizes, and layout wrapper. The "App
  Variants" matrix below is the branching point — read it first, then follow
  the shared rules, then the app-specific subsections.
---

# UI Design System — Food on the Run

One skill, two apps. Shared foundations first, app-specific variants second.

---

## Hard Guarantees (don't break these, both apps)

The design system is enforced by **shared infrastructure**, not by memory. Obey these four rules and the rest of this skill is about the last 10% polish.

1. **Use antd components** (`Button`, `Input`, `Form`, `Table`, `Modal`, `Drawer`, `Menu`…). The global theme auto-applies orange primary, Inter font, app-appropriate sizes and radius — **no per-page configuration needed**.
2. **Tailwind for layout / spacing / color only** — never for element sizing antd already owns.
3. **Never add a `<ConfigProvider>` inside a page or component.** The global one in `src/app.tsx` is the single source of truth.
4. **Always render through the app's shared shell** — `AuthLayout` or default `layouts/index.tsx` for web; `AdminLayout` for admin. Never roll your own `<Layout><Sider>...` shell.

---

## App Variants (pick one subtree, then apply shared rules)

| | **`apps/web` — consumer** | **`apps/admin` — back-office** |
|---|---|---|
| Reference aesthetic | Grab, Uber Eats, DoorDash | Shopify Admin, Linear, Stripe Dashboard |
| Primary user | end customer | internal ops / support |
| **Primary viewport** | phone (375 px) | desktop (1280 px+) |
| **Minimum supported viewport** | phone (375 px) | phone (375 px) — still usable |
| Information density | low, generous whitespace | high, many columns per row |
| Control height (default / large) | 40 / **52** px | 32 / 40 px |
| Button shape | **pill (fully rounded)** | square-ish (6–10 px radius) |
| Input / Card radius | 14 / 16 px | 8 / 10 px |
| Page title | `text-[28px] sm:text-[32px] font-bold` | `text-xl font-semibold` |
| Primary CTA size | `size="large"` | **default size** (no `large`) |
| Layout shell | `AuthLayout` / default `layouts/index.tsx` | `AdminLayout` |
| Theme file | `apps/web/src/theme/antdTheme.ts` (`fotrAntdTheme`) | `apps/admin/src/theme/antdTheme.ts` (`adminAntdTheme`) |
| Sidebar nav | — (top nav only) | yes (`Menu` in `Sider`, hamburger Drawer on mobile) |

**Rule of thumb:** consumer scales UP from phone; admin scales DOWN from desktop. Both must work at 375 px.

---

## Three Hard Responsive Rules (both apps)

These apply to every page in both apps, but they matter **most** in admin because admin is table-and-drawer-heavy. A PR that violates them should be sent back.

### Rule 1 — Every `<Table>` must have `scroll={{ x: 'max-content' }}`

Admin tables have 5+ columns; consumer tables are rare but when they exist they follow the same rule. The **page** must never scroll horizontally — the table does.

```tsx
<Table<Row>
  rowKey="id"
  columns={columns}
  dataSource={rows}
  pagination={{ pageSize: 20 }}
  scroll={{ x: 'max-content' }}
/>
```

Additionally, **pin the action column** when the table has more than 4 columns:

```ts
{
  title: 'Actions',
  key: 'actions',
  width: 160,
  align: 'right',
  fixed: 'right',
  render: (_, row) => <Space>...</Space>,
}
```

Pin the first identity column (`Code`, `ID`, `Name`) with `fixed: 'left'` when the table has 7+ columns.

### Rule 2 — Every `<Drawer>` / wide `<Modal>` must have a fluid width

Fixed `width={720}` breaks on any phone. Use a CSS `min()` expression — antd forwards string widths straight to CSS.

```tsx
// ✅ desktop = 720, phone = 100vw
<Drawer width="min(720px, 100vw)" ...>

// ✅ conditional two-mode drawer
<Drawer width={step === 'review' ? 'min(960px, 100vw)' : 'min(640px, 100vw)'} ...>

// ❌ clips on any viewport narrower than the fixed px
<Drawer width={720} ...>
```

Same rule for `<Modal width=...>`.

### Rule 3 — Every filter / page-header row must wrap

Fixed-width `<Search>` + `<Select>` add up to > 375 px and overflow.

```tsx
// ✅ wraps on narrow, inline on wide
<Space className="mb-4" size="middle" wrap>
  <Search className="w-full sm:w-[280px]" onSearch={setKeyword} />
  <Select className="w-full sm:w-[180px]" options={...} onChange={setRole} />
</Space>

// ✅ page header — title line wraps, CTA drops below on narrow
<div className="flex flex-wrap gap-3 items-start md:items-center justify-between mb-6">
  <div>
    <h1>Restaurants</h1>
    <p className="text-sm text-gray-500">...</p>
  </div>
  <Button type="primary">Add restaurant</Button>
</div>

// ❌ fixed widths, no wrap → overflows on phone
<Space size="middle">
  <Search style={{ width: 280 }} />
  <Select style={{ width: 180 }} />
</Space>
```

---

## Single Source of Truth

Each app has its own theme file with its own density tokens. The **structure** is identical; the **values** differ per the variants matrix above.

| App | Theme file | `ConfigProvider` mount |
|---|---|---|
| `apps/web` | `apps/web/src/theme/antdTheme.ts` (`fotrAntdTheme`) | `apps/web/src/app.tsx` |
| `apps/admin` | `apps/admin/src/theme/antdTheme.ts` (`adminAntdTheme`) | `apps/admin/src/app.tsx` |

**If you need a new brand color or shared size → edit the right `antdTheme.ts`.** Do not hard-code hex in pages or components. Do not wrap individual pages in a second `<ConfigProvider>`.

---

## Brand Colors (shared across both apps)

Import from `@/theme/antdTheme`:

```ts
import { BRAND_COLORS } from '@/theme/antdTheme';
```

| Token | Hex | Tailwind | Usage |
|---|---|---|---|
| `primary` | `#F97316` | `orange-500` | Primary buttons, active menu item, key accents |
| `primaryHover` | `#EA580C` | `orange-600` | Hover states, link hover |
| `primaryActive` | `#C2410C` | `orange-700` | Pressed states |
| `primarySoft` | `#FFF7ED` | `orange-50` | Tag backgrounds, subtle highlights |
| `textPrimary` | `#111827` | `gray-900` | Body text |
| `textSecondary` | `#6B7280` | `gray-500` | Subtitles, captions, placeholders |
| `textMuted` | `#9CA3AF` | `gray-400` | Timestamps, disabled |
| `border` | `#E5E7EB` | `gray-200` | Input / card / row borders |
| `borderStrong` | `#D1D5DB` | `gray-300` | Hover borders |
| `surface` | `#FFFFFF` | `white` | Page / card background |
| `surfaceAlt` | `#F9FAFB` | `gray-50` | Table header, hover, subtle sections |
| `success` | `#16A34A` | `green-600` | Confirmed, success |
| `warning` | `#F59E0B` | `amber-500` | Alerts |
| `danger` | `#DC2626` | `red-600` | Errors, destructive actions |
| `sidebarBg` *(admin only)* | `#0F172A` | `slate-900` | Admin sidebar background |
| `sidebarText` *(admin only)* | `#CBD5E1` | `slate-300` | Admin sidebar inactive text |

**Never** use green as the primary action color (Grab's brand, not ours). **Never** use gradients as full-page backgrounds.

---

## Typography

Font stack is already applied globally in both apps. You don't need to set `font-family` anywhere.

| Role | `apps/web` (consumer) | `apps/admin` (back-office) |
|---|---|---|
| Page title | `text-[28px] sm:text-[32px] font-bold leading-tight tracking-tight` | `text-xl font-semibold text-gray-900 mb-1` |
| Section title | `text-xl sm:text-2xl font-bold` | `text-base font-semibold` |
| Card title | `text-base sm:text-lg font-semibold` | `text-base font-semibold` |
| Body | `text-[15px] font-normal` (`leading-relaxed` for long prose) | `text-sm font-normal` (14 px antd default) |
| Caption / small | `text-[13px] text-gray-500` | `text-xs text-gray-500` |
| Overline | `text-[12px] uppercase tracking-wider font-medium text-gray-400` | same as web |
| Inline code / IDs | — | `<code className="text-xs">` (monospace) |

**Don't cross streams:** admin pages must not reach for consumer-scale `text-3xl` page titles; consumer pages must not shrink to admin-scale `text-xl` titles.

---

## Spacing & Sizing

| | `apps/web` | `apps/admin` |
|---|---|---|
| Container widths | `max-w-[420px]` (forms), `max-w-2xl` (content), `max-w-5xl` (detail), `max-w-7xl` (lists/dashboards) | full-bleed inside `AdminLayout`'s content area; single-column forms use `max-w-2xl` |
| Page padding | `px-4 py-6 sm:px-6 sm:py-8` (lists); `px-5 py-10 sm:py-16` (auth/forms) | owned by `AdminLayout` (`p-4 md:p-6`); pages **do not** repeat padding |
| Card padding | `p-5 sm:p-6` | antd `<Card>` default (24) — don't override |
| Control height | 40 (default) / **52** (large) | 32 (default) / 40 (large) / 24 (small) |
| Touch target | ≥ 44 × 44 px | ≥ 32 × 32 px (icon-only buttons need `aria-label`) |
| Form field gap | antd `Form.Item` default — don't add extra margin | same |

---

## Border Radius

All handled by the global theme — pick the right component / Tailwind class.

| Element | `apps/web` | `apps/admin` |
|---|---|---|
| antd `Button` (any size) | pill (9999) — automatic | 6–8 px square-ish — automatic |
| antd `Input` / `Select` / `DatePicker` | 14 — automatic | 8 — automatic |
| antd `Card` / `Modal` / `Drawer` | 16 — automatic | 10 — automatic |
| Custom divs (cards, badges) | `rounded-xl` / `rounded-2xl` | `rounded-md` / `rounded-lg` |
| Avatars | `rounded-full` | `rounded-full` |

**Never** apply `!rounded-*` overrides to antd components — the theme is correct. Fix the theme instead.

---

## Shadows (both apps)

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

### Component picker (both apps)

| Situation | Use |
|---|---|
| Forms, inputs, selects, date pickers | antd (`Form`, `Input`, `Select`, `DatePicker`) |
| Data tables | antd `Table` + Rule 1 |
| Slide-over edits | antd `Drawer` + Rule 2 |
| Destructive confirms | antd `Modal.confirm` / `Popconfirm` |
| Toasts | antd `message` / `notification` — never browser `alert()` |
| Tabs | antd `Tabs` |
| Row overflow actions | antd `Dropdown` with `<Button type="text" icon={<MoreOutlined />} aria-label="More actions" />` |
| Nav (admin sidebar) | antd `Menu` (admin only) — already themed |
| Layout (flex, grid, page composition) | **Tailwind only** |
| Badges / status pills | antd `Tag` |
| Simple brand blocks / thumbnails | native elements + Tailwind |
| Social / OAuth buttons (web) | native `<button>` + Tailwind — see `OAuthButtons` |

**Do not** mix `Space` / `Row` / `Col` with Tailwind flex/grid in the same subtree. Prefer Tailwind for page-level layout; use `Space` to group controls.

### Button rules

The global theme handles heights, radius, font-weight (500 admin / 600 web) and no shadow. You only supply the variant.

```tsx
// apps/web — large pill, one per view
<Button type="primary" size="large" block>Confirm</Button>
<Button size="large">Cancel</Button>
<Button danger size="large">Delete</Button>
<Button type="link">Learn more</Button>

// apps/admin — default size, square-ish, one per view
<Button type="primary" icon={<PlusOutlined />}>Add restaurant</Button>
<Button size="small" type="link" icon={<EditOutlined />}>Edit</Button>
<Button size="small" type="link" danger icon={<DeleteOutlined />}>Delete</Button>
<Button size="small" type="text" icon={<MoreOutlined />} aria-label="More actions" />
```

**Never** add `!rounded-full` / `!font-semibold` — already global.
**Never** more than one `type="primary"` per view.
**Never** `size="large"` in admin — that's consumer scale.

### Form rules (both apps)

- `<Form layout="vertical" requiredMark={false}>` — labels above inputs, no asterisks
- **No prefix icons inside inputs on web auth forms** — cleaner, matches Grab/Uber look
- Secondary actions (e.g. "Forgot?") sit **inline with the label**, right-aligned
- Use `hasFeedback` on password / validation-heavy fields
- Extract non-trivial validators to `src/utils/<domain>.ts`
- Submit button is the last `Form.Item` with `className="!mb-0"`
- Consumer forms: `size="large"`. Admin forms: default size.

### Table rules (both apps — critical for admin)

```tsx
// Admin list page — 5+ columns, fixed actions, horizontal scroll
const columns: ColumnsType<Row> = [
  { title: 'ID', dataIndex: 'id', key: 'id', width: 120, fixed: 'left' },
  { title: 'Name', dataIndex: 'name', key: 'name' },
  { title: 'Status', dataIndex: 'status', key: 'status', width: 120,
    render: (s) => <Tag color={STATUS_COLORS[s]}>{s}</Tag>,
  },
  { title: 'Created', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: 'Actions', key: 'actions', width: 160, align: 'right', fixed: 'right',
    render: (_, row) => (
      <Space size="small">
        <Button size="small" type="link" icon={<EditOutlined />}>Edit</Button>
        <Button size="small" type="link" danger icon={<DeleteOutlined />}>Delete</Button>
      </Space>
    ),
  },
];

<Table<Row>
  rowKey="id"
  columns={columns}
  dataSource={rows}
  loading={loading}
  pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `${t} items` }}
  scroll={{ x: 'max-content' }}
/>
```

When a row has 4+ actions, collapse the tail into a `<Dropdown>` `<MoreOutlined />` menu.

### Drawer rules (both apps)

```tsx
<Drawer
  title={`Edit — ${user.name}`}
  width="min(720px, 100vw)"
  open={open}
  onClose={onClose}
  extra={<Button type="primary" onClick={save}>Save</Button>}
>
  <Form layout="vertical" requiredMark={false}>...</Form>
</Drawer>
```

---

## Layout Patterns

### Web — Auth flow (login, sign-up, forgot password)

Use `<AuthLayout>`. Reference: `apps/web/src/components/AuthLayout/index.tsx`, `apps/web/src/pages/login/index.tsx`, `apps/web/src/pages/sign-up/index.tsx`.

### Web — List / browse page

```tsx
<div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
  <header className="flex flex-wrap gap-3 items-start sm:items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Users</h1>
      <p className="text-[15px] text-gray-500 mt-1">Manage your team members</p>
    </div>
    <Button type="primary" size="large" icon={<PlusOutlined />}>Add user</Button>
  </header>

  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
    {/* filters — Rule 3 */}
  </div>

  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <Table ... scroll={{ x: 'max-content' }} />
  </div>
</div>
```

### Web — Detail page

```tsx
<div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
    <img className="w-full h-56 object-cover" src="..." alt="" />
    <div className="p-5 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900">Title</h1>
      <p className="text-[15px] text-gray-500 mt-1">Subtitle</p>
    </div>
  </div>
  <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sm:p-6">
    <h2 className="text-lg font-semibold text-gray-900 mb-4">Section</h2>
    ...
  </section>
</div>
```

### Admin — List page (filter bar + table)

```tsx
export default function RestaurantsPage() {
  return (
    <div>
      <div className="flex flex-wrap gap-3 items-start md:items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 mb-1">Restaurants</h1>
          <p className="text-sm text-gray-500">Onboard, review, moderate restaurants.</p>
        </div>
        <Button type="primary" icon={<PlusOutlined />}>Add restaurant</Button>
      </div>

      <Space className="mb-4" size="middle" wrap>
        <Search className="w-full sm:w-[280px]" onSearch={setKeyword} />
        <Select className="w-full sm:w-[180px]" options={STATUS_FILTER_OPTIONS} onChange={setStatus} />
      </Space>

      <Table<Row>
        rowKey="id"
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 20 }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
}
```

### Admin — Detail / edit form

```tsx
<div className="max-w-2xl">
  <h1 className="text-xl font-semibold text-gray-900 mb-6">Edit restaurant</h1>
  <Card>
    <Form layout="vertical" requiredMark={false}>
      ...Form.Items...
      <div className="flex gap-3 justify-end mt-2">
        <Button>Cancel</Button>
        <Button type="primary" htmlType="submit">Save changes</Button>
      </div>
    </Form>
  </Card>
</div>
```

### Admin — Tabbed page

```tsx
<div>
  <div className="mb-6">
    <h1 className="text-xl font-semibold text-gray-900 mb-1">Permissions</h1>
    <p className="text-sm text-gray-500">Manage personas and RBAC roles.</p>
  </div>
  <Tabs defaultActiveKey="users" items={[...]} />
</div>
```

### Destructive confirm (both apps)

```tsx
Modal.confirm({
  title: 'Delete this role?',
  icon: <ExclamationCircleFilled />,
  content: 'This action cannot be undone.',
  okText: 'Delete',
  okButtonProps: { danger: true },
  cancelText: 'Cancel',
  async onOk() { await remove(); },
});
```

### Empty state (both apps)

```tsx
<div className="flex flex-col items-center py-16 text-gray-400">
  <span className="text-5xl mb-3">📭</span>
  <p className="text-sm">No items yet.</p>
  <Button type="primary" className="mt-4">Add the first one</Button>
</div>
```

---

## Mobile Responsiveness

Breakpoints match Tailwind / antd `Grid`:

| Breakpoint | Tailwind | antd `Grid.useBreakpoint()` | Web behavior | Admin behavior |
|---|---|---|---|---|
| < 640 px | (default) | `screens.sm === false` | Single column, `px-4` | Sider → hamburger + Drawer, `p-4`, tables scroll, filters wrap, drawers fill 100 vw |
| ≥ 640 px | `sm:` | `screens.sm === true` | Tighter typography, show secondary elements | still mobile layout in admin |
| ≥ 768 px | `md:` | `screens.md === true` | Two-column where appropriate | Desktop layout. Sider visible 220 px. Content `md:p-6` |
| ≥ 1024 px | `lg:` | `screens.lg === true` | Full desktop, nav bars visible | comfortable admin desktop |
| ≥ 1280 px | `xl:` | `screens.xl === true` | — | Multi-column details, side-by-side forms |

Universal rules:

- **Never** horizontal-scroll the whole page. Tables scroll internally via Rule 1; content wraps via Rule 3.
- **Never** cap the global screen width with `max-w-*` on `<body>` or on any layout shell. Ops teams on 32" displays use multiple panels side-by-side; consumer users on ultrawides still deserve fluid content.
- On mobile web, OAuth button labels hide with `hidden sm:inline`.
- On mobile admin, `AdminLayout` owns the hamburger / Drawer nav — pages do **not** re-implement this.

---

## Motion & Feedback (both apps)

- Interactive elements: `transition-colors` (150 ms)
- Pressed state on custom buttons: `active:scale-[0.98]`
- Loading: antd `loading` prop on `Button` / `Table`; `<Spin />` for full-section loading
- Success / error: antd `message.success()` / `message.error()` — never `alert()`
- Destructive actions always via `Modal.confirm` or `<Popconfirm>`

---

## Forbidden Patterns (both apps, unless noted)

```tsx
// ❌ Local ConfigProvider — breaks the single source of truth
<ConfigProvider theme={{ token: { colorPrimary: '...' } }}>...</ConfigProvider>

// ❌ Fixed drawer / wide modal width — breaks Rule 2
<Drawer width={720} ...>
<Modal width={960} ...>

// ❌ Table without horizontal scroll — breaks Rule 1
<Table columns={columns} dataSource={rows} />

// ❌ Action column without fixed: 'right' on wide tables — scrolls off-screen
{ title: 'Actions', key: 'actions', align: 'right', render: (...) => ... }

// ❌ Filter row with fixed widths and no wrap — breaks Rule 3
<Space size="middle">
  <Search style={{ width: 280 }} />
  <Select style={{ width: 180 }} />
</Space>

// ❌ Overriding theme values on individual components
<Button className="!rounded-full">        // already global (web)
<Input className="!h-[52px]">             // already global (web)
<Button style={{ background: '#F97316' }}> // use type="primary" instead

// ❌ Hard-coded brand hex outside antdTheme.ts
<div className="bg-[#F97316]">

// ❌ Full-page gradient background
<div className="bg-gradient-to-br from-amber-400 to-red-500 min-h-screen">

// ❌ Square inputs / buttons in web (admin buttons ARE square — that's fine)
<Button className="!rounded-none">  // don't do this in web

// ❌ Consumer-scale typography in admin
<h1 className="text-3xl sm:text-4xl font-bold">  // in admin, use text-xl

// ❌ Admin-scale typography in web
<h1 className="text-xl font-semibold">  // in web, use text-2xl/3xl

// ❌ size="large" primary button in admin
<Button type="primary" size="large">Save</Button>

// ❌ Multiple primary buttons per view (either app)
<Button type="primary">Save</Button>
<Button type="primary">Share</Button>

// ❌ Heavy shadows
<div className="shadow-xl">

// ❌ Browser alerts
alert('Saved');

// ❌ Rolling your own shell in admin — use AdminLayout
<Layout><Sider>...</Sider><Content>{children}</Content></Layout>

// ❌ Capping the whole viewport
<body className="max-w-[1440px] mx-auto">

// ❌ Mixing antd layout + Tailwind layout
<Row><Col><div className="flex gap-4">...</div></Col></Row>

// ❌ SCSS / CSS Modules
import styles from './index.module.scss';

// ❌ Inline styles for static layout/spacing/color (see component-conventions)
<div style={{ marginTop: 16, color: '#F97316' }}>
```

---

## Reference Implementations

| Pattern | App | File |
|---|---|---|
| Global theme tokens | web | `apps/web/src/theme/antdTheme.ts` |
| Global theme tokens | admin | `apps/admin/src/theme/antdTheme.ts` |
| Global `ConfigProvider` | web | `apps/web/src/app.tsx` |
| Global `ConfigProvider` | admin | `apps/admin/src/app.tsx` |
| Auth page shell | web | `apps/web/src/components/AuthLayout/index.tsx` |
| Auth form | web | `apps/web/src/pages/login/index.tsx` |
| OAuth button row | web | `apps/web/src/components/OAuthButtons/index.tsx` |
| List + filter bar + card grid | web | `apps/web/src/pages/home/index.tsx` |
| Responsive shell (Sider + mobile Drawer + sticky Header) | admin | `apps/admin/src/components/AdminLayout/index.tsx` |
| List page — filter bar + table (Rules 1 & 3) | admin | `apps/admin/src/pages/permissions/index.tsx` |
| Table inside a drawer (Rules 1 & 2) | admin | `apps/admin/src/pages/permissions/components/UserGrantsDrawer/index.tsx` |
| Fluid-width drawer | admin | `apps/admin/src/pages/permissions/components/RolesDrawer/index.tsx` |
| Page header with wrapping CTA | admin | `apps/admin/src/pages/restaurants/index.tsx` |

---

## Checklist — New Page (shared)

- [ ] No `<ConfigProvider>` in the file (theme is global)
- [ ] Renders inside the app's shared layout shell (don't roll your own)
- [ ] Exactly one `type="primary"` button per view
- [ ] Every `<Table>` has `scroll={{ x: 'max-content' }}` (Rule 1)
- [ ] Actions column uses `fixed: 'right'` when table has > 4 columns (Rule 1)
- [ ] Every `<Drawer>` / wide `<Modal>` uses `width="min(Npx, 100vw)"` (Rule 2)
- [ ] Page-header row uses `flex flex-wrap gap-3 items-start md:items-center` (Rule 3)
- [ ] Filter row uses `<Space wrap>` with `w-full sm:w-[Npx]` on each control (Rule 3)
- [ ] No hard-coded brand hex values (use `BRAND_COLORS` or `orange-500`)
- [ ] Mobile-safe at 375 px width — no horizontal page scroll
- [ ] Destructive actions confirmed via `Modal.confirm` or `Popconfirm`
- [ ] Toasts via antd `message` (never `alert`)
- [ ] No `!rounded-*` / `!h-*` overrides on antd components

## Checklist — New Web Page (additions to shared)

- [ ] Page title is consumer-scale (`text-2xl sm:text-3xl font-bold`)
- [ ] Primary CTA uses `size="large"`
- [ ] Forms use `size="large"`
- [ ] Pill radius preserved (no admin-style square overrides)

## Checklist — New Admin Page (additions to shared)

- [ ] Renders inside `<AdminLayout>` (not a rolled-up `<Layout>`)
- [ ] Page title is admin-scale (`text-xl font-semibold`, not `text-3xl`)
- [ ] Primary CTA uses default size (not `size="large"`)
- [ ] First identity column uses `fixed: 'left'` when table has 7+ columns

## Checklist — New Component (both apps)

- [ ] Uses antd for form / feedback / overlay primitives
- [ ] Uses Tailwind for layout, spacing, color
- [ ] No local theme overrides
- [ ] Respects `BRAND_COLORS` tokens
- [ ] Responsive — collapses or scrolls internally on narrow viewports
- [ ] Named export (no `export default`) — see `component-conventions`

## Checklist — Changing the Design System

- [ ] Token change goes in the right `antdTheme.ts` only (web OR admin, not both unless intentional)
- [ ] If a new shared color is needed, add it to `BRAND_COLORS`
- [ ] Update the "Brand Colors" table above to match
- [ ] Verify existing pages still render at 375 / 768 / 1280 px
