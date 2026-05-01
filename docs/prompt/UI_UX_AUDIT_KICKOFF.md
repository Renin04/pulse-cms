# Pulse CMS — UI/UX Audit & Redesign Kickoff

> **For:** Next session agent  
> **Date:** 2026-04-23  
> **Scope:** Complete visual redesign of all user-facing and admin pages  
> **Tooling:** Screenshot-driven iteration via `scripts/screenshot-audit.mjs`

---

## 1. Project Context

Pulse is a Next.js 14 CMS monorepo with a marketing site (`/`) + blog (`/blog`, `/blog/[slug]`) + admin dashboard (`/admin/*`) + block editor studio (`/admin/studio`, legacy `/studio`).

**Tech stack:**
- Next.js 14 App Router, TypeScript, Tailwind CSS v3
- Prisma + SQLite (dev)
- JWT auth (localStorage-based tokens)
- Custom fonts: Codec Pro, Bahnschrift
- CSS custom properties for theming (`--pulse-red`, `--pulse-black`, `--neutral-*`)

**Dev server:** `npm run dev` in `apps/website` → `http://localhost:3000`

**Admin login:** `mmshfa@pulse.local` / `**removed**`

---

## 2. Screenshot Infrastructure (TESTED & WORKING)

### 2.1 Script Location
`apps/website/scripts/screenshot-audit.mjs`

### 2.2 What It Does
- Uses **puppeteer-core** + system Chrome/Edge
- Captures **all key pages** in **3 viewports**:
  - `desktop`: 1920×1080
  - `tablet`: 768×1024 (@2x)
  - `mobile`: 375×812 (@3x, iPhone X)
- **Auto-login for admin pages**: visits `/studio`, fills credentials, localStorage auth persists across pages
- Outputs to `apps/website/screenshots/`
- Clears old screenshots on each run

### 2.3 How to Run
```bash
cd apps/website
node scripts/screenshot-audit.mjs
```

### 2.4 Expected Output (30 screenshots)
| Category | Pages | Viewports |
|----------|-------|-----------|
| Public | home, blog, post | desktop, tablet, mobile |
| Studio (legacy) | old-studio | desktop, tablet, mobile |
| Admin (auth) | dashboard, content, users, media, settings, studio | desktop, tablet, mobile |

### 2.5 Screenshot Review Workflow
After each design iteration:
1. Make code changes
2. Wait for dev server hot reload
3. Re-run `node scripts/screenshot-audit.mjs`
4. Review the generated PNGs visually
5. Iterate

---

## 3. Current State Analysis (From Screenshots)

### 3.1 Public Pages

#### `/` — Homepage
- **Layout:** Hero → Features/Demo → Dark sections → Footer
- **Hero text:** "blogs are dead / Products are next." (animated/typewriter effect visible)
- **CTAs:** "Join the rebellion" (primary red), "See what's possible →" (text link)
- **Navigation:** Glassmorphism floating nav with Features, Demo, Docs, Blog + "Open Demo" button
- **Mobile:** Responsive, nav collapses, sections stack vertically
- **Issues:**
  - Some dark gradient sections appear as pure black bands (content may not be rendering)
  - Very tall page — some middle sections look sparse
  - No visible micro-interactions or scroll animations

#### `/blog` — Blog Listing
- **Layout:** Dark gradient hero → Search bar → "Latest posts" grid → Footer
- **Hero:** "The rebellion continues" with "PULSE BLOG" badge
- **Search:** Full-width white search input
- **Cards:** One card visible ("Hello Backend") with:
  - Yellow placeholder featured image (letter "H")
  - "PULSE STORY" category badge
  - Title, date, author, read time
