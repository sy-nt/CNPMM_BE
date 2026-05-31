import {
    DeliveryEntity,
    DeliveryMethodEntity,
    DeliveryStatus,
    OrderEntity,
    OrderItemEntity,
    OrderStatus,
    PaymentMethod,
    PaymentStatus,
} from "@domain/entities";
import { AddressEntity } from "@domain/entities/address.entity";
import { CartEntity } from "@domain/entities/cart.entity";
import { CartItemEntity } from "@domain/entities/cartItem.entity";
import { InventoryEntity } from "@domain/entities/inventory.entity";
import { EntityManager } from "typeorm";

import { CUSTOMER_ADDRESS_TEMPLATES, CUSTOMER_FIXTURES } from "./fixtures";
import { SeededSku } from "./product";
import { SeededShop } from "./shop";
import { SeededWarehouse } from "./warehouse";

type CustomerEntry = { email: string; userId: string };

const CART_CUSTOMERS_COUNT = 5;
const ORDER_CUSTOMERS_COUNT = 3;
const ITEMS_PER_CART = 2;
const ITEMS_PER_ORDER = 2;

export interface SeedCartOrderInput {
    customerIdsByEmail: Map<string, string>;
    shopsBySlug: Map<string, SeededShop>;
    skusByShopId: Map<string, SeededSku[]>;
    warehousesByShopId: Map<string, SeededWarehouse[]>;
}

interface SeededAddressesResult {
    addressByCustomer: Map<string, string>;
}

export const seedCartsAndOrders = async (
    manager: EntityManager,
    input: SeedCartOrderInput,
): Promise<void> => {
    const customers = _resolveCustomers(input.customerIdsByEmail);
    if (customers.length === 0) return;
    const skuPool = _flattenSkuPool(input.skusByShopId);
    if (skuPool.length === 0) return;

    const addresses = await _seedCustomerAddresses(manager, customers);
    await _seedCarts(manager, customers, skuPool);

    const deliveryMethod = await _findDefaultDeliveryMethod(manager);
    if (!deliveryMethod) return;
    await _seedOrders(manager, {
        addresses,
        customers,
        deliveryMethod,
        shopsBySlug: input.shopsBySlug,
        skusByShopId: input.skusByShopId,
        warehousesByShopId: input.warehousesByShopId,
    });
};

const _findDefaultDeliveryMethod = async (
    manager: EntityManager,
): Promise<DeliveryMethodEntity | null> => {
    return manager
        .getRepository(DeliveryMethodEntity)
        .findOne({ where: { code: "STANDARD" } });
};

const _flattenSkuPool = (
    skusByShopId: Map<string, SeededSku[]>,
): SeededSku[] => {
    const all: SeededSku[] = [];
    for (const skus of skusByShopId.values()) {
        all.push(...skus);
    }
    return all;
};

interface OrderFinancials {
    deliveryFee: string;
    itemsSubtotal: string;
    totalAmount: string;
}

const DELIVERY_FEE = "25000.00";

const _computeOrderFinancials = (items: SeededSku[]): OrderFinancials => {
    const itemsSubtotal = items
        .reduce((acc, sku) => acc + Number(sku.price) * ITEMS_PER_ORDER, 0)
        .toFixed(2);
    const totalAmount = (Number(itemsSubtotal) + Number(DELIVERY_FEE)).toFixed(
        2,
    );
    return { deliveryFee: DELIVERY_FEE, itemsSubtotal, totalAmount };
};

const _persistCompletedOrder = async (
    manager: EntityManager,
    args: {
        addressId: string;
        addressRow: AddressEntity;
        financials: OrderFinancials;
        shop: SeededShop;
        userId: string;
    },
): Promise<OrderEntity> => {
    const now = new Date();
    const orderRepository = manager.getRepository(OrderEntity);
    return orderRepository.save(
        orderRepository.create({
            completedAt: now,
            confirmedAt: now,
            deliveredAt: now,
            deliveryFee: args.financials.deliveryFee,
            destinationAddressId: args.addressId,
            destinationAddressSnapshot: {
                addressLine: args.addressRow.addressLine,
                city: args.addressRow.city,
                country: args.addressRow.country,
                district: args.addressRow.district,
                latitude: args.addressRow.latitude,
                longitude: args.addressRow.longitude,
                name: args.addressRow.name,
                state: args.addressRow.state,
            },
            itemsSubtotal: args.financials.itemsSubtotal,
            paymentMethod: PaymentMethod.COD,
            paymentStatus: PaymentStatus.PAID,
            processingAt: now,
            shippedAt: now,
            shopId: args.shop.shopId,
            status: OrderStatus.COMPLETED,
            totalAmount: args.financials.totalAmount,
            userId: args.userId,
        }),
    );
};

