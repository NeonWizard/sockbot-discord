import { MigrationInterface, QueryRunner } from "typeorm";

export class shiritori1662143401928 implements MigrationInterface {
  name = "shiritori1662143401928";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "shiritori_word" (
                "id" SERIAL NOT NULL,
                "word" character varying NOT NULL,
                "occurrences" integer NOT NULL DEFAULT '0',
                "chainChannelId" integer,
                "channelId" integer,
                CONSTRAINT "PK_d4759d7b6999136b4dc6f0762ac" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "shiritori_channel" (
                "id" SERIAL NOT NULL,
                "channelID" character varying NOT NULL,
                "chainLength" integer NOT NULL DEFAULT '0',
                "lastUserId" integer,
                "lastWordId" integer,
                CONSTRAINT "REL_07d843c719a3264ceeed905cba" UNIQUE ("lastWordId"),
                CONSTRAINT "PK_a2c76a9f11948a66d4c2ac1d270" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word"
            ADD CONSTRAINT "FK_7a9025c4c4d76d76327829591ed" FOREIGN KEY ("chainChannelId") REFERENCES "shiritori_channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word"
            ADD CONSTRAINT "FK_fe2b27280e593fa78613aebaf3f" FOREIGN KEY ("channelId") REFERENCES "shiritori_channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_channel"
            ADD CONSTRAINT "FK_d042a74a20f69c4200bbce165a9" FOREIGN KEY ("lastUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_channel"
            ADD CONSTRAINT "FK_07d843c719a3264ceeed905cba2" FOREIGN KEY ("lastWordId") REFERENCES "shiritori_word"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "shiritori_channel" DROP CONSTRAINT "FK_07d843c719a3264ceeed905cba2"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_channel" DROP CONSTRAINT "FK_d042a74a20f69c4200bbce165a9"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word" DROP CONSTRAINT "FK_fe2b27280e593fa78613aebaf3f"
        `);
    await queryRunner.query(`
            ALTER TABLE "shiritori_word" DROP CONSTRAINT "FK_7a9025c4c4d76d76327829591ed"
        `);
    await queryRunner.query(`
            DROP TABLE "shiritori_channel"
        `);
    await queryRunner.query(`
            DROP TABLE "shiritori_word"
        `);
  }
}
