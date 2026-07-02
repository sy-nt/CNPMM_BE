/* eslint-disable max-lines-per-function */
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
import { RBAC_SYSTEM_ROLES } from "@shared/lib/rbac/rbac.constants";
import { EntityManager } from "typeorm";

import {
    CUSTOMER_ADDRESS_TEMPLATES,
    CUSTOMER_FIXTURES,
    SHOP_FIXTURES,
} from "./fixtures";
import { SeededSku } from "./product";
import { SeededShop } from "./shop";
import { SeededWarehouse } from "./warehouse";

type CustomerEntry = { email: string; userId: string };

const CART_CUSTOMERS_COUNT = 6;
const ITEMS_PER_CART = 2;
const ITEMS_PER_ORDER = 2;
const DELIVERY_FEE = "25000.00";
const ORDER_STATUS_OFFSET_HOURS = 6;

interface OrderSeedSpec {
    cancellationReason?: string;
    cancelledFrom?: "confirmed" | "processing";
    customerIndex: number;
    shopSlug: string;
    status: OrderStatus;
}

const ORDER_SEED_SPECS: OrderSeedSpec[] = [
    {
        customerIndex: 0,
        shopSlug: "aurora-electronics",
        status: OrderStatus.PENDING,
    },
    {
        customerIndex: 1,
        shopSlug: "mekong-threads",
        status: OrderStatus.CONFIRMED,
    },
    {
        customerIndex: 2,
        shopSlug: "hanoi-hearth",
        status: OrderStatus.PROCESSING,
    },
    {
        customerIndex: 3,
        shopSlug: "lotus-beauty",
        status: OrderStatus.SHIPPED,
    },
    {
        customerIndex: 4,
        shopSlug: "annam-outdoors",
        status: OrderStatus.DELIVERED,
    },
    {
        customerIndex: 5,
        shopSlug: "aurora-electronics",
        status: OrderStatus.COMPLETED,
    },
    {
        cancellationReason: "Customer changed mind before fulfillment.",
        customerIndex: 6,
        shopSlug: "mekong-threads",
        status: OrderStatus.CANCELLED,
    },
    {
        cancellationReason: "Out of stock after confirmation.",
        cancelledFrom: "confirmed",
        customerIndex: 7,
        shopSlug: "hanoi-hearth",
        status: OrderStatus.CANCELLED,
    },
    {
        customerIndex: 8,
        shopSlug: "lotus-beauty",
        status: OrderStatus.COMPLETED,
    },
    {
        customerIndex: 9,
        shopSlug: "annam-outdoors",
        status: OrderStatus.SHIPPED,
    },
];

export interface SeedCartOrderInput {
    customerIdsByEmail: Map<string, string>;
    shopsBySlug: Map<string, SeededShop>;
    skusByShopId: Map<string, SeededSku[]>;
    warehousesByShopId: Map<string, SeededWarehouse[]>;
}

interface OrderFinancials {
    deliveryFee: string;
    itemsSubtotal: string;
    totalAmount: string;
}

