import cron from "node-cron";
import { Lottery } from "../database/models/Lottery";
import * as utils from "../utils";

import { Bot } from "../bot";
import { IsNull } from "typeorm";

// TODO: Make this a module
export default (bot: Bot): void => {
  const client = bot.client;

  client.on("initialized", async () => {
    // Check for any finished lotteries at 8PM
    cron.schedule(
      // "0 20 * * *",
      "* * * * *",
      async () => {
        bot.logger.info("Checking for finished lotteries.");

        // get all lotteries that have ended but haven't had a winning user yet
        const lotteries = (await Lottery.findBy({ winningUser: IsNull() })).filter((lottery) => {
          const endTime = lottery.startedAt.getTime() + lottery.duration * 1000 * 60 * 60 * 24;
          return endTime < Date.now();
        });

        for (const lottery of lotteries) {
          bot.logger.info(`Computing lottery ID: ${lottery.id}`);

          // load lottery's entries
          lottery.entries = await Lottery.createQueryBuilder()
            .relation("entries")
            .of(lottery)
            .loadMany();
          if (lottery.entries.length === 0) continue;

          // generate map of entry IDs to ticket counts
          const entryToTickets = lottery.entries.reduce((acc, entry) => {
            acc[entry.id.toString()] = entry.tickets;
            return acc;
          }, {} as { [key: string]: number });

          // pick a random user weighted by the amount of tickets
          const winningEntryID = +utils.getRandomWeightedValue(entryToTickets);
          const winningUser = lottery.entries.find((entry) => entry.id === winningEntryID)!.user;

          // save winning user to lottery
          lottery.winningUser = winningUser;
          await lottery.save();

          // award winning user the jackpot
          const totalTickets = lottery.entries.reduce((acc, entry) => acc + entry.tickets, 0);
          const jackpot = Math.round(totalTickets * lottery.ticketCost * lottery.jackpotModifier);
          winningUser.sockpoints += jackpot;
          await winningUser.save();
        }
      },
      { timezone: "America/Los_Angeles" }
    );
  });
};
