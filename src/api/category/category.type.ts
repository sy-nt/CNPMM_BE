import { CategoryResponseDto } from "./category.dto";

export type CategoryTreeNode = {
    children: CategoryTreeNode[];
    depth: number;
} & CategoryResponseDto;
