# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sockbot is a Discord bot built with discord.js v14 and TypeScript. It features:

- A points-based economy system ("sockpoints")
- Shiritori word game with dictionary validation
- Lottery system
- Banking and gambling features
- OpenAI GPT-4 integration for chat responses
- TypeORM for PostgreSQL database management

## Development Commands

### Running the bot

```bash
yarn start              # Run bot in development mode (sets DEVELOPMENT=true)
yarn build              # Compile TypeScript and copy static assets
yarn commands:deploy    # Deploy slash commands to Discord
```

### Database operations

```bash
yarn db:start                  # Start local PostgreSQL via docker-compose
yarn migrations:generate       # Generate TypeORM migration (rename RENAME_ME)
yarn migrations:run            # Run pending migrations
yarn migrations:down           # Revert last migration
```

### Code quality

```bash
yarn lint              # Run ESLint
yarn lint:fix          # Run ESLint with --fix
yarn fmt               # Format code with Prettier
yarn fmt:check         # Check formatting without writing
```

### Docker

```bash
yarn docker:build      # Build Docker image
yarn docker:push       # Push to Docker Hub
```

## Architecture

### Entry Point & Initialization

The bot initializes in this sequence:

1. `src/index.ts` - Creates Winston logger, Discord client, and TypeORM data source
2. `src/bot.ts` (`Bot` class) - Loads modules and commands on Discord "ready" event
3. Modules load from `src/modules/` (auto-loaded via filesystem scan)
4. Commands load from `src/commands/` (manually registered in `src/commands/index.ts`)

### Module System

Modules in `src/modules/` are automatically loaded and must export a default function that takes `Bot` as parameter:

```typescript
export default (bot: Bot): void => {
  // Register Discord event listeners
  bot.client.on('eventName', async () => { ... });
}
```

Key modules:

- `commands.ts` - Handles slash command interactions
- `shiritori.ts` - Word game logic with dictionary API validation
- `openai.ts` - GPT-4 chat integration with context building
- `lottery.ts` - Periodic lottery drawings via node-cron
- `bank.ts` - Daily sockpoint rewards

### Command System

Commands implement the `BotCommand` interface with:

- `builder`: SlashCommandBuilder defining command structure
- `execute(bot, interaction)`: Async handler function

New commands must be:

1. Created in `src/commands/` following the `BotCommand` interface
2. Exported from `src/commands/index.ts` in the `commands` array
3. Deployed via `yarn commands:deploy`

### Database Layer

TypeORM entities in `src/database/models/`:

- `User.ts` - Discord user data and sockpoints balance
- `UserHistory.ts` - Transaction log for points (shiritori, lottery, etc.)
- `ShiritoriChannel.ts` - Per-channel shiritori game state
- `KnownWord.ts` - Word dictionary with inflection relationships
- `ShiritoriWord.ts` - Junction table for words used per channel
- `Lottery.ts` / `LotteryTicket.ts` - Lottery state
- `Guild.ts` - Guild-specific settings

Database connection configured in `src/database/source.ts`. Migrations in `src/database/migrations/` run automatically on startup (`migrationsRun: true`).

### Shiritori Game Logic

The shiritori module (`src/modules/shiritori.ts`) enforces:

- One word, alphabetic characters only, minimum 2 characters
- Word must start with last character of previous word
- No consecutive replies from same user
- Penalties for editing/deleting messages in chain
- Oxford Dictionary API validation when `SHIRITORI_WORD_CHECK=true`
- Inflection detection to prevent near-duplicates
- Point awards: base points + chain bonuses + uniqueness bonuses

### OpenAI Integration

The openai module is hardcoded to channel ID `1177076381230825595`. It builds conversation context from the last 20 messages, including reply chains. Uses GPT-4 with a custom personality prompt.

## Environment Variables

Required:

- `DISCORD_TOKEN` - Discord bot token
- `DB_USER` / `DB_PASSWORD` - PostgreSQL credentials
- `DICTIONARY_APP_ID` / `DICTIONARY_APP_KEY` - Oxford Dictionary API

Optional:

- `SHIRITORI_WORD_CHECK=true` - Enable dictionary validation for shiritori
- `OPENAI_DISABLE=true` - Disable OpenAI module
- `OPENAI_API_KEY` - Required if OpenAI enabled
- `DEVELOPMENT=true` - Allows self-replies in shiritori (set automatically by `yarn start`)

## Production Deployment

Docker image is automatically built and pushed to GitHub Container Registry (ghcr.io) on pushes to main or version tags. The image:

- Uses `node:lts-alpine` base
- Installs canvas dependencies (cairo, pango, etc.)
- Runs migrations on startup
- Executes `node dist/index.js`

Deploy commands in production:

```bash
sudo docker exec -it sockbot-discord yarn commands:deploy
```

Run migrations in production:

```bash
sudo docker exec -it sockbot-discord sh
yarn typeorm migration:run -d src/database/source.ts
```

## Key Utilities

`src/utils/utils.ts` contains helpers:

- `fetchCreateUser(discordID)` - Upsert user by Discord ID
- `fetchCreateWord(text)` - Upsert word in dictionary
- `getWordInflectionRoots(word)` - Query Oxford API for inflections
- `numberToEmoji(num)` - Convert digits to emoji for reactions

## Notes

- TypeScript compiled to `dist/` with source maps
- Version is injected into `dist/version.js` post-build from `package.json`
- The bot uses Discord intents: Guilds, GuildMessages, GuildMessageReactions, MessageContent
- Pre-version hook runs formatting and linting checks