const _persistOrderForCustomer = async (
    manager: EntityManager,
    args: {
        addressId: string;
        addressRow: AddressEntity;
        deliveryMethod: DeliveryMethodEntity;
        items: SeededSku[];
        originAddressId: string;
        shop: SeededShop;
        userId: string;
        warehouseId: string;
    },
): Promise<void> => {
    const financials = _computeOrderFinancials(args.items);
    const order = await _persistCompletedOrder(manager, {
        ...args,
        financials,
    });
    await _persistOrderItems(manager, {
        items: args.items,
        orderId: order.id,
        warehouseId: args.warehouseId,
    });
    const delivery = await _persistDelivery(manager, {
        addressId: args.addressId,
        deliveryMethod: args.deliveryMethod,
        fee: financials.deliveryFee,
        orderId: order.id,
        originAddressId: args.originAddressId,
    });
    await manager
        .getRepository(OrderEntity)
        .update({ id: order.id }, { deliveryId: delivery.id });
    await _decrementInventoryForOrder(manager, args.items, args.warehouseId);
};

const _decrementInventoryForOrder = async (
    manager: EntityManager,
    items: SeededSku[],
    warehouseId: string,
): Promise<void> => {
    const inventoryRepository = manager.getRepository(InventoryEntity);
    for (const sku of items) {
        await inventoryRepository.decrement(
            { skuId: sku.id, warehouseId },
            "quantity",
            ITEMS_PER_ORDER,
        );
    }
};

const _persistDelivery = async (
    manager: EntityManager,
    args: {
        addressId: string;
        deliveryMethod: DeliveryMethodEntity;
        fee: string;
        orderId: string;
        originAddressId: string;
    },
): Promise<DeliveryEntity> => {
    const deliveryRepository = manager.getRepository(DeliveryEntity);
    return deliveryRepository.save(
        deliveryRepository.create({
            deliveryMethodId: args.deliveryMethod.id,
            destinationAddressId: args.addressId,
            etaMaxDays: args.deliveryMethod.etaMaxDays,
            etaMinDays: args.deliveryMethod.etaMinDays,
            fee: args.fee,
            notes: "Seeded historical delivery",
            orderId: args.orderId,
            originAddressId: args.originAddressId,
            providerCode: args.deliveryMethod.providerCode ?? "zone-table",
            status: DeliveryStatus.DELIVERED,
            trackingCode: `SEED-${args.orderId.slice(0, 8).toUpperCase()}`,
            zoneCode: "SAME_CITY",
        }),
    );
};

const _persistOrderItems = async (
    manager: EntityManager,
    args: { items: SeededSku[]; orderId: string; warehouseId: string },
): Promise<void> => {
    const orderItemRepository = manager.getRepository(OrderItemEntity);
    const rows = args.items.map((sku) => ({
        imageKeySnapshot: sku.imageKey,
        nameSnapshot: sku.name,
        orderId: args.orderId,
        quantity: ITEMS_PER_ORDER,
        skuId: sku.id,
        spuIdSnapshot: sku.spuId,
        subtotal: (Number(sku.price) * ITEMS_PER_ORDER).toFixed(2),
        unitPriceSnapshot: sku.price,
        warehouseAllocation: [
            { quantity: ITEMS_PER_ORDER, warehouseId: args.warehouseId },
        ],
    }));
    await orderItemRepository.save(orderItemRepository.create(rows));
};

