import { Client, GatewayIntentBits } from "discord.js";
import { Bot } from "./bot";

import * as dotenv from "dotenv";
dotenv.config();

// Validate environment variables
if (process.env.DISCORD_TOKEN == null) {
  throw new Error("Environment variable 'DISCORD_TOKEN' is missing.");
}

// Startup the bot
(async () => {
  console.log("Bot is starting...");

  // Create DiscordJS client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
  });

  // Create TypeORM
  // todo...

  // Set up generic discord listeners
  client.once("ready", async () => {
    const bot = new Bot(client);
    await bot.initialize();
    client.emit("initialized");
    console.log("Bot is ready!");
  });

  client.on("error", (err: Error) => {
    console.error("Bot error: " + err);
  });

  client.on("debug", (message: string) => {
    // console.debug("Debug: ", message);
  });

  client.login(process.env.DISCORD_TOKEN).catch((err: Error) => {
    console.error("Error logging in: " + err);
  });
})().catch((err: Error) => {
  console.error("Startup error: " + err);
});
