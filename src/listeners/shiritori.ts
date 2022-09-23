import { Message } from "discord.js";
import { ShiritoriChannel } from "../database/models/ShiritoriChannel";
import { Bot } from "../bot";
import { ShiritoriWord } from "../database/models/ShiritoriWord";
import * as utils from "../utils";
import { ActionType, UserHistory } from "../database/models/UserHistory";
import { ShiritoriInflectionRoot } from "../database/models/ShiritoriInflectionRoot";

// Tests a message for adhering to shiritori rules. Returns a string error
// on failure, otherwise returns undefined.
const testMessage = (
  message: Message,
  channel: ShiritoriChannel,
  lastWord: ShiritoriWord | null
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
  const expectedStartLetter = lastWord.word.at(lastWord.word.length - 1) ?? "";
  if (!content.startsWith(expectedStartLetter)) {
    return "get freaking shiritori'd";
  }
};

// -- TypeORM helpers
const addWord = async (
  channel: ShiritoriChannel,
  userDiscordID: string,
  word: string
): Promise<void> => {
  let wordEnt = await ShiritoriWord.findOne({
    where: { channel: { id: channel.id }, word: word },
    relations: { channel: true },
  });
  if (wordEnt === null) {
    wordEnt = new ShiritoriWord();
    wordEnt.word = word;
    wordEnt.occurrences = 0;
  }

  wordEnt.occurrences += 1;
  wordEnt.channel = channel;
  wordEnt.chainChannel = channel;
  await wordEnt.save();

  channel.lastUser = await utils.fetchCreateUser(userDiscordID);
  channel.lastWord = wordEnt;
  channel.chainLength += 1;
  await channel.save();

  return;
};

export default (bot: Bot): void => {
  const client = bot.client;

  client.on("messageCreate", async (message: Message) => {
    // -- Bots can't participate in Shiritori. T-T
    if (message.author.bot) return;

    // -- Find ShiritoriChannel in database
    const channel = await ShiritoriChannel.findOneBy({
      channelID: message.channelId,
    });
    if (channel === null) return;

    const user = await utils.fetchCreateUser(message.author.id);

    // -- Check validity of message
    const err = testMessage(message, channel, channel.lastWord);
    if (err !== undefined) {
      const pointPenalty = Math.max(10, channel.chainLength * 1);
      const brokenLength = channel.chainLength;

      // penalize user
      user.sockpoints -= pointPenalty;
      await user.save();

      // reset channel
      channel.chainWords = [];
      channel.chainLength = 0;
      channel.lastWord = null;
      channel.lastUser = null;
      await channel.save();

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

    // -- Add word to chain
    await addWord(channel, message.author.id, message.content.toLowerCase());
    await message.react("✅");

    // -- Calculate point award
    let pointAward = 0;

    // chain length bonus points
    pointAward += Math.min(10, Math.floor(channel.chainLength / 3) + 1);

    // word validity and uniqueness
    if (process.env.SHIRITORI_WORD_CHECK === "true") {
      const wordInflections = await utils.getWordInflections(message.content.toLowerCase());
      if (wordInflections.length > 0) {
        await message.react("📖");

        let wordIsUnique = true;
        for (const inflectionRootWord of wordInflections) {
          let dbInflectionRoot = await ShiritoriInflectionRoot.findOneBy({
            word: inflectionRootWord,
            channel: { id: channel.id },
          });

          if (dbInflectionRoot !== null) {
            wordIsUnique = false;
          } else {
            dbInflectionRoot = new ShiritoriInflectionRoot();
            dbInflectionRoot.channel = channel;
            dbInflectionRoot.word = inflectionRootWord;
            dbInflectionRoot.occurrences = 0;
          }
          dbInflectionRoot.occurrences += 1;
          await dbInflectionRoot.save();
        }

        if (wordIsUnique) {
          pointAward = 30;
        }
      } else {
        // -5 point penalty for invalid words
        pointAward = Math.max(0, pointAward - 5);
      }
    }

    user.sockpoints += pointAward;
    await user.save();

    // -- Record shiritori action in UserHistory
    const userHistory = new UserHistory();
    userHistory.user = user;
    userHistory.action = ActionType.SHIRITORI;
    userHistory.value1 = pointAward;
    await userHistory.save();

    // -- Send reactions
    const usedDigits: Set<string> = new Set();
    for (let digit of pointAward.toString()) {
      while (usedDigits.has(digit)) {
        digit = (+digit + 1).toString();
      }
      if (digit === "10") continue; // BAD. SHOULDN'T HAPPEN
      usedDigits.add(digit);
      await message.react(utils.numberToEmoji(+digit));
    }
  });
};
