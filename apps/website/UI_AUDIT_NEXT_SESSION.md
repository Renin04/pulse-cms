# Pulse Website — Visual UI/UX Audit & Next Session Kickoff

> **Date**: 2026-04-23
> **Status**: CRITICAL BUGS FOUND + Major Design Improvements Needed
> **Goal of Next Session**: Fix all critical visual bugs, elevate UI/UX to professional standard, add microinteractions and microanimations.

---

## 1. How to Take Screenshots (No Playwright Needed)

Both **Google Chrome** and **Microsoft Edge** are installed on this Windows machine. Use Chrome in headless mode for screenshots. This requires ZERO npm installs.

### Chrome Headless Screenshot Command

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" `
  --headless `
  --disable-gpu `
  --screenshot="C:\Users\z0512\Desktop\pulse\apps\website\screenshots\FILENAME.png" `
  --window-size=WIDTH,HEIGHT `
  --hide-scrollbars `
  --user-agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64)" `
  http://localhost:3000/PATH
```

### Responsive Breakpoints to Test

| Device | Width x Height | Pages to Test |
|--------|---------------|---------------|
| Mobile | 375 x 812 | `/`, `/blog`, `/blog/[slug]` |
| Tablet | 768 x 1024 | `/`, `/blog`, `/blog/[slug]` |
| Desktop | 1920 x 1080 | ALL pages including admin |

### Pages That MUST Be Screenshot for Visual Review

1. `http://localhost:3000/` — Homepage
2. `http://localhost:3000/blog` — Blog listing
3. `http://localhost:3000/blog/hello-backend` — Blog post (or any published slug)
4. `http://localhost:3000/admin` — Admin dashboard
5. `http://localhost:3000/admin/content` — Content library
6. `http://localhost:3000/admin/studio` — Studio editor
7. `http://localhost:3000/admin/media` — Media library
8. `http://localhost:3000/admin/users` — User management
9. `http://localhost:3000/admin/settings` — Settings
10. `http://localhost:3000/admin/taxonomies` — Taxonomies
11. `http://localhost:3000/studio` — OLD studio page (for comparison)

### Screenshot Directory

```
C:\Users\z0512\Desktop\pulse\apps\website\screenshots\
```

### View Screenshots in This Session

Use the `ReadMediaFile` tool with the full path to view any screenshot and assess visual state after making changes. Example:

```
ReadMediaFile path="C:\Users\z0512\Desktop\pulse\apps\website\screenshots\01-home-desktop.png"
```

**Workflow for the next agent**: Make a change → Take a screenshot → View it with `ReadMediaFile` → Assess → Iterate.

---

## 2. CRITICAL BUGS (Must Fix First)

### 🔴 BUG-1: Public Marketing Header Leaks Into ALL Admin Pages

**Problem**: The `SmartNavigationWrapper` component shows the public nav (Features, Demo, Docs, Blog, Open Demo button) on `/admin/content`, `/admin/studio`, `/admin/media`, `/admin/users`, `/admin/settings`, `/admin/taxonomies`, and `/studio`. This is a catastrophic UX failure for a CMS.

**Root Cause**: `app/components/SmartNavigationWrapper.tsx` line 54:
```tsx
const isAdminPage = pathname === '/admin' || pathname === '/admin/';
```
This ONLY matches exact `/admin`. It does NOT match `/admin/studio`, `/admin/content`, etc.

**Fix**: Change to:
```tsx
const isAdminPage = pathname.startsWith('/admin') || pathname === '/studio' || pathname.startsWith('/studio/');
```

**File**: `app/components/SmartNavigationWrapper.tsx` (line 54)

---

### 🔴 BUG-2: Admin Dashboard Is Completely Blank (Only Spinner)

**Problem**: `/admin` shows a white page with only a loading spinner in the center. No sidebar, no content, no dashboard.

**Likely Cause**: The `useAuth()` hook in `app/admin/layout.tsx` is not resolving correctly in the headless screenshot context, OR the auth state is not being read properly. The layout shows a loading spinner when `isLoading` is true.

**Investigate**:
- Check if `auth.me()` is hanging
- Check if the auth token is being read correctly
- The admin layout might need a fallback or the auth check might be too strict

**File**: `app/admin/layout.tsx`

---

### 🔴 BUG-3: All Admin Sub-Pages Show Loading Spinners

**Problem**: `/admin/content`, `/admin/studio`, `/admin/media`, `/admin/users`, `/admin/settings` all show infinite loading spinners with the public header visible above.

**Likely Cause**: Same as BUG-2 — the auth gate in the layout is blocking all content. The `useAuth()` hook may be failing to authenticate because:
1. No token is present in headless mode
2. The `auth.me()` API call is returning 401 and the layout shows "CMS Access Required" login screen (which also might not render correctly)

**Screenshot Evidence**: `screenshots/08-admin-content.png`, `screenshots/12-admin-studio.png`

