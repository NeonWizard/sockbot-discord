import { User } from "../database/models/User";
import fetch from "node-fetch";
import * as Canvas from "canvas";
import path from "path";
import { KnownWord } from "../database/models/KnownWord";
import { VerboseTicket } from "../interfaces/tickets";
import { LotteryTicket } from "../database/models/LotteryTicket";

// Fetches a user, or creates a new one if doesn't exist
export const fetchCreateUser = async (discordID: string) => {
  let user = await User.findOneBy({ discordID: discordID });
  if (user === null) {
    user = new User();
    user.discordID = discordID;
    user.sockpoints = 0;
    await user.save();
  }

  return user;
};

// Fetches a known word, or creates a new one if doesn't exist
export const fetchCreateWord = async (word: string) => {
  let wordEnt = await KnownWord.findOne({
    where: { text: word },
    relations: { inflections: true, inflectionOf: true },
  });
  if (wordEnt === null) {
    wordEnt = new KnownWord();
    wordEnt.text = word;
    wordEnt.occurrences = 0;
    wordEnt.inflections = [];
    wordEnt.inflectionOf = [];
    wordEnt.valid = null;
    await wordEnt.save();
  }

  return wordEnt;
};

// Converts digits in a number to their emoji representation
export const numberToEmoji = (number: number) => {
  return number
    .toString()
    .replace(/0/g, "0️⃣")
    .replace(/1/g, "1️⃣")
    .replace(/2/g, "2️⃣")
    .replace(/3/g, "3️⃣")
    .replace(/4/g, "4️⃣")
    .replace(/5/g, "5️⃣")
    .replace(/6/g, "6️⃣")
    .replace(/7/g, "7️⃣")
    .replace(/8/g, "8️⃣")
    .replace(/9/g, "9️⃣");
};

// TODO: Have this insert word and inflections into database and return Word entities
// Queries the Oxford Dictionaries API for inflections of the provided word.
// Returns an empty array if the word does not exist.
export const getWordInflectionRoots = async (word: string): Promise<string[]> => {
  const APP_ID = process.env.DICTIONARY_APP_ID!;
  const APP_KEY = process.env.DICTIONARY_APP_KEY!;

  const res = await fetch(`https://od-api.oxforddictionaries.com/api/v2/lemmas/en/${word}`, {
    headers: { app_id: APP_ID, app_key: APP_KEY },
  });

  const data = await res.json();

  const inflections = [];
  for (const lexicalEntry of data.results?.[0].lexicalEntries ?? []) {
    for (const inflectionOf of lexicalEntry.inflectionOf) {
      inflections.push(inflectionOf.text.toLowerCase());
    }
  }

  const deduplicatedInflections = [...new Set(inflections)];
  const wordsOnly = deduplicatedInflections
    .map((inflection) => inflection.normalize("NFD").replace(/[\u0300-\u036f]/g, "")) // remove accents/diacritics
    .filter((inflection) => /[a-zA-Z]/.test(inflection)); // limit to alphabetic only

  return wordsOnly;
};

// Pass in an object like { a: 10, b: 4, c: 400 } and it'll return either "a", "b", or "c", factoring in their respective
// weight. So in this example, "c" is likely to be returned 400 times out of 414
export const getRandomWeightedValue = (options: { [key: string]: number }) => {
  const keys = Object.keys(options);
  const totalSum = keys.reduce((acc, item) => acc + options[item], 0);

  let runningTotal = 0;
  const cumulativeValues = keys.map((key) => {
    const relativeValue = options[key] / totalSum;
    const cv = {
      key,
      value: relativeValue + runningTotal,
    };
    runningTotal += relativeValue;
    return cv;
  });

  const r = Math.random();
  return cumulativeValues.find(({ value }) => r <= value)!.key;
};

// Generates the factorial of a number
export const factorial = (x: number) => {
  let result = 1;
  for (let nn = 1; nn <= x; ++nn) {
    result *= nn;
  }
  return result;
};

export const generateLotteryImage = async (latestNumber: number, previousNumbers: number[]) => {
  Canvas.registerFont(path.join(__dirname, "../static/fonts/nk57-monospace-no-lt.ttf"), {
    family: "nk57-lt",
  });

  const canvas = Canvas.createCanvas(498, 393);
  const ctx = canvas.getContext("2d");

  const img = await Canvas.loadImage(
    path.join(__dirname, "../static/images", "lottery pointing.png")
  );

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  ctx.font = "68px nk57-lt";
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "red";
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.shadowBlur = 7;
  ctx.fillText(latestNumber.toString(), 211, 85);

  ctx.font = "33px nk57";
  ctx.shadowColor = "white";
  ctx.shadowBlur = 2;
  previousNumbers.forEach((previousNumber, index) => {
    ctx.fillText(
      previousNumber.toString(),
      198 + (index % 3) * 65,
      268 + Math.floor(index / 3) * 65
    );
  });

  return canvas.toBuffer("image/png");
};

// Generates an array of unique random values between min (inclusive) and max (exclusive)
export const generateUniqueRandomArray = (min: number, max: number, length: number) => {
  const arr: number[] = [];
  while (arr.length < length) {
    const r = Math.floor(Math.random() * (max - min) + min);
    if (!arr.includes(r)) arr.push(r);
  }
  return arr;
};

// Creates a VerboseTicket from a LotteryTicket database entity
export const createVerboseTicket = (
  ticket: LotteryTicket,
  winningNumbers: Set<number>
): VerboseTicket => {
  const verboseNumbers = ticket.numbers.map((number) => ({
    number,
    matched: winningNumbers.has(number),
  }));

  return {
    matches: verboseNumbers.reduce((acc, cur) => acc + +cur.matched, 0),
    numbers: verboseNumbers,
    stringLine: verboseNumbers
      .map((vNum) => {
        const numString = vNum.number.toString().padStart(2);
        return vNum.matched ? `[${numString}]` : ` ${numString} `;
      })
      .join(" "),
    ticket: ticket,
  };
};

// Creates an array of VerboseTickets from an array of LotteryTicket database entities
export const createVerboseTickets = (
  tickets: LotteryTicket[],
  winningNumbers: Set<number>
): VerboseTicket[] => {
  return tickets.map((ticket) => createVerboseTicket(ticket, winningNumbers));
};
