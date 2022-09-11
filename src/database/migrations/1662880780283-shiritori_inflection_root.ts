import { MigrationInterface, QueryRunner } from "typeorm";

export class shiritoriInflectionRoot1662880780283 implements MigrationInterface {
  name = "shiritoriInflectionRoot1662880780283";

  public async up(queryRunner: QueryRunner): Promise<void> {
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "shiritori_inflection_root" DROP CONSTRAINT "FK_e7fd3f8fdbadb96a261651014ce"
        `);
    await queryRunner.query(`
            DROP TABLE "shiritori_inflection_root"
        `);
  }
}
