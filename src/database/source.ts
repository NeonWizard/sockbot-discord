import { DataSource } from "typeorm";
import { join } from "path";

import * as dotenv from "dotenv";
dotenv.config();

if (process.env.DB_USER == null || process.env.DB_PASSWORD == null) {
  throw new Error("'DB_USER' and 'DB_PASSWORD' environment variables must be set.");
}

export const PSQLSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432", 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || "sockbot",
  synchronize: false,
  logging: false,
  entities: [join(__dirname, "**/models/*.{ts,js}")],
  migrations: [join(__dirname, "**/migrations/*.{ts,js}")],
  migrationsRun: true,
  subscribers: [],
});
