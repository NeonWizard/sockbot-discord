import { Client, GatewayIntentBits } from "discord.js";
import winston from "winston";
import "reflect-metadata";
import { PSQLSource } from "./database/source";
import * as dotenv from "dotenv";
dotenv.config();

import { Bot } from "./bot";

// Validate environment variables
if (process.env.DISCORD_TOKEN == null) {
  throw new Error("Environment variable 'DISCORD_TOKEN' is missing.");
}

// Startup the bot
(async () => {
  // -- Create logger
  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: "sockbot-discord" },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });
  logger.info("Bot is starting...");

  // -- Create TypeORM
  try {
    await PSQLSource.initialize();
  } catch (err) {
    logger.error("Error creating TypeORM DB link: " + err);
    return;
  }

  // -- Create DiscordJS client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
  });

  // -- Set up generic discord listeners
  client.once("ready", async () => {
    const bot = new Bot(client, PSQLSource, logger);
    await bot.initialize();
    client.emit("initialized");
    logger.info("Bot is ready!");
  });

  client.on("error", (err: Error) => {
    logger.error(err);
  });

  client.on("debug", (message: string) => {
    logger.debug(message);
  });

  client.login(process.env.DISCORD_TOKEN).catch((err: Error) => {
    logger.error("Error logging in: " + err);
  });
})();
