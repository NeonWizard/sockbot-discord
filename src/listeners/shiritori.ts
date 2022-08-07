import { Client, Message } from "discord.js";

export default (client: Client): void => {
  client.on("messageCreate", async (message: Message) => {
    if (message.channelId != process.env.SHIRITORI_CHANNEL) return;
    if (message.author.bot) return;

    // Find last message that wasn't sent by the bot
    let previousMessage;
    const previousMessages = await message.channel.messages.fetch({
      before: message.id,
      limit: 10,
    });
    for (const [ID, msg] of previousMessages) {
      if (msg.author.bot) continue;
      previousMessage = msg;
      break;
    }

    if (previousMessage === undefined) {
      console.error("Couldn't get previous message.");
      return;
    }

    const content = message.content.toLowerCase();
    const previousContent = previousMessage.content.toLowerCase();

    // -- Shiritori rules
    // 1. Only one word!
    if (content.includes(" ")) {
      message.reply("hey.... one word only... -3 sock points...");
      message.react("999086763358298143");
      return;
    }

    // 2. No double posting
    if (previousMessage.author.id === message.author.id) {
      message.reply(
        "ermm.... don't respond to yourself.. that's weird. -10 sock points"
      );
      message.react("999086763358298143");
      return;
    }

    // 3. Message starts with last message's last character
    if (!content.startsWith(previousContent.at(previousContent.length - 1)!)) {
      message.reply(
        "YOU BROKE THE SHIRITORI CHAIN!!! YOU BROKE IT!!!! -5 SOCK POINTS!!!"
      );
      message.react("999086763358298143");
      return;
    }

    message.react("821866361177374743");
  });
};
