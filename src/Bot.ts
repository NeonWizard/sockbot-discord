import { Client, GatewayIntentBits } from "discord.js";

import readyListener from "./listeners/ready";
import shiritoriListener from "./listeners/shiritori";

import * as dotenv from "dotenv";
dotenv.config();

console.log("Bot is starting...");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

readyListener(client);
shiritoriListener(client);

client.login(process.env.TOKEN);