const _pickFirstShopWithSkus = (input: {
    shopsBySlug: Map<string, SeededShop>;
    skusByShopId: Map<string, SeededSku[]>;
    warehousesByShopId: Map<string, SeededWarehouse[]>;
}): {
    originAddressId: string;
    shop: SeededShop;
    skus: SeededSku[];
    warehouseId: string;
} | null => {
    for (const shop of input.shopsBySlug.values()) {
        const skus = input.skusByShopId.get(shop.shopId);
        const warehouses = input.warehousesByShopId.get(shop.shopId);
        if (
            !skus ||
            skus.length === 0 ||
            !warehouses ||
            warehouses.length === 0
        )
            continue;
        const warehouse = warehouses[0];
        return {
            originAddressId: warehouse.addressId,
            shop,
            skus,
            warehouseId: warehouse.id,
        };
    }
    return null;
};

const _resolveCustomers = (
    customerIdsByEmail: Map<string, string>,
): CustomerEntry[] => {
    return CUSTOMER_FIXTURES.flatMap((customer) => {
        const userId = customerIdsByEmail.get(customer.email);
        return userId ? [{ email: customer.email, userId }] : [];
    });
};

const _seedCarts = async (
    manager: EntityManager,
    customers: CustomerEntry[],
    skuPool: SeededSku[],
): Promise<void> => {
    const cartRepository = manager.getRepository(CartEntity);
    const cartItemRepository = manager.getRepository(CartItemEntity);
    const targets = customers.slice(0, CART_CUSTOMERS_COUNT);
    for (const [idx, customer] of targets.entries()) {
        const cart = await cartRepository.save(
            cartRepository.create({ userId: customer.userId }),
        );
        const offset = (idx * ITEMS_PER_CART) % Math.max(1, skuPool.length);
        const items = Array.from({ length: ITEMS_PER_CART }, (_, j) => {
            const sku = skuPool[(offset + j) % skuPool.length];
            return {
                cartId: cart.id,
                quantity: 1 + j,
                skuId: sku.id,
            };
        });
        await cartItemRepository.save(cartItemRepository.create(items));
    }
};

const _seedCustomerAddresses = async (
    manager: EntityManager,
    customers: CustomerEntry[],
): Promise<SeededAddressesResult> => {
    const addressRepository = manager.getRepository(AddressEntity);
    const rows = customers.map((customer, idx) => {
        const template =
            CUSTOMER_ADDRESS_TEMPLATES[idx % CUSTOMER_ADDRESS_TEMPLATES.length];
        return {
            ...template,
            isPrimary: true,
            userId: customer.userId,
        };
    });
    const saved = await addressRepository.save(addressRepository.create(rows));
    const addressByCustomer = new Map<string, string>();
    saved.forEach((row, idx) => {
        addressByCustomer.set(customers[idx].userId, row.id);
    });
    return { addressByCustomer };
};

const _seedOrders = async (
    manager: EntityManager,
    args: {
        addresses: SeededAddressesResult;
        customers: CustomerEntry[];
        deliveryMethod: DeliveryMethodEntity;
        shopsBySlug: Map<string, SeededShop>;
        skusByShopId: Map<string, SeededSku[]>;
        warehousesByShopId: Map<string, SeededWarehouse[]>;
    },
): Promise<void> => {
    const picked = _pickFirstShopWithSkus({
        shopsBySlug: args.shopsBySlug,
        skusByShopId: args.skusByShopId,
        warehousesByShopId: args.warehousesByShopId,
    });
    if (!picked) return;
    const addressRepository = manager.getRepository(AddressEntity);
    const targets = args.customers.slice(0, ORDER_CUSTOMERS_COUNT);
    for (const [idx, customer] of targets.entries()) {
        const addressId = args.addresses.addressByCustomer.get(customer.userId);
        if (!addressId) continue;
        const addressRow = await addressRepository.findOne({
            where: { id: addressId },
        });
        if (!addressRow) continue;
        const itemSlice = picked.skus.slice(
            idx * ITEMS_PER_ORDER,
            idx * ITEMS_PER_ORDER + ITEMS_PER_ORDER,
        );
        if (itemSlice.length === 0) continue;
        await _persistOrderForCustomer(manager, {
            addressId,
            addressRow,
            deliveryMethod: args.deliveryMethod,
            items: itemSlice,
            originAddressId: picked.originAddressId,
            shop: picked.shop,
            userId: customer.userId,
            warehouseId: picked.warehouseId,
        });
    }
};
