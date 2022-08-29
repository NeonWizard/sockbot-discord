import { Client, Collection, CommandInteraction } from "discord.js";
import path from "node:path";
import * as fs from "node:fs/promises";
import { DataSource } from "typeorm";
import { Logger } from "winston";

import readyListener from "./listeners/ready";
import shiritoriListener from "./listeners/shiritori";
import commandsListener from "./listeners/commands";

// TODO: replace any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Commands = Collection<string, any>;

export class Bot {
  public readonly client: Client;
  public readonly logger: Logger;
  public readonly db: DataSource;
  public readonly commands: Commands;

  constructor(client: Client, dbSource: DataSource, logger: Logger) {
    this.client = client;
    this.db = dbSource;
    this.logger = logger;
    this.commands = new Collection();
  }

  public async initialize(): Promise<void> {
    await this.loadCommands();

    // TODO: cmon man it's obvious
    // hint: modularize
    readyListener(this);
    shiritoriListener(this);
    commandsListener(this);

    this.logger.info("Initialized bot!");
  }

  public async loadCommands(): Promise<void> {
    const commandsPath = path.join(__dirname, "commands");
    const commandFiles = await fs.readdir(commandsPath).then((files) => {
      return files.filter(
        (file) => file.endsWith(".ts") || file.endsWith(".js")
      );
    });

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = await import(filePath);
      this.commands.set(command.builder.name, command);
    }
  }
}
