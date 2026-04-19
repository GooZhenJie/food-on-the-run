---
name: code-review
description: >-
  审核优化 FOTR 项目开发完成的代码。当用户要求审查代码、检查代码规范、优化代码质量时使用，
  或当组件/页面开发完成并通过自查 Checklist 后作为开发流程的下一步使用。
---

# 审核优化 — FOTR

## 适用时机

组件/页面开发完成并通过自查 Checklist 后、测试验证之前执行。

## 执行规则

- 逐维度审查本次新增/修改的所有文件
- 发现的问题**必须当场修复**，不留 TODO
- 不修复与本次改动无关的已有 lint 问题

---

## 五维度审核

### 维度 1：开发规范符合性

- [ ] 分层依赖方向正确（Layer 1 → 2 → 3 → 4，禁止反向）
- [ ] UI 组件未直接调用 `fetch` 或 `services/api.ts` 中的函数
- [ ] 无父组件 import 子组件目录内部文件（reverse import）
- [ ] Props 接口使用 `I` + 组件名 + `Props` 命名，无裸 `unknown` 类型
- [ ] 变量 camelCase、常量 UPPER_SNAKE_CASE、组件 PascalCase
- [ ] 所有组件使用 `export const` 具名导出，无 `export default`
- [ ] TS 类型：共享/Context 类型在 `type.d.ts`；本地 Props 可内联
- [ ] Hooks 抽离到 `hooks.ts`，工具函数抽离到 `utils.ts`，常量抽离到 `config.ts`
- [ ] 样式使用 Tailwind；新代码无 inline style 用于布局/颜色/间距
- [ ] localStorage key 使用 `__fotr_` 前缀

### 维度 2：场景遗漏检查

- [ ] 空数据：列表为空、数据为 null 时有对应 UI（空状态占位 / 隐藏组件）
- [ ] Loading 状态：Service 组件的 `loading` 为 true 时有 Loading UI
- [ ] 错误状态：API 失败时有降级处理，不白屏
- [ ] 图表组件：`loading` 为 true 时有 skeleton 或 loading 占位

### 维度 3：可维护性与可扩展性

- [ ] 组件单一职责，未超过 500 行（超过应拆分）
- [ ] Hook 单一职责，建议 200 行内
- [ ] 工具函数为纯函数，无 React 依赖，可独立调用
- [ ] 无 magic number / string，已提取为常量（`config.ts`）
- [ ] 重复出现 2+ 次的逻辑已提取为 hook 或工具函数
- [ ] 新增的 schema 组件已在 `componentMap.ts` 注册

### 维度 4：边界覆盖

- [ ] 数组为空、对象为 null/undefined 时安全访问（`?.`、`?? []`、`?? 0`）
- [ ] 数值边界：0、负数、NaN 不导致崩溃或异常渲染
- [ ] 字符串边界：空字符串、超长文本（截断/省略）
- [ ] 快速点击按钮：loading 期间禁用，防止重复请求
- [ ] 组件卸载时清理副作用：`clearInterval`、`removeEventListener`、`AbortController`
- [ ] `Service` 组件的 `mountedRef` 模式已被正确使用（防卸载后 setState）

### 维度 5：性能检查

- [ ] 无不必要的重渲染：引用类型 props 使用 `useMemo`；回调使用 `useCallback`
- [ ] 大列表（> 100 项）使用 `react-virtualized`（项目已安装）
- [ ] ECharts option 使用 `useMemo` 包裹，避免每次渲染重建配置对象
- [ ] `useEffect` 依赖数组完整且精确
- [ ] Context value 使用 `useMemo` 包裹，避免子树全量重渲染

---

## 下一步

审核完成并修复所有问题后 → 阅读 [testing skill](../testing/SKILL.md)
