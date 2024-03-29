import { EmbedBuilder, Message, PartialMessage } from "discord.js";
import { Bot } from "../bot";
import { KnownWord } from "../database/models/KnownWord";
import { ShiritoriChannel } from "../database/models/ShiritoriChannel";
import { ShiritoriWord } from "../database/models/ShiritoriWord";
import { User } from "../database/models/User";
import { ActionType, UserHistory } from "../database/models/UserHistory";
import * as utils from "../utils";

// Tests a message for adhering to shiritori rules. Returns a string error
// on failure, otherwise returns undefined.
const testMessage = (
  message: Message,
  channel: ShiritoriChannel,
  lastWord: KnownWord | null
): string | undefined => {
  const content = message.content.toLowerCase();

  // -- Shiritori rules
  // 1. Only one word and letters only!
  if (content.includes(" ") || !/^[a-z]+$/.test(content)) {
    return "post must be one word only and umm also only contain alphabetic characters.";
  }

  // 2. Word must be at least two characters
  if (content.length <= 1) {
    return "word must be at least two characters. sorz";
  }

  if (lastWord === null || channel.lastUser === null) {
    return;
  }

  // 3. No self-replying
  if (process.env.DEVELOPMENT !== "true" && channel.lastUser.discordID === message.author.id) {
    return "you can't respond to yourself...";
  }

  // 4. Message starts with last message's last character (CHAIN-BREAKER)
  const expectedStartLetter = lastWord.text.at(lastWord.text.length - 1) ?? "";
  if (!content.startsWith(expectedStartLetter)) {
    return "get freaking shiritori'd";
  }
};

const checkWordValidity = async (knownWordEnt: KnownWord) => {
  if (knownWordEnt.valid === null) {
    // If word hasn't been dictionary checked before, check with API and also add all inflections to KnownWords
    const inflectionRoots = await utils.getWordInflectionRoots(knownWordEnt.text);
    for (const inflectionRoot of inflectionRoots) {
      const inflectionRootEnt = await utils.fetchCreateWord(inflectionRoot);
      inflectionRootEnt.valid = true;
      if (
        inflectionRootEnt.text !== knownWordEnt.text &&
        !inflectionRootEnt.inflections.find((inflection) => inflection.text === knownWordEnt.text)
      ) {
        inflectionRootEnt.inflections.push(knownWordEnt);
        knownWordEnt.inflectionOf.push(inflectionRootEnt);
      }
      await inflectionRootEnt.save();
    }
    knownWordEnt.valid = inflectionRoots.length > 0;
    await knownWordEnt.save();
  }

  return knownWordEnt.valid;
};

const addWord = async (channel: ShiritoriChannel, user: User, word: KnownWord): Promise<void> => {
  // Bump KnownWord occurrences
  word.occurrences += 1;
  await word.save();

  // Upsert ShiritoriWord
  const shiritoriWord = new ShiritoriWord();
  shiritoriWord.channel = channel;
  shiritoriWord.word = word;
  shiritoriWord.chained = true;
  await ShiritoriWord.upsert(shiritoriWord, ["word", "channel"]);

  // Update channel
  channel.lastUser = user;
  channel.lastWord = word;
  channel.chainLength += 1;
  await channel.save();
};

const createChainBrokenEmbed = (reason: string, chainLength: number, pointsLost: number) => {
  return new EmbedBuilder()
    .setColor(0xfc3838)
    .setTitle("Shiritori chain broken")
    .setDescription(`The shiritori chain was broken at a length of ${chainLength} words!`)
    .setThumbnail("https://i.imgflip.com/69gmn2.png")
    .setFields([
      { name: "Reason", value: reason },
      {
        name: "Points lost",
        value: `\`\`\`js\n${pointsLost} sockpoints lost\`\`\``,
      },
    ])
    .setFooter({ text: "get fucked <3" })
    .setTimestamp();
};

const handleMessageChange = async (
  bot: Bot,
  channelID: string,
  userID: string | undefined,
  createdAt: Date,
  deleted: boolean
) => {
  // Find ShiritoriChannel in database
  const channelEnt = await ShiritoriChannel.findOneBy({
    channelID: channelID,
  });
  if (channelEnt === null) return;

  // Fetch DiscordJS channel object
  const channel = await bot.client.channels.fetch(channelID);
  if (channel === null || !channel.isTextBased()) {
    bot.logger.error(`Could not fetch channel for shiritori channel of ID [${channelEnt.id}]`);
    return;
  }

  // Fetch user
  if (userID === undefined) {
    bot.logger.warn(
      "Received message change event in shiritori with no author data attached. Ignoring."
    );
    await channel.send("don't edit or delete messages you little sluts. i'll getcha next time");
    return;
  }
  const user = await utils.fetchCreateUser(userID);

  // Don't break chain if affected message was from before when the chain started
  if (createdAt < channelEnt.chainStartedAt) return;

  // Break chain
  const pointPenalty = Math.max(10, channelEnt.chainLength * 10);
  user.sockpoints -= pointPenalty;
  await user.save();

  // reset channel
  const chainLength = channelEnt.chainLength;
  await channelEnt.resetChain();

  // log failure in UserHistory table
  const userHistory = new UserHistory();
  userHistory.user = user;
  userHistory.action = ActionType.SHIRITORI_FAIL;
  userHistory.value1 = pointPenalty;
  await userHistory.save();

  // send response
  const embed = createChainBrokenEmbed(
    `Chained word was ${deleted ? "deleted" : "edited"}.`,
    chainLength,
    pointPenalty
  );
  await channel.send({ embeds: [embed] });
};

