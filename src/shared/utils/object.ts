import { ObjectLiteral } from "@shared/types";

export function removeNil<T extends ObjectLiteral>(obj: T): Partial<T> {
    return Object.fromEntries(
        Object.entries(obj).filter(
            ([_, value]) => value !== null && value !== undefined,
        ),
    ) as Partial<T>;
}