**File**: `app/admin/layout.tsx`

---

### 🔴 BUG-4: Blog Post Page Loads Forever

**Problem**: `/blog/hello-backend` shows only a loading spinner. The post content never renders.

**Likely Cause**: The `useBackendBlogEntry()` hook or the blog post page component is hanging on data fetch.

**Investigate**:
- Check `app/blog/[slug]/page.tsx`
- Check `app/blog/BlogPostContent.tsx`
- Check if the API `GET /api/content/entries/hello-backend` returns data

**Screenshot Evidence**: `screenshots/05-post-desktop.png`

**Files**: `app/blog/[slug]/page.tsx`, `app/blog/BlogPostContent.tsx`

---

### 🔴 BUG-5: Blog Listing Shows "More Stories Coming Soon" (Empty)

**Problem**: The `/blog` page shows the hero header but no blog cards. It says "More stories coming soon" in a dashed border box.

**Likely Cause**: The blog listing component is not rendering entries from the backend API, OR there are no published entries.

**Note**: There IS one published entry (`hello-backend`) in the database. The blog listing should show it.

**Screenshot Evidence**: `screenshots/03-blog-desktop.png`, `screenshots/04-blog-mobile.png`

**Files**: `app/blog/page.tsx`, `app/components/LocalStudioBlogFeed.tsx`

---

### 🔴 BUG-6: Mobile Homepage Text Overflow

**Problem**: On 375px width mobile, the hero headline "blogs are dead" and "Stories are next." text is cut off on the right edge.

**Screenshot Evidence**: `screenshots/02-home-mobile.png`

**File**: `app/page.tsx` (hero section)

---

## 3. MAJOR DESIGN ISSUES (Professional Critique)

### Admin Panel Design

| Issue | Severity | Description |
|-------|----------|-------------|
| Flat sidebar | Medium | The sidebar is pure white with minimal depth. Needs subtle shadow, better active state indicators, hover transitions |
| No breadcrumbs | Medium | No way to know where you are in the CMS hierarchy |
| Table styling | Medium | Content and Users tables are barebones. Need row hover states, better typography hierarchy, action button grouping |
| Missing empty states | Medium | Empty pages just show text. Needs illustrated empty states with CTAs |
| No loading skeletons | Medium | Spinners everywhere. Need skeleton screens for perceived performance |
| No toast notifications | High | All actions use `alert()` which is unacceptable in production |
| No confirmation dialogs | Medium | Delete confirmations use native `confirm()` — needs custom modal |
| Form inputs lack focus rings | Low | Focus states are inconsistent |

### Studio/Editor Design

| Issue | Severity | Description |
|-------|----------|-------------|
| Studio shows public nav | CRITICAL | See BUG-1 |
| No auto-save indicator | Medium | Users don't know if their work is saved |
| No publishing workflow UI | Medium | Status transitions (draft → review → published) not visually guided |
| Block editor lacks visual polish | Medium | Blocks need better spacing, borders, hover states |
| No dark mode | Low | Modern CMS should have dark mode |

### Blog Design

| Issue | Severity | Description |
|-------|----------|-------------|
| Empty blog listing | CRITICAL | See BUG-5 |
| Post page broken | CRITICAL | See BUG-4 |
| No post card hover effects | Medium | Blog cards should lift on hover with shadow transition |
| No reading progress | Low | Could add a reading progress bar for long posts |
| Tag pills lack microinteraction | Low | Tags should have subtle hover scale/background transitions |
| Mobile text overflow | High | See BUG-6 |

### Homepage Design

| Issue | Severity | Description |
|-------|----------|-------------|
| Hero is static | Medium | The headline could have a subtle type animation or gradient shift |
| CTA buttons lack hover depth | Medium | Buttons need better hover states (lift, glow, or color shift) |
| No scroll-triggered reveals | Medium | Sections below fold should animate in on scroll |
| Mobile text overflow | High | See BUG-6 |

---

## 4. RECOMMENDED IMPROVEMENTS (Next Session Goals)

### Phase A: Fix Critical Bugs (First 30 min)
1. Fix `SmartNavigationWrapper` admin path detection
2. Fix admin layout auth / loading issue
3. Fix blog post page loading forever
4. Fix blog listing empty state

### Phase B: Admin Panel Polish (Next 60 min)
1. Add proper toast notification system (replace all `alert()` calls)
2. Add custom confirmation modal for deletes
3. Improve sidebar design — add depth, better active states, icons
4. Add breadcrumbs to admin pages
5. Improve table styling — row hover, better action buttons, status badges
6. Add loading skeletons for tables and cards
7. Add empty state illustrations with CTAs

