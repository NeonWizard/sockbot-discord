# Sockbot Discord Bot

![GitHub Workflow Status (event)](https://img.shields.io/github/workflow/status/NeonWizard/sockbot-discord/Test,%20build%20and%20publish%20application%20to%20Docker%20Hub?event=push)
![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/NeonWizard/sockbot-discord?label=version)
[![License: GPL-3.0](https://img.shields.io/github/license/NeonWizard/chatzy.js)](https://opensource.org/licenses/GPL-3.0)

## Setup

### Development Environment

1. Install Docker and docker-compose.
2. Copy `dev.env.template` to `.env` and fill in the tokens.
3. Install dependencies with `yarn install`.
4. You can run a local dev postgres container with `yarn db:start`.
5. Run the bot with `yarn start`.

## Deployment

1. Publish commands with `yarn commands:deploy`.
2. Build and push docker image (or let GH action do it for you).
3. Run docker image via production docker-compose file (found in separate repo).

## Environment Variables

| Key                  | Description                                                                     |
| -------------------- | ------------------------------------------------------------------------------- |
| DB_USER              | User for the Postgres DB                                                        |
| DB_PASSWORD          | Password for the Postgres DB                                                    |
| DISCORD_TOKEN        | Discord bot token                                                               |
| DICTIONARY_APP_ID    | App ID for Oxford dictionary account                                            |
| DICTIONARY_APP_KEY   | App key for Oxford dictionary account                                           |
| SHIRITORI_WORD_CHECK | Set to "true" to enable checking the dictionary API for shiritori word validity |

## Helpful Commands

```bash
# Generate TypeORM migration
yarn typeorm migration:generate -d src/database/source.ts -p ./src/database/migrations/MIGRATION_NAME

# Migrating production
sudo docker exec -it sockbot-discord sh
yarn typeorm migration:run -d src/database/source.ts

# Build and push docker instance
docker build -t averagewizard13/sockbot-discord:dev .
docker push averagewizard13/sockbot-discord:dev

# Bump yarn version
yarn version
yarn version --prerelease --preid=alpha

# Deploying commands from prod
sudo docker exec -it sockbot-discord yarn commands:deploy
```
