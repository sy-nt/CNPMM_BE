import { OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { RequestContextService } from "@shared/lib/context";
import { Request } from "express";

import {
    BlockUserRequestDto,
    GetUsersRequestDto,
    UpdateUserRequestDto,
} from "./user.dto";
import userService from "./user.service";

export class UserController {
    @OkResponse()
    async blockUser(req: Request) {
        const body = extractRequest<BlockUserRequestDto>(req, "body");
        return userService.blockUser(body);
    }

    @OkResponse()
    async deleteUser() {
        const jwtPayload = RequestContextService.getJwtPayload();
        await userService.deleteUser({ id: jwtPayload!.userId });
    }

    @OkResponse()
    async getUser() {
        const jwtPayload = RequestContextService.getJwtPayload();
        return userService.getUserById({ id: jwtPayload!.userId });
    }

    @OkResponse()
    async getUsers(req: Request) {
        const dto = extractRequest<GetUsersRequestDto>(req, "query");
        return userService.getUsers(dto);
    }

    @OkResponse()
    async updateUser(req: Request) {
        const body = extractRequest<UpdateUserRequestDto>(req, "body");
        const jwtPayload = RequestContextService.getJwtPayload();
        return userService.updateUser({ id: jwtPayload!.userId }, body);
    }
}

const userController = new UserController();
export default userController;
