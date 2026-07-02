import { buildModulePermissionsMap } from "@shared/utils/role";

export enum ImageError {
    IMAGE_ALREADY_IN_USE = "Image is already in use by another resource",
    IMAGE_NOT_FOUND = "Image not found",
    IMAGE_PREFIX_MISMATCH = "Image prefix does not match the requested usage",
    INVALID_EXTENSION = "Invalid image extension",
    MAX_SIZE_EXCEEDED = "Image size exceeded",
}

export const IMAGE_PREFIXES = {
    PRODUCT_IMAGE: "product-image",
    SHOP_LOGO: "shop-logo",
    USER_AVATAR: "user-avatar",
} as const;

export type ImagePrefix = (typeof IMAGE_PREFIXES)[keyof typeof IMAGE_PREFIXES];

export const ALLOWED_IMAGE_EXTENSIONS = ["jpg", "jpeg", "png"];

export const MAX_IMAGE_SIZE_BYTES_BY_PREFIX: Record<ImagePrefix, number> = {
    [IMAGE_PREFIXES.PRODUCT_IMAGE]: 1024 * 1024 * 5,
    [IMAGE_PREFIXES.SHOP_LOGO]: 1024 * 1024 * 2,
    [IMAGE_PREFIXES.USER_AVATAR]: 1024 * 1024 * 2,
};

export const IMAGE_PRESIGNED_URL_EXPIRATION_TIME_SECONDS = 60 * 5;

export const IMAGE_UNUSED_CLEANUP_GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

export const RBAC_IMAGE_ACTIONS = {
    CREATE_PRESIGNED_URL: "create-presigned-url",
    DELETE: "delete",
    READ: "read",
    UPLOAD: "upload",
} as const;

export const RBAC_IMAGE_MODULES = {
    IMAGE: "image",
} as const;

export type RBAC_IMAGE_ACTIONS =
    (typeof RBAC_IMAGE_ACTIONS)[keyof typeof RBAC_IMAGE_ACTIONS];

export type RBAC_IMAGE_MODULES =
    (typeof RBAC_IMAGE_MODULES)[keyof typeof RBAC_IMAGE_MODULES];

export const IMAGE_PERMISSIONS = buildModulePermissionsMap(
    RBAC_IMAGE_MODULES,
    RBAC_IMAGE_ACTIONS,
);
