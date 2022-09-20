import { User } from "../database/models/User";
import fetch from "node-fetch";

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

// Queries the Oxford Dictionaries API for inflections of the provided word.
// Returns an empty array if the word does not exist.
export const getWordInflections = async (word: string): Promise<string[]> => {
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

  return [...new Set(inflections)];
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

export const factorial = (x: number) => {
  let result = 1;
  for (let nn = 1; nn <= x; ++nn) {
    result *= nn;
  }
  return result;
};
