FROM node:22-alpine
ARG GIT_REPO=https://github.com/dj1p/epg.git
ARG GIT_BRANCH=master
ARG WORKDIR=/epg
ENV CRON_SCHEDULE="0 0 * * *"
ENV RUN_AT_STARTUP=true
RUN apk update \
    && apk upgrade --available \
    && apk add curl git tzdata bash caddy \
    && npm install pm2 -g \
    && mkdir $(echo "${WORKDIR}") -p \
    && cd $(echo "${WORKDIR}") \
    && git clone --depth 1 -b $(echo "${GIT_BRANCH}") $(echo "${GIT_REPO}") . \
    && npm install \
    && cd web \
    && npm install \
    && npm run build \
    && cd .. \
    && mkdir /public
RUN apk del git curl \
  && rm -rf /var/cache/apk/*
COPY pm2.config.js $WORKDIR
WORKDIR $WORKDIR
VOLUME ["/epg/public", "/epg/data"]
EXPOSE 3000
CMD [ "pm2-runtime", "pm2.config.js" ]
