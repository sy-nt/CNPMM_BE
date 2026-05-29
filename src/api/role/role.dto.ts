import { DefaultPaginationDto } from "@shared/types";

export type CreateRoleRequestDto = {
    description: string;
    name: string;
    permissionIds: string[];
};

export type DeleteRoleRequestDto = {
    id: string;
};

export type GetRolesRequestDto = DefaultPaginationDto;

export interface GetRolesResponseDto {
    description: string;
    id: string;
    name: string;
}

export type UpdateRoleRequestDto = {
    id: string;
} & Partial<CreateRoleRequestDto>;
