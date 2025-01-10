FROM node:22-alpine
ARG GIT_REPO=https://github.com/iptv-org/epg.git
ARG GIT_BRANCH=master
ARG USER=iptv-org
ARG WORKDIR=/epg
WORKDIR $WORKDIR
RUN apk update \
    && apk upgrade --no-cache \
    && apk add --no-cache git tzdata bash \
    && npm install -g npm@latest \
    && git clone --depth 1 -b $(echo "${GIT_BRANCH} ${GIT_REPO}") . \
    && npm install \
    && mkdir /public \
    && adduser -D $USER \
    && chown -R $USER $WORKDIR \
    && cd $WORKDIR \
    && apk del git
USER $USER
EXPOSE 3000
CMD [ "npx", "pm2-runtime", "pm2.config.js" ]