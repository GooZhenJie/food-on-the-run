---
name: postgresql-naming-conventions
description: Enforces PostgreSQL naming conventions for this Go project AND keeps the `docs/api/` resource docs in sync with every schema change. Use this skill immediately and without exception whenever creating, modifying, renaming, or deleting any database table, column, index, constraint, enum, migration file, or Go struct that maps to a DB schema. Triggers include writing .sql files, editing migration files, defining Go db structs, adding/removing columns, or any schema-related change.
---

# PostgreSQL Naming Conventions

## Tables

**Why plural nouns?** A table is a set of rows — `users` holds many users, `orders` holds many orders. Plural names read naturally in SQL (`SELECT * FROM users`) and match the convention used by Rails, Django, and most 大厂 schemas. Prefixes like `tbl_` add noise with no information value; the fact that it is a table is already implied by the SQL context.

- `snake_case`, **plural nouns**
- No prefixes (no `tbl_`, no `t_`)

```
✅ users  order_items  delivery_addresses
❌ User   menuItem     tbl_users
```

## Columns

- `snake_case`

| Pattern | Convention | Example |
|---------|-----------|---------|
| Boolean | `is_` / `has_` / `can_` prefix | `is_active`, `has_verified` |
| Timestamp | `_at` suffix, type `TIMESTAMPTZ` | `created_at`, `expires_at` |
| Date only | `_date` suffix | `birth_date`, `start_date` |
| Count | `_count` suffix | `view_count`, `retry_count` |
| Money | `_amount` (integer, cents) — **never FLOAT** | `total_amount`, `price_amount` |
| Status/enum | `status` or `_status` | `status`, `payment_status` |
| JSON/JSONB | `_data` / `_meta` / `_config` suffix | `meta_data`, `config` |
| Foreign key | `{singular_ref_table}_id` (see semantic FK rule below) | `user_id`, `restaurant_id` |
| URL | `_url` suffix, `VARCHAR(500)` | `image_url`, `avatar_url` |
| Sort order | `sort_order INT NOT NULL DEFAULT 0` | `sort_order` |
| Geo latitude | `lat DECIMAL(10, 8)` — **never FLOAT** | `lat` |
| Geo longitude | `lng DECIMAL(11, 8)` — **never FLOAT** | `lng` |

## Required Columns (every table)

**Why these four on every table?** `id` is the stable handle for every row. `created_at` and `updated_at` are essential for debugging, auditing, cache invalidation, and incremental data sync — they cost nothing to add upfront and are painful to backfill later. `deleted_at` enables soft delete, which preserves referential integrity and audit history without permanently destroying data; hard deletes that cascade can silently corrupt analytics and break foreign key chains in ways that are very hard to recover from.

```sql
id          BIGSERIAL PRIMARY KEY,
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
deleted_at  TIMESTAMPTZ              -- nullable, soft delete
```

## Primary Key

- Always named `id`
- **FOTR standard: `BIGSERIAL`**
- `UUID` is explicitly **not used** — reasons:
  1. **Size**: `BIGINT` is 8 bytes vs `UUID` 16 bytes — halves index storage per row
  2. **Insert performance**: `BIGSERIAL` is sequential, so B-tree index pages fill cleanly; `UUID` inserts are random, causing page splits and fragmentation at scale
  3. **JOIN performance**: integer comparisons are faster than 16-byte string comparisons
  4. **Industry precedent**: GitHub, Shopify, and Stripe all use integer PKs for their core tables for these same reasons

## Foreign Keys

### Default rule
When the relationship is unambiguous, use `{singular_referenced_table}_id`:

```sql
-- FK column type must be BIGINT (matches BIGSERIAL PK)
CONSTRAINT fk_orders_users FOREIGN KEY (user_id) REFERENCES users(id)
```

### Semantic FK rule
When a table has **multiple FKs to the same table**, or when the **role is more meaningful than the table name**, use a semantic column name. The constraint name follows `fk_{table}_{column_without_id}`:

