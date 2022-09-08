import { MigrationInterface, QueryRunner } from "typeorm";

export class userhistory1662614540508 implements MigrationInterface {
  name = "userhistory1662614540508";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TYPE "public"."user_history_action_enum" AS ENUM(
                'pay',
                'doubleornothing_win',
                'doubleornothing_loss',
                'shiritori',
                'shiritori_fail'
            )
        `);
    await queryRunner.query(`
            CREATE TABLE "user_history" (
                "id" SERIAL NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT ('now'::text)::timestamp(6) with time zone,
                "action" "public"."user_history_action_enum" NOT NULL,
                "value1" integer,
                "value2" integer,
                "userId" integer,
                "targetUserId" integer,
                CONSTRAINT "PK_777252b9045d8011ab83c5b0834" PRIMARY KEY ("id")
            )
        `);
    await queryRunner.query(`
            ALTER TABLE "user_history"
            ADD CONSTRAINT "FK_1457ea6e3cbd29bf788292d0d15" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);
    await queryRunner.query(`
            ALTER TABLE "user_history"
            ADD CONSTRAINT "FK_bd5dc3721e35c530dddbd1e2181" FOREIGN KEY ("targetUserId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "user_history" DROP CONSTRAINT "FK_bd5dc3721e35c530dddbd1e2181"
        `);
    await queryRunner.query(`
            ALTER TABLE "user_history" DROP CONSTRAINT "FK_1457ea6e3cbd29bf788292d0d15"
        `);
    await queryRunner.query(`
            DROP TABLE "user_history"
        `);
    await queryRunner.query(`
            DROP TYPE "public"."user_history_action_enum"
        `);
  }
}
