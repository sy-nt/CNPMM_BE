import { RoleEntity } from "@domain/entities/role.entity";
import { RequestContextService } from "@shared/lib/context";

import { BaseRepository } from "./base";

export class RoleRepository extends BaseRepository<RoleEntity> {
    setPermissions = async (
        roleId: string,
        permissionIds: string[],
    ): Promise<void> => {
        const ctx = RequestContextService.getContext();
        const manager = ctx.queryRunner!.manager;
        const role = await manager.findOne(RoleEntity, {
            relations: ["permissions"],
            where: { id: roleId },
        });
        if (!role) return;
        role.permissions = permissionIds.map(
            (id) => ({ id }) as RoleEntity["permissions"][number],
        );
        await manager.save(role);
    };
}
const roleRepository = new RoleRepository(RoleEntity);
export default roleRepository;
