export type QueryPrimitive = string | string[] | undefined;

export interface QueryParamMeta<T> {
  defaultValue?: T;
}

type QueryParamMetaForDefault<T, HasDefault extends boolean> = HasDefault extends true
  ? { defaultValue: T }
  : { defaultValue?: undefined };

export interface QueryParamDescriptor<T, HasDefault extends boolean = false> {
  meta: QueryParamMetaForDefault<T, HasDefault>;
  serialize(value: T): QueryPrimitive;
  deserialize(value: QueryPrimitive): T | undefined;
}

export type QuerySchema = Record<string, QueryParamDescriptor<unknown, boolean>>;

type InferParamState<TDescriptor> = TDescriptor extends QueryParamDescriptor<infer T, infer HasDefault>
  ? HasDefault extends true
    ? T
    : T | undefined
  : never;

export type InferQuerySchema<TSchema extends QuerySchema> = {
  -readonly [K in keyof TSchema]: InferParamState<TSchema[K]>;
};
