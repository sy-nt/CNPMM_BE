import { RoleEntity } from "@domain/entities/role.entity";
import { EntityManager } from "typeorm";

export const roles = [
    {
        description: "Admin role",
        name: "admin",
    },
    {
        description: "User role",
        name: "user",
    },
    {
        description: "Moderator role",
        name: "moderator",
    },
    {
        description: "Shop owner role",
        name: "shop_owner",
    },
    {
        description: "Shop manager role",
        name: "shop_manager",
    },
    {
        description: "Shop staff role",
        name: "shop_staff",
    },
];

export const seedRoles = async (manager: EntityManager) => {
    const roleRepository = manager.getRepository(RoleEntity);
    return roleRepository.save(
        roles.map((role) => roleRepository.create(role)),
    );
};
