import { MigrationInterface, QueryRunner } from "typeorm";

export class Initialize1775578450993 implements MigrationInterface {
    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE users;
            DROP TABLE roles;
            DROP TABLE images;
        `);
    }

    // eslint-disable-next-line max-lines-per-function
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
         CREATE TABLE roles (
            id UUID PRIMARY KEY NOT NULL,
            name VARCHAR(255) UNIQUE NOT NULL,
            description TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP
        );

        CREATE TABLE images (
            id UUID PRIMARY KEY NOT NULL,
            bucket VARCHAR(255) NOT NULL,
            mime_type VARCHAR(255) NOT NULL,
            size INT NOT NULL,
            storage_key VARCHAR(255) NOT NULL,
            url VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP
        );

        CREATE TABLE users (
            id UUID PRIMARY KEY NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            first_name VARCHAR(255),
            last_name VARCHAR(255),
            password VARCHAR(255) NOT NULL,
            image_url VARCHAR(255),
            is_active BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            deleted_at TIMESTAMP
        );

        CREATE TABLE user_roles (
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
            PRIMARY KEY (user_id, role_id)
        );

        CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
        CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

        CREATE INDEX idx_users_email ON users(email);
        CREATE INDEX idx_roles_name ON roles(name);
        CREATE INDEX idx_images_storage_key ON images(storage_key);
        CREATE INDEX idx_images_url ON images(url);
    `);
    }
}
