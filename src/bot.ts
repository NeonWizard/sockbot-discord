import { Client } from "discord.js";
import { Logger } from "winston";

import readyListener from "./listeners/ready";
import shiritoriListener from "./listeners/shiritori";

export class Bot {
  public readonly client: Client;
  public readonly logger: Logger;
  // public readonly DB: TypeORM;

  constructor(client: Client, logger: Logger) {
    this.client = client;
    this.logger = logger;

    // TODO: cmon man it's obvious
    readyListener(this);
    shiritoriListener(this);
  }

  public async initialize(): Promise<void> {
    this.logger.info("Initialized bot!");
  }
}
