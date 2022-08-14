import { Client } from "discord.js";

import readyListener from "./listeners/ready";
import shiritoriListener from "./listeners/shiritori";

export class Bot {
  public readonly client: Client;
  // public readonly DB: TypeORM;

  constructor(client: Client) {
    this.client = client;

    readyListener(client);
    shiritoriListener(client);
  }

  public async initialize(): Promise<void> {
    console.log("Initialized bot!");
  }
}
