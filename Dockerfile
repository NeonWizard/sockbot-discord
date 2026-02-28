# Build stage
FROM node:lts-alpine AS builder

WORKDIR /usr/src/bot

# Install build dependencies for canvas
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
      freetype-dev

# Copy package files and install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy source code and build
COPY tsconfig.json ./
COPY src/ ./src/
RUN yarn build

# Remove devDependencies to reduce final image size
RUN yarn install --production --frozen-lockfile --ignore-scripts

# Production stage
FROM node:lts-alpine

WORKDIR /usr/src/bot

# Install runtime dependencies for canvas
RUN apk add --no-cache \
      cairo \
      jpeg \
      pango \
      musl \
      giflib \
      pixman \
      pangomm \
      libjpeg-turbo \
      freetype

# Copy package.json for runtime
COPY package.json ./

# Copy node_modules from builder (already compiled with native deps)
COPY --from=builder /usr/src/bot/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /usr/src/bot/dist ./dist

# Set NODE_ENV to production
ENV NODE_ENV=production

CMD [ "node", "dist/index.js" ]
