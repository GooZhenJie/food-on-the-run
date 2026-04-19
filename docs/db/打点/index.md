## DB Design

基于接口文档，推荐使用**按日志类型分表**的方案：写入时无需 JOIN，各表可独立分区归档，适合高频日志写入场景。

### 设计思路

- 4 种日志类型字段差异较大，合并单表会产生大量 NULL 列
- `user_id`、`subject_type`、`ext_info` 等公共字段在各表中冗余存储（反范式化），避免 FK JOIN
- 主键遵循项目规范使用 UUID（`gen_random_uuid()`），时间戳使用 `TIMESTAMPTZ`
- 不设外键约束（`user_id` 除外），保证写入性能

### 字段适配说明

| Databrain 原始字段 | FOTR 字段 | 变更原因 |
|---|---|---|
| `source` (1=QQ, 2=玉符) | `platform` (web / ios / android / miniprogram) | 来源改为平台类型 |
| `type_id` (dashboard_pc 等) | `module` (home / restaurant / order / search / profile) | 业务模块换为外卖场景 |
| `menu_id` | `section_id` | 避免与餐厅 menu 概念冲突 |
| `game_name` | `subject_name` | 操作对象名称，如餐厅名、菜品名 |
| `uid_type` + `uid` | `subject_type` + `subject_id` | 语义更清晰 |
| `is_online` (logIn/logOut) | 合并至 `user_log.action` | 消除冗余 |
| `systemId` (1=PC, 2=移动) | 合并至 `platform` | 平台字段已覆盖 |
| `t_user_log` 等 | `user_log` 等 | 去掉 `t_` 前缀，符合项目规范 |

---

### DDL

```sql
-- =============================================
-- 用户行为日志表
-- =============================================
CREATE TABLE user_log (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        REFERENCES users(id) ON DELETE SET NULL,
    platform    VARCHAR(20) NOT NULL DEFAULT 'web',   -- web | ios | android | miniprogram
    action      VARCHAR(20) NOT NULL DEFAULT '',      -- login | logout
    ip_address  INET,
    ext_info    TEXT        NOT NULL DEFAULT '',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_log_user_id    ON user_log(user_id);
CREATE INDEX idx_user_log_created_at ON user_log(created_at);
CREATE INDEX idx_user_log_action     ON user_log(action);


-- =============================================
-- 页面访问日志表
-- =============================================
CREATE TABLE page_log (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         REFERENCES users(id) ON DELETE SET NULL,
    platform     VARCHAR(20)  NOT NULL DEFAULT 'web',
    module       VARCHAR(50)  NOT NULL DEFAULT '',    -- home | restaurant | order | search | profile
    section_id   VARCHAR(100) NOT NULL DEFAULT '',    -- 导航区块 ID
    page_id      VARCHAR(100) NOT NULL DEFAULT '',
    page_name    VARCHAR(200) NOT NULL DEFAULT '',
    page_path    VARCHAR(500) NOT NULL DEFAULT '',
    subject_type VARCHAR(50)  NOT NULL DEFAULT '',    -- restaurant_id | order_id | dish_id | rider_id
    subject_id   VARCHAR(200) NOT NULL DEFAULT '',
    subject_name VARCHAR(200) NOT NULL DEFAULT '',    -- 餐厅名、菜品名等；存在时直接插库不查询
    ext_info     TEXT         NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_page_log_user_id    ON page_log(user_id);
CREATE INDEX idx_page_log_created_at ON page_log(created_at);
CREATE INDEX idx_page_log_module     ON page_log(module, page_id);
CREATE INDEX idx_page_log_subject    ON page_log(subject_type, subject_id);


-- =============================================
-- 按钮点击日志表
-- =============================================
CREATE TABLE button_log (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         REFERENCES users(id) ON DELETE SET NULL,
    platform     VARCHAR(20)  NOT NULL DEFAULT 'web',
    button_id    VARCHAR(100) NOT NULL DEFAULT '',
    button_name  VARCHAR(200) NOT NULL DEFAULT '',
    module       VARCHAR(50)  NOT NULL DEFAULT '',
    page_id      VARCHAR(100) NOT NULL DEFAULT '',
    subject_type VARCHAR(50)  NOT NULL DEFAULT '',
    subject_id   VARCHAR(200) NOT NULL DEFAULT '',
    subject_name VARCHAR(200) NOT NULL DEFAULT '',
    ext_info     TEXT         NOT NULL DEFAULT '',
    ext_info2    TEXT         NOT NULL DEFAULT '',
    ext_info3    TEXT         NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_button_log_user_id    ON button_log(user_id);
CREATE INDEX idx_button_log_created_at ON button_log(created_at);
CREATE INDEX idx_button_log_button_id  ON button_log(button_id);
CREATE INDEX idx_button_log_module     ON button_log(module, page_id);
CREATE INDEX idx_button_log_subject    ON button_log(subject_type, subject_id);


-- =============================================
-- 搜索行为日志表
-- =============================================
CREATE TABLE search_log (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         REFERENCES users(id) ON DELETE SET NULL,
    platform     VARCHAR(20)  NOT NULL DEFAULT 'web',
    module       VARCHAR(50)  NOT NULL DEFAULT '',
    query        VARCHAR(500) NOT NULL DEFAULT '',
    click_id     VARCHAR(200) NOT NULL DEFAULT '',    -- 点击的搜索结果 ID
    subject_type VARCHAR(50)  NOT NULL DEFAULT '',
    subject_id   VARCHAR(200) NOT NULL DEFAULT '',
    ext_info     TEXT         NOT NULL DEFAULT '',
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_log_user_id    ON search_log(user_id);
CREATE INDEX idx_search_log_created_at ON search_log(created_at);
CREATE INDEX idx_search_log_module     ON search_log(module);
CREATE INDEX idx_search_log_subject    ON search_log(subject_type, subject_id);
```

---

### 字段映射关系

| API 参数 | DB 列名 | 备注 |
|---|---|---|
| `source` | `platform` | web / ios / android / miniprogram |
| `typeId` | `module` | 业务模块枚举 |
| `menuId` | `section_id` | 导航区块 ID |
| `uidType` + `uid` | `subject_type` + `subject_id` | 操作对象类型 + ID |
| `gameName` | `subject_name` | 操作对象名称，直接插库不查询 |
| `extInfo` / `extInfo2` / `extInfo3` | `ext_info` / `ext_info2` / `ext_info3` | 扩展字段，button_log 独有 2/3 |
| `actionId` | `action` | login / logout |
| `systemId` | 合并至 `platform` | — |

---

### 索引设计说明

- `idx_*_created_at`：所有表必建，支持按时间范围查询
- `idx_*_user_id`：按用户维度统计行为
- `idx_*_module`：按业务模块聚合分析
- `idx_*_subject`：按餐厅、菜品、订单等实体维度查询
- `idx_button_log_button_id`：按具体按钮统计点击量

如数据量增长，建议对 `created_at` 按月做 PostgreSQL **RANGE 分区**，或将日志表接入时序存储（如 TimescaleDB）做离线分析。
