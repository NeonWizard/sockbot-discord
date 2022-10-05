import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import { LOTTERY_TICKET_COST } from "../constants";

import { Bot } from "../bot";
import { BotCommand } from "../interfaces";

interface Item {
  id: string;
  name: string;
  description: string;
  cost: number;
}

const ITEMS: Item[] = [
  {
    id: "lottery_ticket",
    name: "Lottery Ticket",
    description: "A ticket for this week's lottery.",
    cost: LOTTERY_TICKET_COST,
  },
  {
    id: "shiritori_bomb",
    name: "Shiritori Bomb",
    description: "A single-use bomb which will blow up the last word in the shiritori channel.",
    cost: 500,
  },
  {
    id: "at_everyone",
    name: "Single-use @everyone",
    description: "A single-use item which will ping @everyone.",
    cost: 50000,
  },
];

export const ShopCommand: BotCommand = {
  // prettier-ignore
  builder: new SlashCommandBuilder()
    .setName("shop")
    .setDescription("Opens up the sockshop."),

  execute: async (bot: Bot, interaction: CommandInteraction) => {
    const embed = new EmbedBuilder()
      .setColor(0xcfcfcf)
      .setTitle("Sock Shop")
      .setDescription(
        "Lamp oil? Rope? Bombs? You want it? It's yours my friend, as long as you have enough sockpoints."
      )
      .setFields(
        ITEMS.map((item) => {
          return {
            name: item.name,
            value: `${
              item.description
            }\n\`\`\`css\n${item.cost.toLocaleString()} sockpoints\n\`\`\``,
            inline: true,
          };
        })
      )
      .setFooter({ text: "get items <3" })
      .setTimestamp();

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      ITEMS.map((item) => {
        return new ButtonBuilder()
          .setCustomId(item.id)
          .setLabel(item.name)
          .setStyle(ButtonStyle.Primary);
      })
    );

    await interaction.reply({ embeds: [embed], components: [row], allowedMentions: { users: [] } });
  },
};