export default (bot: Bot): void => {
  const client = bot.client;

  // Prevent users from editing messages
  client.on(
    "messageUpdate",
    async (oldMessage: Message | PartialMessage, newMessage: Message | PartialMessage) => {
      // Bots can't participate in Shiritori. T-T
      if (oldMessage.author?.bot || newMessage.author?.bot) return;

      const channelID = oldMessage.channel.id ?? newMessage.channel.id;
      const userID = oldMessage.author?.id ?? newMessage.author?.id;
      const createdAt = oldMessage.createdAt ?? newMessage.createdAt;

      handleMessageChange(bot, channelID, userID, createdAt, false);
    }
  );

  // Prevent users from deleting messages
  client.on("messageDelete", async (message: Message | PartialMessage) => {
    // Bots can't participate in Shiritori. T-T
    if (message.author?.bot) return;

    const channelID = message.channel.id;
    const userID = message.author?.id;
    const createdAt = message.createdAt;

    handleMessageChange(bot, channelID, userID, createdAt, true);
  });

  client.on("messageCreate", async (message: Message) => {
    // Bots can't participate in Shiritori. T-T
    if (message.author.bot) return;

    // Find ShiritoriChannel in database
    const channel = await ShiritoriChannel.findOneBy({
      channelID: message.channelId,
    });
    if (channel === null) return;

    const user = await utils.fetchCreateUser(message.author.id);

    // Check validity of message
    const err = testMessage(message, channel, channel.lastWord);
    if (err !== undefined) {
      const pointPenalty = Math.max(10, channel.chainLength * 10);
      const brokenLength = channel.chainLength;

      // penalize user
      user.sockpoints -= pointPenalty;
      await user.save();

      // reset channel
      await channel.resetChain();

      // log failure in UserHistory table
      const userHistory = new UserHistory();
      userHistory.user = user;
      userHistory.action = ActionType.SHIRITORI_FAIL;
      userHistory.value1 = pointPenalty;
      await userHistory.save();

      // send response
      await message.react("❌");
      const embed = createChainBrokenEmbed(err, brokenLength, pointPenalty);
      await message.reply({ embeds: [embed] });

      return;
    }

    const knownWordEnt = await utils.fetchCreateWord(message.content.toLowerCase());
    let pointAward = 0;
    let wordIsValid = false;

    // Count occurrences of this word in this ShiritoriChannel (either said directly or is an inflection/inflectionOf)
    // This has to be done before the word is added to the ShiritoriChannel (addWord())
    let wordIsUnique =
      (
        await ShiritoriWord.query(`
          SELECT COUNT(*) FROM shiritori_word sw
          INNER JOIN known_word kw
            ON kw.id = sw."wordId"
          WHERE
            sw."channelId" = '${channel.id}' AND
            kw."text" = '${knownWordEnt.text}'
        `)
      )[0].count === "0";

    // Add word to ShiritoriChannel
    await addWord(channel, user, knownWordEnt);

    // By this point, once the green check mark shows up users should be able to send another word without problems
    await message.react("✅");

    // Bonus points based on chain length
    pointAward += Math.min(10, Math.floor(channel.chainLength / 3) + 1);

    // Check validity of words. Invalid words receive a penalty and unique valid words receive a bonus
    if (process.env.SHIRITORI_WORD_CHECK === "true") {
      wordIsValid = await checkWordValidity(knownWordEnt);
      if (!wordIsValid) {
        pointAward = Math.max(0, pointAward - 5);
      } else {
        await message.react("📖");

        // We already calculated if the word is unique, now check if the word's inflections/inflectionOfs are unique
        // This required calling the dictionary API first so we know .inflection and .inflectionOf are set
        if (wordIsUnique) {
          const variants = knownWordEnt.inflectionOf.concat(knownWordEnt.inflections);
          if (variants.length > 0) {
            const occurrences = +(
              await ShiritoriWord.query(`
                SELECT COUNT(*) FROM shiritori_word sw
                INNER JOIN known_word kw
                  ON kw.id = sw."wordId"
                WHERE
                  sw."channelId" = '${channel.id}' AND
                  kw."text" IN (${variants.map((variant) => `'${variant.text}'`).join(", ")})
              `)
            )[0].count;

            if (occurrences !== 0) {
              wordIsUnique = false;
            }
          }
        }

        if (wordIsUnique) {
          pointAward = 30;
        }
      }
    }

    user.sockpoints += pointAward;
    await user.save();

    // Record shiritori action in UserHistory
    const userHistory = new UserHistory();
    userHistory.user = user;
    userHistory.action = ActionType.SHIRITORI;
    userHistory.value1 = pointAward;
    await userHistory.save();

    // Send reactions
    const usedDigits: Set<string> = new Set();
    for (let digit of pointAward.toString()) {
      while (usedDigits.has(digit)) {
        digit = (+digit + 1).toString();
      }
      if (digit === "10") continue; // BAD. SHOULDN'T HAPPEN
      usedDigits.add(digit);
      await message.react(utils.numberToEmoji(+digit));
    }

    if (wordIsValid && wordIsUnique) {
      await message.react("⭐");
    }
  });
};
