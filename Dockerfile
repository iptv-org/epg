# Use a lightweight Node.js base image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /epg

# Install Python, build tools, bash, and dcron (lightweight cron daemon)
RUN apk add --no-cache python3 make g++ bash dcron

# Copy all project files into the container
COPY . .

# Install necessary Node.js packages
RUN npm install

# Ensure the shell script is executable
RUN chmod +x /epg/myepg.sh

# Add the cron job to run the shell script every day at 5:00 AM UTC
RUN echo "0 5 * * * /epg/myepg.sh" >> /etc/crontab

# Expose the port that will be used by the server
EXPOSE 80

# Start the dcron service and run the shell script at container start, then run the server
CMD /epg/myepg.sh && crond && npx serve -l 80 /epg/serve && tail -f /dev/null
