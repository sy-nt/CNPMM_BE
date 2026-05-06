export type Comparable = number | string;
export type Maybe<T> = Nullable<Optional<T>>;

export type NodeEnv = "DEV" | "PROD" | "STAG";
export type Nullable<T> = null | T;

export type ObjectLiteral = Record<string, unknown>;

export type Optional<T> = T | undefined;
export type SortDirection = "ASC" | "asc" | "DESC" | "desc";
