import { MigrationInterface, QueryRunner } from "typeorm";

export class lottery1663743879585 implements MigrationInterface {
  name = "lottery1663743879585";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "lottery_ticket" (
                "id" SERIAL NOT NULL,
                "numbers" text NOT NULL,
                "lotteryId" integer,
                "userId" integer,
                CONSTRAINT "PK_282de3df454e6ead46b50be1b7f" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_98c05d7ce8d86ef1f7e04354f1" ON "lottery_ticket" ("lotteryId")
        `);
    await queryRunner.query(`
            CREATE INDEX "IDX_dc55ccd1030f56db52b41d40cd" ON "lottery_ticket" ("userId")
        `);
    await queryRunner.query(`
            CREATE TABLE "lottery" (
                "id" SERIAL NOT NULL,
                "channelID" character varying NOT NULL,
                "startedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone,
                "winningNumbers" text NOT NULL,
                CONSTRAINT "PK_3c80b07e70c62d855b3ebfdd3ce" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "lottery_ticket"
            ADD CONSTRAINT "FK_98c05d7ce8d86ef1f7e04354f1f" FOREIGN KEY ("lotteryId") REFERENCES "lottery"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "lottery_ticket"
            ADD CONSTRAINT "FK_dc55ccd1030f56db52b41d40cd8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "lottery_ticket" DROP CONSTRAINT "FK_dc55ccd1030f56db52b41d40cd8"
        `);
    await queryRunner.query(`
            ALTER TABLE "lottery_ticket" DROP CONSTRAINT "FK_98c05d7ce8d86ef1f7e04354f1f"
        `);
    await queryRunner.query(`
            DROP TABLE "lottery"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_dc55ccd1030f56db52b41d40cd"
        `);
    await queryRunner.query(`
            DROP INDEX "public"."IDX_98c05d7ce8d86ef1f7e04354f1"
        `);
    await queryRunner.query(`
            DROP TABLE "lottery_ticket"
        `);
  }
}
