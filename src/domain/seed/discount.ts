import {
    DiscountEntity,
    DiscountScope,
    DiscountType,
    DiscountValueType,
} from "@domain/entities";
import { EntityManager } from "typeorm";

import { DiscountFixture, SHOP_DISCOUNT_FIXTURES } from "./fixtures";
import { SeededShop } from "./shop";

const _toDiscountRow = (
    shopId: string,
    fixture: DiscountFixture,
): Partial<DiscountEntity> => ({
    code: fixture.code,
    description: fixture.description,
    discountType: DiscountType.ITEMS,
    isActive: true,
    name: fixture.name,
    rules: fixture.minSubtotal
        ? [{ params: { amount: fixture.minSubtotal }, type: "min_subtotal" }]
        : [],
    scope: DiscountScope.SHOP,
    shopId,
    usedCount: 0,
    value: fixture.value,
    valueType: fixture.isPercentage
        ? DiscountValueType.PERCENTAGE
        : DiscountValueType.FIXED,
});

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
            rows.push(_toDiscountRow(shop.shopId, fixture));
        }
    }
    if (rows.length === 0) return;
    await discountRepository.save(discountRepository.create(rows));
};
