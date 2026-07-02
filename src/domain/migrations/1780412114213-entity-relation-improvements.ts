import { MigrationInterface, QueryRunner } from "typeorm";

export class EntityRelationImprovements1780412114213
    implements MigrationInterface
{
    name = "EntityRelationImprovements1780412114213";

    public async down(queryRunner: QueryRunner): Promise<void> {
        await this.revertCategorySlugScope(queryRunner);
        await this.revertDiscountClaimUnique(queryRunner);
    }

    public async up(queryRunner: QueryRunner): Promise<void> {
        await this.enforceDiscountClaimUnique(queryRunner);
        await this.enforceCategorySlugScope(queryRunner);
    }

    private async dropIndexIfExists(
        queryRunner: QueryRunner,
        table: string,
        indexName: string,
    ): Promise<void> {
        if (!(await this.indexExists(queryRunner, table, indexName))) {
            return;
        }
        await queryRunner.query(
            `ALTER TABLE \`${table}\` DROP INDEX \`${indexName}\``,
        );
    }

    private async enforceCategorySlugScope(
        queryRunner: QueryRunner,
    ): Promise<void> {
        if (
            await this.indexExists(
                queryRunner,
                "categories",
                "UQ_categories_shop_id_slug",
            )
        ) {
            return;
        }

        await this.dropIndexIfExists(
            queryRunner,
            "categories",
            "UQ_categories_slug",
        );
        await queryRunner.query(`
            ALTER TABLE \`categories\`
                ADD UNIQUE KEY \`UQ_categories_shop_id_slug\` (\`shop_id\`, \`slug\`)
        `);
    }

    private async enforceDiscountClaimUnique(
        queryRunner: QueryRunner,
    ): Promise<void> {
        if (
            await this.indexExists(
                queryRunner,
                "discount_claims",
                "UQ_discount_claims_user_id_discount_id",
            )
        ) {
            return;
        }

        const hasLegacyIndex = await this.indexExists(
            queryRunner,
            "discount_claims",
            "IDX_discount_claims_user_id_discount_id",
        );

        if (hasLegacyIndex) {
            await queryRunner.query(`
                ALTER TABLE \`discount_claims\`
                    ADD UNIQUE KEY \`UQ_discount_claims_user_id_discount_id\` (\`user_id\`, \`discount_id\`),
                    DROP INDEX \`IDX_discount_claims_user_id_discount_id\`
            `);
            return;
        }

        await queryRunner.query(`
            ALTER TABLE \`discount_claims\`
                ADD UNIQUE KEY \`UQ_discount_claims_user_id_discount_id\` (\`user_id\`, \`discount_id\`)
        `);
    }

    private async indexExists(
        queryRunner: QueryRunner,
        table: string,
        indexName: string,
    ): Promise<boolean> {
        const rows: { found: number }[] = await queryRunner.query(
            `
                SELECT 1 AS found
                FROM INFORMATION_SCHEMA.STATISTICS
                WHERE TABLE_SCHEMA = DATABASE()
                  AND TABLE_NAME = ?
                  AND INDEX_NAME = ?
                LIMIT 1
            `,
            [table, indexName],
        );
        return rows.length > 0;
    }

    private async revertCategorySlugScope(
        queryRunner: QueryRunner,
    ): Promise<void> {
        if (
            await this.indexExists(
                queryRunner,
                "categories",
                "UQ_categories_slug",
            )
        ) {
            return;
        }

        await this.dropIndexIfExists(
            queryRunner,
            "categories",
            "UQ_categories_shop_id_slug",
        );
        await queryRunner.query(`
            ALTER TABLE \`categories\`
                ADD UNIQUE KEY \`UQ_categories_slug\` (\`slug\`)
        `);
    }

    private async revertDiscountClaimUnique(
        queryRunner: QueryRunner,
    ): Promise<void> {
        if (
            await this.indexExists(
                queryRunner,
                "discount_claims",
                "IDX_discount_claims_user_id_discount_id",
            )
        ) {
            return;
        }

        const hasUniqueIndex = await this.indexExists(
            queryRunner,
            "discount_claims",
            "UQ_discount_claims_user_id_discount_id",
        );

        if (!hasUniqueIndex) {
            return;
        }

        await queryRunner.query(`
            ALTER TABLE \`discount_claims\`
                ADD INDEX \`IDX_discount_claims_user_id_discount_id\` (\`user_id\`, \`discount_id\`),
                DROP INDEX \`UQ_discount_claims_user_id_discount_id\`
        `);
    }
}
