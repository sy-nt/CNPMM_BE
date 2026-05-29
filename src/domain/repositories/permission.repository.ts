import { PermissionEntity } from "@domain/entities/permission.entity";
import { In } from "typeorm";

import { BaseRepository } from "./base";

export class PermissionRepository extends BaseRepository<PermissionEntity> {
    countByIds = async (ids: string[]): Promise<number> => {
        if (ids.length === 0) return 0;
        return this.repository.count({ where: { id: In(ids) } });
    };
}
const permissionRepository = new PermissionRepository(PermissionEntity);
export default permissionRepository;
