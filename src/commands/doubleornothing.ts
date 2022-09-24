import { AttachmentBuilder, CommandInteraction, SlashCommandBuilder } from "discord.js";
import path from "path";
import { ActionType, UserHistory } from "../database/models/UserHistory";
import { BotCommand } from "../interfaces";
import * as utils from "../utils";

export const DoubleOrNothingCommand: BotCommand = {
  builder: new SlashCommandBuilder()
    .setName("doubleornothing")
    .setDescription("50% chance to double your points, 50% chance to lose your points"),

  execute: async (interaction: CommandInteraction) => {
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

      await interaction.reply(
        `<@${
          interaction.user.id
        }> DOUBLED BABY!! ${oldPoints.toLocaleString()} -> ${user.sockpoints.toLocaleString()}`
      );
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
