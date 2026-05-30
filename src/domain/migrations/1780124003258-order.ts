import { MigrationInterface, QueryRunner } from "typeorm";

export class Order1780124003258 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.detachDiscountRedemptionsOrderFK(queryRunner);
        await this.detachDeliveriesOrderFK(queryRunner);
        await this.dropOrderItemsTable(queryRunner);
        await this.dropOrdersTable(queryRunner);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.createOrdersTable(queryRunner);
        await this.attachOrdersForeignKeys(queryRunner);
        await this.createOrderItemsTable(queryRunner);
        await this.attachDeliveriesOrderFK(queryRunner);
        await this.attachDiscountRedemptionsOrderFK(queryRunner);
    }

    private async attachDeliveriesOrderFK(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`deliveries\`
                ADD CONSTRAINT \`FK_deliveries_order_id\` FOREIGN KEY (\`order_id\`)
                    REFERENCES \`orders\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
        `);
    }

    private async attachDiscountRedemptionsOrderFK(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`discount_redemptions\`
                ADD CONSTRAINT \`FK_discount_redemptions_order_id\` FOREIGN KEY (\`order_id\`)
                    REFERENCES \`orders\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
        `);
    }

    private async attachOrdersForeignKeys(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`orders\`
                ADD CONSTRAINT \`FK_orders_cancelled_by_user_id\` FOREIGN KEY (\`cancelled_by_user_id\`)
                    REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                ADD CONSTRAINT \`FK_orders_delivery_discount_id\` FOREIGN KEY (\`delivery_discount_id\`)
                    REFERENCES \`discounts\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                ADD CONSTRAINT \`FK_orders_delivery_id\` FOREIGN KEY (\`delivery_id\`)
                    REFERENCES \`deliveries\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                ADD CONSTRAINT \`FK_orders_destination_address_id\` FOREIGN KEY (\`destination_address_id\`)
                    REFERENCES \`addresses\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                ADD CONSTRAINT \`FK_orders_items_discount_id\` FOREIGN KEY (\`items_discount_id\`)
                    REFERENCES \`discounts\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                ADD CONSTRAINT \`FK_orders_shop_id\` FOREIGN KEY (\`shop_id\`)
                    REFERENCES \`shops\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                ADD CONSTRAINT \`FK_orders_user_id\` FOREIGN KEY (\`user_id\`)
                    REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
        `);
    }

    private async createOrderItemsTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`order_items\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`image_key_snapshot\` VARCHAR(255) NULL DEFAULT NULL,
                \`name_snapshot\` VARCHAR(255) NOT NULL,
                \`order_id\` CHAR(36) NOT NULL,
                \`quantity\` INT NOT NULL,
                \`sku_id\` CHAR(36) NOT NULL,
                \`spu_id_snapshot\` CHAR(36) NOT NULL,
                \`subtotal\` DECIMAL(12, 2) NOT NULL,
                \`unit_price_snapshot\` DECIMAL(12, 2) NOT NULL,
                \`warehouse_allocation\` JSON NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_order_items_order_id_sku_id\` (\`order_id\`, \`sku_id\`),
                INDEX \`IDX_order_items_order_id\` (\`order_id\`),
                INDEX \`IDX_order_items_sku_id\` (\`sku_id\`),
                CONSTRAINT \`FK_order_items_order_id\` FOREIGN KEY (\`order_id\`)
                    REFERENCES \`orders\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_order_items_sku_id\` FOREIGN KEY (\`sku_id\`)
                    REFERENCES \`skus\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createOrdersTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`orders\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`cancellation_reason\` VARCHAR(255) NULL DEFAULT NULL,
                \`cancelled_at\` TIMESTAMP NULL DEFAULT NULL,
                \`cancelled_by_role_name\` VARCHAR(64) NULL DEFAULT NULL,
                \`cancelled_by_user_id\` CHAR(36) NULL DEFAULT NULL,
                \`completed_at\` TIMESTAMP NULL DEFAULT NULL,
                \`confirmed_at\` TIMESTAMP NULL DEFAULT NULL,
                \`delivered_at\` TIMESTAMP NULL DEFAULT NULL,
                \`delivery_discount_amount\` DECIMAL(12, 2) NOT NULL DEFAULT '0.00',
                \`delivery_discount_id\` CHAR(36) NULL DEFAULT NULL,
                \`delivery_fee\` DECIMAL(12, 2) NOT NULL,
                \`delivery_id\` CHAR(36) NULL DEFAULT NULL,
                \`destination_address_id\` CHAR(36) NOT NULL,
                \`destination_address_snapshot\` JSON NOT NULL,
                \`items_discount_amount\` DECIMAL(12, 2) NOT NULL DEFAULT '0.00',
                \`items_discount_id\` CHAR(36) NULL DEFAULT NULL,
                \`items_subtotal\` DECIMAL(12, 2) NOT NULL,
                \`payment_method\` ENUM('cod') NOT NULL DEFAULT 'cod',
                \`payment_status\` ENUM('paid','unpaid') NOT NULL DEFAULT 'unpaid',
                \`processing_at\` TIMESTAMP NULL DEFAULT NULL,
                \`shipped_at\` TIMESTAMP NULL DEFAULT NULL,
                \`shop_id\` CHAR(36) NOT NULL,
                \`status\` ENUM('cancelled','completed','confirmed','delivered','pending','processing','shipped') NOT NULL DEFAULT 'pending',
                \`total_amount\` DECIMAL(12, 2) NOT NULL,
                \`user_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_orders_shop_id\` (\`shop_id\`),
                INDEX \`IDX_orders_status\` (\`status\`),
                INDEX \`IDX_orders_user_id\` (\`user_id\`)
            ) ENGINE=InnoDB
        `);
    }

    private async detachDeliveriesOrderFK(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`deliveries\` DROP FOREIGN KEY \`FK_deliveries_order_id\`
        `);
    }

    private async detachDiscountRedemptionsOrderFK(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`discount_redemptions\` DROP FOREIGN KEY \`FK_discount_redemptions_order_id\`
        `);
    }

    private async dropOrderItemsTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`order_items\``);
    }

    private async dropOrdersTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`orders\``);
    }
}
