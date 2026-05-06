import { UserEntity } from "@domain/entities";

import { BaseRepository } from "./base";

export class UserRepository extends BaseRepository<UserEntity> {}
const userRepository = new UserRepository(UserEntity);
export default userRepository;
