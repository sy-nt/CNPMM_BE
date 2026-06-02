import {
    CategoryEntity,
    ProductAttributeEntity,
    ProductAttributeValueEntity,
    SkuEntity,
    SpuEntity,
} from "@domain/entities";
import { BaseService } from "@shared/lib/base/service";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "@shared/lib/http/httpError";
import { removeNil } from "@shared/utils/object";
import slugify from "slugify";
import { In } from "typeorm";

import { ProductError } from "./product.constants";
import {
    CreateAttributeRequestDto,
    CreateAttributeValueRequestDto,
    CreateProductRequestDto,
    CreateSkuRequestDto,
    DeleteAttributeRequestDto,
    DeleteAttributeValueRequestDto,
    DeleteProductRequestDto,
    DeleteSkuRequestDto,
    GetProductRequestDto,
    GetProductsRequestDto,
    GetProductsResponseDto,
    ProductAttributeResponseDto,
    ProductAttributeValueResponseDto,
    ProductCategoryDto,
    ProductDetailDto,
    ProductSkuResponseDto,
    ProductSummaryDto,
    SetSkuInventoryRequestDto,
    SetSkuSelectionsRequestDto,
    UpdateAttributeRequestDto,
    UpdateAttributeValueRequestDto,
    UpdateProductRequestDto,
    UpdateSkuRequestDto,
} from "./product.dto";
import { SpuWithRelations } from "./product.type";

export class ProductService extends BaseService {
    async addAttribute(
        dto: CreateAttributeRequestDto,
    ): Promise<ProductAttributeResponseDto> {
        await this._getSpuOrThrow(dto.productId, dto.shopId);
        const attribute = await this.repositories.productAttribute.create({
            displayOrder: dto.displayOrder ?? 0,
            name: dto.name,
            spuId: dto.productId,
        });
        const values = await this.repositories.productAttributeValue.createMany(
            dto.values.map((value) => ({
                attributeId: attribute.id,
                displayOrder: value.displayOrder ?? 0,
                value: value.value,
            })),
        );
        return this._toAttributeResponse(attribute, values);
    }

    async addAttributeValue(
        dto: CreateAttributeValueRequestDto,
    ): Promise<ProductAttributeValueResponseDto> {
        await this._getAttributeOrThrow(dto.attributeId, dto.shopId);
        const value = await this.repositories.productAttributeValue.create({
            attributeId: dto.attributeId,
            displayOrder: dto.displayOrder ?? 0,
            value: dto.value,
        });
        return this._toAttributeValueResponse(value);
    }

    async addSku(dto: CreateSkuRequestDto): Promise<ProductSkuResponseDto> {
        await this._getSpuOrThrow(dto.productId, dto.shopId);
        await this._ensureSkuCodeAvailable(dto.skuCode);
        await this._validateSkuSelectionsForSpu(dto.productId, dto.selections);
        const sku = await this.repositories.sku.create({
            imageKey: dto.imageKey,
            isActive: dto.isActive ?? true,
            name: dto.name,
            price: dto.price,
            skuCode: dto.skuCode,
            spuId: dto.productId,
        });
        await this.repositories.skuAttributeValue.replaceForSku(
            sku.id,
            dto.selections.map((s) => ({
                attributeId: s.attributeId,
                attributeValueId: s.valueId,
            })),
        );
        const selections = await this.repositories.skuAttributeValue.findBySku(
            sku.id,
        );
        return this._toSkuResponse(sku, selections);
    }

    async createProduct(
        dto: CreateProductRequestDto,
    ): Promise<ProductDetailDto> {
        await this._assertCategoryExists(dto.categoryId);
        await this._ensureSkuCodesAvailable(dto.skus.map((s) => s.skuCode));
        const slug = await this._generateUniqueSlug(dto.shopId, dto.name);
        const spu = await this._persistSpu(dto, slug);
        const attributeMap = await this._persistAttributes(
            spu.id,
            dto.attributes,
        );
        await this._persistSkus(spu.id, dto.skus, attributeMap);
        return this.getProduct({ idOrSlug: spu.id });
    }

    async deleteAttribute(dto: DeleteAttributeRequestDto): Promise<void> {
        const attribute = await this._getAttributeOrThrow(dto.id, dto.shopId);
        const values =
            await this.repositories.productAttributeValue.findByAttribute(
                attribute.id,
            );
        if (values.length > 0) {
            await this.repositories.productAttributeValue.softDelete({
                attributeId: attribute.id,
            });
        }
        await this.repositories.productAttribute.softDelete({
            id: attribute.id,
        });
    }

