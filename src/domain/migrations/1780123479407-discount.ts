import { MigrationInterface, QueryRunner } from "typeorm";

export class Discount1780123479407 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropDiscountRedemptionsTable(queryRunner);
        await this.dropDiscountTargetSpusTable(queryRunner);
        await this.dropDiscountsTable(queryRunner);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.createDiscountsTable(queryRunner);
        await this.createDiscountTargetSpusTable(queryRunner);
        await this.createDiscountRedemptionsTable(queryRunner);
    }

    private async createDiscountRedemptionsTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        // order_id is intentionally CHAR(36) NULL with no FK in this migration.
        // The future order module migration will ALTER TABLE to add the FK once
        // the orders table exists.
        await queryRunner.query(`
            CREATE TABLE \`discount_redemptions\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`discount_id\` CHAR(36) NOT NULL,
                \`order_id\` CHAR(36) NULL DEFAULT NULL,
                \`redeemed_amount\` DECIMAL(12, 2) NOT NULL,
                \`user_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_discount_redemptions_discount_id\` (\`discount_id\`),
                INDEX \`IDX_discount_redemptions_discount_id_user_id\` (\`discount_id\`, \`user_id\`),
                INDEX \`IDX_discount_redemptions_order_id\` (\`order_id\`),
                CONSTRAINT \`FK_discount_redemptions_discount_id\` FOREIGN KEY (\`discount_id\`)
                    REFERENCES \`discounts\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_discount_redemptions_user_id\` FOREIGN KEY (\`user_id\`)
                    REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createDiscountsTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`discounts\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`code\` VARCHAR(64) NULL DEFAULT NULL,
                \`description\` TEXT NULL DEFAULT NULL,
                \`discount_type\` ENUM('delivery','items') NOT NULL,
                \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
                \`max_discount_amount\` DECIMAL(12, 2) NULL DEFAULT NULL,
                \`max_uses\` INT NULL DEFAULT NULL,
                \`max_uses_per_user\` INT NULL DEFAULT NULL,
                \`name\` VARCHAR(255) NOT NULL,
                \`rules\` JSON NOT NULL,
                \`scope\` ENUM('global','shop') NOT NULL,
                \`shop_id\` CHAR(36) NULL DEFAULT NULL,
                \`used_count\` INT NOT NULL DEFAULT 0,
                \`valid_from\` TIMESTAMP NULL DEFAULT NULL,
                \`valid_until\` TIMESTAMP NULL DEFAULT NULL,
                \`value\` DECIMAL(12, 2) NOT NULL,
                \`value_type\` ENUM('fixed','percentage') NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_discounts_code\` (\`code\`),
                INDEX \`IDX_discounts_scope_discount_type_is_active\` (\`scope\`, \`discount_type\`, \`is_active\`),
                INDEX \`IDX_discounts_shop_id\` (\`shop_id\`),
                CONSTRAINT \`FK_discounts_shop_id\` FOREIGN KEY (\`shop_id\`)
                    REFERENCES \`shops\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createDiscountTargetSpusTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`discount_target_spus\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`discount_id\` CHAR(36) NOT NULL,
                \`spu_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_discount_target_spus_discount_id_spu_id\` (\`discount_id\`, \`spu_id\`),
                INDEX \`IDX_discount_target_spus_discount_id\` (\`discount_id\`),
                CONSTRAINT \`FK_discount_target_spus_discount_id\` FOREIGN KEY (\`discount_id\`)
                    REFERENCES \`discounts\` (\`id\`) ON DELETE CASCADE ON UPDATE RESTRICT,
                CONSTRAINT \`FK_discount_target_spus_spu_id\` FOREIGN KEY (\`spu_id\`)
                    REFERENCES \`spus\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async dropDiscountRedemptionsTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`DROP TABLE \`discount_redemptions\``);
    }

    private async dropDiscountsTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`discounts\``);
    }

    private async dropDiscountTargetSpusTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`DROP TABLE \`discount_target_spus\``);
    }
}
