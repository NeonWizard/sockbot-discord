import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { BotCommand } from ".";
import { User } from "../database/models/User";

export const LeaderboardCommand: BotCommand = {
  // prettier-ignore
  builder: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("it IS a competition"),

  execute: async (interaction: CommandInteraction) => {
    const topUsers = await User.find({
      order: { sockpoints: "DESC" },
      take: 5,
    });

    // dont look at me
    interaction.reply(
      "Top 5 richest people\n\n" +
        topUsers
          .map((x, i) => `${i + 1}. <@${x.discordID}>\n${x.sockpoints.toLocaleString()} sockpoints`)
          .join("\n\n")
    );
  },
};
