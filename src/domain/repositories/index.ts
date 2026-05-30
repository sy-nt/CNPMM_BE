import addressRepository from "./address.repository";
import cartRepository from "./cart.repository";
import cartItemRepository from "./cartItem.repository";
import categoryRepository from "./category.repository";
import categoryClosureRepository from "./categoryClosure.repository";
import deliveryRepository from "./delivery.repository";
import deliveryMethodRepository from "./deliveryMethod.repository";
import deliveryZoneRepository from "./deliveryZone.repository";
import deliveryZoneRateRepository from "./deliveryZoneRate.repository";
import discountRepository from "./discount.repository";
import discountRedemptionRepository from "./discountRedemption.repository";
import discountTargetSpuRepository from "./discountTargetSpu.repository";
import imageRepository from "./image.repository";
import inventoryRepository from "./inventory.repository";
import orderRepository from "./order.repository";
import orderItemRepository from "./orderItem.repository";
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
    cart: cartRepository,
    cartItem: cartItemRepository,
    category: categoryRepository,
    categoryClosure: categoryClosureRepository,
    delivery: deliveryRepository,
    deliveryMethod: deliveryMethodRepository,
    deliveryZone: deliveryZoneRepository,
    deliveryZoneRate: deliveryZoneRateRepository,
    discount: discountRepository,
    discountRedemption: discountRedemptionRepository,
    discountTargetSpu: discountTargetSpuRepository,
    image: imageRepository,
    inventory: inventoryRepository,
    order: orderRepository,
    orderItem: orderItemRepository,
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