```sql
-- restaurants.owner_id references users (BIGINT, not UUID)
CONSTRAINT fk_restaurants_owner FOREIGN KEY (owner_id) REFERENCES users(id)

-- posts with author + reviewer, both FK to users
CONSTRAINT fk_posts_author   FOREIGN KEY (author_id)   REFERENCES users(id)
CONSTRAINT fk_posts_reviewer FOREIGN KEY (reviewer_id) REFERENCES users(id)
```

## Indexes

**Why prefix by index type?** PostgreSQL has multiple index algorithms (B-tree, GIN, GIST, trigram). A name like `idx_products_meta_data` gives no hint about the algorithm — you have to `\d` the table to find out. By encoding the type in the prefix (`gin_`, `gist_`, `trgm_`), any engineer can read the migration and immediately understand the query pattern it is optimised for, without running any database introspection command. This is the same self-documenting rationale behind naming FK columns `fk_` and check constraints `chk_`.

| Type | Prefix | Pattern | Example |
|------|--------|---------|---------|
| Regular B-tree | `idx_` | `idx_{table}_{column}` | `idx_orders_user_id` |
| Composite B-tree | `idx_` | `idx_{table}_{col1}_{col2}` | `idx_orders_user_status` |
| Unique B-tree | `uq_` | `uq_{table}_{column}` | `uq_users_email` |
| Partial | `idx_` | `idx_{table}_{description}` | `idx_orders_pending` |
| GIN (JSONB / array / full-text) | `gin_` | `gin_{table}_{column}` | `gin_products_meta_data` |
| GIST (geo / range) | `gist_` | `gist_{table}_{column}` | `gist_drivers_location` |
| trigram (pg_trgm fuzzy search) | `trgm_` | `trgm_{table}_{column}` | `trgm_restaurants_name` |

```sql
-- B-tree (default, no suffix needed)
CREATE INDEX idx_orders_user_id ON orders(user_id);

-- Unique on soft-delete table — MUST be partial (see Soft Delete section)
CREATE UNIQUE INDEX uq_users_email ON users(email) WHERE deleted_at IS NULL;

-- GIN for JSONB column
CREATE INDEX gin_products_meta_data ON products USING GIN (meta_data);

-- trigram for fuzzy name search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX trgm_restaurants_name ON restaurants USING GIN (name gin_trgm_ops);
```

## Constraints

| Type | Pattern | Example |
|------|---------|---------|
| Primary key | `pk_{table}` | `pk_users` |
| Foreign key (default) | `fk_{table}_{ref_table}` | `fk_orders_users` |
| Foreign key (semantic) | `fk_{table}_{column_without_id}` | `fk_restaurants_owner` |
| Unique | `uq_{table}_{column}` | `uq_users_email` |
| Check | `chk_{table}_{description}` | `chk_orders_total` |

## JSONB Usage Rules

**Why restrict JSONB?** JSONB is powerful but has a hidden cost: PostgreSQL cannot use column statistics, check constraints, foreign keys, or efficient indexes on values *inside* a JSONB blob. Querying a JSONB key with `->>'key'` forces a full table scan or a GIN index that is far less selective than a B-tree on a typed column. Teams that start storing business fields in JSONB for "flexibility" consistently end up with slow queries, broken data integrity (no type enforcement, no NOT NULL), and migration nightmares when they eventually need to add constraints. The rule below exists to prevent that path entirely.

JSONB columns (`_data` / `_meta` / `_config`) are allowed only for **extension attributes and cold data**. They are strictly forbidden for core business logic fields.

| Allowed in JSONB | Forbidden in JSONB |
|------------------|--------------------|
| UI preferences, theme settings | Any field used in `WHERE`, `ORDER BY`, or `JOIN` |
| Third-party webhook payloads | Status, amounts, timestamps, foreign keys |
| Feature flags per-user | Any field that drives business decisions |
| Rarely-queried metadata | Any field with a uniqueness or check constraint |

**The "promote" rule**: if a key inside a JSONB column appears in a `WHERE` clause more than once, it **must** be extracted into a dedicated column in the next migration.

