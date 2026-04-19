---
name: component-development
description: >-
  指导 FOTR 项目组件开发遵循四层分层架构（UI 展示层、业务逻辑层、数据接入层、数据源层）。
  当创建新 React 组件、重构现有组件、审查组件结构时使用，
  或当用户询问组件分层、Props 设计、状态管理模式、数据获取模式时使用。
---

# 组件开发 — 四层分层架构（FOTR）

## 核心原则

高内聚、低耦合。每层只做一件事，层间通过清晰接口通信，禁止跨层直接操作数据/DOM。

**依赖方向**：Layer 1 → 2 → 3 → 4（自上而下，禁止反向依赖）。

```
Layer 1: UI 展示层     → 渲染 UI，触发用户交互回调
Layer 2: 业务逻辑层    → 数据变换，业务规则，状态编排
Layer 3: 数据接入层    → 数据获取，Context 共享状态
Layer 4: 数据源层      → 纯 fetch/async 函数，对应 API endpoint
```

## 快速决策：你的组件属于哪种场景？

**场景 A：纯 UI 组件**
只渲染 UI，无 API 调用，无复杂业务逻辑。
→ 只涉及 Layer 1。参考：`HeroBanner`、`InfoCard`、`MenuGrid`

**场景 B：带业务逻辑的功能组件**
需要数据获取、业务规则处理、状态管理。
→ 涉及 Layer 1 + 2 + 3。参考：`FilterBar`

**场景 C：Schema/配置驱动渲染**
通过 JSON schema 动态渲染组件树。
→ 涉及全部四层。参考：`Render` + `componentMap`

**场景 D：数据驱动图表组件**
从 `ServiceContext` 读取数据并渲染图表。
→ 涉及 Layer 1 + 3。参考：`SalesTrend`、`RadarChart`

## 组件拆分决策流程

1. **包含 API 调用？** → 抽到 `Service` 组件或 Data Hook（Layer 3）
2. **包含数据变换 / 业务规则？** → 纯函数抽到 `utils.ts`；需要 React 状态则抽到 `hooks.ts`（Layer 2）
3. **包含配置→组件映射？** → 抽到 `componentMap.ts`（Layer 2 编排）
4. **剩余 UI 代码超过 500 行？** → 拆分为多个子组件
5. **需要跨 3+ 层共享数据？** → 增加 `context.ts` Provider（Layer 3）

## 各层速览

### Layer 1：UI 展示层

**三类**：纯展示组件、布局组件、组合展示组件。

**允许**：
- `useState`（纯 UI 状态：hover、展开/折叠、动画）
- `useRef` 用于 DOM 测量
- `useMemo` / `useCallback` 用于展示数据计算
- `useContext` 读取 Context 的**只读数据**（如 `useServiceData()`、`useFilterContext()`）
- 自定义 UI hook（放在 `hooks.ts`）

**禁止**：
- 直接 `fetch` / 调用 `services/api.ts` 中的函数
- 在组件内部发起网络请求

**Props 规范**：
- 必须定义 TypeScript 接口（`I` + 组件名 + `Props`），禁止 `props: unknown` 或不写类型
- 回调 props 以 `on` 开头：`onClick`、`onChange`、`onClose`
- 建议不超过 10 个 props；超出时考虑合并为对象或使用 Context

### Layer 2：业务逻辑层

| 类型 | 职责 | 放置位置 |
|------|------|----------|
| 业务 Hook | 封装业务规则和状态 | `hooks.ts` |
| 业务工具函数 | 纯函数数据变换 | `utils.ts` |
| 类型路由/编排 | 配置 → 组件映射 | `componentMap.ts` |

**规则**：
- Hook 单一职责，建议 200 行内
- 工具函数为纯函数，无 React 依赖，可单独测试

### Layer 3：数据接入层

| 类型 | 职责 | FOTR 示例 |
|------|------|-----------|
| Service 组件 | 声明式 fetch，通过 Context 注入 data/loading/error | `src/components/Service/index.tsx` |
| Data Hook | 命令式 fetch，返回 `{ data, loading, error, refresh }` | 自定义 `useXxxData` |
| Context Provider | 跨子树共享状态 | `FilterContext`、`ServiceContext`、`RefreshContext` |

**Service 组件用法**（配置驱动场景标准模式）：

```tsx
<Service api="/api/sales-trend" interval={60000}>
  <SalesTrend />   {/* 通过 useServiceData() 消费 */}
</Service>
```

**Context 创建规则**：
- 必须定义 TypeScript interface
- 必须提供 `useXxx` 封装函数（内含 null 守卫）
- Provider 只在一个组件中创建

```ts
// context.ts
export const MyContext = createContext<IMyContextValue | null>(null);

export const useMyContext = (): IMyContextValue => {
  const ctx = useContext(MyContext);
  if (!ctx) throw new Error('useMyContext must be inside <MyProvider>');
  return ctx;
};
```

**状态管理选型**：

| 数据范围 | 方案 |
|---------|------|
| 组件内部 UI 状态 | `useState` |
| 父→子 1-2 层 | Props + Callbacks |
| 子树 3+ 层共享 | Context + `useContext` |
| 全局（用户信息等）| Umi `useModel` |

### Layer 4：数据源层

纯 async 函数，放在 `src/services/api.ts` 或模块内的 `services/` 目录。

```ts
// services/api.ts
export async function fetchSalesTrend(params: ISalesTrendParams): Promise<ISalesTrendItem[]> {
  const res = await fetch(`/api/sales-trend?${new URLSearchParams(params)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

**规则**：无 React 依赖；一个函数对应一个 API endpoint；有明确的参数和返回类型。

## 文件结构模板

### 模板 A：纯 UI 组件

```
ComponentName/
├── index.tsx       # 展示组件，named export
├── type.d.ts       # 可选，共享类型；简单 props 可内联
└── utils.ts        # 可选，展示辅助纯函数
```

### 模板 B：业务功能组件

```
ComponentName/
├── index.tsx       # 组装 hooks + UI
├── type.d.ts       # 共享/Context 类型
├── hooks.ts        # 业务 hook
├── utils.ts        # 纯函数工具
├── config.ts       # 常量配置
├── context.ts      # 可选，Context + useXxx
└── components/     # 私有子组件
    └── SubView/
```

### 模板 C：Schema 驱动渲染

```
Render/
├── index.tsx           # 递归渲染器
├── componentMap.ts     # 组件注册表
├── type.d.ts
└── schemaComponents/   # schema 专属组件（平铺 tsx，不需独立目录）
    ├── HeroBanner.tsx
    └── MenuGrid.tsx
```

### 模板 D：数据驱动图表

```
charts/ChartName/
├── index.tsx   # 从 useServiceData() 消费数据，渲染 ECharts
```

## 跨模块依赖规则

- 被 2+ 个页面使用的组件 → 提升到 `src/components/`
- 页面私有组件 → `src/pages/<page>/components/`
- **禁止父组件 import 子组件目录内部文件**（见 component-conventions skill）

## 自查 Checklist

- [ ] TypeScript Props 接口已定义，无 `unknown` / 裸对象 props
- [ ] UI 组件未直接发起 fetch 请求
- [ ] 业务 hook / 工具函数已抽离到对应文件
- [ ] Context 有 interface 和 `useXxx` 封装函数
- [ ] Layer 4 service 函数为纯 async，无 React 依赖

## 开发完成后

1. **审核优化**（强制）→ 阅读 [code-review skill](../code-review/SKILL.md)
2. **测试验证**（强制）→ 阅读 [testing skill](../testing/SKILL.md)
3. **反思总结** → 阅读 [reflection skill](../reflection/SKILL.md)
