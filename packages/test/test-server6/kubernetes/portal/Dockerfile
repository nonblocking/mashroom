FROM node:18.16.0
WORKDIR /opt/app
COPY tmp ./
RUN npm ci --omit=dev
RUN node_modules/.bin/lerna bootstrap -- --omit=dev
WORKDIR /opt/app/packages/test/test-server6
EXPOSE 5050
CMD ["node", "../../core/mashroom/dist/server.js"]
