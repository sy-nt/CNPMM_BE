import {
    DiscountEntity,
    DiscountScope,
    DiscountType,
    DiscountValueType,
} from "@domain/entities";
import { EntityManager } from "typeorm";

import {
    DiscountFixture,
    GLOBAL_DISCOUNT_FIXTURES,
    SEED_DISCOUNT_VALID_FROM,
    SEED_DISCOUNT_VALID_UNTIL,
    SHOP_DISCOUNT_FIXTURES,
} from "./fixtures";
import { SeededShop } from "./shop";

const _buildRules = (fixture: DiscountFixture) =>
    fixture.minSubtotal
        ? [{ params: { amount: fixture.minSubtotal }, type: "min_subtotal" }]
        : [];

const _resolveDiscountType = (fixture: DiscountFixture): DiscountType =>
    fixture.discountType === "delivery"
        ? DiscountType.DELIVERY
        : DiscountType.ITEMS;

const _toDiscountRow = (
    fixture: DiscountFixture,
    options: { scope: DiscountScope; shopId?: string },
): Partial<DiscountEntity> => ({
    code: fixture.code,
    description: fixture.description,
    discountType: _resolveDiscountType(fixture),
    isActive: true,
    maxDiscountAmount: fixture.maxDiscountAmount,
    maxUses: fixture.maxUses,
    maxUsesPerUser: fixture.maxUsesPerUser,
    name: fixture.name,
    rules: _buildRules(fixture),
    scope: options.scope,
    shopId: options.shopId,
    usedCount: 0,
    validFrom: SEED_DISCOUNT_VALID_FROM,
    validUntil: SEED_DISCOUNT_VALID_UNTIL,
    value: fixture.value,
    valueType: fixture.isPercentage
        ? DiscountValueType.PERCENTAGE
        : DiscountValueType.FIXED,
});

export const seedGlobalDiscounts = async (
    manager: EntityManager,
): Promise<void> => {
    const discountRepository = manager.getRepository(DiscountEntity);
    const rows = GLOBAL_DISCOUNT_FIXTURES.map((fixture) =>
        _toDiscountRow(fixture, { scope: DiscountScope.GLOBAL }),
    );
    if (rows.length === 0) return;
    await discountRepository.save(discountRepository.create(rows));
};

export const seedShopDiscounts = async (
    manager: EntityManager,
    shopsBySlug: Map<string, SeededShop>,
): Promise<void> => {
    const discountRepository = manager.getRepository(DiscountEntity);
    const rows: Partial<DiscountEntity>[] = [];
    for (const [slug, fixtures] of Object.entries(SHOP_DISCOUNT_FIXTURES)) {
        const shop = shopsBySlug.get(slug);
        if (!shop) continue;
        for (const fixture of fixtures) {
            rows.push(
                _toDiscountRow(fixture, {
                    scope: DiscountScope.SHOP,
                    shopId: shop.shopId,
                }),
            );
        }
    }
    if (rows.length === 0) return;
    await discountRepository.save(discountRepository.create(rows));
};

export const seedDiscounts = async (
    manager: EntityManager,
    shopsBySlug: Map<string, SeededShop>,
): Promise<void> => {
    await seedGlobalDiscounts(manager);
    await seedShopDiscounts(manager, shopsBySlug);
};
