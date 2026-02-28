import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import { commands } from "./commands";

import * as dotenv from "dotenv";
dotenv.config();

// Validate environment variables
if (process.env.DISCORD_TOKEN == null) {
  throw new Error("Environment variable 'DISCORD_TOKEN' is missing.");
}

(async () => {
  const commandBuilders = commands.map((command) => command.builder.toJSON());

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

  // whaaaaat
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id: clientID }: { [key: string]: any } = (await rest.get(
    Routes.oauth2CurrentApplication(),
  )) as object;

  try {
    console.log("Started refreshing application (/) commands.");

    // For testing: deploy to specific guild for instant updates
    if (process.env.TEST_GUILD_ID) {
      console.log(`Deploying to test guild: ${process.env.TEST_GUILD_ID}`);
      await rest.put(Routes.applicationGuildCommands(clientID, process.env.TEST_GUILD_ID), {
        body: commandBuilders,
      });
      console.log("Successfully deployed commands to test guild.");
    } else {
      await rest.put(Routes.applicationCommands(clientID), {
        body: commandBuilders,
      });
      console.log("Successfully reloaded global application (/) commands.");
    }
  } catch (error) {
    console.error(error);
  }
})().catch((err: Error) => {
  throw err;
});
