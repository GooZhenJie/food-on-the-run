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

所有 `docker compose` / `docker build` 命令均在**项目根目录**执行。

### 本地开发（默认）

本地开发只需启动 Postgres 和 Redis 容器，前后端仍在宿主机运行（`pnpm dev`）。

| 命令                     | 说明                                             |
| ------------------------ | ------------------------------------------------ |
| `docker compose up -d`   | 后台启动 PostgreSQL + Redis（及 claude-sandbox） |
| `docker compose down`    | 停止并移除容器                                   |
| `docker compose down -v` | 停止并清除数据卷（清空数据库）                   |
| `docker compose logs -f` | 实时查看容器日志                                 |

| 服务       | 端口   |
| ---------- | ------ |
| PostgreSQL | `5432` |
| Redis      | `6379` |

### 生产镜像

部署时需要 **3 个自建镜像**（`server`、`web`、`admin`）。PostgreSQL 与 Redis 使用官方镜像，无需 build。

| 镜像     | Build context          | Dockerfile                |
| -------- | ---------------------- | ------------------------- |
| `server` | `apps/server`          | `apps/server/Dockerfile`  |
| `web`    | `.`（monorepo 根目录） | `docker/Dockerfile.web`   |
| `admin`  | `.`（monorepo 根目录） | `docker/Dockerfile.admin` |

`web` / `admin` 依赖 `packages/shared`，因此 context 必须是项目根，不能只在 `apps/web` 或 `apps/admin` 下 build。

**用 Compose 一键 build（推荐）**

```bash
# 仅构建 prod 镜像
docker compose --profile prod build

# 构建并启动整栈（postgres + redis + server + web + admin）
docker compose --profile prod up -d --build
docker compose --profile prod up -d --build postgres redis server web admin
```

| 服务                    | 端口（prod profile） |
| ----------------------- | -------------------- |
| web（消费端）           | `9000`               |
| admin（管理端）         | `9001`               |
| server（API，容器内网） | `8080`               |

**dev 与 prod 端口对照**（可同时运行：`docker compose up -d` + `pnpm dev` 与 `--profile prod` 互不抢端口）

| 服务 | dev（`pnpm dev`） | prod（Docker `--profile prod`） |
| --- | --- | --- |
| web | `8000` | `9000` |
| admin | `8001` | `9001` |
| server | `8080`（宿主机） | `8080`（仅容器内网，经 Nginx 代理） |
| PostgreSQL | `5432` | `5432`（共用同一容器） |
| Redis | `6379` | `6379`（共用同一容器） |

### 本地运行 prod 栈（Docker 里看网站）

`docker compose up -d` 只启动 Postgres + Redis（及 claude-sandbox），**不会**启动 web / admin / server。要在容器里看完整网站，需加 `--profile prod`：

```bash
# 确保有 .env
cp .env.example .env

# 启动整栈（推荐：不启动 claude-sandbox）
docker compose --profile prod up -d --build postgres redis server web admin
```

浏览器访问：

| 地址 | 说明 |
| --- | --- |
| http://localhost:9000 | 消费端 web（prod） |
| http://localhost:9001 | 管理端 admin（prod） |

API 通过 Nginx 代理，不直接暴露到宿主机：

- 消费端：`http://localhost:9000/api/...`
- 管理端：`http://localhost:9001/api/...`

