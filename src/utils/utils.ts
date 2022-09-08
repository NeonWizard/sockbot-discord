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

// Checks Dictionary API to check if word is valid
export const checkWordValidity = async (word: string): Promise<boolean> => {
  const res = await fetch(
    `https://www.dictionaryapi.com/api/v3/references/collegiate/json/${word}?key=${process.env.DICTIONARY_API_KEY}`,
    {
      method: "get",
    }
  );
  const data = await res.json();
  for (const entry of data) {
    if (entry?.meta?.id) {
      return true;
    }
  }
  return false;
};
