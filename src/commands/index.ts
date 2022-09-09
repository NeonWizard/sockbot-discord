import {
  CommandInteraction,
  SlashCommandBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

import { BankCommand } from "./bank";
import { DoubleOrNothingCommand } from "./doubleornothing";
import { PayCommand } from "./pay";
import { PingCommand } from "./ping";
import { PointsCommand } from "./points";
import { LeaderboardCommand } from "./leaderboard";

// TODO: Move to interfaces/ folder
export interface BotCommand {
  builder:
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">
    | SlashCommandSubcommandsOnlyBuilder;
  execute(interaction: CommandInteraction): Promise<void>;
}

export const commands = [
  BankCommand,
  DoubleOrNothingCommand,
  LeaderboardCommand,
  PayCommand,
  PingCommand,
  PointsCommand,
];
