import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { Bot } from "../bot";
import { BotCommand } from "../interfaces";
import * as utils from "../utils";

export const BankCommand: BotCommand = {
  builder: new SlashCommandBuilder()
    .setName("bank")
    .setDescription("Banking service")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("deposit")
        .setDescription("Deposit sockpoints")
        .addIntegerOption((option) =>
          option.setName("points").setDescription("How many points to deposit.").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("withdraw")
        .setDescription("Withdraw sockpoints")
        .addIntegerOption((option) =>
          option.setName("points").setDescription("How many points to withdraw.").setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("balance").setDescription("Check bank balance")
    ),

  execute: async (bot: Bot, interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    const user = await utils.fetchCreateUser(interaction.user.id);

    // -- Bank balance
    if (interaction.options.getSubcommand() === "balance") {
      await interaction.reply(`${user.bankBalance} sockpoints in your bank`);
      return;
    }

    const amount = interaction.options.getInteger("points", true);
    if (amount <= 0) {
      await interaction.reply("stares at you");
      return;
    }

    // -- Depositing
    if (interaction.options.getSubcommand() === "deposit") {
      if (amount > user.sockpoints) {
        await interaction.reply(
          `you can't afford that, brokeass. you have ${user.sockpoints} in your wallet.`
        );
        return;
      }
      user.sockpoints -= amount;
      user.bankBalance += amount;
      await user.save();
      await interaction.reply(
        `${amount} sockpoints deposited in your bank.\nBank: ${user.bankBalance}\nWallet: ${user.sockpoints}`
      );
    }
    // -- Withdrawing
    else if (interaction.options.getSubcommand() === "withdraw") {
      if (amount > user.bankBalance) {
        await interaction.reply("not enough money in your bank bozo");
        return;
      }
      user.sockpoints += amount;
      user.bankBalance -= amount;
      await user.save();
      await interaction.reply(
        `${amount} sockpoints withdrawn from your bank.\nBank: ${user.bankBalance}\nWallet: ${user.sockpoints}`
      );
    }
  },
};
