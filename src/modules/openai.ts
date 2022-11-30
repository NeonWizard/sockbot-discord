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

    // TODO: Add conversation pretext, such as:
    // "The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly."
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
    let input: string = context.join("\n");

    // query bot response
    input += `\n${client.user.username}:`;

    bot.logger.debug(input);

    // -- generate openAI completion
    const response = await openAI.createCompletion({
      model: "text-curie-001",
      prompt: input,
      temperature: 1,
      top_p: 0.9,
      max_tokens: 65,
      user: message.author.tag,
      stop: "\n",
    });
    const text = response.data.choices[0].text;
    if (!text) {
      bot.logger.error("OpenAI returned empty response.");
      return;
    }

    // -- post-processing
    let output: string = text;
    output = output
      .split("\n")
      .filter((x) => x)
      .join(" ");

    await message.reply(output);
  });
};
