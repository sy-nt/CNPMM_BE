import { MigrationInterface, QueryRunner } from "typeorm";

export class CategoryAndProduct1780068546957 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.dropCategoryClosureTable(queryRunner);
        await this.dropCategoriesTable(queryRunner);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.createCategoriesTable(queryRunner);
        await this.createCategoryClosureTable(queryRunner);
    }

    private async createCategoriesTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`categories\` (
                \`id\` CHAR(36) NOT NULL,
                \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                \`updated_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                \`deleted_at\` TIMESTAMP NULL DEFAULT NULL,
                \`description\` TEXT NULL DEFAULT NULL,
                \`display_order\` INT NOT NULL DEFAULT 0,
                \`icon_url\` VARCHAR(255) NULL DEFAULT NULL,
                \`is_active\` TINYINT(1) NOT NULL DEFAULT 1,
                \`name\` VARCHAR(255) NOT NULL,
                \`parent_id\` CHAR(36) NULL DEFAULT NULL,
                \`shop_id\` CHAR(36) NULL DEFAULT NULL,
                \`slug\` VARCHAR(255) NOT NULL,
                PRIMARY KEY (\`id\`),
                UNIQUE KEY \`UQ_categories_slug\` (\`slug\`),
                INDEX \`IDX_categories_parent_id\` (\`parent_id\`),
                INDEX \`IDX_categories_shop_id\` (\`shop_id\`),
                CONSTRAINT \`FK_categories_parent_id\` FOREIGN KEY (\`parent_id\`)
                    REFERENCES \`categories\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_categories_shop_id\` FOREIGN KEY (\`shop_id\`)
                    REFERENCES \`shops\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async createCategoryClosureTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE \`category_closure\` (
                \`ancestor_id\` CHAR(36) NOT NULL,
                \`descendant_id\` CHAR(36) NOT NULL,
                \`depth\` INT NOT NULL,
                PRIMARY KEY (\`ancestor_id\`, \`descendant_id\`),
                INDEX \`IDX_category_closure_ancestor_depth\` (\`ancestor_id\`, \`depth\`),
                INDEX \`IDX_category_closure_descendant_id\` (\`descendant_id\`),
                CONSTRAINT \`FK_category_closure_ancestor_id\` FOREIGN KEY (\`ancestor_id\`)
                    REFERENCES \`categories\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT,
                CONSTRAINT \`FK_category_closure_descendant_id\` FOREIGN KEY (\`descendant_id\`)
                    REFERENCES \`categories\` (\`id\`) ON DELETE RESTRICT ON UPDATE RESTRICT
            ) ENGINE=InnoDB
        `);
    }

    private async dropCategoriesTable(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`categories\``);
    }

    private async dropCategoryClosureTable(
        queryRunner: QueryRunner,
    ): Promise<void> {
        await queryRunner.query(`DROP TABLE \`category_closure\``);
    }
}
