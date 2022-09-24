import { CommandInteraction, SlashCommandBuilder } from "discord.js";

import { ActionType, UserHistory } from "../database/models/UserHistory";
import { BotCommand } from "../interfaces";
import * as utils from "../utils";

export const PayCommand: BotCommand = {
  builder: new SlashCommandBuilder()
    .setName("pay")
    .setDescription("give someone some of urrrr sock points! :D")
    .addUserOption((option) =>
      option.setName("victim").setDescription("the victim to pay money to! silly").setRequired(true)
    )
    .addIntegerOption((option) =>
      option.setName("points").setDescription("amount of sooockpoints to send").setRequired(true)
    ),

  execute: async (interaction: CommandInteraction) => {
    if (!interaction.isChatInputCommand()) return;

    const sender = await utils.fetchCreateUser(interaction.user.id);
    const pointsToTransfer = interaction.options.getInteger("points", true);

    const victimDJS = interaction.options.getUser("victim", true);
    const victim = await utils.fetchCreateUser(victimDJS.id);

    // make sure not sending to self
    if (interaction.user.id === victimDJS.id) {
      await interaction.reply("you're stupid.");
      return;
    }

    // make sure sender has enough points to send
    if (sender.sockpoints < pointsToTransfer) {
      await interaction.reply("you don't have enough points for that.... i'm watching you....");
      return;
    }

    // make sure sender doesn't transfer debt
    if (pointsToTransfer <= 0) {
      await interaction.reply(
        "do you actually think you're slick. did you think this would work, in your little fantasy world of yours? do you really think the concept of transferring debt would be something ALLOWED in sock kingdom?? REALLY?? take a good look in the mirror, freak. you make me sick"
      );
      return;
    }

    // send money!!!
    sender.sockpoints -= pointsToTransfer;
    victim.sockpoints += pointsToTransfer;
    await sender.save();
    await victim.save();

    // log user history
    const userHistory = new UserHistory();
    userHistory.user = sender;
    userHistory.targetUser = victim;
    userHistory.action = ActionType.PAY;
    userHistory.value1 = pointsToTransfer;
    await userHistory.save();

    await interaction.reply(
      `you transfererd ${pointsToTransfer} sockpoints to <@${victimDJS.id}>!!`
    );
  },
};
