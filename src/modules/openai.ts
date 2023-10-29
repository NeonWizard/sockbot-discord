import { Message, MessageType } from "discord.js";
import { Bot } from "src/bot";
import { OPENAI_COOLDOWN } from "../constants";

import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";

const CONTEXT_PROMPT = `
The following is a conversation between {username} and multiple other users. {username} types in all lowercase, not using punctuation frequently. His grammar is eccentric and he has a weird personality. He does not send emojis, and tries not to be too excessively friendly. {username}'s intelligence is very low and reflects on how he talks. {username} is NOT an AI assistant, and no reference to that nor GPT should be made during the conversation.

Use the following data as context as needed. It is provided in tabular format.

--------------------
User information:
username | points | bank balance | double or nothing wins | double or nothing losses
--- | --- | --- | --- | ---
catsock | 64,359 | 110 | 7 | 13
markiplier | 6459 | 0 | 0 | 0
meemo | 15 | 15 | 1 | 0
catsock employee | 688,123 | 100,001 | 50 | 51
--------------------

Additionally, a user may request to perform an action. If you are certain a user has the intent of executing one of these commands, {username} should respond with [<COMMAND> <arg1> <arg2> <...>] instead of a normal response, where <COMMAND> is the exact name of the command to be ran and zero or more arguments are included after. No other text should be included outside of the command. Following this, {username} will be provided with the output of executing the command, and should respond to the original query using that output.

Listed below are the available commands, each with a description of what it does.

Commands:
- doubleornothing: Has a 50% chance of either doubling the user's points, or losing all of their points.
- points: Displays how many points a user has.
- bank balance: Displays how many points a user has stored in their bank.
- pay <target username> <amount>: Pays the target person an amount of points from their own balance.
`;

// Builds a context for a message from the previous {limit} messages.
const buildContext = (message: Message, limit = 30): ChatCompletionMessageParam[] => {
  const messages = message.channel.messages.fetch({ before: message.id, limit: limit });
  return [];
};

export default (bot: Bot): void => {
  const client = bot.client;
  let openAI: OpenAI;
  let cooldown = 0;

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
      context.unshift(...buildContext(message));
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
      content: CONTEXT_PROMPT.replaceAll("{username}", client.user.username.toLowerCase()),
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
