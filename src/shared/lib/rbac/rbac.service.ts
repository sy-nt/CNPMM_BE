import { GLOBAL_REDIS_KEY_PREFIX } from "@shared/constants";
import { BaseService } from "@shared/lib/base/service";
import { ForbiddenError } from "@shared/lib/http/httpError";

import {
    PermissionName,
    RBAC_SYSTEM_ROLES,
    ROLE_PERMISSIONS_CACHE_TTL_SECONDS,
} from "./rbac.constants";

export class RbacService extends BaseService {
    async getGuestPermissions(): Promise<PermissionName[]> {
        const cacheKey = `${GLOBAL_REDIS_KEY_PREFIX.ROLE_PERMISSIONS}:${RBAC_SYSTEM_ROLES.GUEST}`;
        const raw = await this.redis.get(cacheKey);
        if (raw) return JSON.parse(raw) as PermissionName[];

        const role = await this.repositories.role.findOne({
            relations: ["permissions"],
            where: { name: RBAC_SYSTEM_ROLES.GUEST },
        });
        if (!role) throw new ForbiddenError();
        const permissions = role.permissions.map(
            (p) => p.name as PermissionName,
        );
        await this.redis.setex(
            cacheKey,
            ROLE_PERMISSIONS_CACHE_TTL_SECONDS,
            JSON.stringify(permissions),
        );
        return permissions;
    }

    async getPermissions(roleId: string): Promise<PermissionName[]> {
        const cacheKey = `${GLOBAL_REDIS_KEY_PREFIX.ROLE_PERMISSIONS}:${roleId}`;
        const raw = await this.redis.get(cacheKey);
        if (raw) return JSON.parse(raw) as PermissionName[];

        const role = await this.repositories.role.findOne({
            relations: ["permissions"],
            where: { id: roleId },
        });
        if (!role) throw new ForbiddenError();
        const permissions = role.permissions.map(
            (p) => p.name as PermissionName,
        );
        await this.redis.setex(
            cacheKey,
            ROLE_PERMISSIONS_CACHE_TTL_SECONDS,
            JSON.stringify(permissions),
        );
        return permissions;
    }
}

const rbacService = new RbacService();
export default rbacService;
