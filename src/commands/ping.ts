import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const builder = new SlashCommandBuilder()
  .setName("ping")
  .setDescription("Replies with 'pong!'");

export const execute = async (interaction: CommandInteraction) => {
  await interaction.reply("pong!");
};
