import { Client, Message, TextChannel } from "discord.js";

let history: Message[] = [];

// Tests a message for adhering to shiritori rules. Returns a string error
// on failure, otherwise returns undefined.
const testMessage = (
  previousMessage: Message | undefined,
  message: Message
): string | undefined => {
  const content = message.content.toLowerCase();
  const previousContent = previousMessage?.content.toLowerCase() ?? "";

  // -- Shiritori rules
  // 1. Only one word and letters only!
  if (content.includes(" ") || !/^[a-z]+$/.test(content)) {
    return "post must be one word only and umm also only contain alphabetic characters.";
  }

  if (previousMessage === undefined) {
    return;
  }

  // 2. No self-replying
  if (previousMessage.author.id === message.author.id) {
    return "you can't respond to yourself...";
  }

  // 3. Message starts with last message's last character (CHAIN-BREAKER)
  if (!content.startsWith(previousContent.at(previousContent.length - 1)!)) {
    return "get freaking shiritori'd";
  }
};

export default (client: Client): void => {
  client.on("initialized", async () => {
    const shiritoriChannel = (await client.channels.fetch(
      process.env.SHIRITORI_CHANNEL!
    )) as TextChannel;

    shiritoriChannel.send(
      "oopsie daisies xD i had to restart >.< starting chain over!"
    );
  });

  client.on("messageCreate", async (message: Message) => {
    if (message.channelId != process.env.SHIRITORI_CHANNEL) return;
    if (message.author.bot) return;

    const previousMessage = history[history.length - 1];

    const err = testMessage(previousMessage, message);
    if (err !== undefined) {
      await message.react("❌");
      await message.reply(
        `<@${message.author.id}> broke the shiritori chain T-T\n${err}\nchain was ${history.length} words long when SOMEONE broke it x.x`
      );
      history = [];
      return;
    }

    history.push(message);
    await message.react("✅");
  });
};
