import { UserEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class UserRepository extends BaseRepository<UserEntity> {
    countByAssignedShop = async (shopId: string): Promise<number> => {
        return this.repository.count({ where: { assignedShopId: shopId } });
    };

    findByAssignedShop = async (shopId: string): Promise<UserEntity[]> => {
        return this.repository.find({
            relations: { role: true },
            select: {
                assignedShopId: true,
                email: true,
                firstName: true,
                id: true,
                lastName: true,
                role: { id: true, name: true },
                roleId: true,
            },
            where: { assignedShopId: shopId },
        });
    };
}
const userRepository = new UserRepository(UserEntity);
export default userRepository;