- **Mobile:** Card stacks to full width, search remains prominent
- **Issues:**
  - Only 1 article — need more demo data for realistic grid testing
  - Card hover states unknown (can't see from static screenshot)
  - No pagination visible (only 1 article)
  - No filter chips or category sidebar

#### `/blog/hello-backend` — Post Detail
- **Layout:** Header meta → Featured visual → Article body → Sidebar (share, tags, CTA) → Footer
- **Meta:** "BACK TO BLOG", "PULSE STORY" badge, title, author, date, read time
- **Featured visual:** Large gradient orange card with "H" lettermark — striking but takes up a lot of space
- **Share:** Twitter, LinkedIn, Facebook, Copy link icons
- **Tags:** Empty section
- **CTA:** "Written in Pulse" promo card with "Try the editor" button
- **Mobile:** Sidebar stacks below content
- **Issues:**
  - No visible article body content (may be empty for this post)
  - No reading progress indicator
  - No "related posts" section
  - Featured visual dominates but doesn't show actual content

### 3.2 Admin Pages (Authenticated)

> **Note:** All admin pages share a common sidebar layout. The public navigation header is **correctly hidden** on admin pages (fix applied: `pathname?.startsWith('/admin')`).

#### `/admin` — Dashboard
- **Layout:** Sidebar → Stat cards (6 metrics) → Quick Actions (4 buttons) → Recent Entries list
- **Stats:** Total Posts, Published, Drafts, In Review, Scheduled, Archived
- **Quick Actions:** New Post, Upload Media, Manage Users, Edit Taxonomies
- **Recent Entries:** "Hello Backend" with slug + published badge
- **Mobile:** 2-column stat grid, stacked quick actions
- **Issues:**
  - Very minimal — no charts, graphs, or data visualization
  - No activity feed or audit log
  - Stat cards are plain white boxes — need visual hierarchy
  - Quick Actions are just text buttons — need icons + better styling

#### `/admin/content` — Content Library
- **Layout:** Header → Search → Bulk actions → Data table
- **Table columns:** Title, Slug, Status, Updated, Actions (view, edit, delete icons)
- **Bulk actions:** Bulk Publish, Bulk Unpublish, Bulk Archive
- **Status filter:** "All Statuses" dropdown
- **New Entry:** Primary button top-right
- **Mobile:** Table may need horizontal scroll or card view
- **Issues:**
  - Table is sterile — no row hover effects, no zebra striping
  - Status badge is plain text — needs colored pills
  - Only 1 row visible — can't assess pagination or empty state
  - No thumbnail/previews in table

#### `/admin/users` — Users
- **Layout:** Header → "No users yet" empty state
- **Empty state:** Icon + text in dashed border box
- **Issues:**
  - Empty state is very plain
  - No guidance on how to add first user

#### `/admin/media` — Media Library
- **Layout:** Header → Search → "No media assets yet" empty state
- **Issues:**
  - Same sterile empty state as users
  - No drag-drop zone visible
  - No folder navigation

#### `/admin/settings` — Settings
- **Layout:** Not fully reviewed in this session — verify with screenshot script

#### `/admin/studio` — Embedded Studio
- **Layout:** Sidebar → Full PulseBlogStudio component
- **Sections:**
  - Header: "Pulse-powered blog authoring" + "New Draft" button + "Reset Workspace"
  - Content Queue (left): Entry list with status badges
  - Selected Entry (center): Title, slug, excerpt, eyebrow, author, tags, SEO fields
  - Workflow Controls (right): Submit for Review, Publish Now, Return to Draft, Archive, Schedule, Queue
  - Lifecycle Summary: Current status, SEO readiness score (50), Reader Route
  - Pulse Editor Canvas: Block editor with "Add block" button
  - Reader Preview: Generated HTML preview
- **Issues:**
  - Very dense information architecture
  - Three-column layout may be overwhelming
  - SEO score of 50 shown prominently — unclear what this means to users
  - Block editor canvas is mostly empty
  - Many UI elements lack consistent spacing/padding

### 3.3 Legacy Studio

#### `/studio` — Old Studio (Unauthenticated)
- **Layout:** Public nav → Login form → Footer
- **Login form:** "Admin Studio" with email, password, "Enter Studio" button
- **Issues:**
  - This page still exists separately from `/admin/studio`
  - Should probably redirect to `/admin` or be removed
  - Login form styling doesn't match admin theme

---

## 4. Critical Bugs Already Fixed

| Bug | File | Fix |
|-----|------|-----|
| Public header showing on admin sub-pages | `SmartNavigationWrapper.tsx` | Changed `pathname === '/admin'` to `pathname?.startsWith('/admin') \|\| pathname === '/studio'` |

---

## 5. Redesign Priorities (Ranked)

### P0 — Must Fix (Functional/Visual Blockers)
1. **Admin Dashboard**: Currently just stat cards + text buttons. Needs charts, activity feed, real data visualization.
2. **Empty States**: Users, Media, and potentially other pages show bare "No X yet" messages. Need illustration + CTA guidance.
3. **Content Library Table**: Needs status color badges, row hover, better spacing, card view option for mobile.

### P1 — Strongly Needed (Visual Quality)
4. **Blog Cards**: Need hover lift effects, better image handling, category colors, consistent metadata layout.
5. **Post Page**: Need reading progress, related posts, better typography scale, share button positioning.
6. **Admin Studio**: The embedded studio needs cleaner 3-column layout, better visual hierarchy, clearer block editor affordances.

### P2 — Polish (Nice to Have)
7. **Homepage Micro-interactions**: Scroll animations, section reveals, button hover states.
8. **Mobile Admin**: Sidebar hamburger menu works but could use better transitions.
9. **Old Studio Consolidation**: Remove `/studio` or redirect to `/admin`.

---

## 6. Design System Notes

### Current Colors (from CSS variables)
- `--pulse-red`: #FF5333 (primary accent)
- `--pulse-black`: #111827 (dark text)
- `--neutral-50`: #F9FAFB (light bg)
- `--neutral-200`: #E5E7EB (borders)
- `--neutral-600`: #4B5563 (secondary text)

### Current Typography
- Headings: Codec Pro (300/400/700)
- Body: Bahnschrift
- Admin UI: System sans-serif via Tailwind defaults

### Existing Components to Leverage
- `SmartNavigationWrapper` — handles scroll-hide + glassmorphism toggle
- `Navigation` — public site nav
- `Footer` — public site footer
- `StudioAuthGate` — auth wrapper with login form
- Admin sidebar in `admin/layout.tsx`

---

## 7. File Map for Redesign

```
apps/website/
├── app/
│   ├── page.tsx                    # Homepage
│   ├── layout.tsx                  # Root layout (fonts, nav wrapper)
│   ├── blog/
│   │   ├── page.tsx               # Blog listing
│   │   └── [slug]/
│   │       └── page.tsx           # Post detail
│   ├── admin/
│   │   ├── layout.tsx             # Admin shell (sidebar)
│   │   ├── page.tsx               # Dashboard
│   │   ├── content/
│   │   │   └── page.tsx           # Content library
│   │   ├── users/
│   │   │   └── page.tsx           # Users
│   │   ├── media/
│   │   │   └── page.tsx           # Media library
│   │   ├── settings/
│   │   │   └── page.tsx           # Settings
│   │   └── studio/
│   │       └── page.tsx           # Embedded studio
│   ├── studio/
│   │   └── page.tsx               # LEGACY — consider removing
│   ├── components/
│   │   ├── SmartNavigationWrapper.tsx
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   ├── StudioAuthGate.tsx
│   │   └── PulseBlogStudio.tsx    # The block editor studio
│   └── globals.css                # CSS variables + Tailwind
├── lib/
│   ├── api-client.ts              # API client (auth uses localStorage)
│   └── use-api.ts                 # React hooks
└── scripts/
    └── screenshot-audit.mjs       # Screenshot tool
```

---

## 8. Recommended Next Steps for Redesign Agent

1. **Run screenshot audit** to capture current baseline
2. **Add demo data** — create 5-10 sample posts so blog grid and content library look realistic
3. **Start with admin dashboard** — it's the most visually empty and easiest win
4. **Redesign empty states** across Users, Media, Content
5. **Polish blog cards** — hover effects, shadows, image handling
6. **Improve post page** — typography, related posts, reading progress
7. **Clean up studio** — better spacing, clearer workflow
8. **Run screenshot audit after each major change** to verify

---

## 9. Quick Commands

```bash
# Start dev server
cd apps/website && npm run dev

# Take screenshots
cd apps/website && node scripts/screenshot-audit.mjs

# Type check
cd apps/website && npm run typecheck

# Build test
cd apps/website && npm run build

# Add demo posts (if script exists)
cd apps/website && node scripts/create-sample-post.js
```

---

## 10. Screenshot File Reference

All screenshots are in `apps/website/screenshots/`:

| File | Description |
|------|-------------|
| `home-{viewport}.png` | Homepage |
| `blog-{viewport}.png` | Blog listing |
| `post-{viewport}.png` | Post detail |
| `old-studio-{viewport}.png` | Legacy studio login |
| `admin-dashboard-{viewport}.png` | Admin dashboard |
| `admin-content-{viewport}.png` | Content library |
| `admin-users-{viewport}.png` | Users page |
| `admin-media-{viewport}.png` | Media library |
| `admin-settings-{viewport}.png` | Settings page |
| `admin-studio-{viewport}.png` | Embedded studio |

Where `{viewport}` = `desktop` | `tablet` | `mobile`.


---

## 11. Progress Tracker

> **Update this table after every redesign session.** Mark pages as DONE, IN PROGRESS, or NOT STARTED. Add notes about what changed or what remains.

| Priority | Page | Path | Status | Notes |
|----------|------|------|--------|-------|
| P0 | Admin Dashboard | `/admin` | DONE | Redesigned with greeting header, colored stat cards with trends, CSS content distribution bar, improved quick actions with primary CTA, recent entries with status badges, content health progress bars |
| P0 | Users Empty State | `/admin/users` | DONE | Fixed API bug (users→items), redesigned empty state with illustration + CTA, improved table with avatars/status badges/role chips, styled create form, added hover + modal screenshot capture |
| P0 | Media Empty State | `/admin/media` | DONE | Fixed upload auth (trailing slash), added view/rename/download/delete actions, preview modal for images/videos/audio/docs, redesigned empty state with icon badge + format badges, polished grid with hover lift |
| P0 | Content Library | `/admin/content` | DONE | Added status stat cards, redesigned table with colored status badges/icons/author/type columns, row hover actions, mobile card view, styled bulk actions, improved empty state, better search/filter UI |
| P1 | Blog Listing | `/blog` | NOT STARTED | Cards need hover lift, better images, category colors |
| P1 | Post Detail | `/blog/[slug]` | NOT STARTED | Needs reading progress, related posts, typography |
| P1 | Admin Studio | `/admin/studio` | NOT STARTED | Cleaner 3-column layout, better hierarchy |
| P2 | Homepage | `/` | NOT STARTED | Scroll animations, section reveals, micro-interactions |
| P2 | Mobile Admin | `/admin/*` | NOT STARTED | Better sidebar transitions |
| P2 | Legacy Studio | `/studio` | NOT STARTED | Redirect to `/admin` or remove |

### Session History

| Date | Session | Pages Completed | Notes |
|------|---------|-----------------|-------|
| 2026-04-23 | Setup & Audit | None | Created screenshot tool, wrote kickoff file, fixed header bug on admin pages |
| 2026-04-23 | Dashboard Redesign | Admin Dashboard (`/admin`) | Redesigned stat cards, added content distribution chart, improved quick actions, recent entries with badges, content health metrics |
| 2026-04-23 | Users Redesign | Users (`/admin/users`) | Fixed API response shape bug, redesigned empty state, polished table view with avatars/badges, styled create form, enhanced screenshot tool for modal/hover capture |
| 2026-04-23 | Media Redesign | Media (`/admin/media`) | Redesigned empty state with icon/upload badge, format type badges, polished grid with hover lift and type icons, styled pagination |
| 2026-04-23 | Critical Backend Fixes | All API routes | Fixed `users`→`items` response key, fixed trailing slash mismatch in api-client, removed `generateStaticParams` from 24 API routes that was breaking PUT/DELETE/POST handlers |

