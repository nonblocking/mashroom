FROM node:24.12.0-slim
WORKDIR /opt/app
COPY host-backend-integration-api-proxy-security/microfrontend/dist ./dist
COPY host-backend-integration-api-proxy-security/microfrontend/package*.json ./
RUN npm ci --omit=dev
EXPOSE 7830
CMD ["node", "dist/server"]
