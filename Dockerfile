# syntax=docker/dockerfile:1

# ----------------------------------------------------------
# Pulse CMS — Production Dockerfile (Hamravesh darkube)
# npm workspaces monorepo + Next.js 14 (apps/website) + Prisma/SQLite
#
# Network fixes for restricted builders (proven on ghatre-charity):
# - Docker base image mirror (ArvanCloud)
# - Alpine package mirror (ArvanCloud)
# - Auto-select npm registry (tests candidates, picks fastest)
# - Retry settings for unstable networks
# ----------------------------------------------------------

ARG NODE_IMAGE=docker.arvancloud.ir/node:20-alpine

###################
# BASE
###################
FROM ${NODE_IMAGE} AS base
WORKDIR /app

ARG ALPINE_MIRROR=https://mirror.arvancloud.ir/alpine
ARG NPM_REGISTRY=auto
ARG NPM_REGISTRY_CANDIDATES="https://registry.npmjs.org/ https://registry.npmmirror.com/"

ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 \
    NEXT_TELEMETRY_DISABLED=1

RUN set -eu; \
    if [ -n "$ALPINE_MIRROR" ]; then \
      ALPINE_VERSION="$(cut -d. -f1,2 /etc/alpine-release)"; \
      printf "%s/v%s/main\n%s/v%s/community\n" "$ALPINE_MIRROR" "$ALPINE_VERSION" "$ALPINE_MIRROR" "$ALPINE_VERSION" > /etc/apk/repositories; \
      echo "Using Alpine mirror: $ALPINE_MIRROR"; \
    fi; \
    apk update; \
    apk add --no-cache libc6-compat openssl ca-certificates curl

###################
# DEPS
###################
FROM base AS deps
WORKDIR /app

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

RUN npx prisma generate

ENV NODE_OPTIONS=--max-old-space-size=2048
RUN npm run build 2>&1 | tee /tmp/next-build.log || (tail -120 /tmp/next-build.log; exit 1)

###################
# RUNNER
###################
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

COPY --from=build /app /app
WORKDIR /app/apps/website

EXPOSE 3000

# Boot: pin the musl Prisma engine (libssl detection is unreliable on alpine),
# apply sqlite migrations to the on-disk db, then serve.
# Required env (set in Hamravesh console):
#   DATABASE_URL="file:/app/data/pulse.db"
#   STORAGE_LOCAL_PATH="/app/data/uploads"
#   JWT_SECRET / JWT_REFRESH_SECRET (see apps/website/.env.example)
CMD ["sh", "-c", "ENGINE=$(ls /app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node 2>/dev/null || true); if [ -n \"$ENGINE\" ]; then export PRISMA_QUERY_ENGINE_LIBRARY=$ENGINE; fi; npx prisma migrate deploy && npx next start -p ${PORT} -H 0.0.0.0"]
