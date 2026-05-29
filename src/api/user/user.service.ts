import { UserEntity } from "@domain/entities/user.entity";
import { BaseService } from "@shared/lib/base/service";
import { BadRequestError } from "@shared/lib/http/httpError";
import { removeNil } from "@shared/utils/object";
import { hashPassword } from "@shared/utils/password";

import { UserError } from "./user.constants";
import {
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
            },
            where: {
                id: dto.id,
            },
        });

        if (!user) throw new BadRequestError(UserError.USER_NOT_FOUND);
        await this.repositories.user.softDelete({ id: dto.id });
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
        return this.toResponse(user);
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

        await this.repositories.user.update(
            { id: params.id },
            removeNil({
                ...dto,
                password: dto.password
                    ? await hashPassword(dto.password)
                    : undefined,
            }),
        );

        return this.getUserById({ id: params.id });
    };

    private toResponse = (user: UserEntity): GetUserByIdResponseDto => ({
        email: user.email,
        firstName: user.firstName,
        id: user.id,
        imageUrl: user.imageUrl,
        lastName: user.lastName,
    });
}

const userService = new UserService();
export default userService;
