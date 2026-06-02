import { MigrationInterface, QueryRunner } from "typeorm";

export class DiscountClaim1780410854594 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE `discount_claims`");
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`discount_claims\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`discount_id\` CHAR(36) NOT NULL,
                \`user_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_discount_claims_discount_id\` (\`discount_id\`),
                INDEX \`IDX_discount_claims_user_id_discount_id\` (\`user_id\`, \`discount_id\`),
                CONSTRAINT \`FK_discount_claims_discount_id\` FOREIGN KEY (\`discount_id\`)
                    REFERENCES \`discounts\` (\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT,
                CONSTRAINT \`FK_discount_claims_user_id\` FOREIGN KEY (\`user_id\`)
                    REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }
}
