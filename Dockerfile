FROM node:lts-alpine

WORKDIR /usr/src/bot

# # .npm-deps https://github.com/Automattic/node-canvas/issues/866
# RUN apk add --no-cache --virtual .health-check curl \
# 	&& apk add --no-cache --virtual .build-deps git build-base g++ \
# 	&& apk add --no-cache --virtual .npm-deps cairo-dev libjpeg-turbo-dev pango

COPY package.json yarn.lock ./
# RUN yarn install && apk del .build-deps

RUN apk add --no-cache --virtual build-deps \
      g++ \
      build-base \
      cairo-dev \
      jpeg-dev \
      pango-dev \
      musl-dev \
      giflib-dev \
      pixman-dev \
      pangomm-dev \
      libjpeg-turbo-dev \
      freetype-dev \
    && yarn install \
    && apk del build-deps \
    && apk add --no-cache \
      cairo \
      jpeg \
      pango \
      musl \
      giflib \
      pixman \
      pangomm \
      libjpeg-turbo \
      freetype

# TODO: Only copy src/
COPY . .
RUN yarn build

CMD [ "node", "dist/index.js" ]
