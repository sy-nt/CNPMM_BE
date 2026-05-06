import imageRepository from "./image.repository";
import roleRepository from "./role.repository";
import userRepository from "./user.repository";

const repositories = {
    image: imageRepository,
    role: roleRepository,
    user: userRepository,
} as const;

export type Repositories = typeof repositories;
export default repositories;
