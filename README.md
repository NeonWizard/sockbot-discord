# Sockbot Discord Bot

## Setup

### Development Environment

1. Install Docker and docker-compose.
2. Copy `.env.template` to `.env` and fill in the credentials.
3. Install dependencies with `yarn install`.
4. You can run a dev postgres container with `yarn db:start`.
5. Run the bot with `yarn start`.

## Deployment

1. Publish commands with `yarn commands:deploy`.
2. Build docker image.
3. Push docker image.
4. Run docker image via production docker-compose file (found in separate repo).

## Environment Variables

| Key           | Description                  |
| ------------- | ---------------------------- |
| DB_USER       | User for the Postgres DB     |
| DB_PASS       | Password for the Postgres DB |
| DISCORD_TOKEN | Discord bot token            |
