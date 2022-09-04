import { CommandInteraction, SlashCommandBuilder } from "discord.js";

import { DoubleOrNothingCommand } from "./doubleornothing";
import { PayCommand } from "./pay";
import { PingCommand } from "./ping";
import { PointsCommand } from "./points";

// TODO: Move to interfaces/ folder
export interface BotCommand {
  builder: Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute(interaction: CommandInteraction): Promise<void>;
}

export const commands = [
  DoubleOrNothingCommand,
  PayCommand,
  PingCommand,
  PointsCommand,
];
