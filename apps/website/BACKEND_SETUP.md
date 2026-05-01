# Pulse Website — Backend & CMS Setup Guide

## What Was Built

This is a **production-ready backend foundation** for the Pulse website that replaces `localStorage` with a real database-backed CMS.

### Architecture
- **Framework**: Next.js App Router (API Routes)
- **Database**: Prisma + SQLite (development) / PostgreSQL (production)
- **Auth**: JWT (access + refresh tokens) with bcrypt password hashing
- **ORM**: Prisma Client

### API Routes Implemented

#### Auth (`/api/auth/*`)
- `POST /api/auth/login` — Login with email/password, returns JWT tokens
- `POST /api/auth/logout` — Logout (logs audit)
- `POST /api/auth/refresh` — Refresh access token
- `GET /api/auth/me` — Get current user
- `POST /api/auth/request-password-reset` — Request password reset (dev mock)
- `POST /api/auth/reset-password` — Reset password with token

#### Users (`/api/users/*`)
- `GET /api/users` — List users (search, pagination)
- `POST /api/users` — Create user (with roles)
- `GET /api/users/:id` — Get user
- `PUT /api/users/:id` — Update user
- `DELETE /api/users/:id` — Delete user
- `PUT /api/users/:id/roles` — Update user roles

#### Roles (`/api/roles`)
- `GET /api/roles` — List all roles with permissions

#### CMS Entries (`/api/cms/entries/*`)
- `GET /api/cms/entries` — List entries (filter by status, contentTypeId, search, pagination)
- `POST /api/cms/entries` — Create entry
- `GET /api/cms/entries/:id` — Get entry
- `PUT /api/cms/entries/:id` — Update entry
- `DELETE /api/cms/entries/:id` — Delete entry
- `GET /api/cms/entries/slug/:slug` — Get entry by slug
- `POST /api/cms/entries/:id/duplicate` — Duplicate entry
- `POST /api/cms/entries/bulk` — Bulk actions (publish/unpublish/archive/delete)
- `POST /api/cms/entries/:id/submit-review` — Submit for review
- `POST /api/cms/entries/:id/approve` — Approve entry
- `POST /api/cms/entries/:id/reject` — Reject entry
- `POST /api/cms/entries/:id/publish` — Publish immediately
- `POST /api/cms/entries/:id/unpublish` — Unpublish (revert to draft)
- `POST /api/cms/entries/:id/schedule` — Schedule for future publish
- `POST /api/cms/entries/:id/archive` — Archive entry
- `GET /api/cms/entries/:id/versions` — List versions
- `POST /api/cms/entries/:id/versions/:versionId/restore` — Restore version

#### Content Types (`/api/cms/content-types/*`)
- `GET /api/cms/content-types` — List content types
- `POST /api/cms/content-types` — Create content type
- `GET /api/cms/content-types/:id` — Get content type
- `PUT /api/cms/content-types/:id` — Update content type
- `DELETE /api/cms/content-types/:id` — Delete content type

#### Taxonomies (`/api/taxonomies/*`)
- `GET /api/taxonomies` — List taxonomies
- `POST /api/taxonomies` — Create taxonomy
- `GET /api/taxonomies/:id` — Get taxonomy
- `PUT /api/taxonomies/:id` — Update taxonomy
- `DELETE /api/taxonomies/:id` — Delete taxonomy
- `GET /api/taxonomies/:id/terms` — List terms
- `POST /api/taxonomies/:id/terms` — Create term
- `PUT /api/taxonomies/:id/terms/:termId` — Update term
- `DELETE /api/taxonomies/:id/terms/:termId` — Delete term

#### Settings (`/api/settings/*`)
- `GET /api/settings` — List settings
- `PUT /api/settings` — Update settings
- `GET /api/settings/featured-tags` — Get featured tags
- `PUT /api/settings/featured-tags` — Update featured tags

#### Public Content Delivery (`/api/content/*`)
- `GET /api/content/entries` — List published entries
- `GET /api/content/entries/:slug` — Get published entry by slug
- `GET /api/content/search?q=...` — Search published entries
- `GET /api/content/related/:slug` — Get related entries
- `GET /api/content/taxonomies/:slug` — Get taxonomy by slug
- `GET /api/content/preview/:token` — Preview draft entry (MVP: permissive)

### Frontend Integration

#### New Files
- `lib/api-client.ts` — Typed API client with automatic token refresh
- `lib/use-api.ts` — React hooks for auth, entries, taxonomies, settings
- `lib/entry-adapter.ts` — Transforms API `EntryDetail` into component-compatible `AdaptedBlogEntry`
- `lib/use-backend-entries.ts` — Hooks for blog listing/reading from backend

