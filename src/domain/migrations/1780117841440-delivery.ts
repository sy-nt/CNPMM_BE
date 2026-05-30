import { MigrationInterface, QueryRunner } from "typeorm";

export class Delivery1780117841440 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropDeliveriesTable(queryRunner);
        await this.dropDeliveryZoneRatesTable(queryRunner);
        await this.dropDeliveryZonesTable(queryRunner);
        await this.dropDeliveryMethodsTable(queryRunner);
        await this.removeAddressCoordinates(queryRunner);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.addAddressCoordinates(queryRunner);
        await this.createDeliveryMethodsTable(queryRunner);
        await this.createDeliveryZonesTable(queryRunner);
        await this.createDeliveryZoneRatesTable(queryRunner);
        await this.createDeliveriesTable(queryRunner);
    }

    private async addAddressCoordinates(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`addresses\`
                ADD COLUMN \`latitude\` DECIMAL(10, 7) NULL DEFAULT NULL,
                ADD COLUMN \`longitude\` DECIMAL(10, 7) NULL DEFAULT NULL
        `);
    }

    private async createDeliveriesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        // order_id is intentionally CHAR(36) NULL with no FK in this migration.
        // The future order module migration will ALTER TABLE to add the FK and
        // (optionally) flip the column to NOT NULL once orders exist.
        await queryRunner.query(`
            CREATE TABLE \`deliveries\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`delivery_method_id\` CHAR(36) NOT NULL,
                \`destination_address_id\` CHAR(36) NOT NULL,
                \`eta_max_days\` INT NOT NULL,
                \`eta_min_days\` INT NOT NULL,
                \`fee\` DECIMAL(12, 2) NOT NULL,
                \`notes\` TEXT NULL DEFAULT NULL,
                \`order_id\` CHAR(36) NULL DEFAULT NULL,
                \`origin_address_id\` CHAR(36) NOT NULL,
                \`provider_code\` VARCHAR(64) NOT NULL,
                \`status\` ENUM('cancelled','delivered','in_transit','pending') NOT NULL DEFAULT 'pending',
                \`tracking_code\` VARCHAR(128) NULL DEFAULT NULL,
                \`zone_code\` VARCHAR(64) NULL DEFAULT NULL,
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_deliveries_order_id\` (\`order_id\`),
                INDEX \`IDX_deliveries_status\` (\`status\`),
                CONSTRAINT \`FK_deliveries_delivery_method_id\` FOREIGN KEY (\`delivery_method_id\`)
                    REFERENCES \`delivery_methods\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_deliveries_destination_address_id\` FOREIGN KEY (\`destination_address_id\`)
                    REFERENCES \`addresses\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_deliveries_origin_address_id\` FOREIGN KEY (\`origin_address_id\`)
                    REFERENCES \`addresses\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createDeliveryMethodsTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`delivery_methods\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`code\` VARCHAR(64) NOT NULL,
                \`description\` TEXT NULL DEFAULT NULL,
                \`eta_max_days\` INT NOT NULL,
                \`eta_min_days\` INT NOT NULL,
                \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
                \`name\` VARCHAR(255) NOT NULL,
                \`provider_code\` VARCHAR(64) NOT NULL DEFAULT 'zone-table',
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_delivery_methods_code\` (\`code\`)
            ) ENGINE=InnoDB
        `);
    }

    private async createDeliveryZoneRatesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`delivery_zone_rates\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`base_fee\` DECIMAL(12, 2) NOT NULL,
                \`delivery_method_id\` CHAR(36) NOT NULL,
                \`delivery_zone_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_delivery_zone_rates_method_zone\` (\`delivery_method_id\`, \`delivery_zone_id\`),
                INDEX \`IDX_delivery_zone_rates_delivery_method_id\` (\`delivery_method_id\`),
                INDEX \`IDX_delivery_zone_rates_delivery_zone_id\` (\`delivery_zone_id\`),
                CONSTRAINT \`FK_delivery_zone_rates_delivery_method_id\` FOREIGN KEY (\`delivery_method_id\`)
                    REFERENCES \`delivery_methods\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_delivery_zone_rates_delivery_zone_id\` FOREIGN KEY (\`delivery_zone_id\`)
                    REFERENCES \`delivery_zones\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createDeliveryZonesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`delivery_zones\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`code\` VARCHAR(64) NOT NULL,
                \`description\` TEXT NULL DEFAULT NULL,
                \`display_order\` INT NOT NULL DEFAULT 0,
                \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
                \`name\` VARCHAR(255) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_delivery_zones_code\` (\`code\`)
            ) ENGINE=InnoDB
        `);
    }

    private async dropDeliveriesTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`deliveries\``);
    }

    private async dropDeliveryMethodsTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`DROP TABLE \`delivery_methods\``);
    }

    private async dropDeliveryZoneRatesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`DROP TABLE \`delivery_zone_rates\``);
    }

    private async dropDeliveryZonesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`DROP TABLE \`delivery_zones\``);
    }

    private async removeAddressCoordinates(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`addresses\`
                DROP COLUMN \`latitude\`,
                DROP COLUMN \`longitude\`
        `);
    }
}
