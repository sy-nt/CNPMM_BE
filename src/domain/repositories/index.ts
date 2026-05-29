import addressRepository from "./address.repository";
import categoryRepository from "./category.repository";
import categoryClosureRepository from "./categoryClosure.repository";
import imageRepository from "./image.repository";
import inventoryRepository from "./inventory.repository";
import permissionRepository from "./permission.repository";
import productAttributeRepository from "./productAttribute.repository";
import productAttributeValueRepository from "./productAttributeValue.repository";
import roleRepository from "./role.repository";
import shopRepository from "./shop.repository";
import skuRepository from "./sku.repository";
import skuAttributeValueRepository from "./skuAttributeValue.repository";
import spuRepository from "./spu.repository";
import userRepository from "./user.repository";
import warehouseRepository from "./warehouse.repository";

const repositories = {
    address: addressRepository,
    category: categoryRepository,
    categoryClosure: categoryClosureRepository,
    image: imageRepository,
    inventory: inventoryRepository,
    permission: permissionRepository,
    productAttribute: productAttributeRepository,
    productAttributeValue: productAttributeValueRepository,
    role: roleRepository,
    shop: shopRepository,
    sku: skuRepository,
    skuAttributeValue: skuAttributeValueRepository,
    spu: spuRepository,
    user: userRepository,
    warehouse: warehouseRepository,
} as const;

export type Repositories = typeof repositories;
export default repositories;
