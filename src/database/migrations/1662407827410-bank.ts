import { MigrationInterface, QueryRunner } from "typeorm";

export class bank1662407827410 implements MigrationInterface {
  name = "bank1662407827410";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "user"
            ADD "bankBalance" integer NOT NULL DEFAULT '0'
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Transfer bank funds back into wallet
    await queryRunner.query(`UPDATE "user" SET "sockpoints"="sockpoints"+"bankBalance"`);

    // Delete bank column
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bankBalance"`);
  }
}
