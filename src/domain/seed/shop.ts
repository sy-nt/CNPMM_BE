import { AddressEntity } from "@domain/entities/address.entity";
import { RoleEntity } from "@domain/entities/role.entity";
import { ShopEntity, ShopStatus } from "@domain/entities/shop.entity";
import { UserEntity } from "@domain/entities/user.entity";
import { RBAC_SYSTEM_ROLES } from "@shared/lib/rbac/rbac.constants";
import { EntityManager } from "typeorm";

import {
    SHOP_FIXTURES,
    SHOP_MODERATOR_FIXTURES,
    SHOP_OWNER_FIXTURES,
    SHOP_STAFF_FIXTURES,
} from "./fixtures";
import { SeedUsersResult } from "./user";

export interface SeededShop {
    ownerId: string;
    primaryAddressId: string;
    shopId: string;
    slug: string;
}

export const seedShops = async (
    manager: EntityManager,
    users: SeedUsersResult,
): Promise<Map<string, SeededShop>> => {
    const shopOwnerRoleId = await _getRoleId(
        manager,
        RBAC_SYSTEM_ROLES.SHOP_OWNER,
    );
    const ownerIdBySlug = _resolveOwnerIdBySlug(users);

    const shops = await _persistShops(manager, ownerIdBySlug);
    const shopBySlug = new Map(shops.map((shop) => [shop.slug, shop]));

    const addresses = await _persistShopAddresses(
        manager,
        shopBySlug,
        ownerIdBySlug,
    );
    const primaryAddressByShopId = new Map(
        addresses.map((address) => [address.shopId!, address.id]),
    );

    await _promoteOwners(manager, shopBySlug, shopOwnerRoleId);
    await _assignWorkers(
        manager,
        shopBySlug,
        users.shopModeratorIdsByEmail,
        SHOP_MODERATOR_FIXTURES,
    );
    await _assignWorkers(
        manager,
        shopBySlug,
        users.staffIdsByEmail,
        SHOP_STAFF_FIXTURES,
    );

    return new Map(
        shops.map((shop) => [
            shop.slug,
            {
                ownerId: shop.ownerId,
                primaryAddressId: primaryAddressByShopId.get(shop.id)!,
                shopId: shop.id,
                slug: shop.slug,
            },
        ]),
    );
};

const _assignWorkers = async (
    manager: EntityManager,
    shopBySlug: Map<string, ShopEntity>,
    workerIdsByEmail: Map<string, string>,
    fixtures: { email: string; shopSlug: string }[],
): Promise<void> => {
    const userRepository = manager.getRepository(UserEntity);
    for (const worker of fixtures) {
        const shop = shopBySlug.get(worker.shopSlug);
        const workerId = workerIdsByEmail.get(worker.email);
        if (!shop || !workerId) continue;
        await userRepository.update(
            { id: workerId },
            { assignedShopId: shop.id },
        );
    }
};

const _getRoleId = async (
    manager: EntityManager,
    name: string,
): Promise<string> => {
    const role = await manager
        .getRepository(RoleEntity)
        .findOne({ select: { id: true }, where: { name } });
    if (!role) {
        throw new Error(`Role ${name} is missing; run role seed first`);
    }
    return role.id;
};

const _persistShopAddresses = async (
    manager: EntityManager,
    shopBySlug: Map<string, ShopEntity>,
    ownerIdBySlug: Map<string, string>,
): Promise<AddressEntity[]> => {
    const addressRepository = manager.getRepository(AddressEntity);
    const rows = SHOP_FIXTURES.map((fixture) => {
        const shop = shopBySlug.get(fixture.slug)!;
        const ownerId = ownerIdBySlug.get(fixture.slug)!;
        return {
            ...fixture.primaryAddress,
            isPrimary: true,
            shopId: shop.id,
            userId: ownerId,
        };
    });
    return addressRepository.save(addressRepository.create(rows));
};

const _persistShops = async (
    manager: EntityManager,
    ownerIdBySlug: Map<string, string>,
): Promise<ShopEntity[]> => {
    const shopRepository = manager.getRepository(ShopEntity);
    const rows = SHOP_FIXTURES.map((fixture) => ({
        description: fixture.description,
        name: fixture.name,
        ownerId: ownerIdBySlug.get(fixture.slug)!,
        slug: fixture.slug,
        status: ShopStatus.ACTIVE,
    }));
    return shopRepository.save(shopRepository.create(rows));
};

const _promoteOwners = async (
    manager: EntityManager,
    shopBySlug: Map<string, ShopEntity>,
    shopOwnerRoleId: string,
): Promise<void> => {
    const userRepository = manager.getRepository(UserEntity);
    for (const shop of shopBySlug.values()) {
        await userRepository.update(
            { id: shop.ownerId },
            { assignedShopId: shop.id, roleId: shopOwnerRoleId },
        );
    }
};

const _resolveOwnerIdBySlug = (users: SeedUsersResult): Map<string, string> => {
    const map = new Map<string, string>();
    for (const owner of SHOP_OWNER_FIXTURES) {
        const ownerId = users.ownerIdsByEmail.get(owner.email);
        if (!ownerId) continue;
        map.set(owner.shopSlug, ownerId);
    }
    return map;
};
