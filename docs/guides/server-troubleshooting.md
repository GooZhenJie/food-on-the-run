# Server 排查手册

本文档覆盖 `pnpm dev` 或 `go run main.go` 启动失败时所有已知场景的排查与修复方法。

---

## 快速诊断

```bash
# 1. 确认数据库在跑
docker ps | grep postgres

# 2. 确认 8080 端口状态
lsof -i:8080

# 3. 直接访问 API 是否响应
curl -s http://localhost:8080/api/public/restaurants | head -c 100
```

---

## 场景 1：`Dirty database version N. Fix and force version.`

**原因**：第 N 号 migration 执行到一半失败，golang-migrate 将其标记为 dirty，之后每次启动都拒绝继续。

**修复**：

```bash
cd apps/server

# 把版本号强制回退到 N-1（上一个干净版本）
migrate \
  -path db/migrations \
  -database "postgres://fotr:fotr_secret@localhost:5432/fotr_dev?sslmode=disable" \
  force $((N - 1))

# 重新跑 migration（验证修复是否生效）
migrate \
  -path db/migrations \
  -database "postgres://fotr:fotr_secret@localhost:5432/fotr_dev?sslmode=disable" \
  up
```

**如果 `migrate up` 又失败**：
- 检查失败的 migration 文件本身是否有 SQL 错误（表名写错、列不存在等）
- 修完文件后再次 `force N-1` → `migrate up`

> **注意**：只有从未成功执行过的 migration 文件才能直接修改。已在生产/其他环境跑过的，必须新建迁移来修正。

---

## 场景 2：`listen tcp :8080: bind: address already in use`

**原因**：8080 端口已被占用——通常是上次 `pnpm dev` 没有正常退出，或手动后台启动了 `go run main.go`。

**修复**：

```bash
# 找到并杀掉占用 8080 的进程
lsof -ti:8080 | xargs kill -9

# 确认端口已释放
lsof -i:8080   # 应无输出
```

然后重新 `pnpm dev`。

**预防**：
- 不要在终端里手动 `go run main.go &` 后台运行，让 `pnpm dev` 统一管理所有进程
- 用 `Ctrl+C` 退出 `pnpm dev`，turbo 会负责清理子进程

---

## 场景 3：`relation "xxx" does not exist`

**原因**：SQL 文件（通常是 seed migration）里引用了不存在的表名，通常是拼写错误。

**排查**：

```bash
# 查看数据库中实际存在的表
psql "postgres://fotr:fotr_secret@localhost:5432/fotr_dev?sslmode=disable" \
  -c "\dt"
```

对照 SQL 文件里的表名，找到写错的地方改正，然后走场景 1 的修复流程（`force N-1` → `migrate up`）。

---

## 场景 4：前端 `data.id` 是 `undefined`，URL 变成 `/xxx/undefined`

**原因**：sqlc 生成的 Go struct 没有 json tag，序列化后字段名是大写（`"ID"`），前端取 `data.id`（小写）拿到 `undefined`。

**修复**：

```bash
cd apps/server

# 确认 sqlc.yaml 里 emit_json_tags 是 true
grep emit_json_tags sqlc.yaml
# 应输出：emit_json_tags: true

# 如果是 false，改为 true 后重新生成
sqlc generate
```

重启 server 生效。

---

## 场景 5：`pnpm dev` 整体 failed，但不知道哪个服务出问题

turbo 的输出会被合并，错误容易淹没。单独启动服务来定位：

```bash
# 只启动 server，看原始错误
cd apps/server && go run main.go

# 只启动 web
cd apps/web && pnpm dev

# 只启动 admin
cd apps/admin && PORT=8001 pnpm dev
```

---

## 常用命令速查

| 场景 | 命令 |
|---|---|
| 查看 migration 当前版本 | `migrate -path db/migrations -database "..." version` |
| 强制设置版本 | `migrate -path db/migrations -database "..." force N` |
| 跑所有 migration | `migrate -path db/migrations -database "..." up` |
| 回滚一个 migration | `migrate -path db/migrations -database "..." down 1` |
| 重新生成 sqlc | `cd apps/server && sqlc generate` |
| 释放 8080 端口 | `lsof -ti:8080 \| xargs kill -9` |
| 检查数据库连接 | `psql "postgres://fotr:fotr_secret@localhost:5432/fotr_dev?sslmode=disable" -c "\dt"` |

---

## 数据库连接字符串

本地开发默认值（无需 `.env`）：

```
postgres://fotr:fotr_secret@localhost:5432/fotr_dev?sslmode=disable
```

如需自定义，在 `apps/server/` 下创建 `.env` 并设置 `DATABASE_URL=...`（需自行在 `main.go` 里加 `godotenv` 加载，当前版本不读 `.env`，直接用环境变量）。
