import { IMAGE_PREFIXES } from "@api/image/image.constants";
import {
    claimImageKeys,
    loadImageUrlLookup,
    releaseImageKeysIfOrphaned,
    resolveImageUrl,
} from "@api/image/image.lifecycle";
import { ShopEntity, ShopStatus } from "@domain/entities/shop.entity";
import { BaseService } from "@shared/lib/base/service";
import { BadRequestError } from "@shared/lib/http/httpError";
import appJwt from "@shared/lib/jwt";
import {
    RBAC_SYSTEM_ROLES,
    RBACSystemRoleName,
} from "@shared/lib/rbac/rbac.constants";
import { removeNil } from "@shared/utils/object";
import { isUUIDv7 } from "@shared/utils/string";
import slugify from "slugify";

import {
    SHOP_MAX_WORKERS,
    SHOP_STATUS_TRANSITIONS,
    SHOP_WORKER_SELECT,
    ShopError,
} from "./shop.constants";
import {
    AdminGetShopsRequestDto,
    AssignWorkerRequestDto,
    GetShopsRequestDto,
    RegisterShopRequestDto,
    ShopWorkerResponseDto,
    UnassignWorkerRequestDto,
    UpdateShopRequestDto,
    UpdateShopStatusRequestDto,
} from "./shop.dto";

export class ShopService extends BaseService {
    async adminGetShops(dto: AdminGetShopsRequestDto) {
        return this.repositories.shop.paginate(
            {
                relations: {
                    owner: true,
                },
                select: {
                    description: true,
                    id: true,
                    name: true,
                    owner: true,
                    slug: true,
                    status: true,
                },
                where: removeNil({
                    status: dto.status,
                }),
            },
            dto,
        );
    }

    async assignWorker(
        dto: AssignWorkerRequestDto,
    ): Promise<ShopWorkerResponseDto> {
        await this._ensureShopExists(dto.shopId);
        const worker = await this._findWorkerByEmail(dto.email);
        if (
            worker.assignedShopId === dto.shopId &&
            worker.role.name === RBAC_SYSTEM_ROLES.SHOP_STAFF
        ) {
            return this._toWorkerResponse(worker);
        }

        await this._assertWorkerAssignable(worker, dto.shopId);

        const staffRoleId = await this._getRoleId(RBAC_SYSTEM_ROLES.SHOP_STAFF);
        await this.repositories.user.update(
            { id: worker.id },
            {
                assignedShopId: dto.shopId,
                roleId: staffRoleId,
            },
        );

        return this._toWorkerResponse({
            ...worker,
            assignedShopId: dto.shopId,
            role: {
                id: staffRoleId,
                name: RBAC_SYSTEM_ROLES.SHOP_STAFF,
            },
            roleId: staffRoleId,
        });
    }

    /**
     * End users get a shop by ID or slug
     * @param idOrSlug - The ID or slug of the shop
     * @returns The shop
     */
    async getShop(idOrSlug: string) {
        const isUUID = isUUIDv7(idOrSlug);
        if (isUUID) {
            return this._getShopById(idOrSlug);
        }
        return this._getShopBySlug(idOrSlug);
    }

    async getShopDetails(idOrSlug: string) {
        const shop = await this.getShop(idOrSlug);
        if (!shop) {
            throw new BadRequestError(ShopError.SHOP_NOT_FOUND);
        }
        // !: Add more details to the shop details
        return shop;
    }

    async getShops(dto: GetShopsRequestDto) {
        return this.repositories.shop.paginate(
            {
                select: {
                    description: true,
                    id: true,
                    name: true,
                    slug: true,
                },
                where: {
                    status: ShopStatus.ACTIVE,
                },
            },
            dto,
        );
    }

    async getWorkers(shopId: string) {
        const workers = await this.repositories.user.findByAssignedShop(shopId);
        return workers.map((user) => this._toWorkerResponse(user));
    }

