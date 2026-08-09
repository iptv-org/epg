FROM node:22-alpine
ARG WORKDIR=/epg
ENV CRON_SCHEDULE="0 0 * * *"
ENV RUN_AT_STARTUP=true
RUN apk update \
    && apk upgrade --available \
    && apk add curl tzdata bash caddy util-linux \
    && npm install pm2 -g \
    && mkdir /public
WORKDIR $WORKDIR
COPY . .
RUN npm install \
    && cd web \
    && npm install \
    && npm run build
VOLUME ["/epg/public", "/epg/data"]
EXPOSE 3000
CMD ["sh", "-c", "node scripts/build-channels.js && exec pm2-runtime pm2.config.js"]
