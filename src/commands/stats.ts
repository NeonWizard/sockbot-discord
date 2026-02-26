import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";

import { Bot } from "../bot";
import { ActionType, UserHistory } from "../database/models/UserHistory";
import { BotCommand } from "../interfaces";
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
  LotteryStats: {
    ticketsBought: number;
    winningTickets: number;
    pointsWon: number;
  };
};

export const StatsCommand: BotCommand = {
  // prettier-ignore
  builder: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("your statistics"),

  execute: async (bot: Bot, interaction: CommandInteraction) => {
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
      LotteryStats: {
        ticketsBought: 0,
        winningTickets: 0,
        pointsWon: 0,
      },
    };

    for (const historyItem of history) {
      switch (historyItem.action) {
        case ActionType.DOUBLEORNOTHING_WIN:
          stats.GambleStats.pointsWon += historyItem.value1 ?? 0;
          stats.GambleStats.timesWon += 1;
          break;
        case ActionType.DOUBLEORNOTHING_LOSS:
          stats.GambleStats.pointsLost += historyItem.value1 ?? 0;
          stats.GambleStats.timesLost += 1;
          break;
        case ActionType.SHIRITORI:
          stats.ShiritoriStats.pointsEarned += historyItem.value1 ?? 0;
          stats.ShiritoriStats.numberOfGoodWords += 1;
          break;
        case ActionType.SHIRITORI_FAIL:
          stats.ShiritoriStats.pointsLost += historyItem.value1 ?? 0;
          stats.ShiritoriStats.numberOfChainBreakers += 1;
          break;
        case ActionType.PAY:
          break;
        case ActionType.LOTTERY_TICKET_PURCHASE:
          stats.LotteryStats.ticketsBought += historyItem.value1 ?? 0;
          break;
        case ActionType.LOTTERY_WIN:
          stats.LotteryStats.winningTickets += 1;
          stats.LotteryStats.pointsWon += historyItem.value2 ?? 0;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x5c7d8a)
      // .setTitle("Sock stats")
      .setFields(
        {
          name: "Shiritori stats",
          value: `
            Points earned: ${stats.ShiritoriStats.pointsEarned.toLocaleString()}
            Points lost: ${stats.ShiritoriStats.pointsLost.toLocaleString()}
            # of good words: ${stats.ShiritoriStats.numberOfGoodWords.toLocaleString()}
            # of chain breakers: ${stats.ShiritoriStats.numberOfChainBreakers.toLocaleString()}
          `,
          inline: true,
        },
        {
          name: "Double or nothing stats",
          value: `
            Points won: ${stats.GambleStats.pointsWon.toLocaleString()}
            Points lost: ${stats.GambleStats.pointsLost.toLocaleString()}
            Times won: ${stats.GambleStats.timesWon.toLocaleString()}
            Times lost: ${stats.GambleStats.timesLost.toLocaleString()}
          `,
          inline: true,
        },
        { name: "\u200b", value: "\u200b", inline: true },
        {
          name: "Lottery stats",
          value: `
            Total tickets purchased: ${stats.LotteryStats.ticketsBought.toLocaleString()}
            Total winning tickets: ${stats.LotteryStats.winningTickets.toLocaleString()}
            Points won: ${stats.LotteryStats.pointsWon.toLocaleString()}
          `,
          inline: true,
        },
        { name: "\u200b", value: "\u200b", inline: true },
      )
      .setFooter({ text: "get informed <3" })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