    async deleteAttributeValue(
        dto: DeleteAttributeValueRequestDto,
    ): Promise<void> {
        const value = await this._getAttributeValueOrThrow(dto.id, dto.shopId);
        await this.repositories.productAttributeValue.softDelete({
            id: value.id,
        });
    }

    async deleteProduct(dto: DeleteProductRequestDto): Promise<void> {
        const spu = await this._getSpuOrThrow(dto.id, dto.shopId);
        const attributes = await this.repositories.productAttribute.findBySpu(
            spu.id,
        );
        await this.repositories.sku.softDelete({ spuId: spu.id });
        if (attributes.length > 0) {
            await this.repositories.productAttributeValue.softDelete({
                attributeId: In(attributes.map((a) => a.id)),
            });
            await this.repositories.productAttribute.softDelete({
                spuId: spu.id,
            });
        }
        await this.repositories.spu.softDelete({ id: spu.id });
    }

    async deleteSku(dto: DeleteSkuRequestDto): Promise<void> {
        const sku = await this._getSkuOrThrow(dto.id, dto.shopId);
        await this.repositories.sku.softDelete({ id: sku.id });
    }

    async getProduct(dto: GetProductRequestDto): Promise<ProductDetailDto> {
        const spu = (await this.repositories.spu.findDetailWithRelations(
            dto.idOrSlug,
        )) as null | SpuWithRelations;
        if (!spu) throw new NotFoundError(ProductError.PRODUCT_NOT_FOUND);
        const skuIds = (spu.skus ?? []).map((sku) => sku.id);
        const quantityBySkuId =
            await this.repositories.inventory.findAvailableTotals(skuIds);
        return this._toProductDetail(spu, quantityBySkuId);
    }

    async getProducts(
        dto: GetProductsRequestDto,
    ): Promise<GetProductsResponseDto> {
        const { categoryId, isActive, search, shopId, ...pagination } = dto;
        const categoryIds = await this._expandCategoryFilter(categoryId);
        const result = await this.repositories.spu.findSummariesPaginated(
            {
                categoryIds,
                isActive,
                search,
                shopId,
            },
            pagination,
        );
        return {
            ...result,
            items: result.items.map(
                (row): ProductSummaryDto => ({
                    categoryId: row.categoryId,
                    id: row.id,
                    mainImageKey: row.mainImageKey ?? undefined,
                    name: row.name,
                    price: row.price,
                    shopId: row.shopId,
                    slug: row.slug,
                    soldCount: row.soldCount,
                }),
            ),
        };
    }

    async setSkuInventory(dto: SetSkuInventoryRequestDto): Promise<void> {
        const sku = await this._getSkuOrThrow(dto.id, dto.shopId);
        const warehouse = await this.repositories.warehouse.findOne({
            select: { id: true, shopId: true },
            where: { id: dto.warehouseId },
        });
        if (!warehouse || warehouse.shopId !== dto.shopId) {
            throw new NotFoundError(ProductError.WAREHOUSE_NOT_FOUND);
        }
        await this.repositories.inventory.upsertQuantity({
            quantity: dto.quantity,
            skuId: sku.id,
            warehouseId: dto.warehouseId,
        });
    }

    async setSkuSelections(dto: SetSkuSelectionsRequestDto): Promise<void> {
        const sku = await this._getSkuOrThrow(dto.id, dto.shopId);
        await this._validateSkuSelectionsForSpu(sku.spuId, dto.selections);
        await this.repositories.skuAttributeValue.replaceForSku(
            sku.id,
            dto.selections.map((s) => ({
                attributeId: s.attributeId,
                attributeValueId: s.valueId,
            })),
        );
    }

    async updateAttribute(
        dto: UpdateAttributeRequestDto,
    ): Promise<ProductAttributeResponseDto> {
        const attribute = await this._getAttributeOrThrow(dto.id, dto.shopId);
        Object.assign(
            attribute,
            removeNil({ displayOrder: dto.displayOrder, name: dto.name }),
        );
        const saved = await this.repositories.productAttribute.save(attribute);
        const values =
            await this.repositories.productAttributeValue.findByAttribute(
                saved.id,
            );
        return this._toAttributeResponse(saved, values);
    }

