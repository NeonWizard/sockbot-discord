FROM node:lts-alpine

WORKDIR /usr/src/bot

COPY package.json yarn.lock ./
RUN yarn install

COPY . .
RUN yarn tsc

CMD [ "node", "dist/Bot.js" ]
