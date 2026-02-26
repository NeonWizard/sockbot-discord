import { ChannelType, Client, GatewayIntentBits } from "discord.js";
import { DiscordGatewayAdapterCreator, joinVoiceChannel } from "@discordjs/voice";
import * as readline from "readline";
import * as dotenv from "dotenv";
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

client.login(process.env.DISCORD_TOKEN).catch((err: Error) => {
  console.log("Error logging in: " + err);
});

client.once("ready", async () => {
  if (process.env.DEVELOPMENT !== "true") return;
  console.log("Bot is ready!");

  // const channel2 = await client.channels.fetch("824472613745065994");
  // if (channel2?.type !== ChannelType.GuildText) return;
  // const attachment = new AttachmentBuilder("7r4MOSWF_53iPh7t.mp4");
  // channel2.send({ files: [attachment] });

  const channel = await client.channels.fetch("913818161420324864");
  if (channel?.type !== ChannelType.GuildVoice) return;

  let connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guildId,
    adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
    selfDeaf: false,
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  let flag = true;
  for (;;) {
    await new Promise((res) =>
      rl.question("THing ?", (answer) => {
        res(answer);
      }),
    );

    if (flag) {
      console.log("DISCONNECT");
      connection.destroy();
    } else {
      console.log("CONNECT");
      connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guildId,
        adapterCreator: channel.guild.voiceAdapterCreator as DiscordGatewayAdapterCreator,
        selfDeaf: false,
      });
    }
    flag = !flag;
  }
});
