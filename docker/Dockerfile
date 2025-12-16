# --- Global ARGs ---
ARG ALPINE_VERSION=3.23.0
ARG NODE_VERSION=24
ARG PM2_VER=6.0.14
ARG SERVE_VER=14.2.5
ARG TSX_VER=4.21.0
ARG CHRONOS_VER=0.0.1

# --- Builder stage: use local repo and install deps ---
FROM node:${NODE_VERSION}-alpine AS builder

ARG PM2_VER
ARG SERVE_VER
ARG TSX_VER
ARG CHRONOS_VER

RUN apk update \
 && apk upgrade \
 && apk add --no-cache tzdata ca-certificates

RUN npm install -g npm@latest

RUN mkdir -p /epg/public /epg/sites/ /_stash

WORKDIR /epg

# Keep npm quiet and deterministic
ENV NODE_ENV=production \
    npm_config_update_notifier=false \
    npm_config_fund=false

# Ensure runtime-writable dirs exist (runner is nonroot)
RUN mkdir -p /epg/.pm2

# Copy lockfile and manifest first to leverage Docker cache
COPY package*.json ./

# Install only production deps, skip lifecycle scripts
RUN npm ci --omit=dev --no-audit --no-fund --ignore-scripts

# Install runtime tools locally 
RUN npm install --no-audit --no-fund --omit=dev --no-save \
    pm2@${PM2_VER} \
    serve@${SERVE_VER} \
    tsx@${TSX_VER} \
    @freearhey/chronos@${CHRONOS_VER}

# Fail the build early if the runtime entrypoint isn't present
RUN test -f /epg/node_modules/pm2/bin/pm2-runtime

# Copy only runtime-relevant sources
COPY scripts                ./scripts
COPY sites                  ./sites
COPY docker/pm2.config.js   ./pm2.config.js
COPY tsconfig.json          ./tsconfig.json
COPY package.json           ./package.json

# Manually repeat the post-installation step (loads temp/data/*.json)
RUN npm run api:load

# Stash tzdata (and CA certs if you want to be explicit)
RUN cp -a /usr/share/zoneinfo                /_stash/zoneinfo \
 && cp -a /etc/ssl/certs/ca-certificates.crt /_stash/ca-certificates.crt

# --- Helper stage: static BusyBox for /bin/sh (no runtime deps)
FROM alpine:${ALPINE_VERSION} AS bb
RUN apk add --no-cache busybox-static
RUN mkdir -p /out/bin \
 && cp /bin/busybox.static /out/bin/busybox \
 && chmod 0755 /out/bin/busybox \
 # Use *relative* symlinks so they remain valid after COPY to /bin
 && ln -s busybox /out/bin/sh

# --- Helper stage: build a tiny static `getconf` that reads sysconf()
FROM alpine:${ALPINE_VERSION} AS gc
RUN apk add --no-cache build-base musl-dev
WORKDIR /src
# Minimal getconf clone: supports CLK_TCK and PAGESIZE (PAGE_SIZE alias)
RUN printf '%s\n' \
'#include <unistd.h>' \
'#include <stdio.h>' \
'#include <string.h>' \
'int main(int argc, char** argv){' \
'  if(argc<2){fprintf(stderr,"usage: getconf NAME\\n"); return 1;}' \
'  if(!strcmp(argv[1],"CLK_TCK")){' \
'    long v=sysconf(_SC_CLK_TCK); if(v<0) return 1; printf("%ld\\n",v); return 0;}' \
'  if(!strcmp(argv[1],"PAGESIZE")||!strcmp(argv[1],"PAGE_SIZE")){' \
'    long v=sysconf(_SC_PAGESIZE); if(v<0) return 1; printf("%ld\\n",v); return 0;}' \
'  if(!strcmp(argv[1],"LONG_BIT")){' \
'    printf("%d\\n",(int)(8*sizeof(long))); return 0;}' \
'  fprintf(stderr,"getconf: unsupported: %s\\n",argv[1]); return 1;}' \
> getconf.c
# Build static so it runs in distroless on any arch (amd64/arm64/armv7)
RUN mkdir -p /out \
 && gcc -Os -static -s -o /out/getconf getconf.c

# ---------- Runner (Distroless) ----------
FROM gcr.io/distroless/nodejs${NODE_VERSION}:nonroot AS runner

# Default settings, can be overridden via env vars

ENV NODE_ENV=production  \
    HOME=/epg \
    PM2_HOME=/epg/.pm2 \
    CRON_SCHEDULE="0 0 * * *" \
    PORT=3000 \
    RUN_AT_STARTUP=true \
    MAX_CONNECTIONS=1 \
    GZIP=false \
    CURL=false \
    DAYS= \
    TIMEOUT=0 \
    DELAY=0 \
    TZ=UTC

# Provide tzdata (and CA bundle) to the distroless image
COPY --from=builder /_stash/zoneinfo /usr/share/zoneinfo
COPY --from=builder /_stash/ca-certificates.crt /etc/ssl/certs/ca-certificates.crt

# Provide /bin with a static /bin/sh (BusyBox) ...
COPY --from=bb /out/bin /bin
# ... and overwrite /bin/getconf with our static getconf binary
COPY --from=gc /out/getconf /bin/getconf

WORKDIR /epg

# Copy only the essentials from builder
COPY --from=builder --chown=nonroot:nonroot /epg /epg

EXPOSE 3000

# Distroless-Node has ENTRYPOINT ["node"]; we therefore specify the JS file:
# pm2-runtime directly from node_modules, without PATH or shell.
CMD ["node_modules/pm2/bin/pm2-runtime","--home","/epg/.pm2","pm2.config.js"]
