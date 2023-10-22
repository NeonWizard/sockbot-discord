import { Message, MessageType } from "discord.js";
import { Bot } from "src/bot";
import { OPENAI_COOLDOWN } from "../constants";

import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

let cooldown = 0;

export default (bot: Bot): void => {
  const client = bot.client;
  let openAI: OpenAI;

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
    openAI = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // cooldown stuff
    cooldown = 0;
    setInterval(() => (cooldown = Math.max(0, cooldown - 1)), 1000);

    bot.logger.info(`OpenAI initialized!`);
  });

  client.on("messageCreate", async (message: Message) => {
    if (openAI === undefined) return;
    if (!client.user || !client.application) return;

    if (message.author.bot) return;

    const context: ChatCompletionMessageParam[] = [
      { content: message.content, role: "user", name: message.author.username },
    ];

    if (message.type === MessageType.Default) {
      if (!message.content.toLowerCase().includes(client.user.username.toLowerCase())) return;
    } else if (message.type === MessageType.Reply) {
      let repliedTo = await message.fetchReference();
      if (repliedTo.author.id !== client.user.id) return;
      context.unshift({
        content: repliedTo.content,
        role: repliedTo.author.bot ? "assistant" : "user",
        name: repliedTo.author.username,
      });

      // build out reply chain context
      while (repliedTo.type === MessageType.Reply) {
        repliedTo = await repliedTo.fetchReference();
        context.unshift({
          content: repliedTo.content,
          role: repliedTo.author.bot ? "assistant" : "user",
          name: repliedTo.author.username,
        });
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
    const contextPrompt: ChatCompletionMessageParam = {
      content: `The following is a conversation between ${client.user.username.toLowerCase()} and multiple other users. ${client.user.username.toLowerCase()} types in all lowercase, not using punctuation frequently. His grammar is eccentric and he has a weird personality. He does not send emojis, and tries not to be too excessively friendly. ${client.user.username.toLowerCase()}'s intelligence is very low and reflects on how he talks. ${client.user.username.toLowerCase()} is NOT an AI assistant, and no reference to that nor GPT should be made during the conversation.`,
      role: "system",
    };
    context.unshift(contextPrompt);

    // -- generate openAI completion
    bot.logger.debug(JSON.stringify(context));
    // TODO: Add top_p and temperature to env variables
    const response = await openAI.chat.completions.create({
      model: "gpt-4",
      messages: context,
      // temperature: 2,
      // top_p: 0.9,
      max_tokens: 250,
      // presence_penalty: 0.1,
    });
    const text = response.choices[0].message.content;
    if (!text) {
      bot.logger.error("OpenAI returned empty response.");
      return;
    }

    // -- post-processing output
    const output = text
      .split("\n")
      .map((x) => x.match(/^(?:[^ :]*: )?(.+)$/)?.[1] ?? "")
      .join("\n");
    if (output === "") {
      bot.logger.error(`OpenAI response unusable. Not responding. Full output: ${text}`);
      return;
    }

    await message.reply(output);
  });
};
