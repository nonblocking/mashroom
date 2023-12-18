FROM node:18.19.0-slim
WORKDIR /opt/app
COPY tmp ./
RUN npm ci --omit=dev
WORKDIR /opt/app/packages/test/test-server6
EXPOSE 5050
CMD ["node", "../../core/mashroom/dist/server.js"]
