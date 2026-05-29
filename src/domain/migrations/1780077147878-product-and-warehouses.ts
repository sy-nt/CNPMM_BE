import { MigrationInterface, QueryRunner } from "typeorm";

export class ProductAndWarehouses1780077147878 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropInventoryTable(queryRunner);
        await this.dropSkuAttributeValuesTable(queryRunner);
        await this.dropProductAttributeValuesTable(queryRunner);
        await this.dropProductAttributesTable(queryRunner);
        await this.dropSkusTable(queryRunner);
        await this.dropSpusTable(queryRunner);
        await this.dropWarehousesTable(queryRunner);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.createWarehousesTable(queryRunner);
        await this.createSpusTable(queryRunner);
        await this.createSkusTable(queryRunner);
        await this.createProductAttributesTable(queryRunner);
        await this.createProductAttributeValuesTable(queryRunner);
        await this.createSkuAttributeValuesTable(queryRunner);
        await this.createInventoryTable(queryRunner);
    }

    private async createInventoryTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`inventory\` (
                \`sku_id\` CHAR(36) NOT NULL,
                \`warehouse_id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`quantity\` INT NOT NULL DEFAULT 0,
                \`reserved_quantity\` INT NOT NULL DEFAULT 0,
                \`version\` INT NOT NULL DEFAULT 1,
                PRIMARY KEY (\`sku_id\`, \`warehouse_id\`),
                INDEX \`IDX_inventory_warehouse_id\` (\`warehouse_id\`),
                CONSTRAINT \`FK_inventory_sku_id\` FOREIGN KEY (\`sku_id\`)
                    REFERENCES \`skus\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_inventory_warehouse_id\` FOREIGN KEY (\`warehouse_id\`)
                    REFERENCES \`warehouses\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createProductAttributesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`product_attributes\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`display_order\` INT NOT NULL DEFAULT 0,
                \`name\` VARCHAR(64) NOT NULL,
                \`spu_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_product_attributes_spu_id_name\` (\`spu_id\`, \`name\`),
                CONSTRAINT \`FK_product_attributes_spu_id\` FOREIGN KEY (\`spu_id\`)
                    REFERENCES \`spus\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createProductAttributeValuesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`product_attribute_values\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`attribute_id\` CHAR(36) NOT NULL,
                \`display_order\` INT NOT NULL DEFAULT 0,
                \`value\` VARCHAR(64) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_product_attribute_values_attribute_id_value\` (\`attribute_id\`, \`value\`),
                CONSTRAINT \`FK_product_attribute_values_attribute_id\` FOREIGN KEY (\`attribute_id\`)
                    REFERENCES \`product_attributes\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createSkuAttributeValuesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`sku_attribute_values\` (
                \`sku_id\` CHAR(36) NOT NULL,
                \`attribute_id\` CHAR(36) NOT NULL,
                \`attribute_value_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`sku_id\`, \`attribute_id\`),
                INDEX \`IDX_sku_attribute_values_attribute_value_id\` (\`attribute_value_id\`),
                CONSTRAINT \`FK_sku_attribute_values_sku_id\` FOREIGN KEY (\`sku_id\`)
                    REFERENCES \`skus\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_sku_attribute_values_attribute_id\` FOREIGN KEY (\`attribute_id\`)
                    REFERENCES \`product_attributes\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_sku_attribute_values_attribute_value_id\` FOREIGN KEY (\`attribute_value_id\`)
                    REFERENCES \`product_attribute_values\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createSkusTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`skus\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`image_key\` VARCHAR(255) NULL DEFAULT NULL,
                \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
                \`name\` VARCHAR(255) NULL DEFAULT NULL,
                \`price\` DECIMAL(12,2) NULL DEFAULT NULL,
                \`sku_code\` VARCHAR(64) NOT NULL,
                \`spu_id\` CHAR(36) NOT NULL,
                \`version\` INT NOT NULL DEFAULT 1,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_skus_sku_code\` (\`sku_code\`),
                INDEX \`IDX_skus_spu_id\` (\`spu_id\`),
                CONSTRAINT \`FK_skus_spu_id\` FOREIGN KEY (\`spu_id\`)
                    REFERENCES \`spus\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createSpusTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`spus\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`category_id\` CHAR(36) NOT NULL,
                \`description\` TEXT NULL DEFAULT NULL,
                \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
                \`main_image_key\` VARCHAR(255) NULL DEFAULT NULL,
                \`name\` VARCHAR(255) NOT NULL,
                \`price\` DECIMAL(12,2) NOT NULL,
                \`shop_id\` CHAR(36) NOT NULL,
                \`slug\` VARCHAR(255) NOT NULL,
                \`version\` INT NOT NULL DEFAULT 1,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_spus_shop_id_slug\` (\`shop_id\`, \`slug\`),
                INDEX \`IDX_spus_category_id\` (\`category_id\`),
                INDEX \`IDX_spus_shop_id\` (\`shop_id\`),
                CONSTRAINT \`FK_spus_category_id\` FOREIGN KEY (\`category_id\`)
                    REFERENCES \`categories\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_spus_shop_id\` FOREIGN KEY (\`shop_id\`)
                    REFERENCES \`shops\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createWarehousesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`warehouses\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`address_id\` CHAR(36) NOT NULL,
                \`code\` VARCHAR(64) NOT NULL,
                \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
                \`is_default\` TINYINT(1) NOT NULL DEFAULT 0,
                \`name\` VARCHAR(255) NOT NULL,
                \`shop_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_warehouses_address_id\` (\`address_id\`),
                UNIQUE KEY \`UQ_warehouses_shop_id_code\` (\`shop_id\`, \`code\`),
                INDEX \`IDX_warehouses_shop_id\` (\`shop_id\`),
                CONSTRAINT \`FK_warehouses_address_id\` FOREIGN KEY (\`address_id\`)
                    REFERENCES \`addresses\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_warehouses_shop_id\` FOREIGN KEY (\`shop_id\`)
                    REFERENCES \`shops\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async dropInventoryTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`inventory\``);
    }

    private async dropProductAttributesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`DROP TABLE \`product_attributes\``);
    }

    private async dropProductAttributeValuesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`DROP TABLE \`product_attribute_values\``);
    }

    private async dropSkuAttributeValuesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`DROP TABLE \`sku_attribute_values\``);
    }

    private async dropSkusTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`skus\``);
    }

    private async dropSpusTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`spus\``);
    }

    private async dropWarehousesTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`warehouses\``);
    }
}
