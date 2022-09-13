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
if (process.env.DICTIONARY_APP_ID == null || process.env.DICTIONARY_APP_KEY == null) {
  throw new Error("Environment variable 'DICTIONARY_APP_ID' or 'DICTIONARY_APP_KEY' is missing");
}

// Startup the bot
(async () => {
  // -- Create logger
  const logger = winston.createLogger({
    levels: winston.config.syslog.levels,
    format: winston.format.combine(
      winston.format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    // prettier-ignore
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple(),
        ),
      }),
      new winston.transports.File({
        format: winston.format.combine(
          winston.format.simple(),
        ),
        filename: "debug.log",
        level: "debug",
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

  // temporary fix for discord stupid
  client.on("disconnect", (event) => {
    logger.debug("normel");
    logger.warn(event);
  });
  client.on("shardDisconnect", (event) => {
    logger.debug("shart");
    logger.warn(event);
  });
  client.on("shardReconnecting", (event) => {
    logger.debug("reconnect");
    logger.warn(event);
  });
  client.on("shardResume", (event) => {
    logger.debug("resume");
    logger.warn(event);
  });

  client.login(process.env.DISCORD_TOKEN).catch((err: Error) => {
    logger.error("Error logging in: " + err);
  });
})();
