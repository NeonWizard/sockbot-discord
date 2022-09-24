import cron from "node-cron";

import { Bot } from "../bot";
import { User } from "../database/models/User";

export default (bot: Bot): void => {
  const client = bot.client;

  client.on("initialized", async () => {
    cron.schedule(
      "0 0 * * *",
      async () => {
        bot.logger.info("Computing daily bank interest.");

        const users = await User.find();
        for (const user of users) {
          // no interest for ppl with over 10 million. sorz
          if (user.bankBalance > 10000000) continue;

          // 4% daily compounding interest
          user.bankBalance = Math.round(user.bankBalance * 1.04);
          await user.save();
        }
      },
      { timezone: "America/Los_Angeles" }
    );
  });
};
