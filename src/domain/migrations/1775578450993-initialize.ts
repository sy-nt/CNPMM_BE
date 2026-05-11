import { MigrationInterface, QueryRunner } from "typeorm";

export class Initialize1775578450993 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query("DROP TABLE IF EXISTS user_roles;");
        await queryRunner.query("DROP TABLE IF EXISTS users;");
        await queryRunner.query("DROP TABLE IF EXISTS roles;");
        await queryRunner.query("DROP TABLE IF EXISTS images;");
    }

    // eslint-disable-next-line max-lines-per-function
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE roles (
                id CHAR(36) PRIMARY KEY NOT NULL,
                name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL
            );
        `);

        await queryRunner.query(`
            CREATE TABLE images (
                id CHAR(36) PRIMARY KEY NOT NULL,
                bucket VARCHAR(255) NOT NULL,
                mime_type VARCHAR(255) NOT NULL,
                size INT NOT NULL,
                storage_key VARCHAR(255) NOT NULL,
                url VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL
            );
        `);

        await queryRunner.query(`
            CREATE TABLE users (
                id CHAR(36) PRIMARY KEY NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                first_name VARCHAR(255),
                last_name VARCHAR(255),
                password VARCHAR(255) NOT NULL,
                image_url VARCHAR(255),
                is_active BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                deleted_at TIMESTAMP NULL
            );
        `);

        await queryRunner.query(`
            CREATE TABLE user_roles (
                user_id CHAR(36) NOT NULL,
                role_id CHAR(36) NOT NULL,
                PRIMARY KEY (user_id, role_id),
                CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
            );
        `);

        await queryRunner.query(
            "CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);",
        );
        await queryRunner.query(
            "CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);",
        );
        await queryRunner.query(
            "CREATE INDEX idx_images_storage_key ON images(storage_key);",
        );
        await queryRunner.query("CREATE INDEX idx_images_url ON images(url);");
    }
}
