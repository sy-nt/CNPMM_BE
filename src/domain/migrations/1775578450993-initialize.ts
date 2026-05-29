import { MigrationInterface, QueryRunner } from "typeorm";

export class Initialize1775578450993 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropCrossTableForeignKeys(queryRunner);
        await this.dropRolePermissionsTable(queryRunner);
        await this.dropImagesTable(queryRunner);
        await this.dropAddressesTable(queryRunner);
        await this.dropShopsTable(queryRunner);
        await this.dropUsersTable(queryRunner);
        await this.dropPermissionsTable(queryRunner);
        await this.dropRolesTable(queryRunner);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.createRolesTable(queryRunner);
        await this.createPermissionsTable(queryRunner);
        await this.createUsersTable(queryRunner);
        await this.createShopsTable(queryRunner);
        await this.createAddressesTable(queryRunner);
        await this.createImagesTable(queryRunner);
        await this.createRolePermissionsTable(queryRunner);
        await this.createCrossTableForeignKeys(queryRunner);
    }

    private async createAddressesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`addresses\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`address_line\` VARCHAR(255) NOT NULL,
                \`city\` VARCHAR(255) NOT NULL,
                \`country\` VARCHAR(255) NOT NULL,
                \`district\` VARCHAR(255) NOT NULL,
                \`is_primary\` TINYINT(1) NOT NULL DEFAULT 0,
                \`name\` VARCHAR(255) NOT NULL,
                \`shop_id\` CHAR(36) NULL DEFAULT NULL,
                \`state\` VARCHAR(255) NOT NULL,
                \`user_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`id\`),
                INDEX \`IDX_addresses_user_id\` (\`user_id\`),
                CONSTRAINT \`FK_addresses_user_id\` FOREIGN KEY (\`user_id\`)
                    REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_addresses_shop_id\` FOREIGN KEY (\`shop_id\`)
                    REFERENCES \`shops\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createCrossTableForeignKeys(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE \`users\`
            ADD CONSTRAINT \`FK_users_assigned_shop_id\`
                FOREIGN KEY (\`assigned_shop_id\`)
                REFERENCES \`shops\` (\`id\`)
                ON DELETE RESTRICT ON UPDATE RESTRICT
        `);
    }

    private async createImagesTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`images\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`is_used\` TINYINT(1) NOT NULL DEFAULT 0,
                \`key\` VARCHAR(255) NOT NULL,
                \`public_url\` VARCHAR(255) NOT NULL,
                \`size\` BIGINT NOT NULL,
                \`used_for\` VARCHAR(255) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_images_key\` (\`key\`),
                INDEX \`IDX_images_key\` (\`key\`)
            ) ENGINE=InnoDB
        `);
    }

    private async createPermissionsTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`permissions\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`description\` TEXT NOT NULL,
                \`name\` VARCHAR(255) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_permissions_name\` (\`name\`),
                INDEX \`IDX_permissions_name\` (\`name\`)
            ) ENGINE=InnoDB
        `);
    }

    private async createRolePermissionsTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`role_permissions\` (
                \`role_id\` CHAR(36) NOT NULL,
                \`permission_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`role_id\`, \`permission_id\`),
                INDEX \`IDX_role_permissions_role_id\` (\`role_id\`),
                INDEX \`IDX_role_permissions_permission_id\` (\`permission_id\`),
                CONSTRAINT \`FK_role_permissions_role_id\` FOREIGN KEY (\`role_id\`)
                    REFERENCES \`roles\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_role_permissions_permission_id\` FOREIGN KEY (\`permission_id\`)
                    REFERENCES \`permissions\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createRolesTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`roles\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`description\` TEXT NOT NULL,
                \`is_system_role\` TINYINT(1) NOT NULL DEFAULT 0,
                \`name\` VARCHAR(255) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_roles_name\` (\`name\`),
                INDEX \`IDX_roles_name\` (\`name\`)
            ) ENGINE=InnoDB
        `);
    }

    private async createShopsTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`shops\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`description\` TEXT NULL DEFAULT NULL,
                \`name\` VARCHAR(255) NOT NULL,
                \`owner_id\` CHAR(36) NOT NULL,
                \`slug\` VARCHAR(255) NOT NULL,
                \`status\` ENUM('active', 'pending', 'suspended') NOT NULL DEFAULT 'pending',
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_shops_owner_id\` (\`owner_id\`),
                UNIQUE KEY \`UQ_shops_slug\` (\`slug\`),
                INDEX \`IDX_shops_status\` (\`status\`),
                CONSTRAINT \`FK_shops_owner_id\` FOREIGN KEY (\`owner_id\`)
                    REFERENCES \`users\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createUsersTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`users\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`assigned_shop_id\` CHAR(36) NULL DEFAULT NULL,
                \`email\` VARCHAR(255) NOT NULL,
                \`first_name\` VARCHAR(255) NULL DEFAULT NULL,
                \`image_url\` VARCHAR(255) NULL DEFAULT NULL,
                \`is_active\` TINYINT(1) NOT NULL DEFAULT 0,
                \`is_blocked\` TINYINT(1) NOT NULL DEFAULT 0,
                \`last_name\` VARCHAR(255) NULL DEFAULT NULL,
                \`password\` VARCHAR(255) NOT NULL,
                \`role_id\` CHAR(36) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_users_email\` (\`email\`),
                INDEX \`IDX_users_email\` (\`email\`),
                INDEX \`IDX_users_role_id\` (\`role_id\`),
                CONSTRAINT \`FK_users_role_id\` FOREIGN KEY (\`role_id\`)
                    REFERENCES \`roles\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async dropAddressesTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`addresses\``);
    }

    private async dropCrossTableForeignKeys(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`users\` DROP FOREIGN KEY \`FK_users_assigned_shop_id\``,
        );
    }

    private async dropImagesTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`images\``);
    }

    private async dropPermissionsTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`DROP TABLE \`permissions\``);
    }

    private async dropRolePermissionsTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`DROP TABLE \`role_permissions\``);
    }

    private async dropRolesTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`roles\``);
    }

    private async dropShopsTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`shops\``);
    }

    private async dropUsersTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`users\``);
    }
}
