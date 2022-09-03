import {
  AttachmentBuilder,
  CommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import * as utils from "../utils";
import * as Canvas from "canvas";
import * as fs from "fs";
import path from "path";

export const builder = new SlashCommandBuilder()
  .setName("points")
  .setDescription("see urrrr sock points! :0");

export const execute = async (interaction: CommandInteraction) => {
  const user = await utils.fetchCreateUser(interaction.user.id);

  // if (user.sockpoints == 0) {
  //   await interaction.reply("no sock points pee boy. haha");
  // } else {
  //   await interaction.reply(
  //     `mmmm you've got ${user.sockpoints.toLocaleString()} points. frutata`
  //   );
  // }

  Canvas.registerFont(
    path.join(__dirname, "../utils/fonts/nk57-monospace-no-eb.ttf"),
    {
      family: "nk57",
    }
  );

  const canvas = Canvas.createCanvas(680, 678);
  const ctx = canvas.getContext("2d");

  const img = await Canvas.loadImage(
    path.join(__dirname, "../images", "four.jpg")
  );

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  ctx.font = "69px nk57";
  ctx.fillStyle = "white";
  ctx.strokeStyle = "black";
  ctx.lineWidth = 7;
  ctx.textAlign = "center";
  ctx.rotate(0.055);
  ctx.strokeText(user.sockpoints.toLocaleString(), 380, 365);
  ctx.fillText(user.sockpoints.toLocaleString(), 380, 365);

  canvas
    .createPNGStream()
    .pipe(fs.createWriteStream(path.join(__dirname, "..", "swag.png")));

  const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), {
    name: "points.png",
  });
  interaction.reply({ files: [attachment] });
};
