# Auth API

对应表：`auth_credentials`, `sessions`

## Endpoints

| Method | Path | 作用 | Auth |
|---|---|---|---|
| POST   | `/api/auth/register` | 密码注册 | — |
| POST   | `/api/auth/login` | 密码登录 | — |
| POST   | `/api/auth/oauth/:provider` | 第三方登录（google/apple/facebook） | — |
| POST   | `/api/auth/refresh` | 刷新 access token | refresh_token |
| POST   | `/api/auth/logout` | 吊销当前 session | ✓ |
| POST   | `/api/auth/password` | 修改密码 | ✓ |
| POST   | `/api/auth/password/forgot` | 发起找回密码 | — |
| POST   | `/api/auth/password/reset` | 使用重置 token 修改密码 | — |
| GET    | `/api/auth/sessions` | 当前用户所有活跃 session | ✓ |
| DELETE | `/api/auth/sessions/:id` | 吊销指定 session | ✓ |

## POST /api/auth/register

```json
{ "name": "string", "email": "string", "password": "string", "phone": "string?" }
```

**201**

```json
{
  "user": { "id": "...", "name": "...", "email": "...", "role": "customer" },
  "access_token": "jwt",
  "refresh_token": "opaque",
  "expires_in": 3600
}
```

## POST /api/auth/login

```json
{ "email": "string", "password": "string" }
```

响应同 `/register`。

## POST /api/auth/oauth/:provider

```json
{ "id_token": "string" }
```

响应同 `/login`。

## POST /api/auth/refresh

```json
{ "refresh_token": "string" }
```

**200** 返回新的 `access_token` / `refresh_token`；旧 refresh token 立即失效。

## POST /api/auth/logout

吊销当前 session。**204**。

## GET /api/auth/sessions

```json
{
  "items": [
    {
      "id": "integer",
      "user_agent": "...",
      "ip_address": "1.2.3.4",
      "device_id": "...",
      "last_used_at": "...",
      "created_at": "...",
      "expires_at": "..."
    }
  ]
}
```

## DELETE /api/auth/sessions/:id

**204**。设置 `revoked_at`。
