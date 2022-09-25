import { Message } from "discord.js";
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

// -- TypeORM helpers
const addWord = async (channel: ShiritoriChannel, user: User, word: KnownWord): Promise<void> => {
  // Bump KnownWord occurrences
  word.occurrences += 1;
  await word.save();

  // Upsert ShiritoriWord
  const shiritoriWord = new ShiritoriWord();
  shiritoriWord.channel = channel;
  shiritoriWord.word = word;
  shiritoriWord.chained = true;
  await ShiritoriWord.upsert(shiritoriWord, ["word"]);

  // Update channel
  channel.lastUser = user;
  channel.lastWord = word;
  channel.chainLength += 1;
  await channel.save();

  return;
};

export default (bot: Bot): void => {
  const client = bot.client;

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
      const pointPenalty = Math.max(10, channel.chainLength * 1);
      const brokenLength = channel.chainLength;

      // penalize user
      user.sockpoints -= pointPenalty;
      await user.save();

      // reset channel
      channel.chainLength = 0;
      channel.lastWord = null;
      channel.lastUser = null;
      await channel.save();
      await ShiritoriWord.update(
        { channel: { id: channel.id }, chained: true },
        { chained: false }
      );

      // log failure in UserHistory table
      const userHistory = new UserHistory();
      userHistory.user = user;
      userHistory.action = ActionType.SHIRITORI_FAIL;
      userHistory.value1 = pointPenalty;
      await userHistory.save();

      // send response
      await message.react("❌");
      await message.reply(
        `<@${message.author.id}> broke the shiritori chain T-T\nthey lost: ${pointPenalty} sockpoints\nreason: ${err}\nthe chain was ${brokenLength} words long when SOMEONE broke it x.x`
      );

      return;
    }

    await message.react("✅");
    const knownWordEnt = await utils.fetchCreateWord(message.content.toLowerCase());
    let pointAward = 0;

    // Bonus points based on chain length
    pointAward += Math.min(10, Math.floor(channel.chainLength / 3) + 1);

    // Check validity of words for bonus points
    if (process.env.SHIRITORI_WORD_CHECK === "true") {
      if (knownWordEnt.valid === null) {
        // If word hasn't been dictionary checked before, check with API and also add all inflections to KnownWords
        const wordInflections = await utils.getWordInflections(message.content.toLowerCase());
        for (const inflection of wordInflections) {
          const inflectionEnt = await utils.fetchCreateWord(inflection);
          inflectionEnt.valid = true;
          // inflectionEnt.inflectionRoot = // todo
          await inflectionEnt.save();
        }
        knownWordEnt.valid = wordInflections.length > 0;
        await knownWordEnt.save();
      }

      if (!knownWordEnt.valid) {
        // -5 point penalty for invalid words
        pointAward = Math.max(0, pointAward - 5);
      } else {
        await message.react("📖");

        // 30 point bonus for unique words (unique in this channel)
        const wordIsUnique =
          (await ShiritoriWord.count({
            where: { channel: { id: channel.id }, word: { text: knownWordEnt.text } },
          })) === 0;

        if (wordIsUnique) {
          pointAward = 30;
        }
      }
    }

    await addWord(channel, user, knownWordEnt);

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

    if (pointAward === 30) {
      await message.react("⭐");
    }
  });
};
