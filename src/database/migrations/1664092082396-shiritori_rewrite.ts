import { MigrationInterface, QueryRunner } from "typeorm";

// !!!!!! WARNING !!!!!!!!
// # THIS IS A BREAKING CHANGE
// # If migrating up and then back down:
//  - ShiritoriInflectionRoot table will be reset
//  - Word occurrences may be inaccurate

export class shiritoriRewrite1664092082396 implements MigrationInterface {
  name = "shiritoriRewrite1664092082396";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create KnownWord table
    await queryRunner.query(`
        CREATE TABLE "known_word" (
            "id" SERIAL NOT NULL,
            "text" character varying NOT NULL,
            "occurrences" integer NOT NULL DEFAULT '0',
            "valid" boolean,
            CONSTRAINT "UQ_39ff079d8f67c509acd8272f0af" UNIQUE ("text"),
            CONSTRAINT "PK_c2f3a6b7e82cadfa62832241867" PRIMARY KEY ("id")
        )
    `);

    // Insert into KnownWord table with values from old ShiritoriWord table, setting valid to null
    await queryRunner.query(`
        INSERT INTO "known_word" (text, occurrences)
        SELECT word, occurrences FROM "shiritori_word"
        ON CONFLICT (text)
        DO NOTHING
    `);

    // Upsert into KnownWord table with values from old ShiritoriInflectionRoot table, setting valid to true
    await queryRunner.query(`
        INSERT INTO "known_word" (text, occurrences, valid)
        SELECT word, '0', 'true' FROM "shiritori_inflection_root"
        ON CONFLICT (text)
        DO UPDATE SET
            valid = 'true'
    `);

    // Drop ShiritoriInflectionRoot table
    await queryRunner.query(`
        ALTER TABLE "shiritori_inflection_root" DROP CONSTRAINT "FK_e7fd3f8fdbadb96a261651014ce"
    `);
    await queryRunner.query(`
        DROP TABLE "shiritori_inflection_root"
    `);

