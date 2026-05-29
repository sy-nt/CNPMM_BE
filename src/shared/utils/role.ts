type UnionToIntersection<U> = (
    U extends unknown ? (x: U) => void : never
) extends (x: infer I) => void
    ? I
    : never;

export const buildModulePermissionsMap = <
    T extends Record<string, string>,
    U extends Record<string, string>,
>(
    modules: T,
    actions: U,
): Readonly<
    Record<
        `${keyof T & string}_${keyof U & string}`,
        `${T[keyof T]}:${U[keyof U]}`
    >
> => {
    return Object.freeze(
        Object.fromEntries(
            (Object.keys(modules) as Array<keyof T & string>).flatMap(
                (module) =>
                    (Object.keys(actions) as Array<keyof U & string>).map(
                        (action) => [
                            `${module}_${action}`,
                            `${modules[module]}:${actions[action]}`,
                        ],
                    ),
            ),
        ),
    ) as Readonly<
        Record<
            `${keyof T & string}_${keyof U & string}`,
            `${T[keyof T]}:${U[keyof U]}`
        >
    >;
};

export const mergePermissionMaps = <
    const T extends Readonly<Record<string, string>>[],
>(
    ...maps: T
): Readonly<UnionToIntersection<T[number]>> => {
    return Object.freeze(Object.assign({}, ...maps)) as Readonly<
        UnionToIntersection<T[number]>
    >;
};
