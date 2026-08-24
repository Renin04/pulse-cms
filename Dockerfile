# syntax=docker/dockerfile:1

# ----------------------------------------------------------
# Pulse CMS — Production Dockerfile (Hamravesh darkube)
# npm workspaces monorepo + Next.js 14 (apps/website) + Prisma/SQLite
#
# Network fixes for restricted builders:
# - Docker base image mirror (ArvanCloud)
# - Auto-select npm registry (tests candidates, picks fastest)
# - Retry settings for unstable networks
# - Browser downloads skipped (no puppeteer/playwright needed at runtime)
# ----------------------------------------------------------

ARG NODE_IMAGE=docker.arvancloud.ir/node:20-bookworm-slim

###################
# DEPS
###################
FROM ${NODE_IMAGE} AS deps
WORKDIR /app

ARG NPM_REGISTRY=auto
ARG NPM_REGISTRY_CANDIDATES="https://registry.npmjs.org/ https://registry.npmmirror.com/"

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NEXT_TELEMETRY_DISABLED=1

RUN set -eu; \
    apt-get update; \
    apt-get install -y --no-install-recommends openssl ca-certificates curl; \
    rm -rf /var/lib/apt/lists/*

# Workspace manifests first (better layer caching)
COPY package.json package-lock.json ./
COPY apps/website/package.json ./apps/website/package.json
COPY packages/blocks/package.json ./packages/blocks/package.json
COPY packages/core/package.json ./packages/core/package.json
COPY packages/editor/package.json ./packages/editor/package.json
COPY packages/react/package.json ./packages/react/package.json
COPY packages/renderer/package.json ./packages/renderer/package.json

RUN set -eu; \
    if [ "$NPM_REGISTRY" != "auto" ]; then \
      selected="${NPM_REGISTRY%/}/"; \
      echo "Using forced npm registry: $selected"; \
    else \
      selected=""; best_time=999999; \
      for reg in $NPM_REGISTRY_CANDIDATES; do \
        reg="${reg%/}/"; \
        echo "Testing npm registry: $reg"; \
        start="$(date +%s)"; \
        if npm view zod version --registry="$reg" --fetch-retries=0 --fetch-timeout=15000 >/dev/null 2>&1 \
           && curl -fsSL --connect-timeout 5 --max-time 20 --range 0-2047 -o /dev/null "${reg}prettier/-/prettier-3.8.3.tgz" 2>/dev/null; then \
          elapsed="$(( $(date +%s) - start ))"; \
          echo "Registry OK: $reg in ${elapsed}s"; \
          if [ "$elapsed" -lt "$best_time" ]; then selected="$reg"; best_time="$elapsed"; fi; \
        else \
          echo "Registry failed: $reg"; \
        fi; \
      done; \
      [ -n "$selected" ] || selected="https://registry.npmjs.org/"; \
      echo "Selected registry: $selected"; \
    fi; \
    npm config set registry "$selected"; \
    npm config set fetch-retries 5; \
    npm config set fetch-retry-mintimeout 15000; \
    npm config set fetch-retry-maxtimeout 120000; \
    npm ci --no-audit --no-fund --loglevel=error

###################
# BUILD
###################
FROM deps AS build
WORKDIR /app
COPY . .
WORKDIR /app/apps/website

# Prisma client (schema is in apps/website/prisma)
RUN npx prisma generate

# next build -> apps/website/dist (distDir in next.config.js)
ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build 2>&1 | tee /tmp/next-build.log || (tail -120 /tmp/next-build.log; exit 1)

###################
# RUNNER
###################
FROM ${NODE_IMAGE} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

RUN set -eu; \
    apt-get update; \
    apt-get install -y --no-install-recommends openssl ca-certificates; \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app /app
WORKDIR /app/apps/website

EXPOSE 3000

# Boot: apply sqlite migrations to the on-disk db, then serve.
# Required env (set in Hamravesh console):
#   DATABASE_URL="file:/app/data/pulse.db"
#   STORAGE_LOCAL_PATH="/app/data/uploads"
#   JWT_SECRET / JWT_REFRESH_SECRET / ADMIN_* (see apps/website/.env.example)
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start -p ${PORT} -H 0.0.0.0"]
