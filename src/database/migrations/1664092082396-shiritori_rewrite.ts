import { MigrationInterface, QueryRunner } from "typeorm";

export class shiritoriRewrite1664092082396 implements MigrationInterface {
  name = "shiritoriRewrite1664092082396";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "shiritori_word" DROP CONSTRAINT "FK_7a9025c4c4d76d76327829591ed"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_channel" DROP CONSTRAINT "FK_07d843c719a3264ceeed905cba2"
        `);
    await queryRunner.query(`
            CREATE TABLE "known_word" (
                "id" SERIAL NOT NULL,
                "text" character varying NOT NULL,
                "occurrences" integer NOT NULL DEFAULT '0',
                "valid" boolean,
                "inflectionRootId" integer,
                CONSTRAINT "UQ_39ff079d8f67c509acd8272f0af" UNIQUE ("text"),
                CONSTRAINT "PK_c2f3a6b7e82cadfa62832241867" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word" DROP COLUMN "word"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word" DROP COLUMN "occurrences"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word" DROP COLUMN "chainChannelId"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word"
            ADD "chained" boolean NOT NULL
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word"
            ADD "wordId" integer
        `);
    await queryRunner.query(`
            ALTER TABLE "known_word"
            ADD CONSTRAINT "FK_8c3bf20faf323e80e098b04a8ee" FOREIGN KEY ("inflectionRootId") REFERENCES "known_word"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word"
            ADD CONSTRAINT "FK_496b6563b2f5d4f27b4eda3fd71" FOREIGN KEY ("wordId") REFERENCES "known_word"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_channel"
            ADD CONSTRAINT "FK_07d843c719a3264ceeed905cba2" FOREIGN KEY ("lastWordId") REFERENCES "known_word"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "shiritori_channel" DROP CONSTRAINT "FK_07d843c719a3264ceeed905cba2"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word" DROP CONSTRAINT "FK_496b6563b2f5d4f27b4eda3fd71"
        `);
    await queryRunner.query(`
            ALTER TABLE "known_word" DROP CONSTRAINT "FK_8c3bf20faf323e80e098b04a8ee"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word" DROP COLUMN "wordId"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word" DROP COLUMN "chained"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word"
            ADD "chainChannelId" integer
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word"
            ADD "occurrences" integer NOT NULL DEFAULT '0'
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word"
            ADD "word" character varying NOT NULL
        `);
    await queryRunner.query(`
            DROP TABLE "known_word"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_channel"
            ADD CONSTRAINT "FK_07d843c719a3264ceeed905cba2" FOREIGN KEY ("lastWordId") REFERENCES "shiritori_word"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word"
            ADD CONSTRAINT "FK_7a9025c4c4d76d76327829591ed" FOREIGN KEY ("chainChannelId") REFERENCES "shiritori_channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }
}
