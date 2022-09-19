import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { BotCommand } from ".";
import { Lottery } from "../database/models/Lottery";
import { LotteryEntry } from "../database/models/LotteryEntry";
import * as utils from "../utils";

export const LotteryCommand: BotCommand = {
  // prettier-ignore
  builder: new SlashCommandBuilder()
    .setName("lottery")
    .setDescription("Lottery service")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("buy")
        .setDescription("Buy lottery tickets")
        .addIntegerOption((option) =>
          option.setName("tickets").setDescription("How many tickets you want to buy.").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("info")
        .setDescription("Info about the current lottery")
    ),

  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    // find and ensure an active lottery
    const activeLottery = await Lottery.findOneBy({});
    if (activeLottery === null) {
      interaction.reply("there's no active lottery, check back later");
      return;
    }

    // load lottery's entries
    activeLottery.entries = await Lottery.createQueryBuilder()
      .relation("entries")
      .of(activeLottery)
      .loadMany();

    // find user and their lottery entry
    const user = await utils.fetchCreateUser(interaction.user.id);
    let entry = await LotteryEntry.findOneBy({
      lottery: { id: activeLottery.id },
      user: { id: user.id },
    });

    // -- Lottery info
    if (interaction.options.getSubcommand() === "info") {
      const response = [];

      const diffTime =
        (activeLottery.startedAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24) +
        activeLottery.duration;

      const totalTickets = activeLottery.entries.reduce((acc, cur) => acc + cur.tickets, 0);

      response.push(`Days Left: ${Math.round(diffTime)}`);
      response.push(`Cost per ticket: ${activeLottery.ticketCost}`);
      response.push(`Your tickets: ${entry?.tickets ?? 0}`);
      response.push(`Total tickets: ${totalTickets}`);
      response.push(
        `Jackpot reward: ${totalTickets * activeLottery.ticketCost * activeLottery.jackpotModifier}`
      );
      await interaction.reply(response.join("\n"));
      return;
    }

    // -- Buy tickets
    if (interaction.options.getSubcommand() !== "buy") return;

    // store amount of tickets to purchase and total cost
    const amount = interaction.options.getInteger("tickets", true);
    if (amount <= 0) {
      await interaction.reply("stares at you");
      return;
    }
    const cost = amount * activeLottery.ticketCost;

    // user cost deduction
    if (cost > user.sockpoints) {
      await interaction.reply("you can't afford that, brokeass");
      return;
    }
    user.sockpoints -= cost;
    await user.save();

    // insert entries into lottery
    if (entry === null) {
      entry = new LotteryEntry();
      entry.lottery = activeLottery;
      entry.user = user;
      entry.tickets = 0;
    }
    entry.tickets += amount;
    await entry.save();

    // reply to user
    await interaction.reply(
      `${amount} sockpoints deposited in your bank.\nBank: ${user.bankBalance}\nWallet: ${user.sockpoints}`
    );
  },
};
