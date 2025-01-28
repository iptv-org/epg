FROM node:lts-bookworm-slim

RUN install -d -g node -o node /build && \
    npm install pm2 -g
WORKDIR /build
USER node

COPY --chown=node:node yarn.lock ./yarn.lock
COPY --chown=node:node package.json ./package.json
COPY --chown=node:node package-lock.json ./package-lock.json

RUN npm ci --ignore-scripts

COPY --chown=node:node . .
RUN npm run postinstall

# Set some application defaults
ENV NODE_ENV=production \
    OUTPUT=/build/public/guide.xml \
    GZIP=true

EXPOSE 3000
CMD [ "pm2-runtime", "docker/ecosystem.config.js" ]
