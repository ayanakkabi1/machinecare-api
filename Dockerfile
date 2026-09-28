FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

ENV MONGOMS_DISABLE_POSTINSTALL=1

RUN npm ci

COPY . .

EXPOSE 5000

USER node

CMD ["npm", "start"]
