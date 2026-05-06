import { RoleEntity } from "@domain/entities/role.entity";

import { BaseRepository } from "./base";

export class RoleRepository extends BaseRepository<RoleEntity> {}
const roleRepository = new RoleRepository(RoleEntity);
export default roleRepository;
