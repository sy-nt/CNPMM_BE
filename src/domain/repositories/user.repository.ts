import { UserEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class UserRepository extends BaseRepository<UserEntity> {
    countByAssignedShop = async (shopId: string): Promise<number> => {
        return this.repository.count({ where: { assignedShopId: shopId } });
    };
}
const userRepository = new UserRepository(UserEntity);
export default userRepository;
