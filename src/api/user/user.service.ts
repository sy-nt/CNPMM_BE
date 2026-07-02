import { IMAGE_PREFIXES } from "@api/image/image.constants";
import {
    claimImageKeys,
    loadImageUrlLookup,
    releaseImageKeysIfOrphaned,
    resolveImageUrl,
} from "@api/image/image.lifecycle";
import { UserEntity } from "@domain/entities/user.entity";
import { BaseService } from "@shared/lib/base/service";
import { BadRequestError } from "@shared/lib/http/httpError";
import {
    RBAC_SYSTEM_ROLES,
    RBACSystemRoleName,
} from "@shared/lib/rbac/rbac.constants";
import { removeNil } from "@shared/utils/object";
import { hashPassword } from "@shared/utils/password";

import { UserError } from "./user.constants";
import {
    AssignModeratorRequestDto,
    AssignModeratorResponseDto,
    BlockUserRequestDto,
    DeleteUserRequestDto,
    GetUserByIdRequestDto,
    GetUserByIdResponseDto,
    GetUsersRequestDto,
    GetUsersResponseDto,
    UpdateUserParamsDto,
    UpdateUserRequestDto,
    UpdateUserResponseDto,
} from "./user.dto";

export class UserService extends BaseService {
    assignModerator = async (
        dto: AssignModeratorRequestDto,
    ): Promise<AssignModeratorResponseDto> => {
        const user = await this.repositories.user.findOne({
            relations: { role: true },
            select: {
                assignedShopId: true,
                email: true,
                id: true,
                role: { id: true, name: true },
            },
            where: { email: dto.email },
        });
        if (!user) {
            throw new BadRequestError(UserError.USER_NOT_FOUND);
        }

        await this._assertModeratorAssignable(user);

        const moderatorRoleId = await this._getRoleId(
            RBAC_SYSTEM_ROLES.MODERATOR,
        );
        await this.repositories.user.update(
            { id: user.id },
            {
                assignedShopId: null,
                roleId: moderatorRoleId,
            },
        );

        return {
            email: user.email,
            id: user.id,
            role: {
                id: moderatorRoleId,
                name: RBAC_SYSTEM_ROLES.MODERATOR,
            },
        };
    };

    blockUser = async (dto: BlockUserRequestDto): Promise<void> => {
        await this.repositories.user.update(
            {
                email: dto.email,
            },
            {
                isBlocked: true,
            },
        );
    };

    deleteUser = async (dto: DeleteUserRequestDto): Promise<void> => {
        const user = await this.repositories.user.findOne({
            select: {
                id: true,
                imageKey: true,
            },
            where: {
                id: dto.id,
            },
        });

        if (!user) throw new BadRequestError(UserError.USER_NOT_FOUND);
        await this.repositories.user.softDelete({ id: dto.id });
        await releaseImageKeysIfOrphaned(this._imageRepositories(), [
            user.imageKey,
        ]);
    };

    getUserById = async (
        dto: GetUserByIdRequestDto,
    ): Promise<GetUserByIdResponseDto> => {
        const user = await this.repositories.user.findOne({
            where: {
                id: dto.id,
            },
        });

        if (!user) throw new BadRequestError(UserError.USER_NOT_FOUND);
        return this._toResponse(user);
    };

    getUsers = async (
        dto: GetUsersRequestDto,
    ): Promise<GetUsersResponseDto> => {
        return this.repositories.user.paginateKeySet(
            {
                select: {
                    email: true,
                    id: true,
                },
                where: removeNil({
                    email: dto.email,
                }),
            },
            dto,
        );
    };

    updateUser = async (
        params: UpdateUserParamsDto,
        dto: UpdateUserRequestDto,
    ): Promise<UpdateUserResponseDto> => {
        const user = await this.repositories.user.findOne({
            where: {
                id: params.id,
            },
        });

        if (!user) throw new BadRequestError(UserError.USER_NOT_FOUND);

        const previousImageKey = user.imageKey;
        if (dto.imageKey && dto.imageKey !== previousImageKey) {
            await claimImageKeys(
                this._imageRepositories(),
                [dto.imageKey],
                IMAGE_PREFIXES.USER_AVATAR,
            );
        }

        await this.repositories.user.update(
            { id: params.id },
            removeNil({
                ...dto,
                password: dto.password
                    ? await hashPassword(dto.password)
                    : undefined,
            }),
        );

        if (dto.imageKey && dto.imageKey !== previousImageKey) {
            await releaseImageKeysIfOrphaned(this._imageRepositories(), [
                previousImageKey,
            ]);
        }

        return this.getUserById({ id: params.id });
    };

    private async _assertModeratorAssignable(user: {
        assignedShopId?: null | string;
        id: string;
        role: { name: string };
    }) {
        if (user.role.name !== RBAC_SYSTEM_ROLES.USER) {
            throw new BadRequestError(UserError.INVALID_MODERATOR_ASSIGNMENT);
        }
        if (user.assignedShopId) {
            throw new BadRequestError(UserError.INVALID_MODERATOR_ASSIGNMENT);
        }
        const ownedShop = await this.repositories.shop.findOne({
            select: { id: true },
            where: { ownerId: user.id },
        });
        if (ownedShop) {
            throw new BadRequestError(UserError.INVALID_MODERATOR_ASSIGNMENT);
        }
    }

    private async _getRoleId(roleName: RBACSystemRoleName) {
        const role = await this.repositories.role.findOne({
            select: { id: true },
            where: { name: roleName },
        });
        if (!role) {
            if (roleName === RBAC_SYSTEM_ROLES.MODERATOR) {
                throw new BadRequestError(UserError.MODERATOR_ROLE_NOT_FOUND);
            }
            throw new BadRequestError(UserError.USER_NOT_FOUND);
        }
        return role.id;
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

    private async _toResponse(
        user: UserEntity,
    ): Promise<GetUserByIdResponseDto> {
        const lookup = await loadImageUrlLookup(this.repositories.image, [
            user.imageKey,
        ]);
        return {
            email: user.email,
            firstName: user.firstName,
            id: user.id,
            imageUrl: resolveImageUrl(user.imageKey, lookup),
            lastName: user.lastName,
        };
    }
}

const userService = new UserService();
export default userService;