    async registerShop(dto: RegisterShopRequestDto) {
        const existingShop = await this.repositories.shop.findOne({
            select: { id: true },
            where: { ownerId: dto.ownerId },
        });
        if (existingShop) {
            throw new BadRequestError(ShopError.SHOP_ALREADY_EXISTS);
        }

        const shopOwnerRole = await this._getShopOwnerRole();
        const slug = await this._generateUniqueSlug(dto.name);

        if (dto.imageKey) {
            await claimImageKeys(
                this._imageRepositories(),
                [dto.imageKey],
                IMAGE_PREFIXES.SHOP_LOGO,
            );
        }

        const shop = await this.repositories.shop.create({
            description: dto.description,
            imageKey: dto.imageKey,
            name: dto.name,
            ownerId: dto.ownerId,
            slug,
        });

        await this.repositories.address.createMany(
            dto.addresses.map((address) => ({
                ...address,
                shopId: shop.id,
                userId: dto.ownerId,
            })),
        );

        await this.repositories.user.update(
            { id: dto.ownerId },
            { assignedShopId: shop.id, roleId: shopOwnerRole.id },
        );

        return {
            shop,
            tokens: appJwt.generateTokens({
                assignedShopId: shop.id,
                roleId: shopOwnerRole.id,
                userId: dto.ownerId,
            }),
        };
    }

    async unassignWorker(
        dto: UnassignWorkerRequestDto,
    ): Promise<ShopWorkerResponseDto> {
        await this._ensureShopExists(dto.shopId);
        const worker = await this._findWorkerByEmail(dto.email);
        await this._assertWorkerUnassignable(worker, dto.shopId);

        const userRoleId = await this._getRoleId(RBAC_SYSTEM_ROLES.USER);
        await this.repositories.user.update(
            { id: worker.id },
            {
                assignedShopId: null,
                roleId: userRoleId,
            },
        );

        return this._toWorkerResponse({
            ...worker,
            assignedShopId: null,
            role: {
                id: userRoleId,
                name: RBAC_SYSTEM_ROLES.USER,
            },
            roleId: userRoleId,
        });
    }

    async updateShop(dto: UpdateShopRequestDto) {
        const { id, ownerId, ...rest } = dto;
        const shop = await this.repositories.shop.findOne({
            select: { id: true, imageKey: true },
            where: { id, ownerId },
        });
        if (!shop) {
            throw new BadRequestError(ShopError.SHOP_NOT_FOUND);
        }

        const previousImageKey = shop.imageKey;
        if (rest.imageKey && rest.imageKey !== previousImageKey) {
            await claimImageKeys(
                this._imageRepositories(),
                [rest.imageKey],
                IMAGE_PREFIXES.SHOP_LOGO,
            );
        }

        await this.repositories.shop.update(
            { id, ownerId },
            {
                ...removeNil(rest),
            },
        );

        if (rest.imageKey && rest.imageKey !== previousImageKey) {
            await releaseImageKeysIfOrphaned(this._imageRepositories(), [
                previousImageKey,
            ]);
        }

        return this._getShopById(id);
    }

    async updateStatus(dto: UpdateShopStatusRequestDto) {
        const { id, status } = dto;
        const shop = await this.repositories.shop.findOne({
            select: { id: true, status: true },
            where: { id },
        });
        if (!shop) {
            throw new BadRequestError(ShopError.SHOP_NOT_FOUND);
        }
        const allowedNextStatuses = SHOP_STATUS_TRANSITIONS[shop.status];
        if (!allowedNextStatuses.includes(status)) {
            throw new BadRequestError(ShopError.INVALID_STATUS_TRANSITION);
        }
        return this.repositories.shop.update({ id }, { status });
    }

    private async _assertWorkerAssignable(
        worker: {
            assignedShopId?: null | string;
            id: string;
            role: { name: string };
        },
        shopId: string,
    ) {
        if (worker.assignedShopId === shopId) {
            if (worker.role.name === RBAC_SYSTEM_ROLES.SHOP_STAFF) {
                return;
            }
            throw new BadRequestError(ShopError.INVALID_ASSIGNED_WORKER);
        }

        if (worker.assignedShopId) {
            throw new BadRequestError(ShopError.INVALID_ASSIGNED_WORKER);
        }

        if (
            worker.role.name === RBAC_SYSTEM_ROLES.SHOP_OWNER ||
            worker.role.name === RBAC_SYSTEM_ROLES.SHOP_MODERATOR
        ) {
            throw new BadRequestError(ShopError.INVALID_ASSIGNED_WORKER);
        }

        const ownedShop = await this.repositories.shop.findOne({
            select: { id: true },
            where: { ownerId: worker.id },
        });
        if (ownedShop) {
            throw new BadRequestError(ShopError.INVALID_ASSIGNED_WORKER);
        }

        const workerCount =
            await this.repositories.user.countByAssignedShop(shopId);
        if (workerCount >= SHOP_MAX_WORKERS) {
            throw new BadRequestError(ShopError.SHOP_MAX_WORKERS_REACHED);
        }
    }