```sql
-- ❌ Business logic buried in JSONB — forbidden
SELECT * FROM orders WHERE meta_data->>'payment_status' = 'failed';

-- ✅ Promoted to a real column
SELECT * FROM orders WHERE payment_status = 'failed';
```

## Soft Delete & Unique Indexes

**Why partial unique indexes?** Soft delete (`deleted_at`) is a widely used pattern, but it has a silent conflict with uniqueness constraints. A plain `UNIQUE` index sees *all* rows — including soft-deleted ones. This means: a user deletes their account (row gets `deleted_at` set), then tries to re-register with the same email. The insert fails with a unique violation, even though the active user table has no conflict. This bug surfaces in production and is invisible in development because test data is rarely re-used. The partial index (`WHERE deleted_at IS NULL`) constrains only the rows that are actually "alive", which is the correct semantic.

Tables with `deleted_at` (soft delete) **must never use a plain `UNIQUE` constraint or a non-partial unique index** on columns that should be re-usable after deletion.

**Rule: all unique indexes on soft-delete tables must be partial.**

```sql
-- ❌ Broken — blocks re-registration after soft delete
CREATE UNIQUE INDEX uq_users_email ON users(email);

-- ✅ Correct — only enforces uniqueness among active (non-deleted) rows
CREATE UNIQUE INDEX uq_users_email ON users(email) WHERE deleted_at IS NULL;
```

This applies to every column that carries a uniqueness requirement on a table that has `deleted_at`.

## Database Charset & Collation

**Why declare this explicitly?** Charset and collation are set once at database creation and are almost impossible to change later without a full dump-and-restore. A mismatch (e.g., `LATIN1` vs `UTF8`) causes silent data corruption on multi-byte characters (Chinese, Arabic, emoji). `en_US.UTF-8` is the safe, universal default. `C.UTF-8` is preferred when deterministic byte-order sorting matters more than locale-aware sorting (e.g., internal IDs, codes). For fuzzy / ILIKE search, `pg_trgm` must be declared upfront — adding it later requires recreating all trigram indexes, which locks the table on large datasets.

- Encoding: **`UTF8`** — set at database creation, never override per-table
- Collation: **`en_US.UTF-8`** (or `C.UTF-8` for pure byte-order sorting)
- For fuzzy / LIKE / ILIKE search on text columns, enable `pg_trgm`:

```sql
-- In 000001_create_types.up.sql, before any table migrations
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

Use a `trgm_` GIN index (see Indexes section) for any column that will be searched with `ILIKE '%...%'` or full-text patterns.

## Enums

- Type name: `snake_case`
- Values: `snake_case`, lowercase
- Define all enums in a dedicated `000001_create_types` migration before any table migrations

```sql
CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'out_for_delivery',
  'delivered',
  'cancelled'
);
```

## Migration Files

Format: `{sequence}_{verb}_{description}.{direction}.sql`

- Sequence: 6-digit zero-padded
- Verb: `create` / `create_type` / `add` / `drop` / `alter` / `rename` / `create_index`
- Direction: `up` / `down`

```
✅ 000001_create_types.up.sql
✅ 000002_create_users.up.sql
✅ 000003_add_is_active_to_users.up.sql
✅ 000006_create_index_orders_user_id.up.sql
❌ migration1.sql   addColumn.sql
```

## Go Struct Mapping

**Why `sqlc`?** Hand-written structs with `db:""` tags drift from the real schema over time — a column is renamed in a migration but the struct tag is not updated, and the bug only surfaces at runtime. ORM-style libraries (GORM, sqlx) add reflection overhead and generate SQL that is hard to audit for performance. `sqlc` solves both problems: it reads the migration files as the single source of truth, generates Go types and query functions at compile time, and fails the build if the SQL is invalid. The result is database access that is as fast as hand-written `pgx` code and as safe as a typed API. This is the same approach used by Stripe, PlanetScale, and other 大厂 Go backends.

This project uses **`sqlc`** for type-safe code generation.

**You never write Go structs by hand.** `sqlc` reads the migration files and SQL query files, then generates:
- Structs from table schemas
- Type-safe query functions with full parameter and return types
- No `db:""` tags, no reflection, no runtime scanning errors

### Directory structure

```
apps/server/
├── db/
│   ├── migrations/       -- migration .sql files (source of truth)
│   ├── queries/          -- hand-written SQL queries (.sql)
│   └── sqlc/             -- generated Go code (never edit manually)
│       ├── db.go
│       ├── models.go
│       └── *.sql.go
└── sqlc.yaml             -- sqlc config
```

### `sqlc.yaml` config

```yaml
version: "2"
sql:
  - engine: "postgresql"
    queries: "db/queries"
    schema: "db/migrations"
    gen:
      go:
        package: "db"
        out: "db/sqlc"
        emit_json_tags: false
        emit_prepared_queries: false
        emit_interface: true
        emit_exact_table_names: false
        null_style: "sql"
