import { CategoryEntity } from "@domain/entities/category.entity";
import { InventoryEntity } from "@domain/entities/inventory.entity";
import { ProductAttributeEntity } from "@domain/entities/productAttribute.entity";
import { ProductAttributeValueEntity } from "@domain/entities/productAttributeValue.entity";
import { SkuEntity } from "@domain/entities/sku.entity";
import { SkuAttributeValueEntity } from "@domain/entities/skuAttributeValue.entity";
import { SpuEntity } from "@domain/entities/spu.entity";
import slugify from "slugify";
import { EntityManager } from "typeorm";

import {
    INVENTORY_BASE_QUANTITY,
    PRODUCT_VARIANTS_PER_TEMPLATE,
    ProductTemplateFixture,
    SHOP_PRODUCT_TEMPLATES,
} from "./fixtures";
import { SeededShop } from "./shop";
import { SeededWarehouse } from "./warehouse";

export interface SeededSku {
    id: string;
    imageKey?: string;
    name: string;
    price: string;
    shopId: string;
    skuCode: string;
    spuId: string;
}

export const seedProducts = async (
    manager: EntityManager,
    shopsBySlug: Map<string, SeededShop>,
    warehousesByShopId: Map<string, SeededWarehouse[]>,
): Promise<Map<string, SeededSku[]>> => {
    const categoryIdByName = await _loadCategoriesByName(manager);
    const result = new Map<string, SeededSku[]>();
    for (const [slug, templates] of Object.entries(SHOP_PRODUCT_TEMPLATES)) {
        const shop = shopsBySlug.get(slug);
        const warehouses = shop && warehousesByShopId.get(shop.shopId);
        if (!shop || !warehouses || warehouses.length === 0) continue;
        const skus = await _seedShopCatalog(manager, {
            categoryIdByName,
            shop,
            templates,
            warehouses,
        });
        result.set(shop.shopId, skus);
    }
    return result;
};

const _buildSkuCode = (
    slug: string,
    templateIdx: number,
    variantIdx: number,
    valueIdx: number,
): string => {
    const prefix = slug.slice(0, 3).toUpperCase();
    const t = String(templateIdx + 1).padStart(2, "0");
    const v = String(variantIdx + 1);
    const x = String(valueIdx + 1).padStart(2, "0");
    return `${prefix}-${t}-${v}-${x}`;
};

const _buildSpuSlug = (name: string, variantIdx: number): string => {
    const base = slugify(name, { lower: true, strict: true });
    return variantIdx === 0 ? base : `${base}-v${variantIdx + 1}`;
};

const _buildVariantName = (name: string, variantIdx: number): string => {
    return variantIdx === 0 ? name : `${name} v${variantIdx + 1}`;
};

const _loadCategoriesByName = async (
    manager: EntityManager,
): Promise<Map<string, string>> => {
    const categories = await manager
        .getRepository(CategoryEntity)
        .find({ select: { id: true, name: true } });
    return new Map(categories.map((c) => [c.name, c.id]));
};

const _persistInventory = async (
    manager: EntityManager,
    skus: SeededSku[],
    warehouses: SeededWarehouse[],
): Promise<void> => {
    const inventoryRepository = manager.getRepository(InventoryEntity);
    const rows = skus.flatMap((sku) =>
        warehouses.map((warehouse) => ({
            quantity: INVENTORY_BASE_QUANTITY,
            reservedQuantity: 0,
            skuId: sku.id,
            warehouseId: warehouse.id,
        })),
    );
    await inventoryRepository.save(inventoryRepository.create(rows));
};

