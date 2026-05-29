import { CreatedResponse, OkResponse } from "@shared/decorators/response";
import { extractRequest } from "@shared/helper/request";
import { Request } from "express";

import {
    CreateRoleRequestDto,
    DeleteRoleRequestDto,
    GetRolesRequestDto,
    UpdateRoleRequestDto,
} from "./role.dto";
import roleService from "./role.service";

export class RoleController {
    @CreatedResponse()
    async createRole(req: Request) {
        const dto = extractRequest<CreateRoleRequestDto>(req, "body");
        return roleService.createRole(dto);
    }

    @OkResponse()
    async deleteRole(req: Request) {
        const dto = extractRequest<DeleteRoleRequestDto>(req, "params");
        return roleService.deleteRole(dto);
    }

    @OkResponse()
    async getPermissions() {
        return roleService.getPermissions();
    }

    @OkResponse()
    async getRole(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        return roleService.getRole(id);
    }

    @OkResponse()
    async getRoles(req: Request) {
        const dto = extractRequest<GetRolesRequestDto>(req, "query");
        return roleService.getRoles(dto);
    }

    @OkResponse()
    async updateRole(req: Request) {
        const { id } = extractRequest<{ id: string }>(req, "params");
        const dto = extractRequest<UpdateRoleRequestDto>(req, "body");
        return roleService.updateRole({ ...dto, id });
    }
}

export default new RoleController();
