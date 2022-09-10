import { CommandInteraction, SlashCommandBuilder } from "discord.js";
import { BotCommand } from ".";
import { UserHistory } from "../database/models/UserHistory";
import { User } from "../database/models/User";
import * as utils from "../utils";

type Stats = {
  GambleStats: {
    pointsWon: number;
    pointsLost: number;
    timesWon: number;
    timesLost: number;
  };
  PaymentStats: {
    pointsReceived: number;
    pointsSent: number;
    transactionsReceived: number;
    transactionsSent: number;
  };
  ShiritoriStats: {
    pointsEarned: number;
    pointsLost: number;
    numberOfGoodWords: number;
    numberOfChainBreakers: number;
  };
};

export const StatsCommand: BotCommand = {
  builder: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("your statistics"),

  execute: async (interaction: CommandInteraction) => {
    const user = await utils.fetchCreateUser(interaction.user.id);

    const history = await UserHistory.find({
      where: { user: { id: user.id } },
    });

    const stats: Stats = {
      GambleStats: {
        pointsWon: 0,
        pointsLost: 0,
        timesWon: 0,
        timesLost: 0,
      },
      PaymentStats: {
        pointsReceived: 0,
        pointsSent: 0,
        transactionsReceived: 0,
        transactionsSent: 0,
      },
      ShiritoriStats: {
        pointsEarned: 0,
        pointsLost: 0,
        numberOfGoodWords: 0,
        numberOfChainBreakers: 0,
      },
    };

    for (const historyItem of history) {
      switch (historyItem.action) {
        case "doubleornothing_win":
          stats.GambleStats.pointsWon += historyItem.value1;
          stats.GambleStats.timesWon += 1;
          break;
        case "doubleornothing_loss":
          stats.GambleStats.pointsLost += historyItem.value1;
          stats.GambleStats.timesLost += 1;
          break;
        case "shiritori":
          stats.ShiritoriStats.pointsEarned += historyItem.value1;
          stats.ShiritoriStats.numberOfGoodWords += 1;
          break;
        case "shiritori_fail":
          stats.ShiritoriStats.pointsLost += historyItem.value1;
          stats.ShiritoriStats.numberOfChainBreakers += 1;
          break;
        case "pay":
          break;
      }
    }

    const response = [];

    response.push("-- Double Or Nothing Stats");
    response.push(`Points Won: ${stats.GambleStats.pointsWon}`);
    response.push(`Times Won: ${stats.GambleStats.timesWon}`);
    response.push(`Points Lost: ${stats.GambleStats.pointsLost}`);
    response.push(`Times Lost: ${stats.GambleStats.timesLost}`);

    response.push("");

    response.push("-- Shiritori Stats");
    response.push(`Points Earned: ${stats.ShiritoriStats.pointsEarned}`);
    response.push(`# of good words: ${stats.ShiritoriStats.numberOfGoodWords}`);
    response.push(`Points Lost: ${stats.ShiritoriStats.pointsLost}`);
    response.push(
      `Chain breakers: ${stats.ShiritoriStats.numberOfChainBreakers}`
    );

    interaction.reply(response.join("\n"));
  },
};