### Phase C: Microinteractions & Microanimations (Next 60 min)
1. **Button hover effects**: Lift + shadow on all primary buttons
2. **Card hover effects**: Scale 1.02 + shadow on blog cards, media cards
3. **Tag/badge transitions**: Smooth background/color transitions on all tags
4. **Page transitions**: Fade/slide between admin routes
5. **Toast animations**: Slide-in from top-right with progress bar
6. **Modal animations**: Scale + fade for confirmation dialogs
7. **Skeleton shimmer**: Animated gradient shimmer on loading skeletons
8. **Nav item hover**: Subtle background slide or indicator movement

### Phase D: Blog & Homepage Polish (Next 60 min)
1. Fix mobile text overflow on homepage
2. Add scroll-triggered fade-in animations to homepage sections
3. Add blog card hover lift effect
4. Add reading progress bar to blog posts
5. Improve tag filter microinteractions
6. Add "back to top" button with smooth scroll

### Phase E: Studio Polish (Next 30 min)
1. Ensure studio has NO public navigation
2. Add auto-save indicator
3. Add status transition visual guide
4. Improve block editor visual spacing

---

## 5. Key File Paths Reference

### Navigation / Layout
- `app/components/SmartNavigationWrapper.tsx` — **BUG-1**
- `app/admin/layout.tsx` — **BUG-2, BUG-3**
- `app/studio/page.tsx`

### Blog (User-Facing)
- `app/blog/page.tsx` — Blog listing
- `app/blog/[slug]/page.tsx` — Blog post
- `app/blog/BlogPostContent.tsx` — Post content component
- `app/components/LocalStudioBlogFeed.tsx` — Blog feed
- `app/components/RelatedPosts.tsx` — Related posts

### Admin Pages
- `app/admin/page.tsx` — Dashboard
- `app/admin/content/page.tsx` — Content library
- `app/admin/studio/page.tsx` — Studio embed
- `app/admin/media/page.tsx` — Media library
- `app/admin/users/page.tsx` — User management
- `app/admin/settings/page.tsx` — Settings
- `app/admin/taxonomies/page.tsx` — Taxonomies

### Studio Components
- `app/components/PulseBlogStudio.tsx` — Main studio (786 lines)
- `app/components/StudioAuthGate.tsx` — Auth gate
- `app/components/StudioBlockCanvas.tsx`
- `app/components/StudioBlogPreview.tsx`

### API Client / Hooks
- `lib/api-client.ts` — All API methods
- `lib/use-api.ts` — React hooks (useAuth, useEntries, etc.)
- `lib/use-backend-entries.ts` — Blog-specific hooks

### Styles
- `app/globals.css` — Global styles and CSS variables
- `tailwind.config.js` — Tailwind configuration

---

## 6. Screenshot Evidence from This Audit

All screenshots are stored in:
```
C:\Users\z0512\Desktop\pulse\apps\website\screenshots\
```

| File | Page | Issue Visible |
|------|------|---------------|
| `01-home-desktop.png` | `/` | OK but static |
| `02-home-mobile.png` | `/` | **BUG-6**: Text overflow |
| `03-blog-desktop.png` | `/blog` | **BUG-5**: Empty listing |
| `04-blog-mobile.png` | `/blog` | **BUG-5**: Empty listing + header issues |
| `05-post-desktop.png` | `/blog/hello-backend` | **BUG-4**: Infinite spinner |
| `06-post-mobile.png` | `/blog/hello-backend` | **BUG-4**: Infinite spinner |
| `07-admin-desktop.png` | `/admin` | **BUG-2**: Blank + spinner |
| `08-admin-content.png` | `/admin/content` | **BUG-1 + BUG-3**: Public nav + spinner |
| `09-admin-users.png` | `/admin/users` | Likely same issues |
| `10-admin-media.png` | `/admin/media` | Likely same issues |
| `11-admin-settings.png` | `/admin/settings` | Likely same issues |
| `12-admin-studio.png` | `/admin/studio` | **BUG-1 + BUG-3**: Public nav + spinner |
| `13-old-studio.png` | `/studio` | **BUG-1**: Public nav visible |

---

## 7. Design System Notes

Current CSS variables (from `globals.css` and Tailwind):
- `--pulse-red`: Primary brand color (orange-red)
- `--pulse-black`: Dark text color
- `--neutral-50` to `--neutral-900`: Gray scale

The design language is clean and modern but lacks:
- Depth (shadows, layers)
- Motion (transitions, animations)
- Feedback (toasts, loading states)
- Polish (focus rings, hover states, active states)

---

## 8. Next Agent Instructions

1. **Start the dev server**: `cd C:\Users\z0512\Desktop\pulse\apps\website && npm run dev`
2. **Fix critical bugs first** (Section 2 above)
3. **After each fix, take a screenshot** and view it with `ReadMediaFile` to verify
4. **Work in phases**: A → B → C → D → E
5. **Run `npm run typecheck`** after every batch of changes
6. **Run `npm run build`** before finishing to ensure production build passes
7. **Test responsiveness** for blog and homepage using different `--window-size` values
8. **Do NOT install Playwright** — use Chrome headless screenshots instead
