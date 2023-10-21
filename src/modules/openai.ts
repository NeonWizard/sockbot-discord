import { Message, MessageType } from "discord.js";
import { Bot } from "src/bot";
import { OPENAI_COOLDOWN } from "../constants";

import { Configuration, OpenAIApi } from "openai";

let cooldown = 0;

export default (bot: Bot): void => {
  const client = bot.client;
  let openAI: OpenAIApi;

  client.on("initialized", async () => {
    if (process.env.OPENAI_DISABLE === "true") {
      bot.logger.warn("OPENAI_DISABLE set to true, disabling OpenAI module.");
      return;
    }

    if (!process.env.OPENAI_API_KEY) {
      bot.logger.error("Unable to initialize OpenAI module: OPENAI_API_KEY is not set.");
      return;
    }

    // initialize openAI API
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    openAI = new OpenAIApi(configuration);

    // cooldown stuff
    cooldown = 0;
    setInterval(() => (cooldown = Math.max(0, cooldown - 1)), 1000);

    bot.logger.info(`OpenAI initialized!`);
  });

  client.on("messageCreate", async (message: Message) => {
    if (!client.user || !client.application) return;

    if (message.author.bot) return;

    const context = [`${message.author.username}: ${message.content}`];

    if (message.type === MessageType.Default) {
      if (!message.content.toLowerCase().includes(client.user.username.toLowerCase())) return;
    } else if (message.type === MessageType.Reply) {
      let repliedTo = await message.fetchReference();
      if (repliedTo.author.id !== client.user.id) return;
      context.unshift(`${repliedTo.author.username}: ${repliedTo.content}`);

      // build out reply chain context
      while (repliedTo.type === MessageType.Reply) {
        repliedTo = await repliedTo.fetchReference();
        context.unshift(`${repliedTo.author.username}: ${repliedTo.content}`);
      }
    } else {
      return;
    }

    if (cooldown > 0) {
      bot.logger.info(
        `Attempted OpenAI interaction but on cooldown. ${cooldown} seconds remaining.`
      );
      return;
    }
    cooldown = OPENAI_COOLDOWN;

    // -- pre-processing input
    const contextPrompt = `
The following is a conversation between ${client.user.username.toLowerCase()} and multiple other users. ${client.user.username.toLowerCase()} types in all lowercase, not using punctuation frequently. His grammar is eccentric and he has a weird personality. He does not send emojis, and tries not to be too excessively friendly. ${client.user.username.toLowerCase()}'s intelligence is very low and reflects on how he talks. ${client.user.username.toLowerCase()} is NOT an AI assistant, and no reference to that nor GPT should be made during the conversation.
`;
    context.unshift(contextPrompt);
    let input: string = context.join("\n");

    // query bot response
    input += `\n${client.user.username}:`;

    bot.logger.debug(input);
    bot.logger.info(input + "\n");

    // -- generate openAI completion
    const response = await openAI.createCompletion({
      model: "text-curie-001",
      prompt: input,
      temperature: 1,
      top_p: 0.9,
      max_tokens: 65,
      user: message.author.tag,
    });
    const text = response.data.choices[0].text;
    if (!text) {
      bot.logger.error("OpenAI returned empty response.");
      return;
    }

    // -- post-processing
    let output: string = text;
    output = output.split("\n").filter((x) => x && !/.*[^ ]: .*/.test(x))[0];

    if (!output) {
      bot.logger.error(`OpenAI response unusable. Not responding. Full output: ${text}`);
      return;
    }

    await message.reply(output);
  });
};
