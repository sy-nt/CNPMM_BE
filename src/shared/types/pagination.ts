import { SortDirection } from "./common";

export type DefaultPaginationDto = {
    page: number;
} & BasePaginationDto;

export type DefaultPaginationResponse<T> = {
    currentPage: number;
    items: T[];
    limit: number;
    totalPage: number;
};

export type KeySetPaginationDto = {
    lastId?: string;
} & BasePaginationDto;

export type KeySetPaginationResponse<T> = {
    hasNextPage: boolean;
    items: T[];
    lastId: string;
};

type BasePaginationDto = {
    limit: number;
    orderBy?: string;
    sort?: SortDirection;
};
