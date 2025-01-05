FROM node:18-alpine

WORKDIR /epg

RUN apk add --no-cache python3 make g++ bash dcron sed

COPY . .
RUN npm install
RUN chmod +x /epg/myepg.sh

# Create entrypoint script
RUN echo '#!/bin/sh' > /entrypoint.sh && \
    echo 'printenv | grep -v "no_proxy" > /etc/environment' >> /entrypoint.sh && \
    echo 'crond -f & npx serve -l 80 /epg/serve' >> /entrypoint.sh && \
    chmod +x /entrypoint.sh

RUN echo "0 5 * * * . /etc/environment; /epg/myepg.sh >> /var/log/cron.log 2>&1" > /etc/crontabs/root

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
