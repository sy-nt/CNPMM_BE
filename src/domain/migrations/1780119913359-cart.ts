import { MigrationInterface, QueryRunner } from "typeorm";

export class Cart1780119913359 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropCartItemsTable(queryRunner);
        await this.dropCartsTable(queryRunner);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.createCartsTable(queryRunner);
        await this.createCartItemsTable(queryRunner);
    }

    private async createCartItemsTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`cart_items\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`cart_id\` CHAR(36) NOT NULL,
                \`quantity\` INT NOT NULL DEFAULT 1,
                \`sku_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_cart_items_cart_id_sku_id\` (\`cart_id\`, \`sku_id\`),
                INDEX \`IDX_cart_items_cart_id\` (\`cart_id\`),
                CONSTRAINT \`FK_cart_items_cart_id\` FOREIGN KEY (\`cart_id\`)
                    REFERENCES \`carts\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_cart_items_sku_id\` FOREIGN KEY (\`sku_id\`)
                    REFERENCES \`skus\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createCartsTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`carts\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`user_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_carts_user_id\` (\`user_id\`),
                CONSTRAINT \`FK_carts_user_id\` FOREIGN KEY (\`user_id\`)
                    REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async dropCartItemsTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`cart_items\``);
    }

    private async dropCartsTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`carts\``);
    }
}
