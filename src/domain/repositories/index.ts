import addressRepository from "./address.repository";
import imageRepository from "./image.repository";
import permissionRepository from "./permission.repository";
import roleRepository from "./role.repository";
import shopRepository from "./shop.repository";
import userRepository from "./user.repository";

const repositories = {
    address: addressRepository,
    image: imageRepository,
    permission: permissionRepository,
    role: roleRepository,
    shop: shopRepository,
    user: userRepository,
} as const;

export type Repositories = typeof repositories;
export default repositories;
