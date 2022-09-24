import { CommandInteraction, SlashCommandBuilder } from "discord.js";

import { BotCommand } from "../interfaces";

export const PingCommand: BotCommand = {
  // prettier-ignore
  builder: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with 'pong!'"),

  execute: async (interaction: CommandInteraction) => {
    await interaction.reply("pong!");
  },
};
