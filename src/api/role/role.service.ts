import { GLOBAL_REDIS_KEY_PREFIX } from "@shared/constants";
import { BaseService } from "@shared/lib/base/service";
import { BadRequestError } from "@shared/lib/http/httpError";
import { removeNil } from "@shared/utils/object";

import { RoleError } from "./role.constants";
import {
    CreateRoleRequestDto,
    DeleteRoleRequestDto,
    GetRolesRequestDto,
    UpdateRoleRequestDto,
} from "./role.dto";

export class RoleService extends BaseService {
    async createRole(dto: CreateRoleRequestDto) {
        await this._ensureUniqueName(dto.name);
        await this._ensurePermissionsExist(dto.permissionIds);
        return this.repositories.role.create({
            description: dto.description,
            name: dto.name,
            permissions: dto.permissionIds.map((id) => ({ id })),
        });
    }

    async deleteRole(dto: DeleteRoleRequestDto) {
        const { id } = dto;
        const role = await this.repositories.role.findOne({
            select: { id: true, isSystemRole: true },
            where: { id },
        });
        if (!role) throw new BadRequestError(RoleError.ROLE_NOT_FOUND);
        if (role.isSystemRole) {
            throw new BadRequestError(RoleError.SYSTEM_ROLE_NOT_DELETABLE);
        }
        await this.repositories.role.delete({ id });
        await this.redis.del(
            `${GLOBAL_REDIS_KEY_PREFIX.ROLE_PERMISSIONS}:${id}`,
        );
    }

    async getPermissions() {
        return this.repositories.permission.find({
            order: {
                name: "ASC",
            },
        });
    }

    async getRole(id: string) {
        const role = await this.repositories.role.findOne({
            relations: ["permissions"],
            where: { id },
        });
        if (!role) throw new BadRequestError(RoleError.ROLE_NOT_FOUND);
        return role;
    }

    async getRoles(dto: GetRolesRequestDto) {
        return this.repositories.role.paginate({}, dto);
    }

    async updateRole(dto: UpdateRoleRequestDto) {
        const { id, permissionIds, ...rest } = dto;
        const scalarUpdates = removeNil(rest);
        if (scalarUpdates.name) {
            await this._ensureUniqueName(scalarUpdates.name, id);
        }
        if (permissionIds) {
            await this._ensurePermissionsExist(permissionIds);
        }
        if (Object.keys(scalarUpdates).length > 0) {
            await this.repositories.role.update({ id }, scalarUpdates);
        }
        if (permissionIds) {
            await this.repositories.role.setPermissions(id, permissionIds);
        }
        await this.redis.del(
            `${GLOBAL_REDIS_KEY_PREFIX.ROLE_PERMISSIONS}:${id}`,
        );
    }

    private async _ensurePermissionsExist(
        permissionIds: string[],
    ): Promise<void> {
        const found =
            await this.repositories.permission.countByIds(permissionIds);
        if (found !== permissionIds.length) {
            throw new BadRequestError(RoleError.INVALID_PERMISSION_IDS);
        }
    }

    private async _ensureUniqueName(
        name: string,
        ignoreId?: string,
    ): Promise<void> {
        const existing = await this.repositories.role.findOne({
            select: { id: true },
            where: { name },
        });
        if (existing && existing.id !== ignoreId) {
            throw new BadRequestError(RoleError.ROLE_ALREADY_EXISTS);
        }
    }
}

const roleService = new RoleService();
export default roleService;
