import { User } from "../entity/User";
import { DataSource } from "typeorm";

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
  synchronize: true,
  logging: false,
  entities: [User],
  migrations: [],
  subscribers: [],
});