测试账号见下方 [测试账号](#测试账号) 章节（密码均为 `123456`）。

**运维命令**

```bash
# 查看运行状态
docker compose ps

# 查看日志
docker compose logs -f server
docker compose logs -f web admin

# 停止 prod 栈（保留数据库数据）
docker compose --profile prod down

# 停止并清空数据库（重新 migration + seed）
docker compose --profile prod down -v
```

**注意**

- prod 栈使用 `9000` / `9001`，与 dev（`pnpm dev` 的 `8000` / `8001`）错开，**可以同时跑**。
- server 首次启动会自动执行 migration 与 seed，等几秒后再刷新页面。
- 本地 build 用 `docker compose --profile prod up --build`；使用 CI 推到 GHCR 的镜像见下方 [CI/CD](#cicd) 章节。

**手动 build（例如推 GHCR 前本地验证）**

```bash
docker build -t fotr-server:local -f apps/server/Dockerfile apps/server
docker build -t fotr-web:local -f docker/Dockerfile.web .
docker build -t fotr-admin:local -f docker/Dockerfile.admin .
```

### 推送到 GitHub Container Registry（ghcr.io）

[GHCR](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry) 是 GitHub 提供的镜像仓库，用于存放 build 好的 Docker 镜像，供 CI/CD 或生产服务器 `docker pull` 部署。

**1. 登录**

本地手动推送需 [Personal Access Token](https://github.com/settings/tokens)（权限：`write:packages`，私有仓库还需 `read:packages`）：

```bash
export GHCR_USER="<你的 GitHub 用户名>"
export GHCR_TOKEN="<PAT 或 GITHUB_TOKEN>"
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
```

GitHub Actions 中可直接使用内置的 `${{ secrets.GITHUB_TOKEN }}`，一般无需单独创建 PAT。

**2. 打 tag 并推送**

将 `<owner>` 替换为 GitHub 用户名或组织名，`<tag>` 常用 `latest` 或 git commit SHA（如 `abc1234`）：

```bash
export GHCR_OWNER="goozhenjie"
export IMAGE_TAG="v0.0.1"

# server
docker build -t ghcr.io/${GHCR_OWNER}/fotr-server:${IMAGE_TAG} -f apps/server/Dockerfile apps/server
docker push ghcr.io/${GHCR_OWNER}/fotr-server:${IMAGE_TAG}

# web
docker build -t ghcr.io/${GHCR_OWNER}/fotr-web:${IMAGE_TAG} -f docker/Dockerfile.web .
docker push ghcr.io/${GHCR_OWNER}/fotr-web:${IMAGE_TAG}

# admin
docker build -t ghcr.io/${GHCR_OWNER}/fotr-admin:${IMAGE_TAG} -f docker/Dockerfile.admin .
docker push ghcr.io/${GHCR_OWNER}/fotr-admin:${IMAGE_TAG}
```

推送成功后，在 GitHub 仓库页 **Packages** 中可看到镜像。私有仓库的镜像默认也是 private。

**3. 在生产服务器拉取**

服务器只需 Docker，无需安装 Node / Go / pnpm：

```bash
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

docker pull ghcr.io/${GHCR_OWNER}/fotr-server:${IMAGE_TAG}
docker pull ghcr.io/${GHCR_OWNER}/fotr-web:${IMAGE_TAG}
docker pull ghcr.io/${GHCR_OWNER}/fotr-admin:${IMAGE_TAG}
```

生产环境建议为部署机单独创建只读 PAT（`read:packages`），不要复用个人主 token。

### CI/CD

`.github/workflows/release-docker.yml` 会在 **`release` 分支有 push** 时（或手动 Run workflow）在 GitHub 云端 build 三个镜像并 push 到 GHCR。

**GitHub Actions 不会直接 build 到你本机 Docker** — 产物在 GHCR，本地或服务器通过 `docker pull` 获取。

**首次启用前：仓库设置**

仓库 → **Settings → Actions → General → Workflow permissions** → 选 **Read and write permissions**（否则 `GITHUB_TOKEN` 无法 push 到 GHCR）。

**Workflow 产出**

| 镜像 | Tags |
| --- | --- |
| `ghcr.io/goozhenjie/fotr-server` | `release-latest`、`release-<commit-sha>` |
| `ghcr.io/goozhenjie/fotr-web` | 同上 |
| `ghcr.io/goozhenjie/fotr-admin` | 同上 |

在 GitHub 仓库 **Actions** 页查看构建日志；成功后 **Packages** 页可见镜像。

**本地运行 CI 构建的镜像**

使用 `docker-compose.ghcr.yml` 覆盖 prod 服务的 `build`，改为从 GHCR pull：

```bash
# 私有镜像需先登录（PAT 权限 read:packages）
export GHCR_USER="goozhenjie"
export GHCR_TOKEN="<PAT>"
echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin

# 指定 tag 并启动（不本地 build）
export IMAGE_TAG=release-latest
docker compose -f docker-compose.yml -f docker-compose.ghcr.yml \
  --profile prod up -d postgres redis server web admin
```

`IMAGE_TAG` 可选：

- `release-latest` — 最近一次 release 分支构建
- `release-<commit-sha>` — 精确到某次 commit（完整 SHA，见 Actions 日志）

浏览器访问 prod 地址：http://localhost:9000 / http://localhost:9001

**与本地 build 的对比**

| 方式 | 命令 | 适用 |
| --- | --- | --- |
| 本地 build | `docker compose --profile prod up -d --build ...` | 改 Dockerfile / 未 push 前验证 |
| GHCR pull | `docker compose -f ... -f docker-compose.ghcr.yml ...` | 验证 CI 产物、与生产一致 |

## 测试账号

所有账号密码统一为 `123456`。

| 角色 | 邮箱 | 登录入口 | 说明 |
| --- | --- | --- | --- |
| 超级管理员 | `admin@fotr.local` | 管理端 dev [http://localhost:8001](http://localhost:8001) / prod [http://localhost:9001](http://localhost:9001) | 拥有 `admin.super` 角色 |
| 商家 | `merchant@fotr.local` | 管理端 + 消费端 | 名为 Lily Tan，绑定 3 家餐厅 |
| 普通用户 | `customer@fotr.local` | 消费端 dev [http://localhost:8000](http://localhost:8000) / prod [http://localhost:9000](http://localhost:9000) | 名为 Demo Customer |

merchant 账号绑定的餐厅：Aunty Lily's Nasi Lemak、The Wonton Noodle Bar、Tandoor Palace。

## 常用命令

| 命令         | 说明                     |
| ------------ | ------------------------ |
| `pnpm dev`   | 启动所有应用的开发服务器 |
| `pnpm build` | 构建所有应用             |
| `pnpm lint`  | 对所有包执行 lint 检查   |

# Debug

## Debugging DB Connections

If DBeaver or your backend services cannot connect to the database, use the following commands to diagnose the issue:

```bash
# 1. Check if the PostgreSQL port is reachable
nc -zv 127.0.0.1 5432

# 2. Identify which process is binding to the port (e.g., Docker vs. Native Postgres)
sudo lsof -i tcp:5432
```
