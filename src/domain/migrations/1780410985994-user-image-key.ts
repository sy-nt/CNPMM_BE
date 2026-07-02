import { MigrationInterface, QueryRunner } from "typeorm";

export class UserImageKey1780410985994 implements MigrationInterface {
    name = "UserImageKey1780410985994";

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`users\`
            CHANGE COLUMN \`image_key\` \`image_url\` VARCHAR(255) NULL DEFAULT NULL
        `);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`users\`
            CHANGE COLUMN \`image_url\` \`image_key\` VARCHAR(255) NULL DEFAULT NULL
        `);
    }
}