interface OrderStatusTimestamps {
    cancelledAt?: Date;
    completedAt?: Date;
    confirmedAt?: Date;
    deliveredAt?: Date;
    processingAt?: Date;
    shippedAt?: Date;
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

const _buildOrderStatusTimestamps = (
    spec: OrderSeedSpec,
    base: Date,
): OrderStatusTimestamps => {
    const { status } = spec;
    const at = (hoursAgo: number) =>
        new Date(base.getTime() - hoursAgo * 60 * 60 * 1000);
    const timestamps: OrderStatusTimestamps = {};
    if (status === OrderStatus.CANCELLED) {
        if (spec.cancelledFrom) {
            timestamps.confirmedAt = at(ORDER_STATUS_OFFSET_HOURS * 2);
        }
        if (spec.cancelledFrom === "processing") {
            timestamps.processingAt = at(ORDER_STATUS_OFFSET_HOURS * 1.5);
        }
        timestamps.cancelledAt = at(ORDER_STATUS_OFFSET_HOURS);
        return timestamps;
    }
    if (
        [
            OrderStatus.COMPLETED,
            OrderStatus.CONFIRMED,
            OrderStatus.DELIVERED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
        ].includes(status)
    ) {
        timestamps.confirmedAt = at(ORDER_STATUS_OFFSET_HOURS * 5);
    }
    if (
        [
            OrderStatus.COMPLETED,
            OrderStatus.DELIVERED,
            OrderStatus.PROCESSING,
            OrderStatus.SHIPPED,
        ].includes(status)
    ) {
        timestamps.processingAt = at(ORDER_STATUS_OFFSET_HOURS * 4);
    }
    if (
        [
            OrderStatus.COMPLETED,
            OrderStatus.DELIVERED,
            OrderStatus.SHIPPED,
        ].includes(status)
    ) {
        timestamps.shippedAt = at(ORDER_STATUS_OFFSET_HOURS * 3);
    }
    if ([OrderStatus.COMPLETED, OrderStatus.DELIVERED].includes(status)) {
        timestamps.deliveredAt = at(ORDER_STATUS_OFFSET_HOURS * 2);
    }
    if (status === OrderStatus.COMPLETED) {
        timestamps.completedAt = at(ORDER_STATUS_OFFSET_HOURS);
    }
    return timestamps;
};

const _computeOrderFinancials = (items: SeededSku[]): OrderFinancials => {
    const itemsSubtotal = items
        .reduce((acc, sku) => acc + Number(sku.price) * ITEMS_PER_ORDER, 0)
        .toFixed(2);
    const totalAmount = (Number(itemsSubtotal) + Number(DELIVERY_FEE)).toFixed(
        2,
    );
    return { deliveryFee: DELIVERY_FEE, itemsSubtotal, totalAmount };
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

const _mapOrderToDeliveryStatus = (
    status: OrderStatus,
): DeliveryStatus | null => {
    if (status === OrderStatus.CANCELLED) return DeliveryStatus.CANCELLED;
    if (status === OrderStatus.SHIPPED) return DeliveryStatus.IN_TRANSIT;
    if (status === OrderStatus.COMPLETED || status === OrderStatus.DELIVERED) {
        return DeliveryStatus.DELIVERED;
    }
    if (status === OrderStatus.PENDING) return null;
    return DeliveryStatus.PENDING;
};

const _persistDelivery = async (
    manager: EntityManager,
    args: {
        addressId: string;
        deliveryMethod: DeliveryMethodEntity;
        fee: string;
        orderId: string;
        originAddressId: string;
        status: DeliveryStatus;
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
            notes: "Seeded order delivery",
            orderId: args.orderId,
            originAddressId: args.originAddressId,
            providerCode: args.deliveryMethod.providerCode ?? "zone-table",
            status: args.status,
            trackingCode: `SEED-${args.orderId.slice(0, 8).toUpperCase()}`,
            zoneCode: "SAME_CITY",
        }),
    );
};

const _persistOrder = async (
    manager: EntityManager,
    args: {
        addressId: string;
        addressRow: AddressEntity;
        financials: OrderFinancials;
        shop: SeededShop;
        spec: OrderSeedSpec;
        userId: string;
    },
): Promise<OrderEntity> => {
    const now = new Date();
    const timestamps = _buildOrderStatusTimestamps(args.spec, now);
    const paymentStatus =
        args.spec.status === OrderStatus.COMPLETED
            ? PaymentStatus.PAID
            : PaymentStatus.UNPAID;
    const orderRepository = manager.getRepository(OrderEntity);
    return orderRepository.save(
        orderRepository.create({
            ...timestamps,
            cancellationReason: args.spec.cancellationReason,
            cancelledByRoleName:
                args.spec.status === OrderStatus.CANCELLED
                    ? RBAC_SYSTEM_ROLES.USER
                    : undefined,
            cancelledByUserId:
                args.spec.status === OrderStatus.CANCELLED
                    ? args.userId
                    : undefined,
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
            paymentStatus,
            shopId: args.shop.shopId,
            status: args.spec.status,
            totalAmount: args.financials.totalAmount,
            userId: args.userId,
        }),
    );
};

