import { Bot } from "src/bot";

export default (bot: Bot): void => {
  const client = bot.client;

  client.on("initialized", async () => {
    if (!client.user || !client.application) {
      return;
    }

    bot.logger.info(`${client.user.username} is online`);
  });
};
