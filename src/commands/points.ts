import {
  AttachmentBuilder,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import * as utils from "../utils";
import * as Canvas from "canvas";
import path from "path";
import { BotCommand } from ".";

export const PointsCommand: BotCommand = {
  builder: new SlashCommandBuilder()
    .setName("points")
    .setDescription("see urrrr sock points! :0"),

  execute: async (interaction: CommandInteraction) => {
    const user = await utils.fetchCreateUser(interaction.user.id);

    Canvas.registerFont(
      path.join(__dirname, "../static/fonts/nk57-monospace-no-eb.ttf"),
      {
        family: "nk57",
      }
    );

    const canvas = Canvas.createCanvas(680, 678);
    const ctx = canvas.getContext("2d");

    const img = await Canvas.loadImage(
      path.join(__dirname, "../static/images", "four.jpg")
    );

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    ctx.font = "69px nk57";
    ctx.fillStyle = "white";
    ctx.strokeStyle = "black";
    ctx.lineWidth = 7;
    ctx.textAlign = "center";
    ctx.rotate(0.05);
    ctx.strokeText(user.sockpoints.toLocaleString(), 380, 365);
    ctx.fillText(user.sockpoints.toLocaleString(), 380, 365);

    const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
      name: "points.png",
    });
    interaction.reply({ files: [attachment] });
  },
};
