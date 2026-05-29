import { BaseService } from "@shared/lib/base/service";
import { BadRequestError } from "@shared/lib/http/httpError";
import appJwt from "@shared/lib/jwt";
import { RBAC_SYSTEM_ROLES } from "@shared/lib/rbac/rbac.constants";
import { removeNil } from "@shared/utils/object";
import { isUUIDv7 } from "@shared/utils/string";
import slugify from "slugify";

import {
    SHOP_MAX_WORKERS,
    SHOP_STATUS_TRANSITIONS,
    ShopError,
} from "./shop.constants";
import {
    AssignWorkerRequestDto,
    GetShopsRequestDto,
    RegisterShopRequestDto,
    UpdateShopRequestDto,
    UpdateShopStatusRequestDto,
} from "./shop.dto";

export class ShopService extends BaseService {
    async assignWorker(dto: AssignWorkerRequestDto) {
        const shop = await this.repositories.shop.findOne({
            where: {
                id: dto.shopId,
                ownerId: dto.shopOwnerId,
            },
        });
        if (!shop) {
            throw new BadRequestError(ShopError.SHOP_NOT_FOUND);
        }

        const workerCount = await this.repositories.user.countByAssignedShop(
            dto.shopId,
        );
        if (workerCount >= SHOP_MAX_WORKERS) {
            throw new BadRequestError(ShopError.SHOP_MAX_WORKERS_REACHED);
        }

        return this.repositories.user.update(
            {
                email: dto.email,
            },
            {
                assignedShopId: dto.shopId,
            },
        );
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
        return this.repositories.shop.paginate({}, dto);
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

        const shop = await this.repositories.shop.create({
            description: dto.description,
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

    async updateShop(dto: UpdateShopRequestDto) {
        const { id, ownerId, ...rest } = dto;
        return this.repositories.shop.update(
            { id, ownerId },
            {
                ...removeNil(rest),
            },
        );
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

    private async _getShopById(id: string) {
        return this.repositories.shop.findOne({
            where: { id },
        });
    }

    private async _getShopBySlug(slug: string) {
        return this.repositories.shop.findOne({
            where: { slug },
        });
    }

    private async _getShopOwnerRole() {
        const role = await this.repositories.role.findOne({
            select: { id: true },
            where: { name: RBAC_SYSTEM_ROLES.SHOP_OWNER },
        });
        if (!role) {
            throw new BadRequestError(ShopError.SHOP_OWNER_ROLE_NOT_FOUND);
        }
        return role;
    }
}

const shopService = new ShopService();
export default shopService;