```

### What sqlc generates (example)

Given the `users` table, sqlc generates:

```go
// models.go — auto-generated, do not edit
type User struct {
    ID        int64        
    Name      string       
    Email     string       
    Role      UserRole     
    CreatedAt time.Time    
    UpdatedAt time.Time    
    DeletedAt sql.NullTime 
}
```

And given a query file `db/queries/users.sql`:

```sql
-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 AND deleted_at IS NULL;

-- name: CreateUser :one
INSERT INTO users (name, email, role)
VALUES ($1, $2, $3)
RETURNING *;
```

sqlc generates:

```go
// users.sql.go — auto-generated, do not edit
func (q *Queries) GetUserByEmail(ctx context.Context, email string) (User, error) { ... }
func (q *Queries) CreateUser(ctx context.Context, arg CreateUserParams) (User, error) { ... }
```

### Rules

- **Never edit files in `db/sqlc/`** — they are always regenerated by `sqlc generate`
- SQL query files live in `db/queries/{table}.sql`
- One `.sql` file per table (e.g., `users.sql`, `orders.sql`)
- Query name comments follow sqlc convention: `-- name: QueryName :one/:many/:exec`
- Run `sqlc generate` after every migration or query change

### Cross-tenant query naming (Phase 3 ABAC)

Any query that touches a **tenant-scoped** table (`orders`, `payments`, `restaurant_payouts`, `menu_items` under a restaurant, etc.) MUST encode the scope dimension in its name. Bare listing / fetching functions that return rows across tenants are forbidden — they are a rehearsal for a data leak.

| Scope | Suffix | Example |
|---|---|---|
| Set of restaurants | `*ByRestaurants` / `*InRestaurants` | `ListOrdersByRestaurants`, `GetOrderInRestaurants`, `UpdateOrderStatusInRestaurants` |
| Single owner user | `*ByOwner` | `ListRestaurantsByOwner`, `ListRestaurantIDsByOwner` |
| Single customer user | `*ByUserID` | `ListOrdersByUserID` |
| City codes | `*ByCityCodes` | `ListOrdersByCityCodes` |

The matching handler MUST pass `actor.Scopes.RestaurantIDs` (or equivalent) in — never a `restaurant_id` from the request body / path.

```go
// ✅ correct — scope filter is baked into the query
items, err := h.queries.ListOrdersByRestaurants(ctx, db.ListOrdersByRestaurantsParams{
    RestaurantIds: actor.Scopes.RestaurantIDs,
    ...
})

// ❌ wrong — trusts the client to say which restaurant, will leak cross-tenant rows
items, err := h.queries.ListOrders(ctx, req.RestaurantID)
```

Admin-side endpoints that intentionally see across tenants (e.g. a future `GET /api/admin/orders`) MUST use a separately named query like `AdminListOrders` so the cross-tenant read is explicit in code review.

## Full Table Example

```sql
CREATE TABLE orders (
  id            BIGSERIAL    PRIMARY KEY,
  user_id       BIGINT       NOT NULL,
  rider_id      BIGINT,                      -- semantic FK: rider, not user
  status        order_status NOT NULL DEFAULT 'pending',
  total_amount  BIGINT       NOT NULL,
  note          TEXT,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  deleted_at    TIMESTAMPTZ,

  CONSTRAINT fk_orders_users  FOREIGN KEY (user_id)  REFERENCES users(id),
  CONSTRAINT fk_orders_rider  FOREIGN KEY (rider_id) REFERENCES users(id),
  CONSTRAINT chk_orders_total CHECK (total_amount >= 0)
);

