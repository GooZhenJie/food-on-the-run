# Resume Alignment Tasks — Demo Readiness

> 目标：确保 FOTR 项目在展示时能覆盖 Resume 中提到的技术能力点。
> 生成日期：2026-05-26
> 展示日期：2026-05-27

---

## 项目现状总览

### ✅ 已完成

| 模块 | 已有功能 |
|------|---------|
| **Go Server** | Auth (注册/登录/刷新/登出)、RBAC (角色/权限/用户角色)、Page Schema CRUD、用户管理、商家端点 (餐厅列表/订单/状态更新)、Audit 中间件 |
| **Web App** | 登录/注册页、首页 (轮播/菜系快捷/餐厅列表)、餐厅详情页 (Schema-driven)、Dashboard (ECharts)、Schema 渲染引擎、集中式数据服务层 (Service/Filter/Refresh) |
| **Admin App** | 登录、Dashboard、餐厅管理 (CRUD+Drawer)、用户管理、订单管理、权限管理 (角色/权限/授权)、Schema 管理 (发布/版本/预览) |
| **DB Migrations** | 37个迁移覆盖: users, addresses, restaurants, menu, orders, deliveries, payments, carts, reviews, promotions, notifications, favorites, RBAC 等 |

### ❌ 缺失（需补齐）

核心用户流程（点餐 → 下单 → 支付 → 取餐）尚未在前端串通。

---

## 优先级任务列表

### P0 — 必须完成（核心展示流程）

> 没有这些，项目无法作为完整 demo 展示。

| # | 任务 | Resume 对应点 | 涉及模块 | 预估工时 |
|---|------|--------------|---------|---------|
| 1 | **菜单 API + 前端菜单页面** — 后端 menu handler (CRUD)、前端餐厅详情中展示菜品列表 | 全栈 CRUD 能力 | Server + Web | 2h |
| 2 | **购物车功能** — 后端 cart handler、前端购物车页面 (增删改数量、小计) | 全栈流程 | Server + Web | 2h |
| 3 | **下单流程** — 后端 order create、前端结算页 → 生成订单 | 状态流转/工作流 | Server + Web | 2h |
| 4 | **订单状态追踪 (Web)** — 顾客端"我的订单"页面，展示订单状态流转 (待确认→准备中→可取餐→完成) | 订单状态机 | Web | 1.5h |
| 5 | **支付模拟** — 简单的支付确认流程 (模拟支付，不需真实网关) | 支付流程能力 | Server + Web | 1h |

**P0 合计预估：~8.5h**

---

### P1 — 高优先级（展示加分项）

> 能明显增强展示效果，体现架构/技术深度。

| # | 任务 | Resume 对应点 | 涉及模块 | 预估工时 |
|---|------|--------------|---------|---------|
| 6 | **Admin ECharts Dashboard 增强** — 完善订单统计图表 (趋势图/饼图/地图)，用真实数据 | ECharts 5 可视化 | Admin + Server | 1.5h |
| 7 | **Admin 多级筛选器** — 订单/餐厅列表支持多条件联动筛选 (状态+时间+金额+餐厅) | 多级联动筛选器 | Admin | 1.5h |
| 8 | **QR Code 取餐码** — 订单完成后生成 QR Code，商家扫码确认取餐 | QR Code 验证 | Web + Server | 1h |
| 9 | **集中式 Service 层 Demo 讲解** — 确保 Service/Filter/Refresh 组件运行良好，可在展示时讲解架构 | 集中式数据服务层 | Web | 0.5h |
| 10 | **Batch Refresh 演示** — Dashboard 页面多图表同时加载，统一 loading 状态 | 批量刷新协调 | Web | 0.5h |

**P1 合计预估：~5h**

---

### P2 — 中优先级（技术栈完整性）

> 体现 Resume 中提到的技术栈广度。

