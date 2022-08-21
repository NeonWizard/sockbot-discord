import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import * as fs from "node:fs/promises";
import * as dotenv from "dotenv";
import path from "node:path";
dotenv.config();

// Validate environment variables
if (process.env.DISCORD_TOKEN == null) {
  throw new Error("Environment variable 'DISCORD_TOKEN' is missing.");
}
// if (process.env.DISCORD_CLIENT_ID == null) {
//   throw new Error("Environment variable 'DISCORD_CLIENT_ID'is missing.");
// }

(async () => {
  const commands = [];
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = await fs.readdir(commandsPath).then((files) => {
    return files.filter((file) => file.endsWith(".ts"));
  });

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const { builder } = await import(filePath);
    commands.push(builder.toJSON());
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);

  // whaaaaat
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { id: clientID }: { [key: string]: any } = (await rest.get(
    Routes.oauth2CurrentApplication()
  )) as object;

  try {
    console.log("Started refreshing application (/) commands.");

    await rest.put(Routes.applicationCommands(clientID), {
      body: commands,
    });

    console.log("Successfully reloaded application (/) commands.");
  } catch (error) {
    console.error(error);
  }
})().catch((err: Error) => {
  throw err;
});
