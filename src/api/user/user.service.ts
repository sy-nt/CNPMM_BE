import config from "@config";
import AppDataSource from "@domain/db/mysql";
import { BaseService } from "@shared/lib/base/service";
import { BadRequestError } from "@shared/lib/http/httpError";
import { removeNil } from "@shared/utils/object";
import bcrypt from "bcrypt";
import ms from "ms";

import { RedisKeyPrefix, UserError } from "./user.constants";
import {
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
    deleteUser = async (dto: DeleteUserRequestDto): Promise<void> => {
        const user = await this.repositories.user.findOne({
            select: {
                id: true,
            },
            where: {
                id: dto.id,
            },
        });

        if (!user) throw new BadRequestError(UserError.USER_NOT_FOUND);
        await AppDataSource.transaction(async (manager) => {
            await this.repositories.user.delete(manager, { id: dto.id });
        });
    };

    getCacheUserRoles = async (id: string) => {
        const cachedRoles = await this.redis.get(
            `${RedisKeyPrefix.USER_ROLES}:${id}`,
        );
        if (cachedRoles) return JSON.parse(cachedRoles) as string[];

        const user = await this.getUserDetailed(id);
        const roles = user.roles.map((role) => role.name);
        await this.redis.setex(
            `${RedisKeyPrefix.USER_ROLES}:${id}`,
            ms(config.auth.jwt.refreshTokenExpiresIn) / 1000,
            JSON.stringify(roles),
        );
        return roles;
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
        return user;
    };

    getUserDetailed = async (id: string) => {
        const user = await this.repositories.user.findOne({
            relations: ["roles"],
            where: {
                id,
            },
        });

        if (!user) throw new BadRequestError(UserError.USER_NOT_FOUND);
        return user;
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

        await AppDataSource.transaction(async (manager) => {
            await this.repositories.user.update(
                manager,
                { id: params.id },
                removeNil({
                    ...dto,
                    password: dto.password
                        ? await bcrypt.hash(dto.password, 10)
                        : undefined,
                }),
            );
        });

        return this.getUserById({ id: params.id });
    };
}

const userService = new UserService();
export default userService;
