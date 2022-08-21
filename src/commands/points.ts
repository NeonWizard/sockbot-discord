import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { User } from "../entity/User";

export const builder = new SlashCommandBuilder()
  .setName("points")
  .setDescription("see urrrr sock points! :0");

export const execute = async (interaction: CommandInteraction) => {
  let user = await User.findOneBy({ discordID: interaction.user.id });
  if (user === null) {
    user = new User();
    user.discordID = interaction.user.id;
    user.sockpoints = 0;
    await user.save();
  }

  if (user.sockpoints == 0) {
    await interaction.reply("no sock points pee boy. haha");
  } else {
    await interaction.reply(
      `mmmm you've got ${user.sockpoints.toLocaleString} points. frutata`
    );
  }
};
