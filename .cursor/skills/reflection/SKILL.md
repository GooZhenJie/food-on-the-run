---
name: reflection
description: >-
  FOTR 项目开发流程完成后的反思总结。当用户要求回顾开发过程、总结经验教训时使用，
  或当测试验证通过后作为开发流程的最后一步使用。
---

# 反思总结 — FOTR

## 适用时机

测试验证（testing skill）通过后执行。这是开发流程的最后一步。

## 执行规则

- 逐项回答反思清单中的问题
- 发现需要调整的规则时，**直接修改对应的 skill 文件**
- 反思完成后输出"本次开发记录"

---

## 通用反思清单

### 1. 分层是否合理？

- 四层架构是否遵循？是否有跨层依赖出现？
- 组件拆分粒度是否合适？是否有组件承担了过多职责？
- → 如果发现新的拆分模式，补充到 `component-development/SKILL.md` 的文件结构模板

### 2. 场景判断是否准确？

- 最初选择的场景（A/B/C/D）是否正确？
- 是否遇到不属于现有四种场景的新模式？
- → 如果发现新场景，补充到 `component-development/SKILL.md` 的"快速决策"章节

### 3. 跨层通信是否规范？

- 是否出现了禁止的反向依赖（UI 层直接 fetch）？
- Context 的使用是否只读？是否有通过 Context 触发副作用的情况？
- → 补充到 `component-development/SKILL.md` 的"各层速览"

### 4. 是否发现新的禁止事项或最佳实践？

- 开发中是否踩过坑（Context 嵌套、Props 膨胀、Hook 循环依赖等）？
- 是否发现 FOTR 特有的模式或反模式？
- → 补充到 `component-conventions/SKILL.md` 的"Forbidden Patterns"或新增章节

### 5. Service 组件是否满足需求？

- `Service` 组件的接口（`api`、`deps`、`interval`、`beforeRequest`、`formatData`）是否够用？
- 是否遇到 Service 无法处理的数据获取场景？
- → 如果 Service 能力需要扩展，记录到 `component-development/SKILL.md`

### 6. Schema/Render 系统是否满足需求？

- `componentMap` 是否需要新增组件类型？
- `ISchemaNode` 的 props 结构是否能覆盖新需求？
- → 更新 `component-development/SKILL.md` 的模板 C

### 7. 是否需要更新关联 skill？

- `component-conventions/SKILL.md`：命名/导出/文件结构约定有变化？
- `code-review/SKILL.md`：发现新的审核维度或检查项？
- `testing/SKILL.md`：发现新的测试模式或工具？

---

## 本次开发记录

反思完成后，输出一段简要记录，包含：

- **做了什么**：功能概述（新增/修改了哪些组件/页面）
- **遇到什么问题**：技术障碍、架构决策点
- **如何解决的**：最终方案和取舍理由
- **是否更新了 skill / 规则**：列出更新了哪些文件（如有）

---

## Skill 更新速查表

| 发现类型 | 更新目标 |
|---------|---------|
| 通用架构 / 分层规则 | `component-development/SKILL.md` |
| 组件命名 / 文件结构 / 导出 / 反向 import | `component-conventions/SKILL.md` |
| 审核维度或检查项 | `code-review/SKILL.md` |
| 测试模式或工具 | `testing/SKILL.md` |
| DB schema / 命名规范 | `postgresql-naming-conventions/SKILL.md` |

---

**流程结束。**
