import { Client, Collection } from "discord.js";
import * as fs from "node:fs/promises";
import path from "path";
import { DataSource } from "typeorm";
import { Logger } from "winston";

import { commands } from "./commands";
import { BotCommand } from "./interfaces";
import { VERSION } from "./version";

export class Bot {
  public readonly client: Client;
  public readonly logger: Logger;
  public readonly db: DataSource;
  public readonly commands: Collection<string, BotCommand>;

  constructor(client: Client, dbSource: DataSource, logger: Logger) {
    this.client = client;
    this.db = dbSource;
    this.logger = logger;
    this.commands = new Collection();
  }

  public async initialize(): Promise<void> {
    await this.loadModules();
    await this.loadCommands();
    await this.setVersionStatus();

    this.logger.info("Initialized bot!");
  }

  public async loadModules(): Promise<void> {
    this.logger.info("Loading modules...");
    const modulesPath = path.join(__dirname, "modules");
    const moduleFiles = await fs.readdir(modulesPath).then((files) => {
      return files.filter((file) => file.endsWith(".ts") || file.endsWith(".js"));
    });

    for (const file of moduleFiles) {
      const filePath = path.join(modulesPath, file);
      const module = await import(filePath);
      module.default(this);
    }
  }

  public async loadCommands(): Promise<void> {
    this.logger.info("Loading commands...");
    for (const command of commands) {
      this.commands.set(command.builder.name, command);
    }
  }

  public async setVersionStatus(): Promise<void> {
    this.client.user?.setPresence({
      activities: [{ name: `v${VERSION}` }],
    });
  }
}
