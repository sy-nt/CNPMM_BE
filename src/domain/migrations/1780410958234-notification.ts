import { MigrationInterface, QueryRunner } from "typeorm";

export class Notification1780410958234 implements MigrationInterface {
    name = "Notification1780410958234";
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`notifications\``);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`notifications\` (
                \`id\` char(36) NOT NULL,
                \`user_id\` char(36) NOT NULL,
                \`type\` varchar(64) NOT NULL,
                \`title\` varchar(255) NOT NULL,
                \`body\` text NOT NULL,
                \`data\` json NOT NULL,
                \`read_at\` timestamp NULL,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                \`deleted_at\` timestamp(6) NULL,
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_notifications_user_id\` (\`user_id\`),
                INDEX \`IDX_notifications_user_id_read_at\` (\`user_id\`, \`read_at\`),
                CONSTRAINT \`FK_notifications_user_id\` FOREIGN KEY (\`user_id\`)
                    REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }
}