    async updateAttributeValue(
        dto: UpdateAttributeValueRequestDto,
    ): Promise<ProductAttributeValueResponseDto> {
        const value = await this._getAttributeValueOrThrow(dto.id, dto.shopId);
        Object.assign(
            value,
            removeNil({ displayOrder: dto.displayOrder, value: dto.value }),
        );
        const saved = await this.repositories.productAttributeValue.save(value);
        return this._toAttributeValueResponse(saved);
    }

    async updateProduct(
        dto: UpdateProductRequestDto,
    ): Promise<ProductDetailDto> {
        const spu = await this._getSpuOrThrow(dto.id, dto.shopId);
        if (dto.categoryId && dto.categoryId !== spu.categoryId) {
            await this._assertCategoryExists(dto.categoryId);
        }
        const { id: _id, shopId: _shopId, ...rest } = dto;
        Object.assign(spu, removeNil(rest));
        try {
            await this.repositories.spu.save(spu);
        } catch (error) {
            this._rethrowIfOptimisticLock(error);
            throw error;
        }
        return this.getProduct({ idOrSlug: spu.id });
    }

    async updateSku(dto: UpdateSkuRequestDto): Promise<ProductSkuResponseDto> {
        const sku = await this._getSkuOrThrow(dto.id, dto.shopId);
        if (dto.skuCode && dto.skuCode !== sku.skuCode) {
            await this._ensureSkuCodeAvailable(dto.skuCode);
        }
        if (
            dto.expectedVersion !== undefined &&
            dto.expectedVersion !== sku.version
        ) {
            throw new ConflictError(ProductError.PRODUCT_CONCURRENT_UPDATE);
        }
        const { expectedVersion: _ev, id: _id, shopId: _shopId, ...rest } = dto;
        Object.assign(sku, removeNil(rest));
        try {
            await this.repositories.sku.save(sku);
        } catch (error) {
            this._rethrowIfOptimisticLock(error);
            throw error;
        }
        const [selections, quantityBySkuId] = await Promise.all([
            this.repositories.skuAttributeValue.findBySku(sku.id),
            this.repositories.inventory.findAvailableTotals([sku.id]),
        ]);
        return this._toSkuResponse(
            sku,
            selections,
            quantityBySkuId.get(sku.id) ?? 0,
        );
    }

    private async _assertCategoryExists(categoryId: string): Promise<void> {
        const category = await this.repositories.category.findOne({
            select: { id: true },
            where: { id: categoryId },
        });
        if (!category) {
            throw new BadRequestError(ProductError.CATEGORY_NOT_FOUND);
        }
    }

    private async _ensureSkuCodeAvailable(code: string): Promise<void> {
        const existing = await this.repositories.sku.findByCodes([code]);
        if (existing.length > 0) {
            throw new ConflictError(ProductError.SKU_CODE_ALREADY_EXISTS);
        }
    }

    private async _ensureSkuCodesAvailable(codes: string[]): Promise<void> {
        const existing = await this.repositories.sku.findByCodes(codes);
        if (existing.length > 0) {
            throw new ConflictError(ProductError.SKU_CODE_ALREADY_EXISTS);
        }
    }

    private async _expandCategoryFilter(
        categoryId?: string,
    ): Promise<string[] | undefined> {
        if (!categoryId) return undefined;
        const subtree =
            await this.repositories.categoryClosure.findSubtreeIds(categoryId);
        return subtree.length > 0 ? subtree : [categoryId];
    }

    private async _generateUniqueSlug(
        shopId: string,
        name: string,
    ): Promise<string> {
        const baseSlug = slugify(name, { lower: true, strict: true });
        const existing = new Set(
            await this.repositories.spu.findSlugsByBase(shopId, baseSlug),
        );
        if (!existing.has(baseSlug)) return baseSlug;
        let suffix = 2;
        while (existing.has(`${baseSlug}-${suffix}`)) suffix++;
        return `${baseSlug}-${suffix}`;
    }

