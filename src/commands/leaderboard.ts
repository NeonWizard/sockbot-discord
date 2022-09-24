import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { BotCommand } from "../interfaces";
import { User } from "../database/models/User";

export const LeaderboardCommand: BotCommand = {
  // prettier-ignore
  builder: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("it IS a competition"),

  execute: async (interaction: CommandInteraction) => {
    // prettier-ignore
    const topUsers = await User.createQueryBuilder("leaderboard")
      .select()
      .addSelect("sockpoints + \"bankBalance\"", "total_points")
      .orderBy("total_points", "DESC")
      .limit(5)
      .getMany();

    // dont look at me
    interaction.reply({
      content:
        "Top 5 richest people\n\n" +
        topUsers
          .map(
            (x, i) =>
              `${i + 1}. <@${x.discordID}>\n${(
                x.sockpoints + x.bankBalance
              ).toLocaleString()} sockpoints`
          )
          .join("\n\n"),
      allowedMentions: { users: [] },
    });
  },
};
