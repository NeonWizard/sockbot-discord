import { Client } from "discord.js";
import { DataSource } from "typeorm";
import { Logger } from "winston";

import readyListener from "./listeners/ready";
import shiritoriListener from "./listeners/shiritori";

export class Bot {
  public readonly client: Client;
  public readonly logger: Logger;
  public readonly db: DataSource;

  constructor(client: Client, dbSource: DataSource, logger: Logger) {
    this.client = client;
    this.db = dbSource;
    this.logger = logger;

    // TODO: cmon man it's obvious
    readyListener(this);
    shiritoriListener(this);
  }

  public async initialize(): Promise<void> {
    this.logger.info("Initialized bot!");
  }
}
