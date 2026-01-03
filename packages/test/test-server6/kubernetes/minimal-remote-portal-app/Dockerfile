FROM node:24.12.0-slim
WORKDIR /opt/app
COPY ./public ./public
COPY package*.json ./
RUN npm i --omit=dev
EXPOSE 8008
CMD ["npm", "start"]