    private async _getAttributeOrThrow(
        id: string,
        shopId: string,
    ): Promise<ProductAttributeEntity> {
        const attribute = await this.repositories.productAttribute.findOne({
            where: { id },
        });
        if (!attribute) {
            throw new NotFoundError(ProductError.ATTRIBUTE_NOT_FOUND);
        }
        const spu = await this.repositories.spu.findOne({
            select: { id: true, shopId: true },
            where: { id: attribute.spuId },
        });
        if (!spu || spu.shopId !== shopId) {
            throw new ForbiddenError(ProductError.PRODUCT_NOT_OWNED);
        }
        return attribute;
    }

    private async _getAttributeValueOrThrow(
        id: string,
        shopId: string,
    ): Promise<ProductAttributeValueEntity> {
        const value = await this.repositories.productAttributeValue.findOne({
            where: { id },
        });
        if (!value) {
            throw new NotFoundError(ProductError.ATTRIBUTE_VALUE_NOT_FOUND);
        }
        await this._getAttributeOrThrow(value.attributeId, shopId);
        return value;
    }

    private async _getSkuOrThrow(
        id: string,
        shopId: string,
    ): Promise<SkuEntity> {
        const sku = await this.repositories.sku.findOne({
            where: { id },
        });
        if (!sku) {
            throw new NotFoundError(ProductError.SKU_NOT_FOUND);
        }
        const spu = await this.repositories.spu.findOne({
            select: { id: true, shopId: true },
            where: { id: sku.spuId },
        });
        if (!spu || spu.shopId !== shopId) {
            throw new ForbiddenError(ProductError.PRODUCT_NOT_OWNED);
        }
        return sku;
    }

    private async _getSpuOrThrow(
        id: string,
        shopId: string,
    ): Promise<SpuEntity> {
        const spu = await this.repositories.spu.findOne({
            where: { id },
        });
        if (!spu) {
            throw new NotFoundError(ProductError.PRODUCT_NOT_FOUND);
        }
        if (spu.shopId !== shopId) {
            throw new ForbiddenError(ProductError.PRODUCT_NOT_OWNED);
        }
        return spu;
    }

    private async _persistAttributes(
        spuId: string,
        attributes: CreateProductRequestDto["attributes"],
    ): Promise<
        Map<number, { attributeId: string; valueIds: Map<number, string> }>
    > {
        const map = new Map<
            number,
            { attributeId: string; valueIds: Map<number, string> }
        >();
        for (const [index, attr] of attributes.entries()) {
            const created = await this.repositories.productAttribute.create({
                displayOrder: attr.displayOrder ?? 0,
                name: attr.name,
                spuId,
            });
            const valueIds = new Map<number, string>();
            const createdValues =
                await this.repositories.productAttributeValue.createMany(
                    attr.values.map((value) => ({
                        attributeId: created.id,
                        displayOrder: value.displayOrder ?? 0,
                        value: value.value,
                    })),
                );
            createdValues.forEach((value, valueIndex) => {
                valueIds.set(valueIndex, value.id);
            });
            map.set(index, { attributeId: created.id, valueIds });
        }
        return map;
    }

    private async _persistSkus(
        spuId: string,
        skus: CreateProductRequestDto["skus"],
        attributeMap: Map<
            number,
            { attributeId: string; valueIds: Map<number, string> }
        >,
    ): Promise<void> {
        for (const skuDto of skus) {
            const sku = await this.repositories.sku.create({
                imageKey: skuDto.imageKey,
                isActive: skuDto.isActive ?? true,
                name: skuDto.name,
                price: skuDto.price,
                skuCode: skuDto.skuCode,
                spuId,
            });
            const rows = skuDto.selections.map((sel) => {
                const attr = attributeMap.get(sel.attributeIndex);
                if (!attr) {
                    throw new BadRequestError(
                        ProductError.SKU_SELECTION_INVALID,
                    );
                }
                const valueId = attr.valueIds.get(sel.valueIndex);
                if (!valueId) {
                    throw new BadRequestError(
                        ProductError.SKU_SELECTION_INVALID,
                    );
                }
                return {
                    attributeId: attr.attributeId,
                    attributeValueId: valueId,
                };
            });
            await this.repositories.skuAttributeValue.replaceForSku(
                sku.id,
                rows,
            );
        }
    }

    private async _persistSpu(
        dto: CreateProductRequestDto,
        slug: string,
    ): Promise<SpuEntity> {
        return this.repositories.spu.create({
            categoryId: dto.categoryId,
            description: dto.description,
            isActive: dto.isActive ?? true,
            mainImageKey: dto.mainImageKey,
            name: dto.name,
            price: dto.price,
            shopId: dto.shopId,
            slug,
        });
    }

