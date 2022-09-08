import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { ActionType, UserHistory } from "../database/models/UserHistory";
import { BotCommand } from ".";
import * as utils from "../utils";

export const PayCommand: BotCommand = {
  builder: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("give someone some of urrrr sock points! :D")
    .addUserOption((option) =>
      option
        .setName("victim")
        .setDescription("the victim to pay money to! silly")
        .setRequired(true)
    )
    .addIntegerOption((option) =>
      option
        .setName("points")
        .setDescription("amount of sooockpoints to send")
        .setRequired(true)
    ),

  execute: async (interaction: CommandInteraction) => {
    await interaction.reply("change catsock's role icon");
    return;
  },
};
