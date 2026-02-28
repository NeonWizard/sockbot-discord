// import cron from "node-cron";
import { Lottery } from "../database/models/Lottery";
import * as utils from "../utils";
import * as constants from "../constants";

import { Bot } from "../bot";
import { AttachmentBuilder } from "discord.js";
import { User } from "../database/models/User";
import { ActionType, UserHistory } from "../database/models/UserHistory";
import { VerboseTicket } from "../interfaces/tickets";

const PRIZE_POOL = constants.LOTTERY_PRIZE_POOL;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const runLottery = async (bot: Bot, lottery: Lottery) => {
  // Fetch lottery channel
  const channel = await bot.client.channels.fetch(lottery.channelID);
  if (channel === null || !channel.isTextBased() || !("send" in channel)) {
    bot.logger.error(`Could not fetch channel for lottery of ID [${lottery.id}]`);
    return;
  }

  // Generate a new random number that hasn't already been picked
  let rndNumber;
  do {
    rndNumber = Math.floor(Math.random() * constants.LOTTERY_POOL_SIZE) + 1;
  } while (lottery.winningNumbers.includes(rndNumber));
  const newWinningNumber = rndNumber;

  // Send lottery image to lottery channel
  const image = await utils.generateLotteryImage(newWinningNumber, lottery.winningNumbers);
  const attachment = new AttachmentBuilder(image, {
    name: "lottery.png",
  });
  await channel.send({ files: [attachment] });

  // Update lottery
  lottery.winningNumbers.push(newWinningNumber);
  await lottery.save();

  // Check if its the last day
  if (lottery.winningNumbers.length === 7) {
    const winningNumbersSet = new Set(lottery.winningNumbers);

    // Store map of user IDs to their winning tickets
    const userWinningTickets: {
      [userID: number]: VerboseTicket[];
    } = {};

    // Run all tickets
    for (const ticket of lottery.tickets) {
      const verboseTicket = utils.createVerboseTicket(ticket, winningNumbersSet);

      if (!verboseTicket.numbers.some((x) => x.matched)) continue;

      if (userWinningTickets[ticket.user.id] === undefined) {
        userWinningTickets[ticket.user.id] = [];
      }
      userWinningTickets[ticket.user.id].push(verboseTicket);
    }

    // Reward and inform all winning users
    for (const [userID, winningTickets] of Object.entries(userWinningTickets)) {
      const user = (await User.findOneBy({ id: +userID }))!;
      const sortedWinningTickets = winningTickets.sort((ticket1, ticket2) =>
        ticket1.matches > ticket2.matches ? -1 : 1,
      );
      const totalPoints = sortedWinningTickets.reduce(
        (acc, ticket) => acc + PRIZE_POOL[ticket.matches],
        0,
      );

      const response = [];
      response.push(`<@${user.discordID}> won ${totalPoints} total sockpoints!`);
      response.push("Here are their top 10 tickets:");

      response.push("```css");
      for (const [i, ticket] of sortedWinningTickets.entries()) {
        // Push command reply line
        if (i < 10) {
          const points = PRIZE_POOL[ticket.matches].toLocaleString();
          const maxPrizeTextSize =
            PRIZE_POOL[sortedWinningTickets[0].matches].toLocaleString().length;

          const rewardString = `${points} sockpoints ${" ".repeat(
            Math.max(0, maxPrizeTextSize - points.length),
          )}`;

          response.push(`${rewardString} - ${ticket.stringLine}`);
        }

        // Reward player
        user.sockpoints += PRIZE_POOL[ticket.matches];

        // Build UserHistory entry
        const userHistory = new UserHistory();
        userHistory.user = user;
        userHistory.action = ActionType.LOTTERY_WIN;
        userHistory.value1 = ticket.matches;
        userHistory.value2 = PRIZE_POOL[ticket.matches];
        await userHistory.save();
      }
      response.push("```");

      await user.save();

      await channel.send(response.join("\n"));
    }

    // Delete old lottery
    await lottery.remove();

    // Create new lottery
    const newLottery = new Lottery();
    newLottery.channelID = lottery.channelID;
    newLottery.winningNumbers = [];
    newLottery.guild = lottery.guild;
    await newLottery.save();
  }
};

export default (bot: Bot): void => {
  const client = bot.client;

  client.on("initialized", async () => {
    // Pre-emptively restart bot 20 mins before lottery. This is
    // a temporary fix for bot losing websocket
    // cron.schedule(
    //   "40 19 * * *",
    //   () => {
    //     bot.logger.info(
    //       "Pre-emptively restarting bot 20 minutes before lottery to reacquire websocket.",
    //     );
    //     process.exit(0);
    //   },
    //   { timezone: "America/Los_Angeles" },
    // );
    // Handle lotteries at 8PM every day
    // cron.schedule(
    //   "0 20 * * *",
    //   // "*/10 * * * * *", // for testing
    //   async () => {
    //     bot.logger.info("Generating daily lottery numbers.");
    //     // Run all lotteries
    //     const lotteries = await Lottery.find({ relations: { tickets: true } });
    //     for (const lottery of lotteries) {
    //       bot.logger.info(`Computing lottery ID: ${lottery.id}`);
    //       await runLottery(bot, lottery);
    //     }
    //   },
    //   { timezone: "America/Los_Angeles" },
    // );
  });
};
