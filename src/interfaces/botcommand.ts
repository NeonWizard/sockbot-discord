import { CommandInteraction } from "discord.js";
import { Bot } from "../bot";

export interface BotCommand {
  builder: { name: string; toJSON(): unknown };
  execute(bot: Bot, interaction: CommandInteraction): Promise<void>;
}
