import { MYSQL_DUP_ENTRY_CODE } from "@shared/constants";

export const isUniqueViolationError = (error: unknown): boolean => {
    const code = (error as { code?: string } | null)?.code;
    return code === MYSQL_DUP_ENTRY_CODE;
};