CREATE INDEX idx_orders_user_id    ON orders(user_id);
CREATE INDEX idx_orders_rider_id   ON orders(rider_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_status     ON orders(status) WHERE deleted_at IS NULL;
```

## API Docs Sync (mandatory)

Every migration that **creates, alters, drops, or renames** a table, column, enum, or constraint MUST come with an update to the matching file under `docs/api/` in the **same PR / commit**.

### Mapping

- One resource doc per business concept — see `docs/api/README.md` for the full `resource → tables` mapping
- If a new table does not yet have a doc, create one by following the structure of existing files (`Endpoints` table → `Model` JSON → endpoint specs)
- If a table is dropped, delete the doc and remove the row from `docs/api/README.md`

### What must be updated in the doc

| Change in migration | What to update in `docs/api/*.md` |
|---|---|
| Add column | Add the field to the `Model` JSON block and any response / request body examples it appears in |
| Drop column | Remove the field from every example |
| Rename column | Rename in every example |
| Add / change enum value | Update the union type in the `Model` and enum list in endpoint specs |
| Add / drop table | Add or delete the resource file; update the index in `docs/api/README.md` |
| Add unique / check constraint that affects client behavior | Document the error response (`409`, `400`) in the relevant endpoint |
| New FK that implies a new endpoint (e.g. sub-resource) | Add the new endpoint row to the `Endpoints` table |

### Failure mode

If a schema change lands without the matching doc update, the next engineer that reads `docs/api/` will build against a stale contract. Treat a missing doc update as the same severity as a missing `sqlc generate` — the PR is not complete.

### Checklist addendum

Add these items to every schema PR self-review:

- [ ] `docs/api/{resource}.md` updated for every schema change in this PR
- [ ] `docs/api/README.md` index reflects any added / removed resources
- [ ] `Model` JSON in the doc matches the final column set (names, nullability, enum values)
- [ ] Endpoint examples reference the new / renamed fields

## Quick Checklist

- [ ] Table name is plural `snake_case`, no prefix
- [ ] All columns are `snake_case`
- [ ] `id` is `BIGSERIAL PRIMARY KEY`
- [ ] `created_at`, `updated_at`, `deleted_at` present on every table
- [ ] Boolean columns use `is_` / `has_` / `can_` prefix
- [ ] Timestamps use `TIMESTAMPTZ`, not `TIMESTAMP`
- [ ] Money stored as `BIGINT` (cents), never `FLOAT`
- [ ] Geo columns use `DECIMAL(10,8)` / `DECIMAL(11,8)`, never `FLOAT`
- [ ] FK column named `{singular_table}_id` or semantic name when role matters
- [ ] FK constraint named `fk_{table}_{ref_table}` or `fk_{table}_{column_without_id}` for semantic FKs
- [ ] All constraints explicitly named per convention
- [ ] B-tree indexes use `idx_` / `uq_`, GIN uses `gin_`, GIST uses `gist_`, trigram uses `trgm_`
- [ ] Unique indexes on soft-delete tables are partial (`WHERE deleted_at IS NULL`)
- [ ] JSONB columns contain no fields used in `WHERE` / `JOIN` / `ORDER BY`
- [ ] `pg_trgm` extension created before any table using trigram indexes
- [ ] Database encoding is `UTF8`
- [ ] Migration file follows `{seq}_{verb}_{desc}.{direction}.sql`
- [ ] FK columns are `BIGINT` (not `UUID`)
- [ ] SQL queries live in `db/queries/{table}.sql`, one file per table
- [ ] Query name comments follow `-- name: QueryName :one/:many/:exec`
- [ ] `sqlc generate` has been run after schema or query changes
- [ ] Files in `db/sqlc/` are never edited manually
- [ ] `docs/api/{resource}.md` updated for every schema change (see API Docs Sync section)
- [ ] `docs/api/README.md` index updated when a resource is added or removed
