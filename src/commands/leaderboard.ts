import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Bot } from "../bot";
import { User } from "../database/models/User";
import { BotCommand } from "../interfaces";

const AWARD_LEVELS = ["🥇", "🥈", "🥉", "😏", "🤡"];

export const LeaderboardCommand: BotCommand = {
  // prettier-ignore
  builder: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("it IS a competition"),

  execute: async (bot: Bot, interaction: CommandInteraction) => {
    const topUsers = await User.createQueryBuilder("leaderboard")
      .select()
      .addSelect('sockpoints + "bankBalance"', "total_points")
      .orderBy("total_points", "DESC")
      .limit(5)
      .getMany();

    const embed = new EmbedBuilder()
      .setColor(0x8a51ff)
      .setTitle("Leaderboard")
      .setDescription("The top 5 sockheads in the sockonomy")
      .setThumbnail("https://i.imgur.com/65ZUH7y.png")
      .setFields(
        await Promise.all(
          topUsers.map(async (user, i) => {
            const discordUser = await bot.client.users.fetch(user.discordID);
            return {
              name: `${AWARD_LEVELS[i]} ${discordUser.tag}`,
              value: `${(user.sockpoints + user.bankBalance).toLocaleString()} sockpoints`,
            };
          }),
        ),
      )
      .setFooter({ text: "get superior <3" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
