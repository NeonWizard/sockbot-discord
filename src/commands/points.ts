import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { User } from "../entity/User";
import * as utils from "../utils";

export const builder = new SlashCommandBuilder()
  .setName("points")
  .setDescription("see urrrr sock points! :0");

export const execute = async (interaction: CommandInteraction) => {
  const user = await utils.fetchCreateUser(interaction.user.id);

  if (user.sockpoints == 0) {
    await interaction.reply("no sock points pee boy. haha");
  } else {
    await interaction.reply(
      `mmmm you've got ${user.sockpoints.toLocaleString} points. frutata`
    );
  }
};
