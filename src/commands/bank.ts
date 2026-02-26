import { CommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { Bot } from "../bot";
import { BotCommand } from "../interfaces";
import * as utils from "../utils";

export const BankCommand: BotCommand = {
  builder: new SlashCommandBuilder()
    .setName("bank")
    .setDescription("Banking service")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("deposit")
        .setDescription("Deposit sockpoints")
        .addIntegerOption((option) =>
          option.setName("points").setDescription("How many points to deposit.").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("withdraw")
        .setDescription("Withdraw sockpoints")
        .addIntegerOption((option) =>
          option.setName("points").setDescription("How many points to withdraw.").setRequired(true),
        ),
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("balance").setDescription("Check bank balance"),
    ),

  execute: async (bot: Bot, interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    const user = await utils.fetchCreateUser(interaction.user.id);

    // -- Bank balance
    if (interaction.options.getSubcommand() === "balance") {
      await interaction.reply(`${user.bankBalance} sockpoints in your bank`);
      return;
    }

    const amount = interaction.options.getInteger("points", true);
    if (amount <= 0) {
      await interaction.reply("stares at you");
      return;
    }

    // -- Depositing
    if (interaction.options.getSubcommand() === "deposit") {
      if (amount > user.sockpoints) {
        await interaction.reply(
          `you can't afford that, brokeass. you have ${user.sockpoints} in your wallet.`,
        );
        return;
      }
      user.sockpoints -= amount;
      user.bankBalance += amount;
      await user.save();

      const embed = new EmbedBuilder()
        .setColor(0x39c0fa)
        .setTitle("Points deposited")
        .setDescription(`You've deposited ${amount.toLocaleString()} sockpoints into your bank.`)
        .setFields(
          {
            name: "New bank balance",
            value: `\`\`\`js\n${user.bankBalance.toLocaleString()} sockpoints\`\`\``,
          },
          {
            name: "New wallet balance",
            value: `\`\`\`js\n${user.sockpoints.toLocaleString()} sockpoints\`\`\``,
          },
        )
        .setFooter({ text: "get rich <3" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
    // -- Withdrawing
    else if (interaction.options.getSubcommand() === "withdraw") {
      if (amount > user.bankBalance) {
        await interaction.reply("not enough money in your bank bozo");
        return;
      }
      user.sockpoints += amount;
      user.bankBalance -= amount;
      await user.save();

      const embed = new EmbedBuilder()
        .setColor(0xfa7a34)
        .setTitle("Points withdrawn")
        .setDescription(`You've withdrawn ${amount.toLocaleString()} sockpoints from your bank.`)
        .setFields(
          {
            name: "New bank balance",
            value: `\`\`\`js\n${user.bankBalance.toLocaleString()} sockpoints\`\`\``,
          },
          {
            name: "New wallet balance",
            value: `\`\`\`js\n${user.sockpoints.toLocaleString()} sockpoints\`\`\``,
          },
        )
        .setFooter({ text: "get rich <3" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    }
  },
};
