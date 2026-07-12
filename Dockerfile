# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24-trixie-slim
ARG API_DATA_SOURCE=default

# ---------- Current API data fallback for local builds ----------
FROM ${NODE_IMAGE} AS api-data-default

COPY docker/api-snapshot.mjs /docker/api-snapshot.mjs

# Keep the local fallback cache in sync with the current API branch head.
ADD https://api.github.com/repos/iptv-org/api/commits/gh-pages /docker/api-head.json

RUN node /docker/api-snapshot.mjs create \
      --ref gh-pages \
      --output /data

# ---------- Dependencies and application ----------
FROM ${NODE_IMAGE} AS builder-base

WORKDIR /epg

ENV NODE_ENV=production \
    HUSKY=0 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

COPY package.json package-lock.json ./

# Lifecycle scripts are disabled deliberately:
# - postinstall needs scripts/, which is copied afterwards
# - prepare calls Husky, which is a development dependency
RUN --mount=type=cache,target=/root/.npm \
    npm ci \
      --omit=dev \
      --ignore-scripts \
      --no-audit \
      --no-fund

COPY scripts ./scripts
COPY sites ./sites
COPY tsconfig.json ./tsconfig.json

COPY pm2.config.js ./pm2.config.js
COPY docker/api-snapshot.mjs /docker/api-snapshot.mjs

FROM builder-base AS builder-default

COPY --from=api-data-default /data /epg/data

FROM builder-base AS builder-snapshot

COPY --from=api-data / /epg/data

FROM builder-${API_DATA_SOURCE} AS builder

RUN node /docker/api-snapshot.mjs verify --directory /epg/data \
 && mkdir -p /epg/public \
 && test -f /epg/node_modules/pm2/bin/pm2-runtime \
 && test -f /epg/node_modules/serve/build/main.js \
 && test -f /epg/node_modules/@freearhey/chronos/index.js \
 && test -f /epg/node_modules/tsx/dist/cli.mjs

# ---------- Runtime ----------
FROM ${NODE_IMAGE} AS runner

ENV NODE_ENV=production \
    DATA_DIR=/epg/data \
    HOME=/home/node \
    PM2_HOME=/home/node/.pm2 \
    CRON_SCHEDULE="0 0 * * *" \
    PORT=3000 \
    RUN_AT_STARTUP=true \
    MAX_CONNECTIONS=1 \
    FILL_GAPS=false \
    GZIP=false \
    JSON=false \
    CURL=false \
    DEBUG=false \
    TIMEOUT=30000 \
    DELAY=0 \
    TZ=UTC \
    NO_UPDATE_CHECK=1 \
    NPM_CONFIG_UPDATE_NOTIFIER=false \
    NPM_CONFIG_FUND=false \
    NPM_CONFIG_AUDIT=false

RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive \
    apt-get install -y --no-install-recommends \
      ca-certificates \
      tzdata \
 && rm -rf /var/lib/apt/lists/* \
 && mkdir -p \
      /home/node/.pm2/logs \
      /home/node/.pm2/pids \
      /home/node/.pm2/modules \
      /epg/public \
 && chown -R node:node /home/node/.pm2 /epg/public

WORKDIR /epg

COPY --from=builder --chown=node:node /epg/node_modules ./node_modules
COPY --from=builder --chown=node:node /epg/scripts ./scripts
COPY --from=builder --chown=node:node /epg/sites ./sites
COPY --from=builder --chown=node:node /epg/data ./data
COPY --from=builder --chown=node:node \
  /epg/package.json \
  /epg/pm2.config.js \
  /epg/tsconfig.json \
  ./

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD ["node", "-e", "const http=require('node:http');const port=Number(process.env.PORT||3000);const req=http.get({host:'127.0.0.1',port,path:'/'},res=>{res.resume();process.exit(res.statusCode<500?0:1)});req.setTimeout(2000,()=>req.destroy());req.on('error',()=>process.exit(1))"]

CMD ["node", "node_modules/pm2/bin/pm2-runtime", "pm2.config.js"]