#### Updated Files
- `app/components/AdminAuth.tsx` — Uses backend login API
- `app/components/StudioAuthGate.tsx` — Uses unified `useAuth` hook
- `app/blog/page.tsx` — Reads published entries from backend API
- `app/blog/BlogPostContent.tsx` — Reads single entry from backend API
- `app/admin/page.tsx` — Reads/writes featured tags and entries via API

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd C:\Users\z0512\Desktop\pulse\apps\website
npm install
```

If npm mirror issues occur, temporarily switch registry:
```bash
npm config set registry https://registry.npmjs.org/
npm install
```

### 2. Set Environment Variables

`.env.local` is already created:
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="pulse-local-dev-secret-change-in-production"
JWT_REFRESH_SECRET="pulse-local-refresh-secret-change-in-production"
```

For production, change `JWT_SECRET` and `JWT_REFRESH_SECRET` to strong random strings.

### 3. Generate Prisma Client

```bash
npx prisma generate
```

> **Note**: If Prisma binary download fails due to network restrictions, set this environment variable first:
> ```bash
> $env:PRISMA_CLI_QUERY_ENGINE_TYPE = "library"
> ```
> Or download the binary manually and place it in `node_modules/@prisma/engines/`.

### 4. Run Database Migration

```bash
npx prisma migrate dev --name init
```

### 5. Seed the Database

```bash
npx prisma db seed
```

> If `db seed` is not configured, run directly:
> ```bash
> npx tsx prisma/seed.ts
> ```

This creates:
- Default roles: `super_admin`, `admin`, `editor`, `reviewer`, `author`, `viewer`
- Default permissions for all scopes
- Default admin user: `admin@pulse.local` / `pulse2025`
- Default content types: `blog_post`, `landing_page`, `site_setting`
- Default site settings including featured tags

### 6. Start Development Server

```bash
npm run dev
```

### 7. Verify Setup

1. Open `http://localhost:3000/admin`
2. Login with `admin@pulse.local` / `pulse2025`
3. Open `http://localhost:3000/blog` — should show published posts from backend
4. Open `http://localhost:3000/studio` — should use unified auth

---

## Database Schema Summary

| Table | Purpose |
|-------|---------|
| `users` | Auth users with password hash |
| `roles` | Role definitions |
| `permissions` | Permission scopes |
| `user_roles` | User-role assignments |
| `role_permissions` | Role-permission assignments |
| `content_types` | CMS content type schemas |
| `entries` | Content entries (JSON blocks, fieldValues, metadata) |
| `entry_versions` | Revision history |
| `entry_taxonomy_terms` | Entry-term relationships |
| `entry_relationships` | Entry-entry relationships |
| `taxonomies` | Taxonomy definitions |
| `taxonomy_terms` | Taxonomy terms (hierarchical) |
| `media_assets` | Media library files |
| `media_folders` | Media folder hierarchy |
| `media_usage` | Asset usage tracking |
| `site_settings` | Site-wide settings |
| `publish_jobs` | Scheduled publish/unpublish jobs |
| `audit_logs` | Audit trail |

---

## Switching to PostgreSQL (Production)

1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. Update `.env.local`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/pulse"
   ```

3. Re-run migration:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

---

## Remaining Work (Phase 3+)

### Phase 3: Media + Block Parity
- [ ] Implement `POST /api/media/upload` with multer/formidable
- [ ] Add S3/R2/Cloudinary storage adapter
- [ ] Update Studio to use media API instead of manual URLs
- [ ] Validate all 40 Pulse block types through the API

### Phase 4: Delivery Hardening
- [ ] Add Redis caching layer for public content
- [ ] Implement secure preview tokens (JWT-signed)
- [ ] Add ISR/revalidation for static blog pages
- [ ] Full-text search indexing (PostgreSQL `tsvector` or Meilisearch)

### Phase 5: Studio Full Migration
- [ ] Rewrite `PulseBlogStudio.tsx` to use `entries.create/update/delete` APIs
- [ ] Replace `BlogStudioWorkspace` with backend workflow engine
- [ ] Remove `browser-blog-studio.ts` localStorage dependency
- [ ] Add real-time collaboration via WebSocket/SSE

### Phase 6: Operations
- [ ] Background job worker for scheduled publishing
- [ ] Analytics dashboard
- [ ] Rate limiting on API routes
- [ ] CSRF protection
- [ ] Sentry error monitoring

---

## Default Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@pulse.local | pulse2025 | super_admin |

---

## Tech Decisions

- **SQLite for dev**: No PostgreSQL server required for local development. Easy to switch.
- **JWT in memory + localStorage fallback**: Balances security with UX. Access token is short-lived (15 min), refresh token is 7 days.
- **JSON columns for blocks/fieldValues**: Prisma + SQLite supports JSON. For complex queries, PostgreSQL's JSONB is recommended.
- **Adapter pattern for frontend**: `entry-adapter.ts` bridges the gap between the new API schema and existing component expectations, minimizing UI rewrites.
