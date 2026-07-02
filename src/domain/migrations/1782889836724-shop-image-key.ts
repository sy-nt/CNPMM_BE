import { MigrationInterface, QueryRunner } from "typeorm";

export class ShopImageKey1782889836724 implements MigrationInterface {
    name = "ShopImageKey1782889836724";

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`shops\`
            DROP COLUMN \`image_key\`
        `);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`shops\`
            ADD \`image_key\` VARCHAR(255) NULL
        `);
    }
}
