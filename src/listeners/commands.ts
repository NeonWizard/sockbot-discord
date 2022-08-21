import { Bot } from "src/bot";

export default (bot: Bot): void => {
  const client = bot.client;

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = bot.commands.get(interaction.commandName);

    if (!command) {
      bot.logger.error("Tried executing a command that does not exist on bot.");
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      bot.logger.error("Error executing a command: ", error);
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  });
};
