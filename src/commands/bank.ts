import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { BotCommand } from ".";
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
          option
            .setName("points")
            .setDescription("How many points to deposit.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("withdraw")
        .setDescription("Withdraw sockpoints")
        .addIntegerOption((option) =>
          option
            .setName("points")
            .setDescription("How many points to withdraw.")
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("balance").setDescription("Check bank balance")
    ),

  execute: async (interaction: CommandInteraction) => {
    await interaction.reply("change catsock's role icon");
    return;
  },
};
