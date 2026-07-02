import { RoleEntity } from "@domain/entities/role.entity";
import { UserEntity } from "@domain/entities/user.entity";
import { RBAC_SYSTEM_ROLES } from "@shared/lib/rbac/rbac.constants";
import { hashPassword } from "@shared/utils/password";
import { EntityManager } from "typeorm";

import {
    ADMIN_FIXTURE,
    CUSTOMER_FIXTURES,
    DEMO_PASSWORD,
    MODERATOR_FIXTURE,
    SHOP_MODERATOR_FIXTURES,
    SHOP_OWNER_FIXTURES,
    SHOP_STAFF_FIXTURES,
} from "./fixtures";

export interface SeedUsersResult {
    adminId: string;
    customerIdsByEmail: Map<string, string>;
    moderatorId: string;
    ownerIdsByEmail: Map<string, string>;
    shopModeratorIdsByEmail: Map<string, string>;
    staffIdsByEmail: Map<string, string>;
}

export const seedUsers = async (
    manager: EntityManager,
): Promise<SeedUsersResult> => {
    const userRepository = manager.getRepository(UserEntity);
    const roleByName = await _loadRolesByName(manager);
    const passwordHash = await hashPassword(DEMO_PASSWORD);

    const rows = _buildUserRows(roleByName, passwordHash);
    const saved = await userRepository.save(userRepository.create(rows));

    const byEmail = new Map(saved.map((user) => [user.email, user.id]));
    const admin = byEmail.get(ADMIN_FIXTURE.email);
    if (!admin) {
        throw new Error("Failed to seed admin user");
    }
    const moderator = byEmail.get(MODERATOR_FIXTURE.email);
    if (!moderator) {
        throw new Error("Failed to seed moderator user");
    }
    return {
        adminId: admin,
        customerIdsByEmail: new Map(
            CUSTOMER_FIXTURES.map((c) => [c.email, byEmail.get(c.email)!]),
        ),
        moderatorId: moderator,
        ownerIdsByEmail: new Map(
            SHOP_OWNER_FIXTURES.map((o) => [o.email, byEmail.get(o.email)!]),
        ),
        shopModeratorIdsByEmail: new Map(
            SHOP_MODERATOR_FIXTURES.map((m) => [
                m.email,
                byEmail.get(m.email)!,
            ]),
        ),
        staffIdsByEmail: new Map(
            SHOP_STAFF_FIXTURES.map((s) => [s.email, byEmail.get(s.email)!]),
        ),
    };
};

const _buildUserRow = (
    fixture: { email: string; firstName: string; lastName: string },
    passwordHash: string,
    roleId: string,
): Partial<UserEntity> => ({
    email: fixture.email,
    firstName: fixture.firstName,
    isActive: true,
    lastName: fixture.lastName,
    password: passwordHash,
    roleId,
});

const _buildUserRows = (
    roleByName: Map<string, string>,
    passwordHash: string,
): Partial<UserEntity>[] => {
    const adminRoleId = _requireRole(roleByName, RBAC_SYSTEM_ROLES.ADMIN);
    const moderatorRoleId = _requireRole(
        roleByName,
        RBAC_SYSTEM_ROLES.MODERATOR,
    );
    const shopModeratorRoleId = _requireRole(
        roleByName,
        RBAC_SYSTEM_ROLES.SHOP_MODERATOR,
    );
    const userRoleId = _requireRole(roleByName, RBAC_SYSTEM_ROLES.USER);
    const staffRoleId = _requireRole(roleByName, RBAC_SYSTEM_ROLES.SHOP_STAFF);
    return [
        _buildUserRow(ADMIN_FIXTURE, passwordHash, adminRoleId),
        _buildUserRow(MODERATOR_FIXTURE, passwordHash, moderatorRoleId),
        ...CUSTOMER_FIXTURES.map((c) =>
            _buildUserRow(c, passwordHash, userRoleId),
        ),
        ...SHOP_OWNER_FIXTURES.map((o) =>
            _buildUserRow(o, passwordHash, userRoleId),
        ),
        ...SHOP_MODERATOR_FIXTURES.map((m) =>
            _buildUserRow(m, passwordHash, shopModeratorRoleId),
        ),
        ...SHOP_STAFF_FIXTURES.map((s) =>
            _buildUserRow(s, passwordHash, staffRoleId),
        ),
    ];
};

const _loadRolesByName = async (
    manager: EntityManager,
): Promise<Map<string, string>> => {
    const roles = await manager.getRepository(RoleEntity).find({
        select: { id: true, name: true },
    });
    return new Map(roles.map((role) => [role.name, role.id]));
};

const _requireRole = (
    roleByName: Map<string, string>,
    name: string,
): string => {
    const id = roleByName.get(name);
    if (!id) {
        throw new Error(`Role ${name} is missing; run role seed first`);
    }
    return id;
};
