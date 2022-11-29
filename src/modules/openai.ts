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
    if (message.type !== MessageType.Default && message.type !== MessageType.Reply) return;
    // if (message.author.id !== "193469296557424640") return;
    if (message.type !== MessageType.Reply && !message.content.toLowerCase().includes("skromp"))
      return;

    if (cooldown > 0) {
      bot.logger.info(
        `Attempted OpenAI interaction but on cooldown. ${cooldown} seconds remaining.`
      );
      return;
    }

    // generate openAI completion
    const response = await openAI.createCompletion({
      model: "text-curie-001",
      prompt: message.content,
      temperature: 1,
      top_p: 0.9,
      max_tokens: 80,
    });
    const text = response.data.choices[0].text;
    if (!text) {
      bot.logger.error("OpenAI returned empty response.");
      return;
    }
    await message.channel.send(text);

    cooldown = OPENAI_COOLDOWN;
  });
};
