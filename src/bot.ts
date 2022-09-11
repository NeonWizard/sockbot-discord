import { Client, Collection } from "discord.js";
import { DataSource } from "typeorm";
import { Logger } from "winston";

import readyListener from "./listeners/ready";
import shiritoriListener from "./listeners/shiritori";
import commandsListener from "./listeners/commands";
import bankListener from "./listeners/bank";

import { BotCommand, commands } from "./commands";

import { VERSION } from "./version";

export class Bot {
  public readonly client: Client;
  public readonly logger: Logger;
  public readonly db: DataSource;
  public readonly commands: Collection<string, BotCommand>;
  // public readonly version: string = "v1.0.0-alpha.2";

  constructor(client: Client, dbSource: DataSource, logger: Logger) {
    this.client = client;
    this.db = dbSource;
    this.logger = logger;
    this.commands = new Collection();
  }

  public async initialize(): Promise<void> {
    await this.loadCommands();
    await this.setVersionStatus();

    // TODO: cmon man it's obvious
    // hint: modularize
    readyListener(this);
    shiritoriListener(this);
    commandsListener(this);
    bankListener(this);

    this.logger.info("Initialized bot!");
  }

  public async loadCommands(): Promise<void> {
    for (const command of commands) {
      this.commands.set(command.builder.name, command);
    }
  }

  public async setVersionStatus(): Promise<void> {
    this.client.user?.setPresence({
      activities: [{ name: `v${VERSION}` }],
    });
    process.env.npm_package_version;
  }
}
