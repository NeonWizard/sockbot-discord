import { DataSource } from "typeorm";
import { join } from "path";
import { User } from "./models/User";
import { ShiritoriChannel } from "./models/ShiritoriChannel";
import { ShiritoriWord } from "./models/ShiritoriWord";

if (process.env.DB_USER == null || process.env.DB_PASSWORD == null) {
  throw new Error(
    "'DB_USER' and 'DB_PASSWORD' environment variables must be set."
  );
}

export const PSQLSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: "sockbot",
  synchronize: false,
  logging: false,
  entities: [User, ShiritoriChannel, ShiritoriWord],
  migrations: [join(__dirname, "**/migrations/*.{ts,js}")],
  migrationsRun: true,
  subscribers: [],
});
