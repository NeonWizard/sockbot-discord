import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { BotCommand } from ".";

export const PingCommand: BotCommand = {
  builder: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with 'pong!'"),

  execute: async (interaction: CommandInteraction) => {
    await interaction.reply("pong!");
  },
};
