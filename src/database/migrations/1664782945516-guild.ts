import { MigrationInterface, QueryRunner } from "typeorm";

export class guild1664782945516 implements MigrationInterface {
  name = "guild1664782945516";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create guild table
    await queryRunner.query(`
        CREATE TABLE "guild" (
            "id" SERIAL NOT NULL,
            "guildID" character varying NOT NULL,
            CONSTRAINT "PK_cfbbd0a2805cab7053b516068a3" PRIMARY KEY ("id")
        )
    `);

    // Insert first default guild
    await queryRunner.query(`
        INSERT INTO "guild" ("guildID")
        VALUES ('821493290192601138')
    `);

    // Add guild edge to lottery
    await queryRunner.query(`
        ALTER TABLE "lottery"
        ADD "guildId" integer
    `);

    // Set lottery guild edge to default guild
    await queryRunner.query(`
        UPDATE "lottery"
        SET "guildId" = (
            SELECT id
            FROM "guild"
            ORDER BY id ASC
            LIMIT 1
        )
    `);

    // Restrict lottery guild edge to non-nullable and unique
    await queryRunner.query(`
        ALTER TABLE "lottery"
        ALTER COLUMN "guildId" SET NOT NULL
    `);
    await queryRunner.query(`
        ALTER TABLE "lottery"
        ADD CONSTRAINT "UQ_29a801e0dc3def91d8e1b468862" UNIQUE ("guildId")
    `);

    // Add guild edge to shiritori channel
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel"
        ADD "guildId" integer
    `);

    // Set shiritori channel guild edge to default guild
    await queryRunner.query(`
        UPDATE "shiritori_channel"
        SET "guildId" = (
            SELECT id
            FROM "guild"
            ORDER BY id ASC
            LIMIT 1
        )
    `);

    // Restrict shiritori channel guild edge to non-nullable
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel"
        ALTER COLUMN "guildId" SET NOT NULL
    `);

    // Create foreign keys
    await queryRunner.query(`
        ALTER TABLE "lottery"
        ADD CONSTRAINT "FK_29a801e0dc3def91d8e1b468862" FOREIGN KEY ("guildId") REFERENCES "guild"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel"
        ADD CONSTRAINT "FK_0f46fa1e8eb4c3f28cdfcb1ac87" FOREIGN KEY ("guildId") REFERENCES "guild"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel" DROP CONSTRAINT "FK_0f46fa1e8eb4c3f28cdfcb1ac87"
    `);
    await queryRunner.query(`
        ALTER TABLE "lottery" DROP CONSTRAINT "FK_29a801e0dc3def91d8e1b468862"
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel" DROP COLUMN "guildId"
    `);
    await queryRunner.query(`
        ALTER TABLE "lottery" DROP CONSTRAINT "UQ_29a801e0dc3def91d8e1b468862"
    `);
    await queryRunner.query(`
        ALTER TABLE "lottery" DROP COLUMN "guildId"
    `);
    await queryRunner.query(`
        DROP TABLE "guild"
    `);
  }
}
