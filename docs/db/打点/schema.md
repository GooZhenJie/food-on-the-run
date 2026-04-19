## Operation Log — DB Schema

### 设计原则

- 4 种日志类型字段差异大，按类型分表，各表独立归档
- 公共字段（`user_id`、`platform`、`subject_type` 等）在各表冗余，避免 JOIN
- 遵循项目 PostgreSQL 命名规范：plural `snake_case`、无前缀、`TIMESTAMPTZ`、显式命名约束

---

### Enums

```sql
CREATE TYPE log_platform AS ENUM (
  'web',
  'ios',
  'android',
  'miniprogram'
);

CREATE TYPE user_action AS ENUM (
  'login',
  'logout'
);
```

---

### DDL

```sql
-- =============================================
-- 用户行为日志
-- =============================================
CREATE TABLE user_logs (
    id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL,
    platform    log_platform NOT NULL DEFAULT 'web',
    action      user_action  NOT NULL,
    ip_address  INET,
    ext_info    TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at  TIMESTAMPTZ,

    CONSTRAINT fk_user_logs_users FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_user_logs_user_id    ON user_logs(user_id);
CREATE INDEX idx_user_logs_created_at ON user_logs(created_at DESC);
CREATE INDEX idx_user_logs_action     ON user_logs(action);


-- =============================================
-- 页面访问日志
-- =============================================
CREATE TABLE page_logs (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL,
    platform     log_platform NOT NULL DEFAULT 'web',
    module       VARCHAR(50)  NOT NULL DEFAULT '', -- home | restaurant | order | search | profile
    section_id   VARCHAR(100) NOT NULL DEFAULT '', -- 导航区块 ID
    page_id      VARCHAR(100) NOT NULL DEFAULT '',
    page_name    VARCHAR(200) NOT NULL DEFAULT '',
    page_path    VARCHAR(500) NOT NULL DEFAULT '',
    subject_type VARCHAR(50)  NOT NULL DEFAULT '', -- restaurant_id | order_id | dish_id | rider_id
    subject_id   VARCHAR(200) NOT NULL DEFAULT '',
    subject_name VARCHAR(200) NOT NULL DEFAULT '', -- 存在时直接插库，不通过 subject_id 查询
    ext_info     TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,

    CONSTRAINT fk_page_logs_users FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_page_logs_user_id         ON page_logs(user_id);
CREATE INDEX idx_page_logs_created_at      ON page_logs(created_at DESC);
CREATE INDEX idx_page_logs_module_page_id  ON page_logs(module, page_id);
CREATE INDEX idx_page_logs_subject         ON page_logs(subject_type, subject_id);


-- =============================================
-- 按钮点击日志
-- =============================================
CREATE TABLE button_logs (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL,
    platform     log_platform NOT NULL DEFAULT 'web',
    button_id    VARCHAR(100) NOT NULL DEFAULT '',
    button_name  VARCHAR(200) NOT NULL DEFAULT '',
    module       VARCHAR(50)  NOT NULL DEFAULT '',
    page_id      VARCHAR(100) NOT NULL DEFAULT '',
    subject_type VARCHAR(50)  NOT NULL DEFAULT '',
    subject_id   VARCHAR(200) NOT NULL DEFAULT '',
    subject_name VARCHAR(200) NOT NULL DEFAULT '',
    ext_info     TEXT,
    ext_info2    TEXT,
    ext_info3    TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,

    CONSTRAINT fk_button_logs_users FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_button_logs_user_id        ON button_logs(user_id);
CREATE INDEX idx_button_logs_created_at     ON button_logs(created_at DESC);
CREATE INDEX idx_button_logs_button_id      ON button_logs(button_id);
CREATE INDEX idx_button_logs_module_page_id ON button_logs(module, page_id);
CREATE INDEX idx_button_logs_subject        ON button_logs(subject_type, subject_id);


-- =============================================
-- 搜索行为日志
-- =============================================
CREATE TABLE search_logs (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL,
    platform     log_platform NOT NULL DEFAULT 'web',
    module       VARCHAR(50)  NOT NULL DEFAULT '',
    query        VARCHAR(500) NOT NULL DEFAULT '',
    click_id     VARCHAR(200) NOT NULL DEFAULT '', -- 点击的搜索结果 ID
    subject_type VARCHAR(50)  NOT NULL DEFAULT '',
    subject_id   VARCHAR(200) NOT NULL DEFAULT '',
    ext_info     TEXT,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    deleted_at   TIMESTAMPTZ,

    CONSTRAINT fk_search_logs_users FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_search_logs_user_id    ON search_logs(user_id);
CREATE INDEX idx_search_logs_created_at ON search_logs(created_at DESC);
CREATE INDEX idx_search_logs_module     ON search_logs(module);
CREATE INDEX idx_search_logs_subject    ON search_logs(subject_type, subject_id);
```

---

### 字段说明

| 列名 | 说明 |
|---|---|
| `platform` | 来源平台，使用 `log_platform` enum |
| `module` | 业务模块：`home` / `restaurant` / `order` / `search` / `profile` |
| `section_id` | 导航区块 ID，对应前端侧边栏或 tab 节点 |
| `subject_type` | 操作对象类型：`restaurant_id` / `order_id` / `dish_id` / `rider_id` |
| `subject_id` | 对应 `subject_type` 的实体 ID |
| `subject_name` | 实体名称；存在时直接插库，跳过 `subject_id` 反查 |
| `ext_info2` / `ext_info3` | 仅 `button_logs` 使用，供特殊业务场景扩展 |
| `deleted_at` | 软删除标记，遵循项目统一规范 |

### 索引说明

| 索引 | 用途 |
|---|---|
| `idx_*_created_at` | 所有表必建，支持时间范围查询，`DESC` 优化最新数据读取 |
| `idx_*_user_id` | 按用户维度统计行为 |
| `idx_*_module_page_id` | 按业务模块 + 页面聚合分析 |
| `idx_*_subject` | 按餐厅、菜品、订单等实体维度查询 |
| `idx_button_logs_button_id` | 按具体按钮统计点击量 |
| `idx_user_logs_action` | 登入 / 登出行为统计 |
