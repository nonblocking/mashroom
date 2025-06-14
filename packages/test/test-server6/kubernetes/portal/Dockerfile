FROM node:24.2.0-slim
WORKDIR /opt/app
COPY tmp ./
RUN npm ci --omit=dev
WORKDIR /opt/app/packages/test/test-server6
EXPOSE 5050
CMD ["node", "../../core/mashroom/dist/server.js"]