const _persistSkusForVariant = async (
    manager: EntityManager,
    args: {
        attribute: ProductAttributeEntity;
        shop: SeededShop;
        spu: SpuEntity;
        template: ProductTemplateFixture;
        templateIdx: number;
        values: ProductAttributeValueEntity[];
        variantIdx: number;
    },
): Promise<SeededSku[]> => {
    const skuRepository = manager.getRepository(SkuEntity);
    const linkRepository = manager.getRepository(SkuAttributeValueEntity);
    const skuRows = args.template.attribute.values.map((_, valueIdx) => ({
        imageKey: undefined as string | undefined,
        isActive: true,
        name: `${args.spu.name} - ${args.template.attribute.values[valueIdx]}`,
        price: args.template.basePrice,
        skuCode: _buildSkuCode(
            args.shop.slug,
            args.templateIdx,
            args.variantIdx,
            valueIdx,
        ),
        spuId: args.spu.id,
    }));
    const savedSkus = await skuRepository.save(skuRepository.create(skuRows));
    const linkRows = savedSkus.map((sku, valueIdx) => ({
        attributeId: args.attribute.id,
        attributeValueId: args.values[valueIdx].id,
        skuId: sku.id,
    }));
    await linkRepository.save(linkRepository.create(linkRows));
    return savedSkus.map((sku) => ({
        id: sku.id,
        imageKey: sku.imageKey,
        name: sku.name!,
        price: sku.price!,
        shopId: args.shop.shopId,
        skuCode: sku.skuCode,
        spuId: sku.spuId,
    }));
};

const _persistVariant = async (
    manager: EntityManager,
    args: {
        categoryId: string;
        shop: SeededShop;
        template: ProductTemplateFixture;
        templateIdx: number;
        variantIdx: number;
    },
): Promise<SeededSku[]> => {
    const spu = await _persistSpu(manager, args);
    const { attribute, values } = await _persistAttribute(
        manager,
        spu.id,
        args.template,
    );
    return _persistSkusForVariant(manager, { ...args, attribute, spu, values });
};

const _persistAttribute = async (
    manager: EntityManager,
    spuId: string,
    template: ProductTemplateFixture,
): Promise<{
    attribute: ProductAttributeEntity;
    values: ProductAttributeValueEntity[];
}> => {
    const attributeRepository = manager.getRepository(ProductAttributeEntity);
    const attribute = await attributeRepository.save(
        attributeRepository.create({
            displayOrder: 0,
            name: template.attribute.name,
            spuId,
        }),
    );
    const valueRepository = manager.getRepository(ProductAttributeValueEntity);
    const values = await valueRepository.save(
        valueRepository.create(
            template.attribute.values.map((value, valueIdx) => ({
                attributeId: attribute.id,
                displayOrder: valueIdx,
                value,
            })),
        ),
    );
    return { attribute, values };
};

const _persistSpu = async (
    manager: EntityManager,
    args: {
        categoryId: string;
        shop: SeededShop;
        template: ProductTemplateFixture;
        variantIdx: number;
    },
): Promise<SpuEntity> => {
    const { categoryId, shop, template, variantIdx } = args;
    const spuRepository = manager.getRepository(SpuEntity);
    return spuRepository.save(
        spuRepository.create({
            categoryId,
            description: template.description,
            isActive: true,
            name: _buildVariantName(template.name, variantIdx),
            price: template.basePrice,
            shopId: shop.shopId,
            slug: _buildSpuSlug(template.name, variantIdx),
        }),
    );
};

const _seedShopCatalog = async (
    manager: EntityManager,
    args: {
        categoryIdByName: Map<string, string>;
        shop: SeededShop;
        templates: ProductTemplateFixture[];
        warehouses: SeededWarehouse[];
    },
): Promise<SeededSku[]> => {
    const { categoryIdByName, shop, templates, warehouses } = args;
    const skus: SeededSku[] = [];
    for (const [templateIdx, template] of templates.entries()) {
        const categoryId = categoryIdByName.get(template.categoryName);
        if (!categoryId) {
            throw new Error(
                `Category ${template.categoryName} not found; run category seed first`,
            );
        }
        for (
            let variantIdx = 0;
            variantIdx < PRODUCT_VARIANTS_PER_TEMPLATE;
            variantIdx++
        ) {
            const variantSkus = await _persistVariant(manager, {
                categoryId,
                shop,
                template,
                templateIdx,
                variantIdx,
            });
            skus.push(...variantSkus);
        }
    }
    await _persistInventory(manager, skus, warehouses);
    return skus;
};
