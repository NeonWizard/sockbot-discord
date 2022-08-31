import { DataSource } from "typeorm";
import { join } from "path";
import { User } from "../entity/User";
import { ShiritoriChannel } from "../entity/ShiritoriChannel";
import { ShiritoriWord } from "../entity/ShiritoriWord";

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
