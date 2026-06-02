import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductSoldStatistic1780409636755 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("ALTER TABLE `spus` DROP COLUMN `sold_count`");
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `spus` ADD COLUMN `sold_count` INT NOT NULL DEFAULT 0",
        );
    }
}
