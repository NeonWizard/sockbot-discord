import { Status } from "discord.js";
import cron from "node-cron";

import { Bot } from "../bot";

export default (bot: Bot): void => {
  const client = bot.client;

  client.on("initialized", async () => {
    // Poll websocket health every 30 minutes
    cron.schedule(
      "*/30 * * * *",
      async () => {
        bot.logger.info("Polling DiscordJS internal websocket health.");

        // Check connection status
        if (client.ws.status !== Status.Idle && client.ws.status !== Status.Ready) {
          bot.logger.warn(`Websocket status in not-so-good state: ${client.ws.status.toString()}`);
        }

        // Heartbeat
        if (client.ws.ping <= 0) {
          bot.logger.warn(`Websocket ping is unusual: ${client.ws.ping}`);
        } else {
          bot.logger.info(`Current ping: ${client.ws.ping}`);
        }
      },
      { timezone: "America/Los_Angeles" }
    );
  });
};
