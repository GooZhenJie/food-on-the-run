---
name: testing
description: >-
  为 FOTR 项目组件/页面编写测试用例。当用户要求添加测试、编写单元测试、提高测试覆盖率时使用，
  或当代码审核优化完成后作为开发流程的下一步使用。
---

# 测试验证 — FOTR

## 适用时机

审核优化（code-review skill）完成后、反思总结之前执行。

## 前置条件

使用前确认测试基础设施已就绪：

```bash
# 检查是否已安装
pnpm add -D @testing-library/react @testing-library/jest-dom @testing-library/user-event vitest jsdom
```

Umi 4 推荐使用 `vitest`；如项目已配置 `jest`，用法相同。

---

## 强制测试矩阵

根据 component-development skill 中的场景分类：

| 场景 | 组件渲染测试 | Props 边界测试 | Hook 单元测试 | 工具函数测试 |
|------|:---:|:---:|:---:|:---:|
| A 纯 UI 组件 | 必须 | 必须 | — | 如有 utils 则必须 |
| B 业务功能组件 | 必须 | 必须 | 必须 | 必须 |
| C Schema 驱动 | 必须（componentMap 完整性）| — | — | 必须 |
| D 数据图表组件 | 必须（mock ServiceContext）| — | — | — |

---

## 各层测试要点

### Layer 1：UI 展示层

```tsx
// ComponentName/__tests__/index.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HeroBanner } from '../index';

describe('HeroBanner', () => {
  const defaultProps = {
    title: 'Test Restaurant',
    rating: 4.5,
    deliveryTime: 30,
    address: '123 Street',
  };

  it('renders title', () => {
    render(<HeroBanner {...defaultProps} />);
    expect(screen.getByText('Test Restaurant')).toBeInTheDocument();
  });

  it('renders empty state when no title', () => {
    render(<HeroBanner {...defaultProps} title={undefined} />);
    // verify graceful render
  });
});
```

### Layer 2：业务逻辑层

**纯函数工具 — 优先使用 `it.each` 表格驱动**：

```ts
// utils/__tests__/utils.test.ts
import { formatPrice } from '../utils';

describe('formatPrice', () => {
  it.each([
    [10, 'RM 10.00'],
    [0,  'RM 0.00'],
    [9.9, 'RM 9.90'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatPrice(input)).toBe(expected);
  });
});
```

**业务 Hook**：

```ts
import { renderHook, act } from '@testing-library/react';
import { useFilter } from '../hooks';

describe('useFilter', () => {
  it('resets category when cuisine changes', () => {
    const { result } = renderHook(() => useFilter());
    act(() => result.current.setFilterVal({ cuisine: 'chinese', category: 'noodles' }));
    act(() => result.current.setFilterVal({ cuisine: 'western' }));
    expect(result.current.filterVal.category).toBe('');
  });
});
```

### Layer 3：数据接入层

**Service Context 消费组件（场景 D）**：

```tsx
import { render, screen } from '@testing-library/react';
import { ServiceContext } from '@/components/Service/context';
import { SalesTrend } from '../index';

const mockCtx = { data: mockSalesData, loading: false, error: null, refresh: vi.fn() };

it('renders chart when data is available', () => {
  render(
    <ServiceContext.Provider value={mockCtx}>
      <SalesTrend />
    </ServiceContext.Provider>
  );
  // ECharts 渲染验证（可检查容器存在）
  expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
});

it('shows loading state', () => {
  render(
    <ServiceContext.Provider value={{ ...mockCtx, loading: true, data: null }}>
      <SalesTrend />
    </ServiceContext.Provider>
  );
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
});
```

### Layer 4：数据源层

```ts
// services/__tests__/api.test.ts
import { fetchSalesTrend } from '../api';

global.fetch = vi.fn();

describe('fetchSalesTrend', () => {
  it('returns data on success', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ date: '2024-01-01', orders: 10, revenue: 100 }],
    });
    const data = await fetchSalesTrend({ restaurantId: '1' });
    expect(data).toHaveLength(1);
  });

  it('throws on non-ok response', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(fetchSalesTrend({ restaurantId: '1' })).rejects.toThrow('HTTP 500');
  });
});
```

### Schema 组件 — componentMap 完整性

```ts
// Render/__tests__/componentMap.test.ts
import { componentMap } from '../componentMap';

const REQUIRED_COMPONENTS = ['RestaurantPage', 'HeroBanner', 'MenuGrid', 'ReviewList', 'InfoCard'];

describe('componentMap', () => {
  it.each(REQUIRED_COMPONENTS)('registers %s', (name) => {
    expect(componentMap[name]).toBeDefined();
    expect(typeof componentMap[name]).toBe('function');
  });
});
```

---

## 测试文件放置规则

```
ComponentName/
├── index.tsx
└── __tests__/
    ├── index.test.tsx    # 组件渲染测试
    ├── hooks.test.ts     # hook 测试（如有）
    └── utils.test.ts     # 工具函数测试（如有）
```

---

## 测试 Checklist

- [ ] 场景矩阵中"必须"的测试类型已全部编写
- [ ] 工具函数（`utils.ts`）100% 覆盖
- [ ] 自定义 Hook 有 `renderHook` 测试
- [ ] 组件测试覆盖：正常态 / Loading 态 / 空数据态 / 错误态
- [ ] 无 `console.error` / `console.warn` 输出（说明 props 类型或 key 有问题）
- [ ] 运行全部测试通过：`pnpm test`

---

## 下一步

所有测试通过后 → 阅读 [reflection skill](../reflection/SKILL.md)
