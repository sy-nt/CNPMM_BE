import { DefaultPaginationDto } from "@shared/types";

export type CategoryResponseDto = {
    description?: string;
    displayOrder?: number;
    iconUrl?: string;
    id: string;
    isActive?: boolean;
    name: string;
    parentId?: string;
    slug: string;
};

export type CreateCategoryRequestDto = {
    description?: string;
    displayOrder?: number;
    iconUrl?: string;
    name: string;
    parentId?: string;
    shopId?: string;
};

export type DeleteCategoryRequestDto = {
    callerShopId?: string;
    id: string;
};

export type GetCategoryTreeRequestDto = {
    depth: number;
    id: string;
};

export type GetSystemCategoriesRequestDto = DefaultPaginationDto;

export type UpdateCategoryRequestDto = {
    callerShopId?: string;
    description?: string;
    displayOrder?: number;
    iconUrl?: string;
    id: string;
    isActive?: boolean;
    name?: string;
};
