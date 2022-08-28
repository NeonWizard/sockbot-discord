import { User } from "../entity/User";

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
