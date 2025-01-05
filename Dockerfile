FROM node:lts-bookworm-slim

WORKDIR /build

COPY yarn.lock ./yarn.lock
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

RUN npm ci --ignore-scripts

COPY . .
COPY docker/ecosystem.config.js ./ecosystem.config.js
COPY docker/serve.json ./serve.json

RUN npm install pm2 -g && \
    npm run postinstall

# Set some application defaults
ENV NODE_ENV=production \
    OUTPUT=/build/public/guide.xml \
    GZIP=true

EXPOSE 3000
CMD [ "pm2-runtime", "ecosystem.config.js" ]
