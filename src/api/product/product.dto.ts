import { DefaultPaginationDto, DefaultPaginationResponse } from "@shared/types";

export interface CreateAttributeRequestDto {
    displayOrder?: number;
    name: string;
    productId: string;
    shopId: string;
    values: Array<{ displayOrder?: number; value: string }>;
}

export interface CreateAttributeValueRequestDto {
    attributeId: string;
    displayOrder?: number;
    shopId: string;
    value: string;
}

export interface CreateProductRequestDto {
    attributes: Array<{
        displayOrder?: number;
        name: string;
        values: Array<{ displayOrder?: number; value: string }>;
    }>;
    categoryId: string;
    description?: string;
    isActive?: boolean;
    mainImageKey?: string;
    name: string;
    price: string;
    shopId: string;
    skus: Array<{
        imageKey?: string;
        isActive?: boolean;
        name?: string;
        price?: string;
        selections: Array<{ attributeIndex: number; valueIndex: number }>;
        skuCode: string;
    }>;
}

export interface CreateSkuRequestDto {
    imageKey?: string;
    isActive?: boolean;
    name?: string;
    price?: string;
    productId: string;
    selections: Array<{ attributeId: string; valueId: string }>;
    shopId: string;
    skuCode: string;
}

export interface DeleteAttributeRequestDto {
    id: string;
    shopId: string;
}

export interface DeleteAttributeValueRequestDto {
    id: string;
    shopId: string;
}

export interface DeleteProductRequestDto {
    id: string;
    shopId: string;
}

export interface DeleteSkuRequestDto {
    id: string;
    shopId: string;
}

export interface GetProductRequestDto {
    idOrSlug: string;
}

export type GetProductsRequestDto = {
    categoryId?: string;
    isActive?: boolean;
    search?: string;
    shopId?: string;
} & DefaultPaginationDto;

export type GetProductsResponseDto =
    DefaultPaginationResponse<ProductSummaryDto>;

export interface ProductAttributeResponseDto {
    displayOrder: number;
    id: string;
    name: string;
    values: ProductAttributeValueResponseDto[];
}

export interface ProductAttributeValueResponseDto {
    attributeId: string;
    displayOrder: number;
    id: string;
    value: string;
}

export interface ProductCategoryDto {
    iconUrl?: string;
    id: string;
    name: string;
    parentId?: string;
    slug: string;
}

export interface ProductDetailDto {
    attributes: ProductAttributeResponseDto[];
    category?: ProductCategoryDto;
    categoryId: string;
    description?: string;
    id: string;
    isActive: boolean;
    mainImageKey?: string;
    name: string;
    price: string;
    shopId: string;
    skus: ProductSkuResponseDto[];
    slug: string;
    soldCount: number;
    version: number;
}

export interface ProductSkuResponseDto {
    id: string;
    imageKey?: string;
    isActive: boolean;
    name?: string;
    price?: string;
    quantity: number;
    selections: Array<{ attributeId: string; attributeValueId: string }>;
    skuCode: string;
    spuId: string;
    version: number;
}

export interface ProductSummaryDto {
    categoryId: string;
    id: string;
    mainImageKey?: string;
    name: string;
    price: string;
    shopId: string;
    slug: string;
    soldCount: number;
}

export interface SetSkuInventoryRequestDto {
    id: string;
    quantity: number;
    shopId: string;
    warehouseId: string;
}

export interface SetSkuSelectionsRequestDto {
    id: string;
    selections: Array<{ attributeId: string; valueId: string }>;
    shopId: string;
}

export interface UpdateAttributeRequestDto {
    displayOrder?: number;
    id: string;
    name?: string;
    shopId: string;
}

export interface UpdateAttributeValueRequestDto {
    displayOrder?: number;
    id: string;
    shopId: string;
    value?: string;
}

export interface UpdateProductRequestDto {
    categoryId?: string;
    description?: string;
    id: string;
    isActive?: boolean;
    mainImageKey?: string;
    name?: string;
    price?: string;
    shopId: string;
}

export interface UpdateSkuRequestDto {
    expectedVersion?: number;
    id: string;
    imageKey?: string;
    isActive?: boolean;
    name?: string;
    price?: string;
    shopId: string;
    skuCode?: string;
}
