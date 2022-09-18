import { MigrationInterface, QueryRunner } from "typeorm";

export class lottery1663533867032 implements MigrationInterface {
  name = "lottery1663533867032";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "lottery_entry" (
                "id" SERIAL NOT NULL,
                "tickets" integer NOT NULL,
                "lotteryId" integer,
                "userId" integer,
                CONSTRAINT "REL_b94876f1d8f35b9e98daed664e" UNIQUE ("userId"),
                CONSTRAINT "PK_38f54be7b276bc9c1758be7930c" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "lottery" (
                "id" SERIAL NOT NULL,
                "startedAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone,
                "duration" integer NOT NULL,
                "ticketCost" integer NOT NULL DEFAULT '30',
                "winningUserId" integer,
                CONSTRAINT "REL_0d0b2509adf5b6371472c3f2c5" UNIQUE ("winningUserId"),
                CONSTRAINT "PK_3c80b07e70c62d855b3ebfdd3ce" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "lottery_entry"
            ADD CONSTRAINT "FK_fdb3bb741bc608a11ed6cc3ae82" FOREIGN KEY ("lotteryId") REFERENCES "lottery"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "lottery_entry"
            ADD CONSTRAINT "FK_b94876f1d8f35b9e98daed664e9" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "lottery"
            ADD CONSTRAINT "FK_0d0b2509adf5b6371472c3f2c50" FOREIGN KEY ("winningUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "lottery" DROP CONSTRAINT "FK_0d0b2509adf5b6371472c3f2c50"
        `);
    await queryRunner.query(`
            ALTER TABLE "lottery_entry" DROP CONSTRAINT "FK_b94876f1d8f35b9e98daed664e9"
        `);
    await queryRunner.query(`
            ALTER TABLE "lottery_entry" DROP CONSTRAINT "FK_fdb3bb741bc608a11ed6cc3ae82"
        `);
    await queryRunner.query(`
            DROP TABLE "lottery"
        `);
    await queryRunner.query(`
            DROP TABLE "lottery_entry"
        `);
  }
}
