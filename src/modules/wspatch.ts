import { Status } from "discord.js";

import { Bot } from "../bot";

const STARTING_CHECK_TIME = 60 * 1000; // in milliseconds
let timeToNextCheck = STARTING_CHECK_TIME; // ignore the camelcase inconsistency, or else

let lastPing = -1; // last websocket ping recorded

const checkWSHealth = async (bot: Bot) => {
  const client = bot.client;

  // Check connection status
  if (client.ws.status !== Status.Idle && client.ws.status !== Status.Ready) {
    bot.logger.warning(`Websocket status in not-so-good state: ${client.ws.status.toString()}`);
    // If not healthy, just restart the bot. YOLO
    process.exit(0);
  }

  // Heartbeat
  if (client.ws.ping <= 0) {
    bot.logger.warning(`Websocket ping is unusual: ${client.ws.ping}`);
  } else {
    const ping = client.ws.ping;
    bot.logger.debug(`Current ping: ${ping}`);

    // Check if ping hasn't changed
    if (lastPing === ping) {
      // If not, next WS health checker will be twice as soon
      timeToNextCheck /= 2;
      // If check interval under a certain value (ping has been the same for a while), restart
      if (timeToNextCheck < 100) {
        bot.logger.error(
          `Ping has remained the same for ${(STARTING_CHECK_TIME * 2) / 1000} seconds, restarting!`
        );
        process.exit(0);
      }
      bot.logger.warning(
        "Amogus sus... ping remained the same as the last check. Checking again twice as soon."
      );
    } else {
      timeToNextCheck = STARTING_CHECK_TIME;
    }
    lastPing = ping;
  }

  setTimeout(() => checkWSHealth(bot), timeToNextCheck);
};

export default (bot: Bot): void => {
  const client = bot.client;

  client.on("initialized", async () => {
    // Poll websocket health every 30 minutes
    // cron.schedule(
    //   "*/30 * * * *",
    //   async () => {
    //     checkWSHealth(bot);
    //   },
    //   { timezone: "America/Los_Angeles" }
    // );

    // Give the bot 5 seconds to stabilize itself before beginning WS health checker
    setTimeout(() => {
      bot.logger.info("Starting WS health loop...");
      // Kick off first websocket health checker,
      // which should reschedule another instance of itself as needed
      checkWSHealth(bot);
    }, 5000);
  });
};
