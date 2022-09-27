import { MigrationInterface, QueryRunner } from "typeorm";

export class guild1664314095439 implements MigrationInterface {
  name = "guild1664314095439";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        CREATE TABLE "guild" (
            "id" SERIAL NOT NULL,
            "guildID" character varying NOT NULL,
            "shiritoriChannelId" integer,
            "lotteryId" integer,
            CONSTRAINT "REL_87821d4bd52dabae949b2f4d84" UNIQUE ("shiritoriChannelId"),
            CONSTRAINT "REL_6370296736ca41a2d6029fff20" UNIQUE ("lotteryId"),
            CONSTRAINT "PK_cfbbd0a2805cab7053b516068a3" PRIMARY KEY ("id")
        )
    `);
    await queryRunner.query(`
        ALTER TABLE "guild"
        ADD CONSTRAINT "FK_87821d4bd52dabae949b2f4d846" FOREIGN KEY ("shiritoriChannelId") REFERENCES "shiritori_channel"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
        ALTER TABLE "guild"
        ADD CONSTRAINT "FK_6370296736ca41a2d6029fff200" FOREIGN KEY ("lotteryId") REFERENCES "lottery"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "guild" DROP CONSTRAINT "FK_6370296736ca41a2d6029fff200"
    `);
    await queryRunner.query(`
        ALTER TABLE "guild" DROP CONSTRAINT "FK_87821d4bd52dabae949b2f4d846"
    `);
    await queryRunner.query(`
        DROP TABLE "guild"
    `);
  }
}