| # | 任务 | Resume 对应点 | 涉及模块 | 预估工时 |
|---|------|--------------|---------|---------|
| 11 | **Docker Compose 完整化** — 确保 `docker-compose up` 能一键启动 (Go + PostgreSQL + Redis) | Docker 容器化 | DevOps | 1h |
| 12 | **Redis 集成** — 会话存储 或 菜单缓存 (至少有一个实际用途) | Redis | Server | 1.5h |
| 13 | **Excel 数据导出** — Admin 订单列表/用户列表支持导出 Excel | Excel 导入/导出 | Admin | 1h |
| 14 | **通知系统 UI** — 简单的站内通知列表 (订单状态变更通知) | 通知系统 (FCM) | Web + Server | 1.5h |
| 15 | **评价系统** — 订单完成后可评价，餐厅详情显示评分 | 全栈 CRUD | Web + Server | 1.5h |

**P2 合计预估：~6.5h**

---

### P3 — 低优先级（锦上添花）

> 时间充裕时再做，或作为"未来规划"展示。

| # | 任务 | Resume 对应点 | 涉及模块 | 预估工时 |
|---|------|--------------|---------|---------|
| 16 | **富文本编辑器** — 餐厅描述/公告使用富文本 | CKEditor 富文本 | Admin | 1h |
| 17 | **收据 PDF 生成** — 订单完成后可下载 PDF 收据 | 附件/PDF 生成 | Server + Web | 1.5h |
| 18 | **DVA/Redux 状态管理** — 全局购物车/用户状态使用 DVA model | DVA/Redux | Web | 1h |
| 19 | **Schema 渲染引擎深度演示** — 准备不同 schema 配置切换展示，体现"无需发版改变布局" | JSON Schema 渲染引擎 | Web + Admin | 0.5h |
| 20 | **Turborepo 构建演示** — 展示 monorepo 并行构建效率 | Turborepo + pnpm | DevOps | 0.5h |

**P3 合计预估：~4.5h**

---

## 建议展示路线（Demo Script）

```
1. 项目架构概述 (Monorepo: pnpm + Turborepo)
   └── 展示代码结构：apps/web, apps/admin, apps/server, packages/shared

2. 顾客端核心流程 (apps/web)
   ├── 首页 → 浏览餐厅 → 查看菜单
   ├── 加入购物车 → 结算 → 支付 → 生成订单
   ├── 订单追踪 (状态实时更新)
   └── QR Code 取餐码

3. 商家端操作 (Merchant Portal)
   ├── 查看待处理订单
   ├── 更新订单状态 (确认 → 准备中 → 可取餐)
   └── 扫码确认取餐

4. 管理后台 (apps/admin)
   ├── Dashboard (ECharts 多图表 + 批量刷新)
   ├── 多级筛选器 (订单/餐厅联动过滤)
   ├── 用户/角色权限管理 (RBAC)
   ├── Schema 管理 (发布/预览/版本)
   └── 数据导出 (Excel)

5. 技术亮点讲解
   ├── JSON Schema-driven 渲染引擎 (改配置即改页面)
   ├── 集中式 Service 数据层 (依赖追踪/自动 refetch)
   ├── Go 后端 + PostgreSQL + Redis
   └── Docker 一键部署
```

---

## 技术栈覆盖对照表

| Resume 提到的技术 | 项目中体现 | 状态 |
|------------------|-----------|------|
| React | Web + Admin | ✅ 已有 |
| TypeScript | 全项目 | ✅ 已有 |
| UmiJS | Web + Admin 路由 | ✅ 已有 |
| Ant Design | Admin UI | ✅ 已有 |
| Tailwind CSS | Web UI | ✅ 已有 |
| ECharts 5 | Web Dashboard + Admin Dashboard | ✅ 已有 (需增强) |
| DVA/Redux | 状态管理 | ⚠️ 需补充 |
| Go | Server | ✅ 已有 |
| PostgreSQL | 数据库 | ✅ 已有 |
| Redis | 缓存/会话 | ❌ 需添加 |
| Docker | 容器化 | ⚠️ 需验证 |
| Turborepo | Monorepo 构建 | ✅ 已有 |
| RBAC 权限控制 | Server + Admin | ✅ 已有 |
| 审计日志 | Audit 中间件 | ✅ 已有 |
| Schema 渲染引擎 | Render 组件 | ✅ 已有 |
| 集中式数据服务层 | Service 组件 | ✅ 已有 |
| 批量刷新协调 | Dashboard | ✅ 已有 |
| 多级筛选器 | Filter 组件 | ⚠️ 需增强 |