    private _rethrowIfOptimisticLock(error: unknown): void {
        const name = (error as { name?: string } | null)?.name;
        if (name === "OptimisticLockVersionMismatchError") {
            throw new ConflictError(ProductError.PRODUCT_CONCURRENT_UPDATE);
        }
    }

    private _toAttributeResponse(
        attribute: ProductAttributeEntity,
        values: ProductAttributeValueEntity[],
    ): ProductAttributeResponseDto {
        return {
            displayOrder: attribute.displayOrder,
            id: attribute.id,
            name: attribute.name,
            values: values.map((value) =>
                this._toAttributeValueResponse(value),
            ),
        };
    }

    private _toAttributeValueResponse(
        value: ProductAttributeValueEntity,
    ): ProductAttributeValueResponseDto {
        return {
            attributeId: value.attributeId,
            displayOrder: value.displayOrder,
            id: value.id,
            value: value.value,
        };
    }

    private _toProductCategory(
        category?: CategoryEntity,
    ): ProductCategoryDto | undefined {
        if (!category) return undefined;
        return {
            iconUrl: category.iconUrl,
            id: category.id,
            name: category.name,
            parentId: category.parentId,
            slug: category.slug,
        };
    }

    private _toProductDetail(
        spu: SpuWithRelations,
        quantityBySkuId: Map<string, number>,
    ): ProductDetailDto {
        return {
            attributes: (spu.attributes ?? []).map((attr) =>
                this._toAttributeResponse(attr, attr.values ?? []),
            ),
            category: this._toProductCategory(spu.category),
            categoryId: spu.categoryId,
            description: spu.description,
            id: spu.id,
            isActive: spu.isActive,
            mainImageKey: spu.mainImageKey,
            name: spu.name,
            price: spu.price,
            shopId: spu.shopId,
            skus: (spu.skus ?? []).map((sku) =>
                this._toSkuResponse(
                    sku,
                    (sku.selections ?? []).map((sel) => ({
                        attributeId: sel.attributeId,
                        attributeValueId: sel.attributeValueId,
                        skuId: sku.id,
                    })),
                    quantityBySkuId.get(sku.id) ?? 0,
                ),
            ),
            slug: spu.slug,
            soldCount: spu.soldCount,
            version: spu.version,
        };
    }

    private _toSkuResponse(
        sku: SkuEntity,
        selections: Array<{ attributeId: string; attributeValueId: string }>,
        quantity = 0,
    ): ProductSkuResponseDto {
        return {
            id: sku.id,
            imageKey: sku.imageKey,
            isActive: sku.isActive,
            name: sku.name,
            price: sku.price,
            quantity,
            selections: selections.map((sel) => ({
                attributeId: sel.attributeId,
                attributeValueId: sel.attributeValueId,
            })),
            skuCode: sku.skuCode,
            spuId: sku.spuId,
            version: sku.version,
        };
    }

    private async _validateSkuSelectionsForSpu(
        spuId: string,
        selections: Array<{ attributeId: string; valueId: string }>,
    ): Promise<void> {
        const attributeIds = [...new Set(selections.map((s) => s.attributeId))];
        if (attributeIds.length !== selections.length) {
            throw new BadRequestError(ProductError.SKU_SELECTION_INVALID);
        }
        const attributes =
            await this.repositories.productAttribute.findByIdsForSpu(
                attributeIds,
                spuId,
            );
        if (attributes.length !== attributeIds.length) {
            throw new BadRequestError(ProductError.ATTRIBUTE_NOT_FOUND);
        }
        const values =
            await this.repositories.productAttributeValue.findByAttributeIds(
                attributeIds,
            );
        const valueByAttribute = new Map<string, Set<string>>();
        for (const value of values) {
            const set =
                valueByAttribute.get(value.attributeId) ?? new Set<string>();
            set.add(value.id);
            valueByAttribute.set(value.attributeId, set);
        }
        for (const sel of selections) {
            const allowed = valueByAttribute.get(sel.attributeId);
            if (!allowed || !allowed.has(sel.valueId)) {
                throw new BadRequestError(
                    ProductError.ATTRIBUTE_VALUE_NOT_FOUND,
                );
            }
        }
    }
}

const productService = new ProductService();
export default productService;
