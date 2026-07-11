# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:24-trixie-slim

# ---------- Dependencies and application ----------
FROM ${NODE_IMAGE} AS builder

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

RUN mkdir -p \
      /epg/public \
      /epg/temp/data \
 && npm run api:load \
 && for file in \
      blocklist \
      categories \
      channels \
      cities \
      countries \
      feeds \
      guides \
      languages \
      logos \
      regions \
      streams \
      subdivisions \
      timezones; \
    do \
      test -s "/epg/temp/data/${file}.json"; \
    done \
 && test -f /epg/node_modules/pm2/bin/pm2-runtime \
 && test -f /epg/node_modules/serve/build/main.js \
 && test -f /epg/node_modules/@freearhey/chronos/index.js \
 && test -f /epg/node_modules/tsx/dist/cli.mjs

# ---------- Runtime ----------
FROM ${NODE_IMAGE} AS runner

ENV NODE_ENV=production \
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
 && chown -R node:node /home/node/.pm2

WORKDIR /epg

COPY --from=builder --chown=node:node /epg /epg

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=15s --retries=3 \
  CMD ["node", "-e", "const http=require('node:http');const port=Number(process.env.PORT||3000);const req=http.get({host:'127.0.0.1',port,path:'/'},res=>{res.resume();process.exit(res.statusCode<500?0:1)});req.setTimeout(2000,()=>req.destroy());req.on('error',()=>process.exit(1))"]

CMD ["node", "node_modules/pm2/bin/pm2-runtime", "pm2.config.js"]