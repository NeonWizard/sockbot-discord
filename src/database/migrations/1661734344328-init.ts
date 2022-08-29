import { MigrationInterface, QueryRunner } from "typeorm";

export class init1661734344328 implements MigrationInterface {
    name = 'init1661734344328'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" SERIAL NOT NULL,
                "discordID" character varying NOT NULL,
                "sockpoints" integer NOT NULL DEFAULT '0',
                CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id")
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "user"
        `);
    }

}
