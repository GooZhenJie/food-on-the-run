# 2026-05-27 — Umi 4 Access Control Migration

## 任务
将 admin 权限管理从手工 `allowedRoles` 过滤迁移到 Umi 4 原生 access 机制。

## 改动文件
- `apps/admin/.umirc.ts` — 启用 `@umijs/plugins/dist/initial-state` 和 `@umijs/plugins/dist/access`，路由加 `access` 字段
- `apps/admin/src/app.tsx` — 新增 `getInitialState` export
- `apps/admin/src/access.ts` — 新增，定义 `canManageUsers / canManagePermissions / canManageSchemas`
- `apps/admin/src/components/AdminLayout/type.d.ts` — `allowedRoles` 替换为 `accessKey`
- `apps/admin/src/components/AdminLayout/index.tsx` — `useAccess()` 替换手工 `getCurrentUser().role` 过滤
- `apps/admin/src/pages/login/index.tsx` — 登录成功后调用 `setInitialState` 保持 access 实时生效

## 关键设计决策
- `access.ts` 是纯函数，易于单测
- 路由级 `access` 字段防止 merchant 直接 URL 访问受保护页面
- `setInitialState` 在登录时调用，确保 SPA 内切换账号时 access 规则立即更新

## 踩坑
- 第一次跳过 pre-coding guard 直接编码，导致走了「临时方案 → 正式方案」两轮，浪费一次迭代

## 结论
LGTM，无 MUST_FIX
