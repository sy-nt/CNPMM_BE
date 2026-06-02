import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductTextIndex1780389819857 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `spus` DROP INDEX `IDX_spus_name_description_fulltext`",
        );
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            "ALTER TABLE `spus` ADD FULLTEXT INDEX `IDX_spus_name_description_fulltext` (`name`, `description`)",
        );
    }
}