    // Alter ShiritoriChannel table
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel"
        DROP CONSTRAINT "FK_07d843c719a3264ceeed905cba2"
    `);
    await queryRunner.query(`
        UPDATE "shiritori_channel" sc
        SET "lastWordId" = kw.id
        FROM "shiritori_word" sw, "known_word" kw
            WHERE sw."id" = sc."lastWordId"
            AND kw."text" = sw."word"
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel"
        ADD CONSTRAINT "FK_07d843c719a3264ceeed905cba2" FOREIGN KEY ("lastWordId") REFERENCES "known_word"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel"
        ADD "chainStartedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel"
        ALTER COLUMN "chainStartedAt"
        DROP DEFAULT
    `);

    // ShiritoriWord occurrences
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        DROP COLUMN "occurrences"
    `);

    // Create and fill chained boolean column
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ADD "chained" boolean
    `);
    await queryRunner.query(`
        UPDATE "shiritori_word"
        SET "chained" = "chainChannelId" IS NOT null
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ALTER COLUMN "chained" SET NOT NULL
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        DROP CONSTRAINT "FK_7a9025c4c4d76d76327829591ed"
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        DROP COLUMN "chainChannelId"
    `);

    // Link to KnownWord
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ADD "wordId" integer
    `);
    await queryRunner.query(`
        UPDATE "shiritori_word"
        SET "wordId" = subquery.id
        FROM (SELECT id, text FROM "known_word") AS subquery
        WHERE "word"=subquery.text
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ALTER COLUMN "wordId"
        SET NOT NULL
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ADD CONSTRAINT "FK_496b6563b2f5d4f27b4eda3fd71" FOREIGN KEY ("wordId") REFERENCES "known_word"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        DROP COLUMN "word"
    `);

    // Set ShiritoriWord channelId to not nullable
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ALTER COLUMN "channelId"
        SET NOT NULL
    `);

    // Create unique index on ShiritoriWord channel+word composite
    await queryRunner.query(`
        CREATE UNIQUE INDEX "IDX_aa697db71a8e4c933ecc86eda1" ON "shiritori_word" ("channelId", "wordId")
    `);

    // KnownWordInflections linking table
    await queryRunner.query(`
        CREATE TABLE "known_word_inflections" (
            "inflectionOf" integer NOT NULL,
            "inflection" integer NOT NULL,
            CONSTRAINT "PK_f9821cad50473965772f1d22fa9" PRIMARY KEY ("inflectionOf", "inflection")
        )
    `);
    await queryRunner.query(`
        CREATE INDEX "IDX_32d1f1b150c16b947cc30a9932" ON "known_word_inflections" ("inflectionOf")
    `);
    await queryRunner.query(`
        CREATE INDEX "IDX_af7e639d4650942f896109f887" ON "known_word_inflections" ("inflection")
    `);
    await queryRunner.query(`
        ALTER TABLE "known_word_inflections"
        ADD CONSTRAINT "FK_32d1f1b150c16b947cc30a99322" FOREIGN KEY ("inflectionOf") REFERENCES "known_word"("id") ON DELETE CASCADE ON UPDATE CASCADE
    `);
    await queryRunner.query(`
        ALTER TABLE "known_word_inflections"
        ADD CONSTRAINT "FK_af7e639d4650942f896109f887d" FOREIGN KEY ("inflection") REFERENCES "known_word"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // KnownWordInflections linking table
    await queryRunner.query(`
        ALTER TABLE "known_word_inflections" DROP CONSTRAINT "FK_af7e639d4650942f896109f887d"
    `);
    await queryRunner.query(`
        ALTER TABLE "known_word_inflections" DROP CONSTRAINT "FK_32d1f1b150c16b947cc30a99322"
    `);
    await queryRunner.query(`
        DROP INDEX "public"."IDX_af7e639d4650942f896109f887"
    `);
    await queryRunner.query(`
        DROP INDEX "public"."IDX_32d1f1b150c16b947cc30a9932"
    `);
    await queryRunner.query(`
        DROP TABLE "known_word_inflections"
    `);

    // Remove ShiritoriWord unique composite index
    await queryRunner.query(`
        DROP INDEX "public"."IDX_aa697db71a8e4c933ecc86eda1"
    `);

    // Set ShiritoriWord channelId to be nullable
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ALTER COLUMN "channelId"
        DROP NOT NULL
    `);

    // Unlink to KnownWord
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ADD "word" character varying
    `);
    await queryRunner.query(`
        UPDATE "shiritori_word"
        SET "word" = subquery.text
        FROM (select id, text FROM "known_word") as subquery
        WHERE "wordId"=subquery.id
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ALTER COLUMN "word" SET NOT NULL
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        DROP CONSTRAINT "FK_496b6563b2f5d4f27b4eda3fd71"
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        DROP COLUMN "wordId"
    `);

    // ShiritoriWord chained column
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ADD "chainChannelId" integer
    `);
    await queryRunner.query(`
        UPDATE "shiritori_word"
        SET "chainChannelId" = "channelId"
        WHERE "chained" = 'true'
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ADD CONSTRAINT "FK_7a9025c4c4d76d76327829591ed" FOREIGN KEY ("chainChannelId") REFERENCES "shiritori_channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        DROP COLUMN "chained"
    `);

    // ShiritoriWord occurrences
    await queryRunner.query(`
        ALTER TABLE "shiritori_word"
        ADD "occurrences" integer NOT NULL DEFAULT '0'
    `);
    await queryRunner.query(`
        UPDATE "shiritori_word" sw
        SET "occurrences" = kw."occurrences"
        FROM "known_word" kw
            WHERE kw."text" = sw."word"
    `);

    // Alter ShiritoriChannel table
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel"
        DROP CONSTRAINT "FK_07d843c719a3264ceeed905cba2"
    `);
    await queryRunner.query(`
        UPDATE "shiritori_channel" sc
        SET "lastWordId" = sw.id
        FROM "shiritori_word" sw, "known_word" kw
            WHERE kw."id" = sc."lastWordId"
            AND sw."word" = kw."text"
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel"
        ADD CONSTRAINT "FK_07d843c719a3264ceeed905cba2" FOREIGN KEY ("lastWordId") REFERENCES "shiritori_word"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_channel" DROP COLUMN "chainStartedAt"
    `);

    // Create ShiritoriInflectionRoot table
    await queryRunner.query(`
        CREATE TABLE "shiritori_inflection_root" (
            "id" SERIAL NOT NULL,
            "word" character varying NOT NULL,
            "occurrences" integer NOT NULL DEFAULT '0',
            "channelId" integer,
            CONSTRAINT "PK_0358feac9b974e09aa6df5d773d" PRIMARY KEY ("id")
        )
    `);
    await queryRunner.query(`
        ALTER TABLE "shiritori_inflection_root"
        ADD CONSTRAINT "FK_e7fd3f8fdbadb96a261651014ce" FOREIGN KEY ("channelId") REFERENCES "shiritori_channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    // Drop KnownWord table
    await queryRunner.query(`
        DROP TABLE "known_word"
    `);
  }
}