const _persistOrderForSpec = async (
    manager: EntityManager,
    args: {
        addressId: string;
        addressRow: AddressEntity;
        deliveryMethod: DeliveryMethodEntity;
        items: SeededSku[];
        originAddressId: string;
        shop: SeededShop;
        spec: OrderSeedSpec;
        userId: string;
        warehouseId: string;
    },
): Promise<void> => {
    const financials = _computeOrderFinancials(args.items);
    const order = await _persistOrder(manager, { ...args, financials });
    await _persistOrderItems(manager, {
        items: args.items,
        orderId: order.id,
        warehouseId: args.warehouseId,
    });

    const deliveryStatus = _mapOrderToDeliveryStatus(args.spec.status);
    if (deliveryStatus) {
        const delivery = await _persistDelivery(manager, {
            addressId: args.addressId,
            deliveryMethod: args.deliveryMethod,
            fee: financials.deliveryFee,
            orderId: order.id,
            originAddressId: args.originAddressId,
            status: deliveryStatus,
        });
        await manager
            .getRepository(OrderEntity)
            .update({ id: order.id }, { deliveryId: delivery.id });
    }

    if (_shouldDecrementInventory(args.spec.status)) {
        await _decrementInventoryForOrder(
            manager,
            args.items,
            args.warehouseId,
        );
    }
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

const _pickShopContext = (input: {
    shopsBySlug: Map<string, SeededShop>;
    shopSlug: string;
    skusByShopId: Map<string, SeededSku[]>;
    warehousesByShopId: Map<string, SeededWarehouse[]>;
}): {
    originAddressId: string;
    shop: SeededShop;
    skus: SeededSku[];
    warehouseId: string;
} | null => {
    const shop = input.shopsBySlug.get(input.shopSlug);
    if (!shop) return null;
    const skus = input.skusByShopId.get(shop.shopId);
    const warehouses = input.warehousesByShopId.get(shop.shopId);
    if (!skus || skus.length === 0 || !warehouses || warehouses.length === 0) {
        return null;
    }
    const warehouse = warehouses[0];
    return {
        originAddressId: warehouse.addressId,
        shop,
        skus,
        warehouseId: warehouse.id,
    };
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
    const addressRepository = manager.getRepository(AddressEntity);
    const shopSlugs = SHOP_FIXTURES.map((shop) => shop.slug);

    for (const [specIdx, spec] of ORDER_SEED_SPECS.entries()) {
        const customer = args.customers[spec.customerIndex];
        if (!customer) continue;

        const picked = _pickShopContext({
            shopsBySlug: args.shopsBySlug,
            shopSlug: spec.shopSlug,
            skusByShopId: args.skusByShopId,
            warehousesByShopId: args.warehousesByShopId,
        });
        if (!picked) continue;

        const addressId = args.addresses.addressByCustomer.get(customer.userId);
        if (!addressId) continue;

        const addressRow = await addressRepository.findOne({
            where: { id: addressId },
        });
        if (!addressRow) continue;

        const offset =
            (specIdx * ITEMS_PER_ORDER + shopSlugs.indexOf(spec.shopSlug)) %
            Math.max(1, picked.skus.length - ITEMS_PER_ORDER + 1);
        const items = picked.skus.slice(offset, offset + ITEMS_PER_ORDER);
        if (items.length < ITEMS_PER_ORDER) continue;

        await _persistOrderForSpec(manager, {
            addressId,
            addressRow,
            deliveryMethod: args.deliveryMethod,
            items,
            originAddressId: picked.originAddressId,
            shop: picked.shop,
            spec,
            userId: customer.userId,
            warehouseId: picked.warehouseId,
        });
    }
};

const _shouldDecrementInventory = (status: OrderStatus): boolean =>
    [
        OrderStatus.COMPLETED,
        OrderStatus.DELIVERED,
        OrderStatus.PROCESSING,
        OrderStatus.SHIPPED,
    ].includes(status);
