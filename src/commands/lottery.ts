import {
  AttachmentBuilder,
  ChatInputCommandInteraction,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";

import { Bot } from "../bot";
import { LOTTERY_POOL_SIZE, LOTTERY_PRIZE_POOL, LOTTERY_TICKET_COST } from "../constants";
import { Lottery } from "../database/models/Lottery";
import { LotteryTicket } from "../database/models/LotteryTicket";
import { User } from "../database/models/User";
import { ActionType, UserHistory } from "../database/models/UserHistory";
import { BotCommand } from "../interfaces";
import * as utils from "../utils";

const getLotteryInfo = async (interaction: ChatInputCommandInteraction) => {
  const response = [];
  response.push(
    `The sock lottery is a powerball-style lottery that takes place once a week. Every day at 8PM Pacific, a number from 1 to ${LOTTERY_POOL_SIZE} is randomly drawn. At any point, you can purchase tickets for ${LOTTERY_TICKET_COST.toLocaleString()} sockpoints each, which will have a sequence of 7 randomly generated numbers. For each of these numbers that matches the drawn lottery numbers, you'll receive a prize!`
  );

  response.push("");
  response.push("Match Table:");
  response.push("```css");
  for (const [i, prize] of LOTTERY_PRIZE_POOL.entries()) {
    if (i === 0) continue;
    response.push(`Match ${i} - ${prize.toLocaleString()} sockpoints`);
  }
  response.push("```");
  await interaction.reply(response.join("\n"));
};

const listTickets = async (
  interaction: ChatInputCommandInteraction,
  lottery: Lottery,
  user: User
) => {
  const winningNumbersSet = new Set(lottery.winningNumbers);
  const userTickets = lottery.tickets.filter((ticket) => ticket.user.id === user.id);

  if (userTickets.length === 0) {
    await interaction.reply("You don't have any tickets :(");
    return;
  }

  const fetchAll = interaction.options.getBoolean("all") ?? false;

  // Generate verbose ticket objects
  const verboseTickets = userTickets.map((ticket) => {
    const vTicket = ticket.numbers.map((number) => ({
      number: number,
      matched: winningNumbersSet.has(number),
    }));
    return {
      ticket: vTicket,
      matches: vTicket.reduce((acc, ticket) => acc + +ticket.matched, 0),
    };
  });

  // Sort tickets by number of matching numbers, descending
  verboseTickets.sort((ticket1, ticket2) => (ticket1.matches > ticket2.matches ? -1 : 1));

  // Create response text
  const response: string[] = [];
  const ticketLines: string[] = [];
  for (const [i, ticket] of verboseTickets.slice(0, fetchAll ? undefined : 10).entries()) {
    const numbersString = ticket.ticket
      .map((number) => {
        const numberString = number.number.toString().padStart(2);
        return number.matched ? `[${numberString}]` : ` ${numberString} `;
      })
      .join(" ");
    ticketLines.push(`Ticket ${(i + 1).toString().padStart(2, "0")} // ${numbersString}`);
    ticketLines.push("-".repeat(47));
  }
  ticketLines.pop(); // Remove last dash divider

  // If fetching all, create a text file and send as an attachment reply
  if (fetchAll) {
    const attachment = new AttachmentBuilder(Buffer.from(ticketLines.join("\n")), {
      name: "tickets.txt",
    });
    await interaction.reply({ files: [attachment] });
    return;
  }

  // Otherwise, reply directly with a formatted message
  response.push("```css");
  response.push(...ticketLines);
  response.push("```");

  await interaction.reply(response.join("\n"));
};

const buyTickets = async (
  interaction: ChatInputCommandInteraction,
  lottery: Lottery,
  user: User
) => {
  // determine amount of tickets to purchase and total cost
  const amount = interaction.options.getInteger("amount", true);
  if (amount <= 0) {
    await interaction.reply("stares at you");
    return;
  }
  const cost = amount * LOTTERY_TICKET_COST;

  // user cost deduction
  if (cost > user.sockpoints) {
    await interaction.reply("you can't afford that, brokeass");
    return;
  }
  user.sockpoints -= cost;
  await user.save();

  // generate and save new tickets
  const tickets: LotteryTicket[] = [];
  for (let i = 0; i < amount; i++) {
    const ticket = new LotteryTicket();
    ticket.lottery = lottery;
    ticket.user = user;
    ticket.numbers = Array.from(
      { length: 7 },
      () => Math.floor(Math.random() * LOTTERY_POOL_SIZE) + 1
    );
    tickets.push(ticket);
  }
  await LotteryTicket.save(tickets);

  // save to UserHistory
  const userHistory = new UserHistory();
  userHistory.user = user;
  userHistory.action = ActionType.LOTTERY_TICKET_PURCHASE;
  userHistory.value1 = amount;
  userHistory.value2 = cost;
  await userHistory.save();

  // reply to user
  await interaction.reply(
    `${amount} tickets were purchased for ${cost.toLocaleString()} sockpoints.`
  );
};

export const LotteryCommand: BotCommand = {
  // prettier-ignore
  builder: new SlashCommandBuilder()
    .setName("lottery")
    .setDescription("Lottery service")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Information about the lottery.")
    )
    .addSubcommandGroup((group) =>
      group
        .setName("tickets")
        .setDescription("Ticket related commands.")
        .addSubcommand((subcommand) =>
          subcommand
            .setName("list")
            .setDescription("Lists your lottery tickets. Defaults to your top 10 tickets.")
            .addBooleanOption((option) =>
              option.setName("all").setDescription("Whether to return ALL of your tickets as a text file.").setRequired(false)
            )
        )
        .addSubcommand((subcommand) =>
          subcommand
            .setName("buy")
            .setDescription("Buy lottery tickets!")
            .addIntegerOption((option) =>
              option.setName("amount").setDescription("How many tickets to buy.").setRequired(true)
            )
        )
    ),

  execute: async (bot: Bot, interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    // find and ensure an active lottery
    // TODO: tie to guild
    const activeLottery = await Lottery.findOne({ where: {}, relations: ["tickets"] });
    if (activeLottery === null) {
      await interaction.reply("there's no active lottery, check back later");
      return;
    }

    // fetch calling user
    const user = await utils.fetchCreateUser(interaction.user.id);

    // -- Lottery info
    if (interaction.options.getSubcommand() === "info") {
      await getLotteryInfo(interaction);
      return;
    }

    // -- Tickets subcommands
    if (interaction.options.getSubcommandGroup() === "tickets") {
      if (interaction.options.getSubcommand() === "list") {
        await listTickets(interaction, activeLottery, user);
        return;
      }
      if (interaction.options.getSubcommand() === "buy") {
        await buyTickets(interaction, activeLottery, user);
        return;
      }
    }
  },
};
