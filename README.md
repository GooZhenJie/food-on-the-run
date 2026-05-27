# Food on the Run

基于 **pnpm + Turborepo** 管理的 monorepo 项目。

## 项目结构

```
food-on-the-run/
├── apps/
│   ├── web/       # 消费端前端（UmiJS + React + Tailwind + antd，:8000）
│   ├── admin/     # 管理端前端（UmiJS + React + Tailwind + antd，:8001）
│   └── server/    # 后端服务（Go，运行于 :8080，同时服务 web 与 admin）
├── packages/
│   ├── api-types/ # 共享 API 类型定义
│   ├── configs/   # 共享配置
│   └── ui-shared/ # 共享 UI 组件
```

## 环境要求

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/) `>= 10.28.2`
- [Go](https://golang.org/)
- [Docker](https://www.docker.com/) + Docker Compose（用于本地数据库）

## 快速开始

**1. 安装依赖**

```bash
pnpm install
```

**2. 配置环境变量**

```bash
cp .env.example .env
```

**3. 启动数据库服务（PostgreSQL + Redis）**

```bash
docker compose up -d
```

**4. 同时启动前后端**

```bash
pnpm dev
```

## 单独运行

**消费端前端**（UmiJS dev server，`http://localhost:8000`）：

```bash
cd apps/web
pnpm dev
```

**管理端前端**（UmiJS dev server，`http://localhost:8001`）：

```bash
cd apps/admin
pnpm dev
```

**后端**（Go，监听 `http://localhost:8080`）：

```bash
cd apps/server
go run main.go
```

## Docker

本地开发只需启动 Postgres 和 Redis 容器，前后端仍在宿主机运行。

| 命令 | 说明 |
| --- | --- |
| `docker compose up -d` | 后台启动 PostgreSQL + Redis |
| `docker compose down` | 停止并移除容器 |
| `docker compose down -v` | 停止并清除数据卷（清空数据库） |
| `docker compose logs -f` | 实时查看容器日志 |

**服务端口**

| 服务 | 端口 |
| --- | --- |
| PostgreSQL | `5432` |
| Redis | `6379` |

## 测试账号

所有账号密码统一为 `123456`。

| 角色 | 邮箱 | 登录入口 | 说明 |
| --- | --- | --- | --- |
| 超级管理员 | `admin@fotr.local` | 管理端 http://localhost:8001 | 拥有 `admin.super` 角色 |
| 商家 | `merchant@fotr.local` | 管理端 + 消费端 | 名为 Lily Tan，绑定 3 家餐厅 |
| 普通用户 | `customer@fotr.local` | 消费端 http://localhost:8000 | 名为 Demo Customer |

merchant 账号绑定的餐厅：Aunty Lily's Nasi Lemak、The Wonton Noodle Bar、Tandoor Palace。

## 常用命令

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 启动所有应用的开发服务器 |
| `pnpm build` | 构建所有应用 |
| `pnpm lint` | 对所有包执行 lint 检查 |