    private async _assertWorkerUnassignable(
        worker: {
            assignedShopId?: null | string;
            role: { name: string };
        },
        shopId: string,
    ) {
        if (worker.assignedShopId !== shopId) {
            throw new BadRequestError(ShopError.WORKER_NOT_IN_SHOP);
        }

        if (worker.role.name !== RBAC_SYSTEM_ROLES.SHOP_STAFF) {
            throw new BadRequestError(ShopError.INVALID_ASSIGNED_WORKER);
        }
    }

    private async _ensureShopExists(shopId: string) {
        const shop = await this.repositories.shop.findOne({
            select: { id: true },
            where: { id: shopId },
        });
        if (!shop) {
            throw new BadRequestError(ShopError.SHOP_NOT_FOUND);
        }
    }

    private async _findWorkerByEmail(email: string) {
        const worker = await this.repositories.user.findOne({
            relations: { role: true },
            select: {
                ...SHOP_WORKER_SELECT,
                role: { id: true, name: true },
            },
            where: { email },
        });
        if (!worker) {
            throw new BadRequestError(ShopError.WORKER_NOT_FOUND);
        }
        return worker;
    }

    private async _generateUniqueSlug(name: string): Promise<string> {
        const baseSlug = slugify(name, { lower: true, strict: true });
        const existing = new Set(
            await this.repositories.shop.findSlugsByBase(baseSlug),
        );
        if (!existing.has(baseSlug)) return baseSlug;
        let suffix = 2;
        while (existing.has(`${baseSlug}-${suffix}`)) suffix++;
        return `${baseSlug}-${suffix}`;
    }

    private async _getRoleId(roleName: RBACSystemRoleName) {
        const role = await this.repositories.role.findOne({
            select: { id: true },
            where: { name: roleName },
        });
        if (!role) {
            throw new BadRequestError(this._roleNotFoundError(roleName));
        }
        return role.id;
    }

    private async _getShopById(id: string) {
        const shop = await this.repositories.shop.findOne({
            select: {
                description: true,
                id: true,
                imageKey: true,
                name: true,
                slug: true,
            },
            where: { id },
        });
        if (!shop) return null;
        return this._toPublicShop(shop);
    }

    private async _getShopBySlug(slug: string) {
        const shop = await this.repositories.shop.findOne({
            select: {
                description: true,
                id: true,
                imageKey: true,
                name: true,
                slug: true,
            },
            where: { slug },
        });
        if (!shop) return null;
        return this._toPublicShop(shop);
    }

    private async _getShopOwnerRole() {
        return {
            id: await this._getRoleId(RBAC_SYSTEM_ROLES.SHOP_OWNER),
        };
    }

    private _imageRepositories() {
        return {
            image: this.repositories.image,
            shop: this.repositories.shop,
            sku: this.repositories.sku,
            spu: this.repositories.spu,
            user: this.repositories.user,
        };
    }

    private _roleNotFoundError(roleName: RBACSystemRoleName) {
        if (roleName === RBAC_SYSTEM_ROLES.SHOP_OWNER) {
            return ShopError.SHOP_OWNER_ROLE_NOT_FOUND;
        }
        if (roleName === RBAC_SYSTEM_ROLES.SHOP_STAFF) {
            return ShopError.SHOP_STAFF_ROLE_NOT_FOUND;
        }
        return ShopError.USER_ROLE_NOT_FOUND;
    }

    private async _toPublicShop(
        shop: Pick<
            ShopEntity,
            "description" | "id" | "imageKey" | "name" | "slug"
        >,
    ) {
        const lookup = await loadImageUrlLookup(this.repositories.image, [
            shop.imageKey,
        ]);
        return {
            description: shop.description,
            id: shop.id,
            imageKey: shop.imageKey,
            imageUrl: resolveImageUrl(shop.imageKey, lookup),
            name: shop.name,
            slug: shop.slug,
        };
    }

    private _toWorkerResponse(worker: {
        assignedShopId?: null | string;
        email: string;
        firstName?: string;
        id: string;
        lastName?: string;
        role?: { id: string; name: string };
        roleId: string;
    }): ShopWorkerResponseDto {
        return {
            assignedShopId: worker.assignedShopId,
            email: worker.email,
            firstName: worker.firstName,
            id: worker.id,
            lastName: worker.lastName,
            role: worker.role ?? { id: worker.roleId, name: "" },
            roleId: worker.roleId,
        };
    }
}

const shopService = new ShopService();
export default shopService;
