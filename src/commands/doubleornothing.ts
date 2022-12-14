import {
  AttachmentBuilder,
  CommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder,
} from "discord.js";
import path from "path";
import { Bot } from "../bot";
import { ActionType, UserHistory } from "../database/models/UserHistory";
import { BotCommand } from "../interfaces";
import * as utils from "../utils";

export const DoubleOrNothingCommand: BotCommand = {
  builder: new SlashCommandBuilder()
    .setName("doubleornothing")
    .setDescription("50% chance to double your points, 50% chance to lose your points"),

  execute: async (bot: Bot, interaction: CommandInteraction) => {
    const user = await utils.fetchCreateUser(interaction.user.id);

    if (user.sockpoints < 0) {
      await interaction.reply("brokeass. try again when you've paid your debt");
      return;
    }

    if (Math.random() < 0.5) {
      // -- Double
      const oldPoints = user.sockpoints;
      user.sockpoints *= 2;
      await user.save();

      const userHistory = new UserHistory();
      userHistory.user = user;
      userHistory.action = ActionType.DOUBLEORNOTHING_WIN;
      userHistory.value1 = oldPoints;
      await userHistory.save();

      const embed = new EmbedBuilder()
        .setColor(0xf2c30a)
        .setTitle("POINTS DOUBLED!!")
        .setDescription(`CONGRATS!!! YOU DOUBLED YOUR POINTS!!!`)
        .setFields(
          {
            name: "Previous balance",
            value: `\`\`\`js\n${oldPoints.toLocaleString()} sockpoints\`\`\``,
          },
          {
            name: "New balance",
            value: `\`\`\`js\n${user.sockpoints.toLocaleString()} sockpoints\`\`\``,
          }
        )
        .setFooter({ text: "get rich <3" })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } else {
      // -- Nothing
      const oldPoints = user.sockpoints;
      user.sockpoints = 0;
      await user.save();

      const userHistory = new UserHistory();
      userHistory.user = user;
      userHistory.action = ActionType.DOUBLEORNOTHING_LOSS;
      userHistory.value1 = oldPoints;
      await userHistory.save();

      const attachment = new AttachmentBuilder(
        path.join(__dirname, "../static/images/cry-man.gif")
      );
      await interaction.reply({ files: [attachment] });
    }
  },
};
