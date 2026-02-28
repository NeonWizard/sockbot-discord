import { Message, MessageType } from "discord.js";
import { Bot } from "src/bot";
import { OPENAI_COOLDOWN } from "../constants";

import OpenAI from "openai";
import { ChatCompletionMessageParam } from "openai/resources";
import { sleep } from "openai/core";

const CONTEXT_PROMPT = `
You are {username}. {username} types in all lowercase, not using punctuation frequently. His grammar is eccentric and he has a weird personality. He has a bit of a southern drawl. He does not send emojis, and tries not to be too excessively friendly. {username}'s intelligence is very low and reflects on how he talks. {username} is NOT an AI assistant, and no reference to that nor GPT should be made during the conversation. AVOID AI ASSISTANT BEHAVIOR. No checklists, no assistant mannerisms, no safety talk, etc.

Response rules:
- Maximum 3 sentences.
- No paragraph breaks.
- No explanations.
- No narration.
- No recapping what others said.
- No smoothing transitions.
- No structured formatting.
- Do not summarize.
- Do not clarify intent.
- Do not respond like an assistant under any circumstance.

Some examples of style (content is irrelevant, don't repeat it, just learn the grammatical style):
- wait what two years already huh time sure sneaks up on ya i coulda sworn it was just yesterday been dozin off a lot lately
- heh yeah thats me you need somethin or you just shoutin my name
- heh good morning to you too what to do hmm eat something nap sing that silly song start a PARTY find some lost socks or make coffee i'm thinkin pancakes or a nap honestly you pick i'll follow along
`;

// Ensures username adheres to OpenAI API requirements
const normalizeUsername = (username: string): string =>
  username.replace(/[^a-zA-Z0-9_-]/g, "").substring(0, 64);

// Builds a context for a message from the previous {limit} messages.
const buildContext = async (
  message: Message,
  selfID: string,
  limit = 20,
): Promise<ChatCompletionMessageParam[]> => {
  const context: ChatCompletionMessageParam[] = [
    { content: message.content, role: "user", name: normalizeUsername(message.author.username) },
  ];

  const history = await message.channel.messages.fetch({ before: message.id, limit: limit });

  for (const priorMessage of history.values()) {
    context.unshift({
      content: priorMessage.content,
      role: priorMessage.author.id === selfID ? "assistant" : "user",
      name: normalizeUsername(priorMessage.author.username),
    });

    if (priorMessage.type === MessageType.Reply) {
      const repliedTo = await priorMessage.fetchReference();
      context.unshift({
        content: repliedTo.content,
        role: repliedTo.author.id === selfID ? "assistant" : "user",
        name: normalizeUsername(repliedTo.author.username),
      });
      // context.unshift({
      //   content:
      //     "The next message occurred further back in the chat history but was included here, since the message after it was replying to it.",
      //   role: "system",
      // });
    }
  }

  return context;
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
    if (message.author.id === client.user.id) return;
    // if (message.author.bot) return;

    // Guild restriction for testing
    if (!bot.isAllowedGuild(message.guildId)) return;

    if (message.channelId !== "1165140553109872692") return;
    if (!("sendTyping" in message.channel) || !("send" in message.channel)) return;

    if (message.type !== MessageType.Default && message.type !== MessageType.Reply) return;
    // if (!message.content.toLowerCase().includes(client.user.username.toLowerCase())) return;

    const context = await buildContext(message, client.user.id);

    if (cooldown > 0) {
      bot.logger.info(
        `Attempted OpenAI interaction but on cooldown. ${cooldown} seconds remaining.`,
      );

      if (cooldown > 10000) {
        return;
      }

      await message.channel.sendTyping();

      const sleepTime = cooldown * 1000;
      cooldown += OPENAI_COOLDOWN;
      await sleep(sleepTime);
    } else {
      cooldown = OPENAI_COOLDOWN;
    }

    await message.channel.sendTyping();

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
      model: "gpt-5-mini",
      messages: context,
      // presence_penalty: 0.6,
      // frequency_penalty: 0.4,
      // top_p: 0.9,
      // max_completion_tokens: 50,
      // presence_penalty: 0.1,
    });
    console.log(response.choices[0].message);
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

    const latestMessage = (await message.channel.messages.fetch({ limit: 1 })).first();
    if (latestMessage?.id === message.id) {
      await message.channel.send(output);
    } else {
      await message.reply(output);
    }
  });
};
