FROM node:lts-slim
LABEL authors="torvalds"
WORKDIR /app
COPY . .
RUN npm install
