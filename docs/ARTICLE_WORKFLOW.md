# Article Publishing Workflow (Headless API)

Pulse ships a token-authenticated HTTP endpoint for publishing articles
programmatically — write drafts anywhere (an editor, an AI assistant, a script)
and push them to any Pulse instance.

## 1. Setup

1. Generate a strong token and set it on the server:
   ```bash
   # .env (server)
   CONTENT_API_TOKEN="<64 random hex chars>"
   ```
   Until it's set, the endpoint answers `503`.
2. For pushing to production from a local machine, also set:
   ```bash
   PROD_SITE_URL="https://your-site.com"
   ```

## 2. Publish from the CLI

Write an article JSON file (shape below), then:

```bash
node scripts/publish-article.mjs article.json                    # local dev server
node scripts/publish-article.mjs article.json --target prod      # production ($PROD_SITE_URL)
node scripts/publish-article.mjs article.json --dry-run          # validate only
```

## 3. Article JSON shape

```json
{
  "title": "Simple Guide to Reading Prescriptions",
  "slug": "how-to-read-a-prescription",
  "excerpt": "One or two sentences shown in cards and search results.",
  "tags": ["health", "guide"],
  "coverImage": "/assets/blog/cover.webp",
  "status": "published",
  "blocks": [
    { "type": "heading", "data": { "level": 2, "text": "Start here" } },
    { "type": "text", "data": { "text": "Body paragraph…" } },
    { "type": "callout", "data": { "variant": "tip", "title": "Note", "text": "…" } }
  ]
}
```

- `slug` is optional for Latin titles (auto-slugified); **required for
  non-Latin titles** (e.g. Persian/Arabic — auto-slug would be empty).
- Re-POSTing the same slug **updates** the entry (idempotent).
- Every block's `data` is validated against the real `@pulse/blocks` zod
  schemas; invalid blocks get a `422` with per-block details.

## 4. Endpoint contract — `POST /api/cms/publish-article`

| Case | Response |
|---|---|
| Missing/invalid token | `401 {"error":"unauthorized"}` |
| `CONTENT_API_TOKEN` unset | `503 {"error":"service_unavailable"}` |
| Rate limited (30/15min) | `429 {"error":"rate_limited","retryAfter":…}` |
| Validation failure | `400 {"error":"slug_required"|"invalid"}` or `422 {"error":"invalid_blocks","details":[…]}` |
| Created | `201 {"status":"ok","id","slug","url":"/blog/<slug>","action":"created"}` |
| Updated | `200 {…,"action":"updated"}` |

## 5. Useful block types

`text`, `heading`, `list`, `callout`, `alert`, `blockquote`, `table`, `image`,
`code`, `divider`, `video`, `gallery` — see `packages/blocks/src/*Block.ts`
for each block's exact `data` schema.
