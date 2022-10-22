FROM node:16.18.0-slim
WORKDIR /opt/app
COPY tmp ./
RUN npm ci --production
RUN node_modules/.bin/lerna bootstrap -- --production --force
WORKDIR /opt/app/packages/test/test-server6
EXPOSE 5050
CMD ["node", "../../core/mashroom/dist/server.js"]
